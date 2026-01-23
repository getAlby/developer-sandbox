import { useState, useEffect } from "react";
import {
  Loader2,
  FileText,
  Send,
  Copy,
  Check,
  ArrowRight,
  Search,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

export function LookupInvoiceScenario() {
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

// Shared state for the invoice between Alice and Bob
let sharedInvoice: string | null = null;
let sharedAmount: number | null = null;
const invoiceListeners = new Set<() => void>();

function notifyInvoiceListeners() {
  invoiceListeners.forEach((listener) => listener());
}

function setSharedInvoice(invoice: string | null, amount: number | null) {
  sharedInvoice = invoice;
  sharedAmount = amount;
  notifyInvoiceListeners();
}

function useSharedInvoice() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    invoiceListeners.add(listener);
    return () => {
      invoiceListeners.delete(listener);
    };
  }, []);

  return { invoice: sharedInvoice, amount: sharedAmount };
}

function AlicePanel() {
  const [amount, setAmount] = useState("1000");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<
    "pending" | "settled" | "failed" | "accepted" | null
  >(null);
  const [lookupInvoiceInput, setLookupInvoiceInput] = useState("");

  const { getNWCClient } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep } = useTransactionStore();

  const handleCreateInvoice = async () => {
    const client = getNWCClient("alice");
    if (!client) return;

    setIsCreating(true);
    setInvoiceStatus(null);

    const amountSats = parseInt(amount);
    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      toWallet: "alice",
      amount: amountSats,
      description: "Creating invoice...",
    });

    try {
      const amountMillisats = amountSats * 1000;

      const invoice = await client.makeInvoice({
        amount: amountMillisats,
        description: description || `Payment of ${amountSats} sats`,
      });

      setCreatedInvoice(invoice.invoice);
      setLookupInvoiceInput(invoice.invoice);
      setSharedInvoice(invoice.invoice, amountSats);

      updateTransaction(txId, {
        status: "success",
        description: `Invoice created for ${amountSats} sats`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: `Invoice: ${amountSats} sats`,
        direction: "right",
        status: "success",
        snippetIds: ["make-invoice"],
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
      updateTransaction(txId, {
        status: "error",
        description: "Failed to create invoice",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLookupInvoice = async () => {
    const client = getNWCClient("alice");
    const invoiceToLookup = lookupInvoiceInput || createdInvoice;
    if (!client || !invoiceToLookup) return;

    setIsLookingUp(true);

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      toWallet: "alice",
      description: "Looking up invoice status...",
    });

    try {
      const result = await client.lookupInvoice({ invoice: invoiceToLookup });

      setInvoiceStatus(result.state);

      const statusLabel =
        result.state === "settled"
          ? "Paid"
          : result.state === "pending"
            ? "Pending"
            : result.state === "accepted"
              ? "Accepted (Hold)"
              : "Failed";

      updateTransaction(txId, {
        status: "success",
        amount: Math.floor(result.amount / 1000),
        description: `Invoice status: ${statusLabel}`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: `Status: ${statusLabel}`,
        direction: "right",
        status: result.state === "failed" ? "error" : "success",
        snippetIds: ["lookup-invoice"],
      });
    } catch (error) {
      console.error("Failed to lookup invoice:", error);
      updateTransaction(txId, {
        status: "error",
        description: "Failed to lookup invoice",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCopy = async () => {
    if (createdInvoice) {
      await navigator.clipboard.writeText(createdInvoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = () => {
    switch (invoiceStatus) {
      case "settled":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "accepted":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (invoiceStatus) {
      case "settled":
        return "Paid";
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted (Hold Invoice)";
      case "failed":
        return "Failed";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (invoiceStatus) {
      case "settled":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "accepted":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "failed":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Create & Lookup Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create Invoice Section */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Amount (sats)</label>
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
            placeholder="What's this payment for?"
            disabled={isCreating}
          />
        </div>
        <Button
          onClick={handleCreateInvoice}
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
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </>
          )}
        </Button>

        {createdInvoice && (
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs text-muted-foreground">
              BOLT-11 Invoice
            </label>
            <div className="flex gap-2">
              <Input
                value={createdInvoice}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              Invoice sent to Bob
            </p>
          </div>
        )}

        {/* Lookup Invoice Section */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-xs text-muted-foreground">
            Lookup Invoice Status
          </label>
          <div className="space-y-1">
            <Input
              value={lookupInvoiceInput}
              onChange={(e) => setLookupInvoiceInput(e.target.value)}
              placeholder="lnbc... (or use created invoice)"
              className="font-mono text-xs"
              disabled={isLookingUp}
            />
          </div>
          <Button
            onClick={handleLookupInvoice}
            disabled={isLookingUp || (!lookupInvoiceInput && !createdInvoice)}
            variant="secondary"
            className="w-full"
          >
            {isLookingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Looking up...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Lookup Invoice
              </>
            )}
          </Button>

          {invoiceStatus && (
            <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">{getStatusText()}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [invoice, setInvoice] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    amount: number | null;
    preimage: string;
  } | null>(null);
  const { invoice: sharedInv, amount: sharedAmt } = useSharedInvoice();

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep, updateFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  const invoiceToUse = invoice || sharedInv || "";

  const handlePayInvoice = async () => {
    const client = getNWCClient("bob");
    if (!client || !invoiceToUse) return;

    setIsPaying(true);

    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "bob",
      toWallet: "alice",
      amount: sharedAmt ?? undefined,
      description: "Paying invoice...",
    });

    const flowStepId = addFlowStep({
      fromWallet: "bob",
      toWallet: "alice",
      label: "Paying invoice...",
      direction: "left",
      status: "pending",
      snippetIds: ["pay-invoice"],
    });

    try {
      const result = await client.payInvoice({ invoice: invoiceToUse });

      const bobBalance = await client.getBalance();
      const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
      setWalletBalance("bob", bobBalanceSats);
      addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

      const aliceClient = getNWCClient("alice");
      if (aliceClient) {
        const aliceBalance = await aliceClient.getBalance();
        const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
        setWalletBalance("alice", aliceBalanceSats);
        addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });
      }

      updateTransaction(txId, {
        status: "success",
        description: `Payment confirmed! Preimage: ${result.preimage}`,
      });

      // Update flow step to success
      updateFlowStep(flowStepId, {
        label: "Payment confirmed",
        status: "success",
      });

      setPaymentSuccess({
        amount: sharedAmt,
        preimage: result.preimage,
      });
      setInvoice("");
      setSharedInvoice(null, null);
    } catch (error) {
      console.error("Failed to pay invoice:", error);
      updateTransaction(txId, {
        status: "error",
        description: "Payment failed",
      });

      // Update flow step to error
      updateFlowStep(flowStepId, {
        label: "Payment failed",
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Pay Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            BOLT-11 Invoice
          </label>
          <Input
            value={invoiceToUse}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="lnbc..."
            disabled={isPaying}
            className="font-mono text-xs"
          />
          {sharedInv && !invoice && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Invoice received from Alice ({sharedAmt?.toLocaleString()} sats)
            </p>
          )}
        </div>
        <Button
          onClick={handlePayInvoice}
          disabled={isPaying || !invoiceToUse}
          className="w-full"
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Paying...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Pay Invoice
            </>
          )}
        </Button>

        {paymentSuccess && (
          <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Payment Successful!
              </span>
            </div>
            {paymentSuccess.amount && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Paid {paymentSuccess.amount.toLocaleString()} sats to Alice
              </p>
            )}
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono break-all">
              Preimage: {paymentSuccess.preimage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
