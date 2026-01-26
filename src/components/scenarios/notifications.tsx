import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Bell, BellOff, Zap, Mail } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

interface ReceivedPayment {
  id: string;
  amount: number;
  timestamp: Date;
  description?: string;
}

export function NotificationsScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const allConnected = areAllWalletsConnected(["alice", "bob"]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AlicePanel />
      <BobPanel />
    </div>
  );
}

function AlicePanel() {
  const [address, setAddress] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getNWCClient, setWalletBalance, getWallet } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const bobWallet = getWallet("bob");
  const addressToUse = address || bobWallet?.lightningAddress || "";

  const handleQuickPay = async (satoshi: number) => {
    if (!addressToUse) return;

    const client = getNWCClient("alice");
    if (!client) return;

    setIsPaying(true);
    setError(null);

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      toWallet: "bob",
      amount: satoshi,
      description: `Paying ${satoshi} sats to ${addressToUse}...`,
      snippetIds: ["pay-lightning-address"],
    });

    const requestFlowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `Requesting invoice for ${satoshi} sats...`,
      direction: "right",
      status: "pending",
      snippetIds: ["request-invoice-from-address"],
    });

    let payFlowStepId = "";

    try {
      // Lookup the lightning address and request an invoice
      const ln = new LightningAddress(addressToUse);
      await ln.fetch();

      const invoice = await ln.requestInvoice({ satoshi });

      // Update request flow step to success
      updateFlowStep(requestFlowStepId, {
        label: `Invoice: ${satoshi} sats`,
        status: "success",
        direction: "left",
      });

      payFlowStepId = addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Paying invoice...",
        direction: "right",
        status: "pending",
        snippetIds: ["pay-invoice"],
      });

      await client.payInvoice({ invoice: invoice.paymentRequest });

      // Update Alice's balance
      const aliceBalance = await client.getBalance();
      const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
      setWalletBalance("alice", aliceBalanceSats);
      addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

      // Update Bob's balance
      const bobClient = getNWCClient("bob");
      if (bobClient) {
        const bobBalance = await bobClient.getBalance();
        const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
        setWalletBalance("bob", bobBalanceSats);
        addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });
      }

      updateTransaction(txId, {
        status: "success",
        description: `Paid ${satoshi} sats to ${addressToUse}`,
      });

      // Update flow step to success
      updateFlowStep(payFlowStepId, {
        label: "Payment confirmed",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to pay:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Payment failed: ${errorMessage}`,
      });

      // Update the appropriate flow step to error
      if (payFlowStepId) {
        updateFlowStep(payFlowStepId, {
          label: `Payment failed: ${errorMessage}`,
          status: "error",
        });
      } else {
        updateFlowStep(requestFlowStepId, {
          label: `Request failed: ${errorMessage}`,
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
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Send Payments</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Recipient Lightning Address
          </label>
          <div className="flex gap-2">
            <Input
              value={addressToUse}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="bob@example.com"
              disabled={isPaying}
            />
          </div>
          {bobWallet?.lightningAddress && !address && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Using Bob's Lightning Address
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Quick Pay</label>
          <div className="flex gap-2">
            {[100, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handleQuickPay(amount)}
                disabled={isPaying || !addressToUse}
                className="flex-1"
              >
                {isPaying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {amount}
                    <span className="ml-1 text-xs text-muted-foreground">
                      sats
                    </span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">Try it out!</p>
          <p className="text-xs mt-1 opacity-90">
            Click the buttons above to send payments to Bob. If Bob is
            subscribed to notifications, they'll see the payments appear in
            real-time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  const bobWallet = getWallet("bob");

  const handleNotification = useCallback(
    (notification: Nip47Notification) => {
      if (notification.notification_type === "payment_received") {
        const tx = notification.notification;
        const amountSats = Math.floor(tx.amount / 1000);

        const payment: ReceivedPayment = {
          id: tx.payment_hash || Date.now().toString(),
          amount: amountSats,
          timestamp: new Date(),
          description: tx.description,
        };

        setReceivedPayments((prev) => [payment, ...prev]);

        addTransaction({
          type: "payment_received",
          status: "success",
          toWallet: "bob",
          amount: amountSats,
          description: `Bob received ${amountSats} sats via notification`,
          snippetIds: ["subscribe-notifications"],
        });

        addFlowStep({
          fromWallet: "alice",
          toWallet: "bob",
          label: `🔔 Notification: +${amountSats} sats`,
          direction: "right",
          status: "success",
          snippetIds: ["subscribe-notifications"],
        });

        // Update Bob's balance
        const client = getNWCClient("bob");
        if (client) {
          client.getBalance().then((balance) => {
            const balanceSats = Math.floor(balance.balance / 1000);
            setWalletBalance("bob", balanceSats);
            addBalanceSnapshot({ walletId: "bob", balance: balanceSats });
          });
        }
      }
    },
    [
      addTransaction,
      addFlowStep,
      addBalanceSnapshot,
      getNWCClient,
      setWalletBalance,
    ],
  );

  const startListening = async () => {
    const client = getNWCClient("bob");
    if (!client) {
      setError("Bob wallet not connected");
      return;
    }

    setIsStarting(true);
    setError(null);

    const txId = addTransaction({
      type: "subscription_started",
      status: "pending",
      description: "Bob subscribing to payment notifications...",
      snippetIds: ["subscribe-notifications"],
    });

    try {
      const unsub = await client.subscribeNotifications(handleNotification, [
        "payment_received",
      ]);
      unsubRef.current = unsub;
      setIsListening(true);

      updateTransaction(txId, {
        status: "success",
        description: "Bob is now listening for payment notifications",
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: "🔔 Subscribed to notifications",
        direction: "right",
        status: "success",
        snippetIds: ["subscribe-notifications"],
      });
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to subscribe to notifications: ${errorMessage}`,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopListening = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setIsListening(false);

    addTransaction({
      type: "subscription_started",
      status: "success",
      description: "Bob stopped listening for notifications",
      snippetIds: ["subscribe-notifications"],
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "🔕 Unsubscribed from notifications",
      direction: "right",
      status: "success",
      snippetIds: ["subscribe-notifications"],
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Receive Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bobWallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs">
              {bobWallet.lightningAddress}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {isListening ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Listening
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Not listening
              </span>
            )}
          </div>

          <Button
            variant={isListening ? "outline" : "default"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={isStarting}
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <>
                <BellOff className="mr-1 h-4 w-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Bell className="mr-1 h-4 w-4" />
                Start Listening
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Incoming Payments
          </label>
          <div className="min-h-[120px] max-h-[200px] overflow-y-auto space-y-2">
            {receivedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isListening
                  ? "Waiting for incoming payments..."
                  : "Start listening to see incoming payments"}
              </p>
            ) : (
              receivedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      +{payment.amount} sats
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {payment.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
