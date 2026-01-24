import { useEffect, useRef } from "react";
import { LightningAddress, Invoice } from "@getalby/lightning-tools";
import {
  getFiatValue,
  getSatoshiValue,
  getFiatBtcRate,
  getFormattedFiatValue,
} from "@getalby/lightning-tools/fiat";
import { useWalletStore } from "@/stores";
import type { WalletClient } from "@/types/global";

const WALLET_IDS = ["alice", "bob", "charlie", "david"] as const;

// Extend NWCClient with wallet ID for better console identification
function extendClient(client: unknown, walletId: string): WalletClient {
  const extended = client as WalletClient;
  extended.walletId = walletId;
  return extended;
}

export function useDevConsole() {
  const { wallets, getNWCClient } = useWalletStore();
  const hasLoggedWelcome = useRef(false);

  // Initialize on mount - expose lightning tools
  useEffect(() => {
    // Expose Lightning tools
    window.LightningAddress = LightningAddress;
    window.Invoice = Invoice;

    // Expose fiat utilities
    window.getFiatValue = getFiatValue;
    window.getSatoshiValue = getSatoshiValue;
    window.getFiatBtcRate = getFiatBtcRate;
    // @ts-expect-error - getFormattedFiatValue is available but may not be in types
    window.getFormattedFiatValue = getFormattedFiatValue;

    // Initialize alby namespace
    window.alby = {
      wallets: {},
      tools: {
        LightningAddress,
        Invoice,
      },
    };

    // Log welcome message once
    if (!hasLoggedWelcome.current) {
      hasLoggedWelcome.current = true;
      console.log(
        "%c⚡ Alby Sandbox",
        "font-size: 16px; font-weight: bold; color: #F7931A; background: #1a1a2e; padding: 4px 8px; border-radius: 4px;",
      );
      console.log(
        "%cLightning tools available in browser console:",
        "font-weight: bold;",
      );
      console.log(
        "%c  • LightningAddress  %c- Fetch and interact with lightning addresses",
        "color: #0066CC; font-weight: bold;",
        "",
      );
      console.log(
        "%c  • Invoice           %c- Decode BOLT-11 invoices",
        "color: #0066CC; font-weight: bold;",
        "",
      );
      console.log(
        "%c  • getFiatValue()    %c- Convert sats to fiat",
        "color: #0066CC; font-weight: bold;",
        "",
      );
      console.log(
        "%c  • getSatoshiValue() %c- Convert fiat to sats",
        "color: #0066CC; font-weight: bold;",
        "",
      );
      console.log("");
      console.log(
        "Connect wallets to access them as: %calice%c, %cbob%c, %ccharlie%c, %cdavid",
        "font-weight: bold;",
        "",
        "font-weight: bold;",
        "",
        "font-weight: bold;",
        "",
        "font-weight: bold;",
      );
      console.log(
        "Or via namespace: alby.wallets.alice, alby.wallets.bob, etc.",
      );
      console.log("");
      console.log(
        "%cExample:%c await alice.getBalance()",
        "font-weight: bold;",
        "font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 2px;",
      );
    }

    // Cleanup on unmount
    return () => {
      // Remove lightning tools
      delete (window as Partial<Window>).LightningAddress;
      delete (window as Partial<Window>).Invoice;
      delete (window as Partial<Window>).getFiatValue;
      delete (window as Partial<Window>).getSatoshiValue;
      delete (window as Partial<Window>).getFiatBtcRate;
      // @ts-expect-error - cleaning up custom property
      delete window.getFormattedFiatValue;

      // Remove wallet references
      for (const walletId of WALLET_IDS) {
        delete (window as Partial<Window>)[walletId];
      }

      // Remove alby namespace
      delete (window as Partial<Window>).alby;
    };
  }, []);

  // Update wallet globals when wallet connections change
  useEffect(() => {
    for (const walletId of WALLET_IDS) {
      const wallet = wallets[walletId];
      const client = getNWCClient(walletId);

      if (wallet?.status === "connected" && client) {
        // Wallet is connected - expose the client
        const extendedClient = extendClient(client, walletId);
        // Use type assertion through unknown to safely assign to window
        (window as unknown as Record<string, unknown>)[walletId] =
          extendedClient;

        if (window.alby) {
          window.alby.wallets[walletId as keyof typeof window.alby.wallets] =
            extendedClient;
        }

        // Log when a new wallet becomes available
        console.log(
          `%c⚡ ${walletId}%c wallet connected - available as %cwindow.${walletId}`,
          "font-weight: bold; color: #008800;",
          "",
          "font-family: monospace; font-weight: bold;",
        );
      } else {
        // Wallet is disconnected - remove the client
        if ((window as unknown as Record<string, unknown>)[walletId]) {
          delete (window as Partial<Window>)[walletId];
          if (window.alby?.wallets) {
            delete window.alby.wallets[
              walletId as keyof typeof window.alby.wallets
            ];
          }
        }
      }
    }
  }, [wallets, getNWCClient]);
}
