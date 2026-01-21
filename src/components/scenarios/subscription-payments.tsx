import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Play, Square, Zap, Mail } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

interface ReceivedPayment {
  id: string;
  amount: number;
  timestamp: Date;
}

// Shared state for subscription configuration
let subscriptionConfig = {
  amount: 100,
  interval: 10,
};
const configListeners = new Set<() => void>();

function notifyConfigListeners() {
  configListeners.forEach((listener) => listener());
}

function setSubscriptionConfig(amount: number, interval: number) {
  subscriptionConfig = { amount, interval };
  notifyConfigListeners();
}

function useSubscriptionConfig() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    configListeners.add(listener);
    return () => {
      configListeners.delete(listener);
    };
  }, []);

  return subscriptionConfig;
}

export function SubscriptionPaymentsScenario() {
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
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [selectedInterval, setSelectedInterval] = useState(10);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setSubscriptionConfig(amount, selectedInterval);
  };

  const handleIntervalSelect = (interval: number) => {
    setSelectedInterval(interval);
    setSubscriptionConfig(selectedAmount, interval);
  };

  // Initialize shared config
  useEffect(() => {
    setSubscriptionConfig(selectedAmount, selectedInterval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Subscription Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Payment Amount
          </label>
          <div className="flex gap-2">
            {[100, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                onClick={() => handleAmountSelect(amount)}
                className="flex-1"
              >
                {amount}
                <span className="ml-1 text-xs opacity-70">sats</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Payment Interval
          </label>
          <div className="flex gap-2">
            {[10, 30, 60].map((interval) => (
              <Button
                key={interval}
                variant={selectedInterval === interval ? "default" : "outline"}
                onClick={() => handleIntervalSelect(interval)}
                className="flex-1"
              >
                {interval}
                <span className="ml-1 text-xs opacity-70">sec</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">How it works</p>
          <p className="text-xs mt-1 opacity-90">
            Alice's wallet connection allows Bob to charge{" "}
            <strong>{selectedAmount} sats</strong> every{" "}
            <strong>{selectedInterval} seconds</strong>. Bob uses this
            connection to pay invoices to himself.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [isCharging, setIsCharging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [nextChargeIn, setNextChargeIn] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  const config = useSubscriptionConfig();
  const bobWallet = getWallet("bob");

  const chargeSubscription = useCallback(async () => {
    const aliceClient = getNWCClient("alice");
    const bobClient = getNWCClient("bob");
    const bobAddress = bobWallet?.lightningAddress;

    if (!aliceClient || !bobClient || !bobAddress) {
      setError("Missing wallet connection or lightning address");
      return false;
    }

    try {
      addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "alice",
        toWallet: "bob",
        amount: config.amount,
        description: `Subscription charge: ${config.amount} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Requesting invoice for ${config.amount} sats...`,
        direction: "left",
        status: "pending",
      });

      // Bob requests an invoice from his own lightning address
      const ln = new LightningAddress(bobAddress);
      await ln.fetch();
      const invoice = await ln.requestInvoice({ satoshi: config.amount });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: `Invoice: ${config.amount} sats`,
        direction: "right",
        status: "success",
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Paying subscription...",
        direction: "right",
        status: "pending",
      });

      // Use Alice's NWC connection to pay the invoice (Bob charges Alice)
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

      // Add to received payments list
      const payment: ReceivedPayment = {
        id: Date.now().toString(),
        amount: config.amount,
        timestamp: new Date(),
      };
      setReceivedPayments((prev) => [payment, ...prev]);

      addTransaction({
        type: "payment_received",
        status: "success",
        fromWallet: "alice",
        toWallet: "bob",
        amount: config.amount,
        description: `Subscription payment received: ${config.amount} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Payment confirmed",
        direction: "left",
        status: "success",
      });

      return true;
    } catch (err) {
      console.error("Subscription charge failed:", err);
      setError(err instanceof Error ? err.message : "Charge failed");

      addTransaction({
        type: "payment_failed",
        status: "error",
        fromWallet: "alice",
        toWallet: "bob",
        description: "Subscription charge failed",
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Payment failed",
        direction: "right",
        status: "error",
      });

      return false;
    }
  }, [
    config.amount,
    bobWallet?.lightningAddress,
    getNWCClient,
    setWalletBalance,
    addTransaction,
    addFlowStep,
    addBalanceSnapshot,
  ]);

  const startCharging = async () => {
    setIsStarting(true);
    setError(null);

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: `Subscription started`,
      direction: "right",
      status: "success",
    });

    addTransaction({
      type: "invoice_created",
      status: "pending",
      description: "Starting subscription charges...",
    });

    // Charge immediately first
    const success = await chargeSubscription();

    if (success) {
      setIsCharging(true);
      setNextChargeIn(config.interval);

      addTransaction({
        type: "invoice_created",
        status: "success",
        description: `Subscription active: ${config.amount} sats every ${config.interval}s`,
      });

      // Set up interval for recurring charges
      intervalRef.current = setInterval(() => {
        chargeSubscription();
        setNextChargeIn(config.interval);
      }, config.interval * 1000);

      // Set up countdown timer
      countdownRef.current = setInterval(() => {
        setNextChargeIn((prev) =>
          prev !== null && prev > 0 ? prev - 1 : null,
        );
      }, 1000);
    }

    setIsStarting(false);
  };

  const stopCharging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsCharging(false);
    setNextChargeIn(null);

    addTransaction({
      type: "invoice_created",
      status: "success",
      description: "Subscription stopped",
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "Subscription stopped",
      direction: "right",
      status: "success",
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Subscription Service</span>
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
            {isCharging ? (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Charging
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Not charging
              </span>
            )}
          </div>

          <Button
            variant={isCharging ? "outline" : "default"}
            size="sm"
            onClick={isCharging ? stopCharging : startCharging}
            disabled={isStarting}
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCharging ? (
              <>
                <Square className="mr-1 h-4 w-4" />
                Stop Charging
              </>
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" />
                Start Charging
              </>
            )}
          </Button>
        </div>

        {isCharging && nextChargeIn !== null && (
          <div className="text-xs text-muted-foreground text-center">
            Next charge in {nextChargeIn}s
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Incoming Payments
          </label>
          <div className="min-h-[120px] max-h-[200px] overflow-y-auto space-y-2">
            {receivedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isCharging
                  ? "Waiting for subscription payments..."
                  : "Start charging to receive subscription payments"}
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
