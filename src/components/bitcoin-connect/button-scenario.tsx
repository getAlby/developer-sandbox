import { useState, useEffect, useRef } from "react";
import {
  Button as BitcoinConnectButton,
  onConnected,
  onDisconnected,
} from "@getalby/bitcoin-connect-react";
import { LightningAddress } from "@getalby/lightning-tools";
import type { WebLNProvider } from "@webbtc/webln-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TestTube2,
  Loader2,
  Copy,
  Check,
  Send,
  Wallet,
} from "lucide-react";
import { createTestWallet } from "@/lib/faucet";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WalletCard } from "@/components/wallet-card";
import { WALLET_PERSONAS } from "@/types";

export function BitcoinConnectButtonScenario() {
  const [isConnected, setIsConnected] = useState(false);
  const [testConnectionString, setTestConnectionString] = useState<
    string | null
  >(null);
  const [isCreatingTestWallet, setIsCreatingTestWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aliceBalance, setAliceBalance] = useState<number | undefined>();
  const providerRef = useRef<WebLNProvider | null>(null);

  const { initializeWallets, getWallet, areAllWalletsConnected } =
    useWalletStore();
  const bobWallet = getWallet("bob");
  const bobConnected = areAllWalletsConnected(["bob"]);

  // Initialize Bob's wallet on mount
  useEffect(() => {
    initializeWallets(["bob"]);
  }, [initializeWallets]);

  useEffect(() => {
    const unsubConnected = onConnected(async (provider) => {
      setIsConnected(true);
      providerRef.current = provider;

      // Get Alice's balance
      try {
        const balance = await provider.getBalance();
        setAliceBalance(
          typeof balance.balance === "number"
            ? Math.floor(balance.balance)
            : undefined
        );
      } catch (error) {
        console.error("Failed to get balance:", error);
      }
    });

    const unsubDisconnected = onDisconnected(() => {
      setIsConnected(false);
      providerRef.current = null;
      setAliceBalance(undefined);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
    };
  }, []);

  const handleGetTestConnectionString = async () => {
    setIsCreatingTestWallet(true);
    try {
      const connectionSecret = await createTestWallet();
      setTestConnectionString(connectionSecret);
    } catch (error) {
      console.error("Failed to create test wallet:", error);
    } finally {
      setIsCreatingTestWallet(false);
    }
  };

  const handleCopyConnectionString = async () => {
    if (testConnectionString) {
      await navigator.clipboard.writeText(testConnectionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshAliceBalance = async () => {
    if (providerRef.current) {
      try {
        const balance = await providerRef.current.getBalance();
        setAliceBalance(
          typeof balance.balance === "number"
            ? Math.floor(balance.balance)
            : undefined
        );
      } catch (error) {
        console.error("Failed to refresh Alice balance:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-md:flex-wrap">
        {/* Alice Card - Bitcoin Connect */}
        <Card className="flex-1">
          <CardHeader className="pb-2 min-w-xs">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{WALLET_PERSONAS.alice.emoji}</span>
                <span>Alice</span>
              </CardTitle>
              <Badge
                variant={isConnected ? "default" : "outline"}
                className={isConnected ? "bg-green-500" : ""}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </CardHeader>
          <div className="flex-1" />
          <CardContent className="space-y-4">
            {isConnected ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>Bitcoin Connect</span>
                </div>
                {aliceBalance !== undefined && (
                  <div className="text-2xl font-bold">
                    {aliceBalance.toLocaleString()} sats
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                The simplest way to add Lightning wallet connectivity. Just drop
                in the Button component - it handles connection, displays
                balance, and manages wallet state automatically.
              </p>
            )}
            <div className="flex justify-center">
              <BitcoinConnectButton />
            </div>

            {/* Test wallet helper - inside Alice's card when not connected */}
            {!isConnected && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TestTube2 className="h-4 w-4 text-purple-500" />
                  <span>Try with a Test Wallet</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Don't have a Lightning wallet? Get a free test wallet
                  connection string, then use the <strong>"NWC"</strong> option
                  above and paste it there.
                </p>

                {testConnectionString ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <code className="block p-3 pr-12 bg-muted rounded-md text-xs break-all max-h-24 overflow-y-auto">
                        {testConnectionString}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={handleCopyConnectionString}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copy this, click the button above, select "NWC", and paste
                      it.
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetTestConnectionString}
                    disabled={isCreatingTestWallet}
                    className="w-full"
                  >
                    {isCreatingTestWallet ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating test wallet...
                      </>
                    ) : (
                      <>
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Get NWC Test Connection String
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bob's Wallet Card */}
        {bobWallet && <WalletCard wallet={bobWallet} />}
      </div>

      {/* Payment Section - Only show when both connected */}
      {isConnected && bobConnected && bobWallet?.lightningAddress && (
        <PayBobSection
          bobLightningAddress={bobWallet.lightningAddress}
          provider={providerRef.current}
          onPaymentComplete={refreshAliceBalance}
        />
      )}
    </div>
  );
}

interface PayBobSectionProps {
  bobLightningAddress: string;
  provider: WebLNProvider | null;
  onPaymentComplete: () => void;
}

function PayBobSection({
  bobLightningAddress,
  provider,
  onPaymentComplete,
}: PayBobSectionProps) {
  const [amount, setAmount] = useState("100");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const handlePayBob = async () => {
    if (!provider || !amount) return;

    setIsPaying(true);
    setError(null);

    const satoshi = parseInt(amount);

    // Add pending transaction
    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      toWallet: "bob",
      amount: satoshi,
      description: `Alice paying ${satoshi} sats to Bob via Bitcoin Connect...`,
      snippetIds: ["bc-button"],
    });

    const requestFlowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `Requesting invoice from ${bobLightningAddress}...`,
      direction: "right",
      status: "pending",
      snippetIds: ["request-invoice-from-address"],
    });

    let payFlowStepId = "";

    try {
      // Request invoice from Bob's lightning address
      const ln = new LightningAddress(bobLightningAddress);
      await ln.fetch();

      const invoice = await ln.requestInvoice({ satoshi });

      // Update request flow step to success
      updateFlowStep(requestFlowStepId, {
        label: `Invoice: ${satoshi} sats`,
        direction: "left",
        status: "success",
      });

      // Pay the invoice using Bitcoin Connect provider
      payFlowStepId = addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Paying via Bitcoin Connect...",
        direction: "right",
        status: "pending",
        snippetIds: ["bc-button"],
      });

      await provider.sendPayment(invoice.paymentRequest);

      // Update Bob's balance
      const bobClient = getNWCClient("bob");
      if (bobClient) {
        const bobBalance = await bobClient.getBalance();
        const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
        setWalletBalance("bob", bobBalanceSats);
        addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });
      }

      // Refresh Alice's balance
      onPaymentComplete();

      // Update transaction to success
      updateTransaction(txId, {
        status: "success",
        description: `Alice paid ${satoshi} sats to Bob`,
      });

      // Update flow step to success
      updateFlowStep(payFlowStepId, {
        label: "Payment confirmed ⚡",
        status: "success",
      });

      // Reset amount
      setAmount("100");
    } catch (err) {
      console.error("Failed to pay Bob:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Payment failed: ${errorMessage}`,
      });

      // Update the appropriate flow step to error
      if (payFlowStepId) {
        updateFlowStep(payFlowStepId, {
          label: `Payment failed`,
          status: "error",
        });
      } else {
        updateFlowStep(requestFlowStepId, {
          label: `Request failed`,
          status: "error",
        });
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Pay Bob</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Alice can now pay Bob using Bitcoin Connect. Enter an amount and click
          Pay to send sats from Alice to Bob's lightning address.
        </p>

        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Paying to:</span>
          <span className="font-mono">{bobLightningAddress}</span>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">
              Amount (sats)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              disabled={isPaying}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handlePayBob}
              disabled={isPaying || !amount || parseInt(amount) <= 0}
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Paying...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Pay Bob ⚡
                </>
              )}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
