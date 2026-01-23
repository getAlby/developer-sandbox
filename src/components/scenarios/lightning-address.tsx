import { useState } from "react";
import { Loader2, Send, Mail, AtSign } from "lucide-react";
import { LightningAddress } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

export function LightningAddressScenario() {
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
  const { getWallet } = useWalletStore();
  const aliceWallet = getWallet("alice");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Share Lightning Address</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Alice's Lightning Address is like an email for receiving payments.
          Anyone can send sats to this address without needing an invoice first.
        </p>

        {aliceWallet?.lightningAddress ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm">
              {aliceWallet.lightningAddress}
            </span>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            <p>Alice's wallet doesn't have a Lightning Address.</p>
            <p className="text-xs mt-1 opacity-75">
              Test wallets from faucet.nwc.dev include a Lightning Address
              automatically.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("100");
  const [comment, setComment] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [addressInfo, setAddressInfo] = useState<{
    min: number;
    max: number;
    description: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getNWCClient, setWalletBalance, getWallet } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const aliceWallet = getWallet("alice");

  // Pre-fill with Alice's address if available and input is empty
  const addressToUse = address || aliceWallet?.lightningAddress || "";

  const handleLookup = async () => {
    if (!addressToUse) return;

    setError(null);
    setAddressInfo(null);

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      description: `Looking up ${addressToUse}...`,
      snippetIds: ["fetch-lightning-address"],
    });

    try {
      const ln = new LightningAddress(addressToUse);
      await ln.fetch();

      if (!ln.lnurlpData) {
        throw new Error("Could not fetch Lightning Address data");
      }

      setAddressInfo({
        min: ln.lnurlpData.min,
        max: ln.lnurlpData.max,
        description: ln.lnurlpData.description,
      });

      updateTransaction(txId, {
        status: "success",
        description: `Found ${addressToUse} (${ln.lnurlpData.min}-${ln.lnurlpData.max} sats)`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Lookup: ${addressToUse}`,
        direction: "left",
        status: "success",
        snippetIds: ["fetch-lightning-address"],
      });
    } catch (err) {
      console.error("Failed to lookup address:", err);
      setError("Failed to lookup Lightning Address");
      updateTransaction(txId, {
        status: "error",
        description: "Failed to lookup Lightning Address",
      });
    }
  };

  const handlePay = async () => {
    if (!addressToUse || !amount) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsPaying(true);
    setError(null);

    const satoshi = parseInt(amount);

    // Add pending transaction
    const txId = addTransaction({
      type: "payment_sent",
      status: "pending",
      fromWallet: "bob",
      toWallet: "alice",
      amount: satoshi,
      description: `Paying ${satoshi} sats to ${addressToUse}...`,
      snippetIds: ["pay-lightning-address"],
    });

    const requestFlowStepId = addFlowStep({
      fromWallet: "bob",
      toWallet: "alice",
      label: `Requesting invoice...`,
      direction: "left",
      status: "pending",
      snippetIds: ["request-invoice-from-address"],
    });

    let payFlowStepId = "";

    try {
      // Lookup the lightning address and request an invoice
      const ln = new LightningAddress(addressToUse);
      await ln.fetch();

      const invoice = await ln.requestInvoice({
        satoshi,
        comment: comment || undefined,
      });

      // Update request flow step to success
      updateFlowStep(requestFlowStepId, {
        label: `Invoice: ${satoshi} sats`,
        direction: "right",
        status: "success",
      });

      // Pay the invoice
      payFlowStepId = addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Paying invoice...",
        direction: "left",
        status: "pending",
        snippetIds: ["pay-invoice"],
      });

      await client.payInvoice({ invoice: invoice.paymentRequest });

      // Update Bob's balance
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
        description: `Paid ${satoshi} sats to ${addressToUse}`,
      });

      // Update flow step to success
      updateFlowStep(payFlowStepId, {
        label: "Payment confirmed",
        status: "success",
      });

      // Reset form
      setAmount("100");
      setComment("");
      setAddressInfo(null);
    } catch (err) {
      console.error("Failed to pay:", err);
      setError(err instanceof Error ? err.message : "Payment failed");

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
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Pay to Lightning Address</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Lightning Address
          </label>
          <div className="flex gap-2">
            <Input
              value={addressToUse}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="alice@example.com"
              disabled={isPaying}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleLookup}
              disabled={!addressToUse || isPaying}
              title="Lookup address"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>
          {aliceWallet?.lightningAddress && !address && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Using Alice's Lightning Address
            </p>
          )}
        </div>

        {addressInfo && (
          <div className="p-2 bg-muted rounded text-xs space-y-1">
            <p>
              <span className="text-muted-foreground">Accepts:</span>{" "}
              {addressInfo.min} - {addressInfo.max.toLocaleString()} sats
            </p>
            {addressInfo.description && (
              <p>
                <span className="text-muted-foreground">Description:</span>{" "}
                {addressInfo.description}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Amount (sats)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            disabled={isPaying}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Comment (optional)
          </label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Thanks for the coffee!"
            disabled={isPaying}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handlePay}
          disabled={isPaying || !addressToUse || !amount}
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
              Pay to Address
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
