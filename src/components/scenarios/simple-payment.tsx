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
      <BobPanel />
      <AlicePanel />
    </div>
  );
}

// Shared state for the invoice between Bob and Alice
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

function BobPanel() {
  const [amount, setAmount] = useState("1000");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { getNWCClient } = useWalletStore();
  const { addTransaction, addFlowStep } = useTransactionStore();

  const handleCreateInvoice = async () => {
    const client = getNWCClient("bob");
    if (!client) return;

    setIsCreating(true);

    try {
      // Add pending transaction
      addTransaction({
        type: "invoice_created",
        status: "pending",
        toWallet: "bob",
        amount: parseInt(amount),
        description: "Creating invoice...",
      });

      // Create invoice (amount in millisats)
      const amountSats = parseInt(amount);
      const amountMillisats = amountSats * 1000;

      const invoice = await client.makeInvoice({
        amount: amountMillisats,
        description: description || `Payment of ${amountSats} sats`,
      });

      setCreatedInvoice(invoice.invoice);
      setSharedInvoice(invoice.invoice, amountSats);

      // Add success transaction
      addTransaction({
        type: "invoice_created",
        status: "success",
        toWallet: "bob",
        amount: amountSats,
        description: `Invoice created for ${amountSats} sats: ${invoice.invoice}`,
      });

      // Add flow step
      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Invoice: ${amountSats} sats`,
        direction: "left",
        status: "success",
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
      addTransaction({
        type: "invoice_created",
        status: "error",
        toWallet: "bob",
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
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Create Invoice</span>
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
              Invoice sent to Alice
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlicePanel() {
  const [invoice, setInvoice] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const { invoice: sharedInv, amount: sharedAmt } = useSharedInvoice();

  const { getNWCClient, setWalletBalance } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  // Use shared invoice if available and local input is empty
  const invoiceToUse = invoice || sharedInv || "";

  const handlePayInvoice = async () => {
    const client = getNWCClient("alice");
    if (!client || !invoiceToUse) return;

    setIsPaying(true);

    try {
      // Add pending transaction
      addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "alice",
        toWallet: "bob",
        amount: sharedAmt ?? undefined,
        description: "Paying invoice...",
      });

      // Add flow step for payment initiation
      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Paying invoice...",
        direction: "right",
        status: "pending",
      });

      // Pay the invoice
      const result = await client.payInvoice({ invoice: invoiceToUse });

      // Get updated balances
      const aliceBalance = await client.getBalance();
      const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
      setWalletBalance("alice", aliceBalanceSats);
      addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

      // Update Bob's balance if connected
      const bobClient = getNWCClient("bob");
      if (bobClient) {
        const bobBalance = await bobClient.getBalance();
        const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
        setWalletBalance("bob", bobBalanceSats);
        addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });
      }

      // Add success transaction
      addTransaction({
        type: "payment_sent",
        status: "success",
        fromWallet: "alice",
        toWallet: "bob",
        amount: sharedAmt ?? undefined,
        description: `Payment confirmed! Preimage: ${result.preimage}`,
      });

      // Add flow step for confirmation
      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Payment confirmed",
        direction: "left",
        status: "success",
      });

      // Clear the invoice
      setInvoice("");
      setSharedInvoice(null, null);
    } catch (error) {
      console.error("Failed to pay invoice:", error);
      addTransaction({
        type: "payment_failed",
        status: "error",
        fromWallet: "alice",
        toWallet: "bob",
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Pay Invoice</span>
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
              Invoice received from Bob ({sharedAmt?.toLocaleString()} sats)
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
      </CardContent>
    </Card>
  );
}
