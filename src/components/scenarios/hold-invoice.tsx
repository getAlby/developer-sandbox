import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Copy,
  Check,
  Lock,
  Unlock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useWalletStore,
  useTransactionStore,
  useHoldInvoiceStore,
} from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";

// Utility to convert bytes to hex string
const toHexString = (bytes: Uint8Array) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

export function HoldInvoiceScenario() {
  const { areAllWalletsConnected } = useWalletStore();
  const { reset } = useHoldInvoiceStore();
  const allConnected = areAllWalletsConnected(["alice", "bob"]);

  // Reset shared state when component mounts
  useEffect(() => {
    reset();
  }, [reset]);

  if (!allConnected) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BobPanel />
      <AlicePanel />
    </div>
  );
}

function BobPanel() {
  const [amount, setAmount] = useState("1000");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();
  const {
    invoiceData,
    invoiceState,
    setInvoiceData,
    setInvoiceState,
    reset: resetHoldInvoice,
  } = useHoldInvoiceStore();

  // Use ref to always have current invoice data in notification callback
  const invoiceDataRef = useRef(invoiceData);
  useEffect(() => {
    invoiceDataRef.current = invoiceData;
  }, [invoiceData]);

  const handleNotification = useCallback(
    (notification: Nip47Notification) => {
      const currentInvoiceData = invoiceDataRef.current;
      if (
        notification.notification_type === "hold_invoice_accepted" &&
        currentInvoiceData &&
        notification.notification.payment_hash === currentInvoiceData.paymentHash
      ) {
        setInvoiceState("held");

        addTransaction({
          type: "payment_received",
          status: "pending",
          toWallet: "bob",
          amount: currentInvoiceData.amount,
          description: `Hold invoice payment held (${currentInvoiceData.amount} sats)`,
        });

        addFlowStep({
          fromWallet: "alice",
          toWallet: "bob",
          label: `🔒 Payment held: ${currentInvoiceData.amount} sats`,
          direction: "right",
          status: "pending",
        });
      }
    },
    [addTransaction, addFlowStep, setInvoiceState]
  );

  const createHoldInvoice = async () => {
    const client = getNWCClient("bob");
    if (!client) {
      setError("Bob wallet not connected");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const satoshi = parseInt(amount);
      const amountMsat = satoshi * 1000;

      // Generate preimage and payment hash
      const preimageBytes = crypto.getRandomValues(new Uint8Array(32));
      const preimage = toHexString(preimageBytes);

      const hashBuffer = await crypto.subtle.digest("SHA-256", preimageBytes);
      const paymentHashBytes = new Uint8Array(hashBuffer);
      const paymentHash = toHexString(paymentHashBytes);

      addTransaction({
        type: "invoice_created",
        status: "pending",
        description: `Creating hold invoice for ${satoshi} sats...`,
      });

      // Create the hold invoice
      const response = await client.makeHoldInvoice({
        amount: amountMsat,
        description: description || "Hold invoice",
        payment_hash: paymentHash,
      });

      const newInvoiceData = {
        invoice: response.invoice,
        preimage,
        paymentHash,
        amount: satoshi,
        description: description || undefined,
        settleDeadline: response.settle_deadline,
      };

      // Update ref immediately so notification handler can access it
      invoiceDataRef.current = newInvoiceData;
      setInvoiceData(newInvoiceData);
      setInvoiceState("created");

      addTransaction({
        type: "invoice_created",
        status: "success",
        amount: satoshi,
        description: `Hold invoice created for ${satoshi} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `⏳ Created hold invoice: ${satoshi} sats`,
        direction: "right",
        status: "success",
      });

      // Subscribe to notifications
      const unsub = await client.subscribeNotifications(handleNotification, [
        "hold_invoice_accepted",
      ]);
      unsubRef.current = unsub;

      addTransaction({
        type: "invoice_created",
        status: "success",
        description: "Listening for payment...",
      });
    } catch (err) {
      console.error("Failed to create hold invoice:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create hold invoice"
      );

      addTransaction({
        type: "invoice_created",
        status: "error",
        description: "Failed to create hold invoice",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const settleInvoice = async () => {
    if (!invoiceData) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsProcessing(true);
    setError(null);

    try {
      addTransaction({
        type: "payment_received",
        status: "pending",
        toWallet: "bob",
        description: "Settling hold invoice...",
      });

      await client.settleHoldInvoice({ preimage: invoiceData.preimage });

      setInvoiceState("settled");

      // Update Bob's balance
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

      addTransaction({
        type: "payment_received",
        status: "success",
        toWallet: "bob",
        amount: invoiceData.amount,
        description: `Hold invoice settled - Bob received ${invoiceData.amount} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "bob",
        label: `✅ Settled: +${invoiceData.amount} sats`,
        direction: "right",
        status: "success",
      });

      // Cleanup
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    } catch (err) {
      console.error("Failed to settle hold invoice:", err);
      setError(err instanceof Error ? err.message : "Failed to settle");

      addTransaction({
        type: "payment_received",
        status: "error",
        description: "Failed to settle hold invoice",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelInvoice = async () => {
    if (!invoiceData) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsProcessing(true);
    setError(null);

    try {
      addTransaction({
        type: "payment_received",
        status: "pending",
        description: "Cancelling hold invoice...",
      });

      await client.cancelHoldInvoice({ payment_hash: invoiceData.paymentHash });

      setInvoiceState("cancelled");

      // Update balances (Alice should get refund)
      const aliceClient = getNWCClient("alice");
      if (aliceClient) {
        const aliceBalance = await aliceClient.getBalance();
        const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
        setWalletBalance("alice", aliceBalanceSats);
        addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });
      }

      addTransaction({
        type: "payment_failed",
        status: "success",
        description: `Hold invoice cancelled - Alice refunded ${invoiceData.amount} sats`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `❌ Cancelled: refund ${invoiceData.amount} sats`,
        direction: "left",
        status: "error",
      });

      // Cleanup
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    } catch (err) {
      console.error("Failed to cancel hold invoice:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel");

      addTransaction({
        type: "payment_failed",
        status: "error",
        description: "Failed to cancel hold invoice",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyInvoice = async () => {
    if (!invoiceData) return;
    await navigator.clipboard.writeText(invoiceData.invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    resetHoldInvoice();
    setAmount("1000");
    setDescription("");
    setError(null);
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
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

  const getStateIcon = () => {
    switch (invoiceState) {
      case "created":
        return "⏳";
      case "held":
        return "🔒";
      case "settled":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return null;
    }
  };

  const getStateLabel = () => {
    switch (invoiceState) {
      case "created":
        return "Created";
      case "held":
        return "Held";
      case "settled":
        return "Settled";
      case "cancelled":
        return "Cancelled";
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Create Hold Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invoiceState === "idle" && (
          <>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p>
                Hold invoices allow conditional payments. You control when to
                release or refund the funds.
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

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Description (optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escrow for..."
                disabled={isCreating}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={createHoldInvoice}
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
                  <Lock className="mr-2 h-4 w-4" />
                  Create Hold Invoice
                </>
              )}
            </Button>
          </>
        )}

        {invoiceState !== "idle" && invoiceData && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStateIcon()}</span>
                <span className="font-medium">{getStateLabel()}</span>
              </div>
              <span className="text-lg font-mono">
                {invoiceData.amount} sats
              </span>
            </div>

            {invoiceState === "created" && (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-mono text-xs break-all">
                    {invoiceData.invoice.slice(0, 60)}...
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
                  Waiting for payment... (Listening)
                </p>
              </>
            )}

            {invoiceState === "held" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Payment is held. Choose an action:
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={settleInvoice}
                    disabled={isProcessing}
                    className="flex-1"
                    variant="default"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Unlock className="mr-1 h-4 w-4" />
                        Settle (Receive)
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={cancelInvoice}
                    disabled={isProcessing}
                    className="flex-1"
                    variant="outline"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel (Refund)
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {(invoiceState === "settled" || invoiceState === "cancelled") && (
              <Button onClick={reset} variant="outline" className="w-full">
                Create New Hold Invoice
              </Button>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

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
                <p>
                  <span className="text-muted-foreground">preimage:</span>{" "}
                  {invoiceData.preimage.slice(0, 16)}...
                </p>
                <p>
                  <span className="text-muted-foreground">payment_hash:</span>{" "}
                  {invoiceData.paymentHash.slice(0, 16)}...
                </p>
                {invoiceData.settleDeadline && (
                  <p>
                    <span className="text-muted-foreground">
                      settle_deadline:
                    </span>{" "}
                    block {invoiceData.settleDeadline}
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

  const { invoiceData, invoiceState } = useHoldInvoiceStore();
  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  const invoiceToUse = invoiceInput || invoiceData?.invoice || "";

  // Determine Alice's payment status based on shared invoice state
  // Prioritize store state (held/settled/cancelled) over local isPaying flag
  const getPaymentStatus = () => {
    if (invoiceState === "held") return "held";
    if (invoiceState === "settled") return "settled";
    if (invoiceState === "cancelled") return "cancelled";
    if (isPaying) return "pending";
    return "idle";
  };

  const paymentStatus = getPaymentStatus();

  const handlePay = async () => {
    if (!invoiceToUse) return;

    const client = getNWCClient("alice");
    if (!client) return;

    setIsPaying(true);
    setError(null);

    try {
      const amount = invoiceData?.amount || 0;

      addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "alice",
        toWallet: "bob",
        amount,
        description: `Paying hold invoice for ${amount} sats...`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: `Paying hold invoice: ${amount} sats`,
        direction: "right",
        status: "pending",
      });

      // Pay the invoice - this will block until settled or cancelled
      await client.payInvoice({ invoice: invoiceToUse });

      // Update Alice's balance
      const aliceBalance = await client.getBalance();
      const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
      setWalletBalance("alice", aliceBalanceSats);
      addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

      addTransaction({
        type: "payment_sent",
        status: "success",
        fromWallet: "alice",
        toWallet: "bob",
        amount,
        description: `Payment completed (${amount} sats)`,
      });
    } catch (err) {
      console.error("Failed to pay:", err);
      setError(err instanceof Error ? err.message : "Payment failed");

      addTransaction({
        type: "payment_failed",
        status: "error",
        fromWallet: "alice",
        description: "Payment failed",
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Payment failed",
        direction: "right",
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case "pending":
        return (
          <span className="text-yellow-600 dark:text-yellow-400">
            Pending...
          </span>
        );
      case "held":
        return (
          <span className="text-orange-600 dark:text-orange-400">
            Pending (Held)
          </span>
        );
      case "settled":
        return (
          <span className="text-green-600 dark:text-green-400">Settled</span>
        );
      case "cancelled":
        return (
          <span className="text-red-600 dark:text-red-400">
            Cancelled (Refunded)
          </span>
        );
      default:
        return <span className="text-muted-foreground">Not Paid</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Pay Hold Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Payment Status:</span>
          {getStatusDisplay()}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hold Invoice</label>
          <Input
            value={invoiceToUse}
            onChange={(e) => setInvoiceInput(e.target.value)}
            placeholder="Paste the hold invoice..."
            disabled={isPaying || paymentStatus === "held"}
          />
          {invoiceData && !invoiceInput && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Using Bob's hold invoice
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {paymentStatus === "idle" && (
          <Button
            onClick={handlePay}
            disabled={isPaying || !invoiceToUse}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            Pay Hold Invoice
          </Button>
        )}

        {isPaying && (
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Paying...
          </Button>
        )}

        {paymentStatus === "held" && (
          <>
            <Button disabled className="w-full" variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Waiting for settle/cancel...
            </Button>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              <p>
                Payment is held. Your funds are locked until the recipient
                settles or cancels the invoice.
              </p>
            </div>
          </>
        )}

        {paymentStatus === "settled" && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
            <p>Payment completed successfully. Bob has received the funds.</p>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200">
            <p>Payment was cancelled. Your funds have been refunded.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
