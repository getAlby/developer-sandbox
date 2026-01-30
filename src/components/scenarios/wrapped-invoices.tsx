import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Copy,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useWalletStore,
  useTransactionStore,
  useWrappedInvoiceStore,
} from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

export function WrappedInvoicesScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const { reset } = useWrappedInvoiceStore();
  const allConnected = areAllWalletsConnected(["alice", "bob", "charlie"]);

  // Reset shared state when component mounts
  useEffect(() => {
    reset();
  }, [reset]);

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

function CharliePanel() {
  const [amount, setAmount] = useState("1000");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getNWCClient } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep } =
    useTransactionStore();
  const { state, charlieInvoice, setCharlieInvoice, setState } =
    useWrappedInvoiceStore();

  const createInvoice = async () => {
    const client = getNWCClient("charlie");
    if (!client) {
      setError("Charlie wallet not connected");
      return;
    }

    setIsCreating(true);
    setError(null);

    const satoshi = parseInt(amount);
    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: `Charlie creating invoice for ${satoshi} sats...`,
      snippetIds: ["make-invoice"],
    });

    try {
      const response = await client.makeInvoice({
        amount: satoshi * 1000, // millisats
        description: "Payment to Charlie",
      });

      // Decode invoice to get payment hash
      const decoded = await client.lookupInvoice({
        invoice: response.invoice,
      });

      const invoiceData = {
        invoice: response.invoice,
        paymentHash: decoded.payment_hash,
        amount: satoshi,
      };

      setCharlieInvoice(invoiceData);
      setState("charlie_invoice_created");

      updateTransaction(txId, {
        status: "success",
        amount: satoshi,
        description: `Charlie created invoice for ${satoshi} sats`,
      });

      addFlowStep({
        fromWallet: "charlie",
        toWallet: "bob",
        label: `Invoice: ${satoshi} sats`,
        direction: "left",
        status: "success",
        snippetIds: ["make-invoice"],
      });
    } catch (err) {
      console.error("Failed to create invoice:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to create invoice: ${errorMessage}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyInvoice = async () => {
    if (!charlieInvoice) return;
    await navigator.clipboard.writeText(charlieInvoice.invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPaid = state === "bob_paid_charlie" || state === "settled";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.charlie.emoji}</span>
          <span>Charlie: Create Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p>
                Charlie creates a regular invoice. Bob will wrap it to act as
                intermediary.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Amount (sats)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                disabled={isCreating}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={createInvoice}
              disabled={isCreating || !amount}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create Invoice
                </>
              )}
            </Button>
          </>
        )}

        {state !== "idle" && charlieInvoice && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-mono font-medium">
                {charlieInvoice.amount} sats
              </span>
            </div>

            {!isPaid && (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-mono text-xs break-all">
                    {charlieInvoice.invoice.substring(0, 60)}...
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyInvoice}
                    className="mt-2 w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy Invoice
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  <span className="relative flex h-2 w-2 inline-block mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  Waiting for payment...
                </p>
              </>
            )}

            {isPaid && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
                <p>
                  <span className="text-lg mr-1">✅</span>
                  Payment received! +{charlieInvoice.amount} sats
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [fee, setFee] = useState("100");
  const [isWrapping, setIsWrapping] = useState(false);
  const [isPayingCharlie, setIsPayingCharlie] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();
  const {
    state,
    charlieInvoice,
    bobWrapped,
    receivedPreimage,
    setState,
    setBobWrapped,
    setReceivedPreimage,
  } = useWrappedInvoiceStore();

  // Refs to access latest state in callbacks
  const bobWrappedRef = useRef(bobWrapped);
  useEffect(() => {
    bobWrappedRef.current = bobWrapped;
  }, [bobWrapped]);

  const handleNotification = useCallback(
    (notification: Nip47Notification) => {
      console.log("=== BOB RECEIVED NOTIFICATION ===");
      console.log("Type:", notification.notification_type);
      console.log("Full notification:", JSON.stringify(notification, null, 2));
      const currentBobWrapped = bobWrappedRef.current;

      if (notification.notification_type === "hold_invoice_accepted") {
        console.log("Hold invoice accepted notification received");
        console.log("Expected payment_hash:", currentBobWrapped?.paymentHash);
        console.log(
          "Received payment_hash:",
          notification.notification.payment_hash,
        );

        if (currentBobWrapped) {
          setState("alice_paid");

          addTransaction({
            type: "payment_received",
            status: "pending",
            toWallet: "bob",
            amount: currentBobWrapped.totalAmount,
            description: `Alice's payment HELD (${currentBobWrapped.totalAmount} sats) - in network, not Bob's wallet`,
            snippetIds: ["subscribe-hold-notifications"],
          });

          addFlowStep({
            fromWallet: "bob",
            toWallet: "bob",
            label: `🔒 Alice's ${currentBobWrapped.totalAmount} sats HELD (in network)`,
            direction: "left",
            status: "pending",
            snippetIds: ["subscribe-hold-notifications"],
          });
        }
      }
    },
    [addTransaction, addFlowStep, setState],
  );

  const createWrappedInvoice = async () => {
    if (!charlieInvoice) return;

    const client = getNWCClient("bob");
    if (!client) {
      setError("Bob wallet not connected");
      return;
    }

    setIsWrapping(true);
    setError(null);

    const feeAmount = parseInt(fee) || 100;
    const totalAmount = charlieInvoice.amount + feeAmount;

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: `Bob creating wrapped hold invoice for ${totalAmount} sats...`,
      snippetIds: ["hold-invoice"],
    });

    try {
      // Create hold invoice with SAME payment hash as Charlie's invoice
      // Note: We don't need a preimage - we'll get it from paying Charlie
      console.log(
        "Creating hold invoice with Charlie's payment_hash:",
        charlieInvoice.paymentHash,
      );
      const response = await client.makeHoldInvoice({
        amount: totalAmount * 1000, // millisats
        description: `Wrapped invoice (${charlieInvoice.amount} + ${feeAmount} fee)`,
        payment_hash: charlieInvoice.paymentHash,
      });

      console.log(
        "makeHoldInvoice response:",
        JSON.stringify(response, null, 2),
      );
      console.log(
        "Created wrapped invoice with payment_hash:",
        charlieInvoice.paymentHash,
      );

      const wrappedData = {
        wrappedInvoice: response.invoice,
        preimage: "", // Will be filled when we pay Charlie
        paymentHash: charlieInvoice.paymentHash,
        totalAmount,
        fee: feeAmount,
        charlieAmount: charlieInvoice.amount,
      };

      bobWrappedRef.current = wrappedData;
      setBobWrapped(wrappedData);
      setState("bob_wrapped");

      updateTransaction(txId, {
        status: "success",
        amount: totalAmount,
        description: `Bob created wrapped invoice: ${totalAmount} sats (same payment hash)`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Wrapped: ${totalAmount} sats (${feeAmount} fee)`,
        direction: "left",
        status: "success",
        snippetIds: ["hold-invoice"],
      });

      // Subscribe to notifications for when Alice pays
      console.log(
        "Subscribing to hold_invoice_accepted notifications for Bob...",
      );
      const unsub = await client.subscribeNotifications(handleNotification, [
        "hold_invoice_accepted",
      ]);
      console.log("Subscription established for Bob");
      unsubRef.current = unsub;
    } catch (err) {
      console.error("Failed to create wrapped invoice:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to create wrapped invoice: ${errorMessage}`,
      });
    } finally {
      setIsWrapping(false);
    }
  };

  const payCharlie = async () => {
    if (!charlieInvoice || !bobWrapped) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsPayingCharlie(true);
    setError(null);

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "bob",
      toWallet: "charlie",
      amount: charlieInvoice.amount,
      description: `Bob paying Charlie ${charlieInvoice.amount} sats (using Bob's own funds)...`,
      snippetIds: ["pay-invoice"],
    });

    const flowStepId = addFlowStep({
      fromWallet: "bob",
      toWallet: "charlie",
      label: `Paying Charlie ${charlieInvoice.amount} sats...`,
      direction: "right",
      status: "pending",
      snippetIds: ["pay-invoice"],
    });

    try {
      const result = await client.payInvoice({
        invoice: charlieInvoice.invoice,
      });

      // We get the preimage from paying Charlie!
      const preimage = result.preimage;
      setReceivedPreimage(preimage);
      setState("bob_paid_charlie");

      // Update Bob's balance (decreased by Charlie's amount)
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

      updateTransaction(txId, {
        status: "success",
        description: `Bob paid Charlie ${charlieInvoice.amount} sats - received preimage!`,
      });

      updateFlowStep(flowStepId, {
        label: `✅ Paid Charlie, got preimage`,
        status: "success",
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `🔑 Preimage: ${preimage.substring(0, 16)}...`,
        direction: "right",
        status: "success",
        snippetIds: ["pay-invoice"],
      });
    } catch (err) {
      console.error("Failed to pay Charlie:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to pay Charlie: ${errorMessage}`,
      });

      updateFlowStep(flowStepId, {
        label: `Failed to pay Charlie`,
        status: "error",
      });
    } finally {
      setIsPayingCharlie(false);
    }
  };

  const settleAlicePayment = async () => {
    if (!bobWrapped || !receivedPreimage) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsSettling(true);
    setError(null);

    const txId = addTransaction({
      type: "payment_received",
      status: "pending",
      toWallet: "bob",
      amount: bobWrapped.totalAmount,
      description: `Bob settling Alice's payment with preimage...`,
      snippetIds: ["hold-invoice-settle"],
    });

    try {
      await client.settleHoldInvoice({ preimage: receivedPreimage });

      setState("settled");

      // Update Bob's balance (increased by Alice's payment)
      const bobBalance = await client.getBalance();
      const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
      setWalletBalance("bob", bobBalanceSats);
      addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

      // Update Alice's balance
      const aliceClient = getNWCClient("alice");
      if (aliceClient) {
        const aliceBalance = await aliceClient.getBalance();
        const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
        setWalletBalance("alice", aliceBalanceSats);
        addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });
      }

      updateTransaction(txId, {
        status: "success",
        description: `Bob settled! Earned ${bobWrapped.fee} sats fee`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `✅ Settled! Fee earned: ${bobWrapped.fee} sats`,
        direction: "right",
        status: "success",
        snippetIds: ["hold-invoice-settle"],
      });

      // Cleanup
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    } catch (err) {
      console.error("Failed to settle:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to settle: ${errorMessage}`,
      });
    } finally {
      setIsSettling(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  const canWrap = state === "charlie_invoice_created" && charlieInvoice;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Wrap Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground text-center">
            Waiting for Charlie to create an invoice...
          </div>
        )}

        {canWrap && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Charlie's Invoice Received</p>
              <p>
                Amount: {charlieInvoice.amount} sats
                <br />
                Hash: {charlieInvoice.paymentHash.substring(0, 16)}...
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Your Fee (sats)
              </label>
              <Input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="100"
                disabled={isWrapping}
              />
            </div>

            <div className="p-2 bg-muted rounded-lg text-xs">
              <div className="flex justify-between">
                <span>Charlie's amount:</span>
                <span>{charlieInvoice.amount} sats</span>
              </div>
              <div className="flex justify-between">
                <span>Your fee:</span>
                <span>+{fee} sats</span>
              </div>
              <div className="flex justify-between font-medium border-t mt-1 pt-1">
                <span>Wrapped total:</span>
                <span>{charlieInvoice.amount + (parseInt(fee) || 0)} sats</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={createWrappedInvoice}
              disabled={isWrapping}
              className="w-full"
            >
              {isWrapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Create Wrapped Invoice
                </>
              )}
            </Button>
          </>
        )}

        {state === "bob_wrapped" && bobWrapped && (
          <>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Wrapped Invoice Ready</p>
              <p className="text-xs mt-1">
                Total: {bobWrapped.totalAmount} sats ({bobWrapped.fee} fee)
              </p>
              <p className="text-xs">Same payment hash as Charlie's invoice</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              <span className="relative flex h-2 w-2 inline-block mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              Waiting for Alice to pay...
            </p>
          </>
        )}

        {state === "alice_paid" && bobWrapped && (
          <>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium">
                🔒 Alice's payment HELD ({bobWrapped.totalAmount} sats)
              </p>
              <p className="text-xs mt-1">
                Funds are locked in the network, NOT in your wallet.
                <br />
                Now pay Charlie with YOUR funds to get the preimage.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={payCharlie}
              disabled={isPayingCharlie}
              className="w-full"
            >
              {isPayingCharlie ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Paying Charlie...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Pay Charlie {charlieInvoice?.amount} sats
                </>
              )}
            </Button>
          </>
        )}

        {state === "bob_paid_charlie" && bobWrapped && receivedPreimage && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">✅ Charlie Paid!</p>
              <p className="text-xs mt-1">
                Preimage received. Now settle Alice's payment to claim your fee.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={settleAlicePayment}
              disabled={isSettling}
              className="w-full"
            >
              {isSettling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Settling...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Settle & Claim {bobWrapped.fee} sats fee
                </>
              )}
            </Button>
          </>
        )}

        {state === "settled" && bobWrapped && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <p className="font-medium text-lg">🎉 Success!</p>
            <p className="mt-1">
              You acted as a non-custodial intermediary.
              <br />
              Fee earned:{" "}
              <span className="font-mono">{bobWrapped.fee} sats</span>
            </p>
          </div>
        )}

        {(bobWrapped || receivedPreimage) && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Technical Details
            </button>

            {showDetails && (
              <div className="p-2 bg-muted rounded text-xs font-mono space-y-1">
                {bobWrapped && (
                  <p>
                    <span className="text-muted-foreground">payment_hash:</span>{" "}
                    {bobWrapped.paymentHash}
                  </p>
                )}
                {receivedPreimage && (
                  <p>
                    <span className="text-muted-foreground">preimage:</span>{" "}
                    {receivedPreimage}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AlicePanel() {
  const [invoiceInput, setInvoiceInput] = useState("");
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
  const { state, bobWrapped } = useWrappedInvoiceStore();

  const invoiceToUse = invoiceInput || bobWrapped?.wrappedInvoice || "";

  const canPay =
    (state === "bob_wrapped" || state === "alice_paid") && invoiceToUse;
  const hasPaid =
    state === "alice_paid" ||
    state === "bob_paid_charlie" ||
    state === "settled";

  const handlePay = async () => {
    if (!invoiceToUse) return;

    const client = getNWCClient("alice");
    if (!client) return;

    setIsPaying(true);
    setError(null);

    const amount = bobWrapped?.totalAmount || 0;

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "alice",
      toWallet: "bob",
      amount,
      description: `Alice paying wrapped invoice for ${amount} sats...`,
      snippetIds: ["pay-invoice"],
    });

    const flowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: `Paying ${amount} sats...`,
      direction: "right",
      status: "pending",
      snippetIds: ["pay-invoice"],
    });

    try {
      // This will block until the hold invoice is settled or cancelled
      console.log("Alice starting payment to wrapped invoice...");
      console.log("Invoice:", invoiceToUse.substring(0, 50) + "...");
      const paymentPromise = client.payInvoice({ invoice: invoiceToUse });
      console.log("Alice payment initiated, waiting for settlement...");
      await paymentPromise;
      console.log("Alice payment completed!");

      // Update Alice's balance
      const aliceBalance = await client.getBalance();
      const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
      setWalletBalance("alice", aliceBalanceSats);
      addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

      updateTransaction(txId, {
        status: "success",
        description: `Alice paid ${amount} sats (via wrapped invoice)`,
      });

      updateFlowStep(flowStepId, {
        label: `✅ Paid ${amount} sats`,
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

      updateFlowStep(flowStepId, {
        label: `Payment failed`,
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusText = () => {
    if (state === "settled") return "Payment Complete";
    if (state === "bob_paid_charlie") return "Pending (Bob settling...)";
    if (state === "alice_paid") return "Pending (Held in network)";
    if (isPaying) return "Paying...";
    return "Not Paid";
  };

  const getStatusColor = () => {
    if (state === "settled") return "text-green-600 dark:text-green-400";
    if (hasPaid) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Pay Wrapped Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Payment Status:</span>
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>

        {!hasPaid && (
          <>
            {state === "idle" || state === "charlie_invoice_created" ? (
              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground text-center">
                Waiting for Bob to create wrapped invoice...
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Wrapped Invoice
                  </label>
                  <Input
                    value={invoiceToUse}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    placeholder="Paste invoice..."
                    disabled={isPaying}
                  />
                  {bobWrapped && !invoiceInput && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Using Bob's wrapped invoice
                    </p>
                  )}
                </div>

                {bobWrapped && (
                  <div className="p-2 bg-muted rounded-lg text-xs">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-mono">
                        {bobWrapped.totalAmount} sats
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      (includes {bobWrapped.fee} sats intermediary fee)
                    </p>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handlePay}
                  disabled={isPaying || !canPay}
                  className="w-full"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Paying...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Pay Invoice
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        )}

        {state === "alice_paid" && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            <p>
              <span className="text-lg mr-1">🔒</span>
              Your funds are held in the network. Waiting for Bob to complete
              the flow...
            </p>
          </div>
        )}

        {state === "bob_paid_charlie" && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800 dark:text-orange-200">
            <p>Bob paid Charlie. Waiting for settlement...</p>
          </div>
        )}

        {state === "settled" && bobWrapped && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <p>
              <span className="text-lg mr-1">✅</span>
              Payment complete! Paid {bobWrapped.totalAmount} sats.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
