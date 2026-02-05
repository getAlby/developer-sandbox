import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Play, Pause, Zap, Music } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

interface StreamingPayment {
  id: string;
  amount: number;
  timestamp: Date;
}

// Shared state for streaming configuration  
const streamingConfig = {
  satsPerMinute: 100,
  paymentInterval: 10, // seconds between payments
};

export function StreamingPaymentsScenario() {
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [streamingTime, setStreamingTime] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nextPaymentIn, setNextPaymentIn] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const bobWallet = getWallet("bob");

  // Calculate amount per payment interval
  const amountPerPayment = Math.floor(
    (streamingConfig.satsPerMinute / 60) * streamingConfig.paymentInterval,
  );

  const sendStreamingPayment = useCallback(async () => {
    const aliceClient = getNWCClient("alice");
    const bobClient = getNWCClient("bob");
    const bobAddress = bobWallet?.lightningAddress;

    if (!aliceClient || !bobClient || !bobAddress) {
      setError("Missing wallet connection or lightning address");
      return false;
    }

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      toWallet: "bob",
      amount: amountPerPayment,
      description: `Streaming payment: ${amountPerPayment} sats`,
      snippetIds: ["pay-lightning-address"],
    });

    const requestFlowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `Streaming ${amountPerPayment} sats...`,
      direction: "right",
      status: "pending",
      snippetIds: ["request-invoice-from-address", "pay-invoice"],
    });

    try {
      // Request invoice from Bob's lightning address
      const ln = new LightningAddress(bobAddress);
      await ln.fetch();
      const invoice = await ln.requestInvoice({ satoshi: amountPerPayment });

      // Pay the invoice
      await aliceClient.payInvoice({ invoice: invoice.paymentRequest });

      // Update Alice's balance
      const aliceBalance = await aliceClient.getBalance();
      const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
      setWalletBalance("alice", aliceBalanceSats);
      addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

      // Update Bob's balance
      const bobBalance = await bobClient.getBalance();
      const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
      setWalletBalance("bob", bobBalanceSats);
      addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

      setTotalPaid((prev) => prev + amountPerPayment);

      updateTransaction(txId, {
        status: "success",
        description: `Streamed ${amountPerPayment} sats`,
      });

      updateFlowStep(requestFlowStepId, {
        label: `💸 ${amountPerPayment} sats`,
        status: "success",
      });

      return true;
    } catch (err) {
      console.error("Streaming payment failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Payment failed: ${errorMessage}`,
      });

      updateFlowStep(requestFlowStepId, {
        label: `Failed: ${errorMessage}`,
        status: "error",
      });

      return false;
    }
  }, [
    amountPerPayment,
    bobWallet?.lightningAddress,
    getNWCClient,
    setWalletBalance,
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  ]);

  const startStreaming = async () => {
    setIsStarting(true);
    setError(null);

    addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: "▶️ Started streaming",
      direction: "right",
      status: "success",
      snippetIds: ["subscribe-notifications"],
    });

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: "Starting streaming payments...",
      snippetIds: ["subscribe-notifications"],
    });

    // Send first payment immediately
    const success = await sendStreamingPayment();

    if (success) {
      setIsStreaming(true);
      setNextPaymentIn(streamingConfig.paymentInterval);

      updateTransaction(txId, {
        status: "success",
        description: `Streaming: ${streamingConfig.satsPerMinute} sats/min (${amountPerPayment} sats every ${streamingConfig.paymentInterval}s)`,
      });

      //Set up interval for recurring payments
      intervalRef.current = setInterval(() => {
        sendStreamingPayment();
        setNextPaymentIn(streamingConfig.paymentInterval);
      }, streamingConfig.paymentInterval * 1000);

      // Set up countdown timer
      countdownRef.current = setInterval(() => {
        setNextPaymentIn((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);

      // Set up streaming time counter
      timeRef.current = setInterval(() => {
        setStreamingTime((prev) => prev + 1);
      }, 1000);
    } else {
      updateTransaction(txId, {
        status: "error",
        description: "Failed to start streaming",
      });
    }

    setIsStarting(false);
  };

  const stopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }
    setIsStreaming(false);
    setNextPaymentIn(null);

    addTransaction({
      type: "invoice_created",
      status: "success",
      description: `Streaming stopped. Total streamed: ${totalPaid} sats over ${Math.floor(streamingTime / 60)}m ${streamingTime % 60}s`,
      snippetIds: ["subscribe-notifications"],
    });

    addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: "⏸️ Stopped streaming",
      direction: "right",
      status: "success",
      snippetIds: ["subscribe-notifications"],
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Content Consumer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Player Simulation */}
        <div className="p-4 bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-linear-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Lightning Podcast Episode #42</p>
              <p className="text-xs text-muted-foreground">By Bob's Creator Channel</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-linear-to-r from-purple-500 to-blue-500 transition-all ${
                  isStreaming ? "animate-pulse" : ""
                }`}
                style={{
                  width: streamingTime > 0 ? `${Math.min((streamingTime / 180) * 100, 100)}%` : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(streamingTime)}</span>
              <span>3:00</span>
            </div>
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center justify-center mt-4">
            <Button
              size="lg"
              onClick={isStreaming ? stopStreaming : startStreaming}
              disabled={isStarting}
              className="rounded-full h-14 w-14 p-0"
            >
              {isStarting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isStreaming ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Streaming Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Streaming Rate</p>
            <p className="text-sm font-medium">
              {streamingConfig.satsPerMinute} <span className="text-xs text-muted-foreground">sats/min</span>
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
            <p className="text-sm font-medium">
              {totalPaid} <span className="text-xs text-muted-foreground">sats</span>
            </p>
          </div>
        </div>

        {isStreaming && nextPaymentIn !== null && (
          <div className="text-xs text-muted-foreground text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            💸 Next payment in {nextPaymentIn}s ({amountPerPayment} sats)
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">How it works</p>
          <p className="text-xs mt-1 opacity-90">
            While streaming, Alice automatically pays Bob {amountPerPayment} sats every {streamingConfig.paymentInterval} seconds ({streamingConfig.satsPerMinute} sats/minute). Perfect for podcasts, music, or video!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [receivedPayments, setReceivedPayments] = useState<StreamingPayment[]>([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } = useTransactionStore();

  const bobWallet = getWallet("bob");

  const handleNotification = useCallback(
    (notification: any) => {
      if (notification.notification_type === "payment_received") {
        const tx = notification.notification;
        const amountSats = Math.floor(tx.amount / 1000);

        const payment: StreamingPayment = {
          id: tx.payment_hash || Date.now().toString(),
          amount: amountSats,
          timestamp: new Date(),
        };

        setReceivedPayments((prev) => [payment, ...prev].slice(0, 10)); // Keep last 10
        setTotalReceived((prev) => prev + amountSats);

        addTransaction({
          type: "payment_received",
          status: "success",
          toWallet: "bob",
          amount: amountSats,
          description: `Streaming payment received: ${amountSats} sats`,
          snippetIds: ["subscribe-notifications"],
        });

        addFlowStep({
          fromWallet: "alice",
          toWallet: "bob",
          label: `💰 +${amountSats} sats`,
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
    [addTransaction, addFlowStep, addBalanceSnapshot, getNWCClient, setWalletBalance],
  );

  const startListening = async () => {
    const client = getNWCClient("bob");
    if (!client) return;

    try {
      const unsub = await client.subscribeNotifications(handleNotification, ["payment_received"]);
      unsubRef.current = unsub;

      addTransaction({
        type: "subscription_started",
        status: "success",
        description: "Bob is listening for streaming payments",
        snippetIds: ["subscribe-notifications"],
      });
    } catch (err) {
      console.error("Failed to subscribe:", err);
    }
  };

  // Auto-start listening
  useEffect(() => {
    startListening();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Content Creator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bobWallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs">{bobWallet.lightningAddress}</span>
          </div>
        )}

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {totalReceived} <span className="text-xs">sats</span>
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Listener Status</p>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-600 dark:text-green-400">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Recent Streaming Payments</label>
          <div className="min-h-[180px] max-h-[180px] overflow-y-auto space-y-2">
            {receivedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Waiting for streaming payments...
              </p>
            ) : (
              receivedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300"
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

        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-200">
          <p className="font-medium">💡 Value4Value Model</p>
          <p className="text-xs mt-1 opacity-90">
            Bob earns streaming payments while Alice consumes content. Popular in podcasting 2.0 and music streaming!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
