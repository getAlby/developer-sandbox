import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Bell, BellOff, Zap, Mail, Settings } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

interface PrismPayment {
  id: string;
  receivedAmount: number;
  charlieAmount: number;
  davidAmount: number;
  keptAmount: number;
  timestamp: Date;
}

interface ReceivedPayment {
  id: string;
  amount: number;
  timestamp: Date;
}

export function PaymentPrismsScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const allConnected = areAllWalletsConnected([
    "alice",
    "bob",
    "charlie",
    "david",
  ]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <AlicePanel />
      <BobPanel />
      <RecipientPanel walletId="charlie" />
      <RecipientPanel walletId="david" />
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
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setLastPayment({ amount: satoshi, success: false });

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
          <span>Alice: Send</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Recipient</label>
          <Input
            value={addressToUse}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="bob@example.com"
            disabled={isPaying}
            className="text-xs"
          />
          {bobWallet?.lightningAddress && !address && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Using Bob's address
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Quick Pay</label>
          <div className="flex gap-1">
            {[100, 500, 1000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handleQuickPay(amount)}
                disabled={isPaying || !addressToUse}
                className="flex-1 text-xs px-1"
                size="sm"
              >
                {isPaying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>{amount}</>
                )}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {lastPayment && (
          <div
            className={`p-2 rounded-lg text-xs ${lastPayment.success ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}
          >
            {lastPayment.success
              ? `✅ Sent ${lastPayment.amount} sats`
              : `❌ Failed`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [charliePercent, setCharliePercent] = useState("5");
  const [davidPercent, setDavidPercent] = useState("10");
  const [prismPayments, setPrismPayments] = useState<PrismPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const charliePercentRef = useRef(charliePercent);
  const davidPercentRef = useRef(davidPercent);

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
  const davidWallet = getWallet("david");

  // Keep refs in sync with state
  useEffect(() => {
    charliePercentRef.current = charliePercent;
    davidPercentRef.current = davidPercent;
  }, [charliePercent, davidPercent]);

  const payToRecipient = async (
    recipientId: string,
    recipientAddress: string,
    amount: number,
  ) => {
    const client = getNWCClient("bob");
    if (!client || amount < 1) return false;

    try {
      const ln = new LightningAddress(recipientAddress);
      await ln.fetch();
      const invoice = await ln.requestInvoice({ satoshi: amount });
      await client.payInvoice({ invoice: invoice.paymentRequest });

      // Update recipient's balance
      const recipientClient = getNWCClient(recipientId);
      if (recipientClient) {
        const balance = await recipientClient.getBalance();
        const balanceSats = Math.floor(balance.balance / 1000);
        setWalletBalance(recipientId, balanceSats);
        addBalanceSnapshot({ walletId: recipientId, balance: balanceSats });
      }

      return true;
    } catch (err) {
      console.error(`Failed to pay ${recipientId}:`, err);
      return false;
    }
  };

  const splitPayment = useCallback(
    async (amountSats: number) => {
      const client = getNWCClient("bob");
      if (
        !client ||
        !charlieWallet?.lightningAddress ||
        !davidWallet?.lightningAddress
      ) {
        console.error("Cannot split: missing client or recipient addresses");
        return;
      }

      const cPercent = parseInt(charliePercentRef.current) || 5;
      const dPercent = parseInt(davidPercentRef.current) || 5;
      const charlieAmount = Math.floor((amountSats * cPercent) / 100);
      const davidAmount = Math.floor((amountSats * dPercent) / 100);
      const keptAmount = amountSats - charlieAmount - davidAmount;

      const txId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        description: `Bob splitting ${amountSats} sats via prism...`,
        snippetIds: ["pay-lightning-address"],
      });

      const charlieFlowStepId = addFlowStep({
        fromWallet: "bob",
        toWallet: "charlie",
        label: `Splitting ${charlieAmount} sats (${cPercent}%)...`,
        direction: "right",
        status: "pending",
        snippetIds: ["pay-lightning-address"],
      });

      const charlieTxId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        toWallet: "charlie",
        description: `Bob splitting ${amountSats} sats via prism...`,
        snippetIds: ["pay-lightning-address"],
      });

      const davidFlowStepId = addFlowStep({
        fromWallet: "bob",
        toWallet: "david",
        label: `Splitting ${davidAmount} sats (${dPercent}%)...`,
        direction: "right",
        status: "pending",
        snippetIds: ["pay-lightning-address"],
      });

      const davidTxId = addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        toWallet: "david",
        description: `Bob splitting ${amountSats} sats via prism...`,
        snippetIds: ["pay-lightning-address"],
      });

      // Pay Charlie
      let charlieSuccess = false;
      if (charlieAmount >= 1) {
        charlieSuccess = await payToRecipient(
          "charlie",
          charlieWallet.lightningAddress,
          charlieAmount,
        );

        // Update flow step to success or error
        updateFlowStep(charlieFlowStepId, {
          label: charlieSuccess
            ? `✅ Charlie: ${charlieAmount} sats`
            : "❌ Charlie failed",
          status: charlieSuccess ? "success" : "error",
        });

        updateTransaction(charlieTxId, {
          description: charlieSuccess
            ? `✅ Charlie: ${charlieAmount} sats`
            : "❌ Charlie failed",
          status: charlieSuccess ? "success" : "error",
        });
      } else {
        // Amount too small, mark as success (skipped)
        updateFlowStep(charlieFlowStepId, {
          label: `Charlie: skipped (0 sats)`,
          status: "success",
        });
      }

      // Pay David
      let davidSuccess = false;
      if (davidAmount >= 1) {
        davidSuccess = await payToRecipient(
          "david",
          davidWallet.lightningAddress,
          davidAmount,
        );

        // Update flow step to success or error
        updateFlowStep(davidFlowStepId, {
          label: davidSuccess
            ? `✅ David: ${davidAmount} sats`
            : "❌ David failed",
          status: davidSuccess ? "success" : "error",
        });

        updateTransaction(davidTxId, {
          description: davidSuccess
            ? `✅ David: ${davidAmount} sats`
            : "❌ David failed",
          status: davidSuccess ? "success" : "error",
        });
      } else {
        // Amount too small, mark as success (skipped)
        updateFlowStep(davidFlowStepId, {
          label: `David: skipped (0 sats)`,
          status: "success",
        });
      }

      // Update Bob's balance
      const bobBalance = await client.getBalance();
      const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
      setWalletBalance("bob", bobBalanceSats);
      addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

      const payment: PrismPayment = {
        id: Date.now().toString(),
        receivedAmount: amountSats,
        charlieAmount: charlieSuccess ? charlieAmount : 0,
        davidAmount: davidSuccess ? davidAmount : 0,
        keptAmount:
          keptAmount +
          (charlieSuccess ? 0 : charlieAmount) +
          (davidSuccess ? 0 : davidAmount),
        timestamp: new Date(),
      };

      setPrismPayments((prev) => [payment, ...prev]);

      updateTransaction(txId, {
        status: "success",
        description: `Prism split: Charlie ${charlieAmount} sats, David ${davidAmount} sats, kept ${keptAmount} sats`,
      });
    },
    [
      getNWCClient,
      charlieWallet?.lightningAddress,
      davidWallet?.lightningAddress,
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
          snippetIds: ["subscribe-notifications"],
        });

        addFlowStep({
          fromWallet: "bob",
          toWallet: "bob",
          label: `🔔 Received ${amountSats} sats`,
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

        // Split the payment
        splitPayment(amountSats);
      }
    },
    [
      addTransaction,
      addFlowStep,
      addBalanceSnapshot,
      getNWCClient,
      setWalletBalance,
      splitPayment,
    ],
  );

  const startListening = async () => {
    const client = getNWCClient("bob");
    if (!client) {
      setError("Bob wallet not connected");
      return;
    }

    if (!charlieWallet?.lightningAddress || !davidWallet?.lightningAddress) {
      setError("Recipient lightning addresses not available");
      return;
    }

    setIsStarting(true);
    setError(null);

    const txId = addTransaction({
      type: "invoice_created",
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

      const cPercent = charliePercent;
      const dPercent = davidPercent;

      updateTransaction(txId, {
        status: "success",
        description: `Bob listening - prism: Charlie ${cPercent}%, David ${dPercent}%`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `🔺 Prism active`,
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
      type: "invoice_created",
      status: "success",
      description: "Bob stopped prism splitting",
      snippetIds: ["subscribe-notifications"],
    });

    addFlowStep({
      fromWallet: "bob",
      toWallet: "bob",
      label: "🔺 Prism stopped",
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

  const keptPercent =
    100 - (parseInt(charliePercent) || 0) - (parseInt(davidPercent) || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Prism</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bobWallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs truncate">
              {bobWallet.lightningAddress}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Prism Split
          </label>
          <div className="p-2 bg-muted rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Charlie:</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={charliePercent}
                  onChange={(e) => setCharliePercent(e.target.value)}
                  disabled={isListening}
                  className="w-14 h-7 text-xs text-center"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>David:</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={davidPercent}
                  onChange={(e) => setDavidPercent(e.target.value)}
                  disabled={isListening}
                  className="w-14 h-7 text-xs text-center"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-muted-foreground border-t pt-1">
              <span>Bob keeps:</span>
              <span>{keptPercent}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isListening ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Active
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Stopped</span>
            )}
          </div>

          <Button
            variant={isListening ? "outline" : "default"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={isStarting}
            className="text-xs"
          >
            {isStarting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isListening ? (
              <>
                <BellOff className="mr-1 h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Bell className="mr-1 h-3 w-3" />
                Start
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {prismPayments.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Splits</label>
            <div className="max-h-[100px] overflow-y-auto space-y-1">
              {prismPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded text-xs"
                >
                  <div className="text-green-700 dark:text-green-300">
                    ✅ Charlie:{payment.charlieAmount} David:
                    {payment.davidAmount} Kept:{payment.keptAmount}
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

interface RecipientPanelProps {
  walletId: "charlie" | "david";
}

function RecipientPanel({ walletId }: RecipientPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const hasAutoStartedRef = useRef(false);
  const seenPaymentsRef = useRef<Set<string>>(new Set());

  const { getNWCClient, getWallet, setWalletBalance } = useWalletStore();
  const { addFlowStep, addBalanceSnapshot } = useTransactionStore();

  const wallet = getWallet(walletId);
  const persona = WALLET_PERSONAS[walletId];

  // Use refs for the notification handler to avoid recreating subscriptions
  const handleNotificationRef = useRef<
    ((notification: Nip47Notification) => void) | null
  >(null);
  handleNotificationRef.current = (notification: Nip47Notification) => {
    if (notification.notification_type === "payment_received") {
      const tx = notification.notification;
      const amountSats = Math.floor(tx.amount / 1000);
      const paymentId = tx.payment_hash || Date.now().toString();

      // Deduplicate - only process if this payment hasn't been seen yet
      if (seenPaymentsRef.current.has(paymentId)) {
        return;
      }
      seenPaymentsRef.current.add(paymentId);

      const payment: ReceivedPayment = {
        id: paymentId,
        amount: amountSats,
        timestamp: new Date(),
      };

      setReceivedPayments((prev) => [payment, ...prev]);

      // Note: We don't add a transaction here because BobPanel already logs
      // the prism split. This notification just updates the recipient's UI
      // and flow diagram.

      addFlowStep({
        fromWallet: walletId,
        toWallet: walletId,
        label: `🔔 ${persona.name}: +${amountSats} sats`,
        direction: "right",
        status: "success",
        snippetIds: ["subscribe-notifications"],
      });

      // Update balance
      const client = getNWCClient(walletId);
      if (client) {
        client.getBalance().then((balance) => {
          const balanceSats = Math.floor(balance.balance / 1000);
          setWalletBalance(walletId, balanceSats);
          addBalanceSnapshot({ walletId, balance: balanceSats });
        });
      }
    }
  };

  const startListening = async () => {
    if (unsubRef.current) return; // Already listening

    const client = getNWCClient(walletId);
    if (!client) {
      setError(`${persona.name} wallet not connected`);
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const unsub = await client.subscribeNotifications(
        (notification) => handleNotificationRef.current?.(notification),
        ["payment_received"],
      );

      unsubRef.current = unsub;
      setIsListening(true);
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to subscribe");
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
  };

  // Auto-start listening when component mounts - only once
  useEffect(() => {
    // Skip if we've already auto-started (handles React Strict Mode)
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;

    const client = getNWCClient(walletId);
    if (!client) return;

    let unsub: (() => void) | null = null;

    client
      .subscribeNotifications(
        (notification) => handleNotificationRef.current?.(notification),
        ["payment_received"],
      )
      .then((unsubFn) => {
        unsub = unsubFn;
        unsubRef.current = unsubFn;
        setIsListening(true);
      })
      .catch((err) => {
        console.error("Failed to subscribe:", err);
      });

    return () => {
      if (unsub) {
        unsub();
      }
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{persona.emoji}</span>
          <span>{persona.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wallet?.lightningAddress && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs truncate">
              {wallet.lightningAddress}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isListening ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Waiting
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Stopped</span>
            )}
          </div>

          <Button
            variant={isListening ? "outline" : "default"}
            size="sm"
            onClick={isListening ? stopListening : () => startListening()}
            disabled={isStarting}
            className="text-xs"
          >
            {isStarting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isListening ? (
              <BellOff className="h-3 w-3" />
            ) : (
              <Bell className="h-3 w-3" />
            )}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Incoming</label>
          <div className="min-h-[60px] max-h-[100px] overflow-y-auto space-y-1">
            {receivedPayments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                {isListening ? "Waiting..." : "Start to see payments"}
              </p>
            ) : (
              receivedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-900/20 rounded"
                >
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      +{payment.amount}
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
