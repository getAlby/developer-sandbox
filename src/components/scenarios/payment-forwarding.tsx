import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Bell, BellOff, Zap, Mail, Settings } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

interface ForwardedPayment {
  id: string;
  receivedAmount: number;
  forwardedAmount: number;
  keptAmount: number;
  timestamp: Date;
}

interface ReceivedPayment {
  id: string;
  amount: number;
  timestamp: Date;
}

export function PaymentForwardingScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const allConnected = areAllWalletsConnected(["alice", "bob", "charlie"]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <AlicePanel />
      <BobPanel />
      <CharliePanel />
    </div>
  );
}

function AlicePanel() {
  const [address, setAddress] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<{
    amount: number;
    success: boolean;
  } | null>(null);

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
    setLastPayment(null);

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      toWallet: "bob",
      amount: satoshi,
      description: `Alice paying ${satoshi} sats to Bob...`,
    });

    const requestFlowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `Requesting invoice for ${satoshi} sats...`,
      direction: "right",
      status: "pending",
    });

    let payFlowStepId = "";

    try {
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
        description: `Alice paid ${satoshi} sats to Bob`,
      });

      // Update flow step to success
      updateFlowStep(payFlowStepId, {
        label: "Payment confirmed",
        status: "success",
      });

      setLastPayment({ amount: satoshi, success: true });
    } catch (err) {
      console.error("Failed to pay:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setLastPayment({ amount: satoshi, success: false });

      updateTransaction(txId, {
        status: "error",
        description: "Payment failed",
      });

      // Update the appropriate flow step to error
      if (payFlowStepId) {
        updateFlowStep(payFlowStepId, {
          label: "Payment failed",
          status: "error",
        });
      } else {
        updateFlowStep(requestFlowStepId, {
          label: "Request failed",
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
            Recipient (Bob's Address)
          </label>
          <Input
            value={addressToUse}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="bob@example.com"
            disabled={isPaying}
          />
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
                size="sm"
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

        {lastPayment && (
          <div
            className={`p-2 rounded-lg text-sm ${lastPayment.success ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}
          >
            {lastPayment.success
              ? `✅ Sent ${lastPayment.amount} sats`
              : `❌ Failed to send ${lastPayment.amount} sats`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [forwardPercent, setForwardPercent] = useState("10");
  const [forwardedPayments, setForwardedPayments] = useState<
    ForwardedPayment[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const forwardPercentRef = useRef(forwardPercent);

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const bobWallet = getWallet("bob");
  const charlieWallet = getWallet("charlie");

  // Keep ref in sync with state
  useEffect(() => {
    forwardPercentRef.current = forwardPercent;
  }, [forwardPercent]);

  const forwardPayment = useCallback(
    async (amountSats: number) => {
      const client = getNWCClient("bob");
      if (!client || !charlieWallet?.lightningAddress) {
        console.error("Cannot forward: missing client or charlie address");
        return;
      }

      const percent = parseInt(forwardPercentRef.current) || 10;
      const forwardAmount = Math.floor((amountSats * percent) / 100);
      const keptAmount = amountSats - forwardAmount;

      if (forwardAmount < 1) {
        console.log("Forward amount too small, skipping");
        return;
      }

      const txId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        toWallet: "charlie",
        amount: forwardAmount,
        description: `Bob forwarding ${forwardAmount} sats (${percent}%) to Charlie...`,
      });

      const flowStepId = addFlowStep({
        fromWallet: "bob",
        toWallet: "charlie",
        label: `Forwarding ${forwardAmount} sats (${percent}%)...`,
        direction: "right",
        status: "pending",
      });

      try {
        // Get invoice from Charlie's lightning address
        const ln = new LightningAddress(charlieWallet.lightningAddress);
        await ln.fetch();
        const invoice = await ln.requestInvoice({ satoshi: forwardAmount });

        // Pay the invoice
        await client.payInvoice({ invoice: invoice.paymentRequest });

        // Update Bob's balance
        const bobBalance = await client.getBalance();
        const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
        setWalletBalance("bob", bobBalanceSats);
        addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

        // Update Charlie's balance
        const charlieClient = getNWCClient("charlie");
        if (charlieClient) {
          const charlieBalance = await charlieClient.getBalance();
          const charlieBalanceSats = Math.floor(charlieBalance.balance / 1000);
          setWalletBalance("charlie", charlieBalanceSats);
          addBalanceSnapshot({
            walletId: "charlie",
            balance: charlieBalanceSats,
          });
        }

        const payment: ForwardedPayment = {
          id: Date.now().toString(),
          receivedAmount: amountSats,
          forwardedAmount: forwardAmount,
          keptAmount,
          timestamp: new Date(),
        };

        setForwardedPayments((prev) => [payment, ...prev]);

        updateTransaction(txId, {
          status: "success",
          description: `Bob forwarded ${forwardAmount} sats to Charlie (kept ${keptAmount} sats)`,
        });

        // Update flow step to success
        updateFlowStep(flowStepId, {
          label: `✅ Forwarded ${forwardAmount} sats`,
          status: "success",
        });
      } catch (err) {
        console.error("Failed to forward payment:", err);

        updateTransaction(txId, {
          status: "error",
          description: `Failed to forward payment: ${err instanceof Error ? err.message : "Unknown error"}`,
        });

        // Update flow step to error
        updateFlowStep(flowStepId, {
          label: "Forward failed",
          status: "error",
        });
      }
    },
    [
      getNWCClient,
      charlieWallet?.lightningAddress,
      setWalletBalance,
      addTransaction,
      addFlowStep,
      updateFlowStep,
      addBalanceSnapshot,
    ],
  );

  const handleNotification = useCallback(
    (notification: Nip47Notification) => {
      if (notification.notification_type === "payment_received") {
        const tx = notification.notification;
        const amountSats = Math.floor(tx.amount / 1000);

        addTransaction({
          type: "payment_received",
          status: "success",
          toWallet: "bob",
          amount: amountSats,
          description: `Bob received ${amountSats} sats`,
        });

        addFlowStep({
          fromWallet: "bob",
          toWallet: "bob",
          label: `🔔 Received ${amountSats} sats`,
          direction: "right",
          status: "success",
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

        // Forward the payment
        forwardPayment(amountSats);
      }
    },
    [
      addTransaction,
      addFlowStep,
      addBalanceSnapshot,
      getNWCClient,
      setWalletBalance,
      forwardPayment,
    ],
  );

  const startListening = async () => {
    const client = getNWCClient("bob");
    if (!client) {
      setError("Bob wallet not connected");
      return;
    }

    if (!charlieWallet?.lightningAddress) {
      setError("Charlie's lightning address not available");
      return;
    }

    setIsStarting(true);
    setError(null);

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: "Bob subscribing to payment notifications...",
    });

    try {
      const unsub = await client.subscribeNotifications(handleNotification, [
        "payment_received",
      ]);
      unsubRef.current = unsub;
      setIsListening(true);

      updateTransaction(txId, {
        status: "success",
        description: `Bob listening - will forward ${forwardPercent}% to Charlie`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `🔔 Listening (${forwardPercent}% → Charlie)`,
        direction: "right",
        status: "success",
      });
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to subscribe");

      updateTransaction(txId, {
        status: "error",
        description: "Failed to subscribe to notifications",
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
      type: "invoice_created",
      status: "success",
      description: "Bob stopped forwarding payments",
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "🔕 Stopped forwarding",
      direction: "right",
      status: "success",
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
          <span>Bob: Forward Payments</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bobWallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs truncate">
              {bobWallet.lightningAddress}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Forward Settings
          </label>
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="text-xs text-muted-foreground">
              Forward to Charlie
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={forwardPercent}
                onChange={(e) => setForwardPercent(e.target.value)}
                disabled={isListening}
                className="w-20 text-center"
              />
              <span className="text-sm">%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {isListening ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Forwarding
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Stopped</span>
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
                Stop
              </>
            ) : (
              <>
                <Bell className="mr-1 h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {forwardedPayments.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Forwarded Payments
            </label>
            <div className="max-h-[150px] overflow-y-auto space-y-2">
              {forwardedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 dark:text-green-300">
                      ✅ Forwarded {payment.forwardedAmount} sats
                    </span>
                    <span className="text-muted-foreground">
                      {payment.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Kept {payment.keptAmount} sats
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CharliePanel() {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const seenPaymentsRef = useRef<Set<string>>(new Set());

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const { addFlowStep, addBalanceSnapshot } = useTransactionStore();

  const charlieWallet = getWallet("charlie");

  const handleNotification = useCallback(
    (notification: Nip47Notification) => {
      if (notification.notification_type === "payment_received") {
        const tx = notification.notification;
        const amountSats = Math.floor(tx.amount / 1000);

        const paymentId = tx.payment_hash || Date.now().toString();

        // Deduplicate - only process if this payment hasn't been seen yet
        if (seenPaymentsRef.current.has(paymentId)) {
          return;
        }
        seenPaymentsRef.current.add(paymentId);

        setReceivedPayments((prev) => [
          { id: paymentId, amount: amountSats, timestamp: new Date() },
          ...prev,
        ]);

        // Note: We don't add a transaction here because BobPanel already logs
        // the successful forward. This notification just updates Charlie's UI.

        addFlowStep({
          fromWallet: "charlie",
          toWallet: "charlie",
          label: `🔔 Charlie received ${amountSats} sats`,
          direction: "right",
          status: "success",
        });

        // Update Charlie's balance
        const client = getNWCClient("charlie");
        if (client) {
          client.getBalance().then((balance) => {
            const balanceSats = Math.floor(balance.balance / 1000);
            setWalletBalance("charlie", balanceSats);
            addBalanceSnapshot({ walletId: "charlie", balance: balanceSats });
          });
        }
      }
    },
    [addFlowStep, addBalanceSnapshot, getNWCClient, setWalletBalance],
  );

  const startListening = useCallback(
    async (abortSignal?: { aborted: boolean }) => {
      const client = getNWCClient("charlie");
      if (!client) {
        setError("Charlie wallet not connected");
        return;
      }

      setIsStarting(true);
      setError(null);

      try {
        const unsub = await client.subscribeNotifications(handleNotification, [
          "payment_received",
        ]);

        // If aborted during async operation, clean up immediately
        if (abortSignal?.aborted) {
          unsub();
          return;
        }

        unsubRef.current = unsub;
        setIsListening(true);

        addFlowStep({
          fromWallet: "charlie",
          toWallet: "charlie",
          label: "🔔 Charlie listening",
          direction: "right",
          status: "success",
        });
      } catch (err) {
        console.error("Failed to subscribe to notifications:", err);
        if (!abortSignal?.aborted) {
          setError(err instanceof Error ? err.message : "Failed to subscribe");
        }
      } finally {
        if (!abortSignal?.aborted) {
          setIsStarting(false);
        }
      }
    },
    [getNWCClient, handleNotification, addFlowStep],
  );

  const stopListening = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setIsListening(false);
  };

  // Auto-start listening when component mounts
  useEffect(() => {
    const abortSignal = { aborted: false };
    startListening(abortSignal);
    return () => {
      abortSignal.aborted = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [startListening]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.charlie.emoji}</span>
          <span>Charlie: Receive Forwards</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {charlieWallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs truncate">
              {charlieWallet.lightningAddress}
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
                Waiting
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
            onClick={isListening ? stopListening : () => startListening()}
            disabled={isStarting}
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <>
                <BellOff className="mr-1 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Bell className="mr-1 h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Incoming Payments
          </label>
          <div className="min-h-[100px] max-h-[150px] overflow-y-auto space-y-2">
            {receivedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isListening
                  ? "Waiting for forwarded payments..."
                  : "Start listening to see payments"}
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
