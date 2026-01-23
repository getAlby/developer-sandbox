import { useState, useEffect } from "react";
import { Loader2, FileText, Send, Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

export function SimplePaymentScenario() {
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

  const { getNWCClient } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep } = useTransactionStore();

  const handleCreateInvoice = async () => {
    const client = getNWCClient("alice");
    if (!client) return;

    setIsCreating(true);

    // Add pending transaction
    const amountSats = parseInt(amount);
    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      toWallet: "alice",
      amount: amountSats,
      description: "Creating invoice...",
    });

    try {
      // Create invoice (amount in millisats)
      const amountMillisats = amountSats * 1000;

      const invoice = await client.makeInvoice({
        amount: amountMillisats,
        description: description || `Payment of ${amountSats} sats`,
      });

      setCreatedInvoice(invoice.invoice);
      setSharedInvoice(invoice.invoice, amountSats);

      // Update transaction to success
      updateTransaction(txId, {
        status: "success",
        description: `Invoice created for ${amountSats} sats: ${invoice.invoice}`,
      });

      // Add flow step
      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Invoice: ${amountSats} sats`,
        direction: "right",
        status: "success",
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

  const handleCopy = async () => {
    if (createdInvoice) {
      await navigator.clipboard.writeText(createdInvoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Create Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [invoice, setInvoice] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ preimage: string; amount: number } | null>(null);
  const { invoice: sharedInv, amount: sharedAmt } = useSharedInvoice();

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, updateTransaction, addFlowStep, updateFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  // Use shared invoice if available and local input is empty
  const invoiceToUse = invoice || sharedInv || "";

  const handlePayInvoice = async () => {
    const client = getNWCClient("bob");
    if (!client || !invoiceToUse) return;

    setIsPaying(true);

    // Add pending transaction
    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "bob",
      toWallet: "alice",
      amount: sharedAmt ?? undefined,
      description: "Paying invoice...",
    });

    // Add flow step for payment initiation
    const flowStepId = addFlowStep({
      fromWallet: "bob",
      toWallet: "alice",
      label: "Paying invoice...",
      direction: "left",
      status: "pending",
    });

    try {
      // Pay the invoice
      const result = await client.payInvoice({ invoice: invoiceToUse });

      // Get updated balances
      const bobBalance = await client.getBalance();
      const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
      setWalletBalance("bob", bobBalanceSats);
      addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });

      // Update Alice's balance if connected
      const aliceClient = getNWCClient("alice");
      if (aliceClient) {
        const aliceBalance = await aliceClient.getBalance();
        const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
        setWalletBalance("alice", aliceBalanceSats);
        addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });
      }

      // Update transaction to success
      updateTransaction(txId, {
        status: "success",
        description: `Payment confirmed! Preimage: ${result.preimage}`,
      });

      // Update flow step to success
      updateFlowStep(flowStepId, {
        label: "Payment confirmed",
        status: "success",
      });

      // Store payment result for success display
      setPaymentResult({ preimage: result.preimage, amount: sharedAmt ?? 0 });

      // Clear the invoice
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
      <CardContent className="flex flex-col space-y-3 h-full">
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
        <div className="flex-1" />
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

        {paymentResult && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">
                Payment successful! ({paymentResult.amount.toLocaleString()} sats)
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Payment Preimage
              </label>
              <Input
                value={paymentResult.preimage}
                readOnly
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
