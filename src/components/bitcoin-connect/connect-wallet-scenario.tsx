import { useState, useEffect, useRef } from "react";
import {
  launchModal,
  onConnected,
  onDisconnected,
  onModalOpened,
  onModalClosed,
  disconnect,
} from "@getalby/bitcoin-connect-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransactionStore } from "@/stores";
import { Loader2, Unplug, Wallet, Zap } from "lucide-react";

interface WalletInfo {
  alias?: string;
  balance?: number;
}

export function ConnectWalletScenario() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const modalOpenedTxIdRef = useRef<string | null>(null);
  const { addTransaction, updateTransaction } = useTransactionStore();

  useEffect(() => {
    // Subscribe to connection events
    const unsubConnected = onConnected(async (provider) => {
      setIsConnected(true);
      setIsLoading(true);

      addTransaction({
        type: "balance_updated",
        status: "success",
        description: "Wallet connected via Bitcoin Connect",
        snippetIds: ["bc-launch-modal"],
      });

      try {
        // Get wallet info
        const info = await provider.getInfo();
        const balance = await provider.getBalance();

        const walletData: WalletInfo = {
          alias: info.node?.alias || "Connected Wallet",
          // WebLN returns balance in sats
          balance:
            typeof balance.balance === "number"
              ? Math.floor(balance.balance)
              : undefined,
        };

        setWalletInfo(walletData);

        addTransaction({
          type: "balance_updated",
          status: "success",
          description: `Connected to ${walletData.alias}${walletData.balance !== undefined ? ` with ${walletData.balance.toLocaleString()} sats` : ""}`,
          amount: walletData.balance,
          snippetIds: ["bc-launch-modal"],
        });
      } catch (error) {
        console.error("Failed to get wallet info:", error);
        setWalletInfo({ alias: "Connected Wallet" });
      } finally {
        setIsLoading(false);
      }
    });

    const unsubDisconnected = onDisconnected(() => {
      setIsConnected(false);
      setWalletInfo(null);

      addTransaction({
        type: "balance_updated",
        status: "success",
        description: "Wallet disconnected",
        snippetIds: ["bc-disconnect"],
      });
    });

    const unsubModalOpened = onModalOpened(() => {
      const txId = addTransaction({
        type: "balance_updated",
        status: "pending",
        description: "Bitcoin Connect modal opened",
        snippetIds: ["bc-launch-modal"],
      });
      modalOpenedTxIdRef.current = txId;
    });

    const unsubModalClosed = onModalClosed(() => {
      if (modalOpenedTxIdRef.current) {
        updateTransaction(modalOpenedTxIdRef.current, {
          status: "success",
          description: "Bitcoin Connect modal closed",
        });
        modalOpenedTxIdRef.current = null;
      }
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubModalOpened();
      unsubModalClosed();
    };
  }, [addTransaction, updateTransaction]);

  const handleConnect = () => {
    launchModal();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Bitcoin Connect Wallet</span>
            </CardTitle>
            <Badge
              variant={isConnected ? "default" : "outline"}
              className={isConnected ? "bg-green-500" : ""}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading wallet info...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Wallet className="h-4 w-4" />
                    <span>{walletInfo?.alias || "Connected Wallet"}</span>
                  </div>
                  {walletInfo?.balance !== undefined && (
                    <div className="text-2xl font-bold">
                      {walletInfo.balance.toLocaleString()} sats
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full"
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to open the Bitcoin Connect modal and
                connect your Lightning wallet. Bitcoin Connect supports various
                wallet types including NWC, browser extensions, and mobile apps.
              </p>

              <Button onClick={handleConnect} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
