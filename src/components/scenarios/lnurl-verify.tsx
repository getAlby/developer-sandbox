import { useState, useCallback } from "react";
import {
  Loader2,
  Send,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { LightningAddress, Invoice } from "@getalby/lightning-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

type VerifyStatus = "pending" | "paid" | "unknown" | null;

interface StoredInvoice {
  invoice: Invoice;
  verifyUrl: string | null;
  amount: number;
  address: string;
  paymentHash: string;
}

export function LnurlVerifyScenario() {
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
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("100");
  const [isFetching, setIsFetching] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [storedInvoice, setStoredInvoice] = useState<StoredInvoice | null>(
    null,
  );
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(null);
  const [verifyResponse, setVerifyResponse] = useState<{
    settled: boolean;
    preimage?: string;
    pr?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getNWCClient, setWalletBalance, getWallet } = useWalletStore();
  const { addTransaction, addFlowStep, addBalanceSnapshot } =
    useTransactionStore();

  const bobWallet = getWallet("bob");
  const addressToUse = address || bobWallet?.lightningAddress || "";

  const handleFetchInvoice = useCallback(async () => {
    if (!addressToUse || !amount) return;

    setIsFetching(true);
    setError(null);
    setStoredInvoice(null);
    setVerifyStatus(null);
    setVerifyResponse(null);

    try {
      const satoshi = parseInt(amount);

      addTransaction({
        type: "invoice_created",
        status: "pending",
        description: `Fetching invoice from ${addressToUse}...`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Request invoice: ${satoshi} sats`,
        direction: "left",
        status: "pending",
      });

      const ln = new LightningAddress(addressToUse);
      await ln.fetch();

      const invoice = await ln.requestInvoice({ satoshi });

      const hasVerify = !!invoice.verify;

      setStoredInvoice({
        invoice,
        verifyUrl: invoice.verify,
        amount: satoshi,
        address: addressToUse,
        paymentHash: invoice.paymentHash,
      });

      addTransaction({
        type: "invoice_created",
        status: "success",
        description: `Invoice received (${satoshi} sats)${hasVerify ? " with verify URL" : ""}`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: hasVerify ? "Invoice + Verify URL" : "Invoice (no verify)",
        direction: "right",
        status: "success",
      });

      if (!hasVerify) {
        addTransaction({
          type: "invoice_created",
          status: "pending",
          description:
            "Note: This lightning address does not support LNURL-Verify",
        });
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch invoice");

      addTransaction({
        type: "invoice_created",
        status: "error",
        description: "Failed to fetch invoice",
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Invoice request failed",
        direction: "left",
        status: "error",
      });
    } finally {
      setIsFetching(false);
    }
  }, [addressToUse, amount, addTransaction, addFlowStep]);

  const handlePayInvoice = useCallback(async () => {
    if (!storedInvoice) return;

    const client = getNWCClient("bob");
    if (!client) return;

    setIsPaying(true);
    setError(null);

    try {
      addTransaction({
        type: "payment_sent",
        status: "pending",
        fromWallet: "bob",
        toWallet: "alice",
        amount: storedInvoice.amount,
        description: `Paying ${storedInvoice.amount} sats...`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: `Pay: ${storedInvoice.amount} sats`,
        direction: "left",
        status: "pending",
      });

      await client.payInvoice({
        invoice: storedInvoice.invoice.paymentRequest,
      });

      // Update balances
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

      addTransaction({
        type: "payment_sent",
        status: "success",
        fromWallet: "bob",
        toWallet: "alice",
        amount: storedInvoice.amount,
        description: `Payment sent! Use verify URL to confirm.`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Payment received",
        direction: "right",
        status: "success",
      });

      setVerifyStatus("unknown");
    } catch (err) {
      console.error("Failed to pay:", err);
      setError(err instanceof Error ? err.message : "Payment failed");

      addTransaction({
        type: "payment_failed",
        status: "error",
        fromWallet: "bob",
        toWallet: "alice",
        description: "Payment failed",
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Payment failed",
        direction: "left",
        status: "error",
      });
    } finally {
      setIsPaying(false);
    }
  }, [
    storedInvoice,
    getNWCClient,
    setWalletBalance,
    addTransaction,
    addFlowStep,
    addBalanceSnapshot,
  ]);

  const handleVerifyPayment = useCallback(async () => {
    if (!storedInvoice?.invoice) return;

    setIsVerifying(true);
    setError(null);

    try {
      addTransaction({
        type: "invoice_created",
        status: "pending",
        description: `Verifying payment via LNURL-Verify...`,
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "GET verify URL",
        direction: "left",
        status: "pending",
      });

      const isPaid = await storedInvoice.invoice.isPaid();

      if (isPaid) {
        setVerifyStatus("paid");
        setVerifyResponse({
          settled: true,
          preimage: storedInvoice.invoice.preimage || undefined,
          pr: storedInvoice.invoice.paymentRequest,
        });

        addTransaction({
          type: "invoice_created",
          status: "success",
          description: `Payment verified: SETTLED`,
        });

        addFlowStep({
          fromWallet: "alice",
          toWallet: "bob",
          label: "Status: SETTLED",
          direction: "right",
          status: "success",
        });
      } else {
        setVerifyStatus("pending");
        setVerifyResponse({
          settled: false,
          pr: storedInvoice.invoice.paymentRequest,
        });

        addTransaction({
          type: "invoice_created",
          status: "pending",
          description: `Payment verified: PENDING`,
        });

        addFlowStep({
          fromWallet: "alice",
          toWallet: "bob",
          label: "Status: PENDING",
          direction: "right",
          status: "pending",
        });
      }
    } catch (err) {
      console.error("Failed to verify:", err);
      setError(err instanceof Error ? err.message : "Verification failed");

      addTransaction({
        type: "invoice_created",
        status: "error",
        description: "Verification failed",
      });

      addFlowStep({
        fromWallet: "bob",
        toWallet: "alice",
        label: "Verify failed",
        direction: "left",
        status: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [storedInvoice, addTransaction, addFlowStep]);

  const handleReset = () => {
    setStoredInvoice(null);
    setVerifyStatus(null);
    setVerifyResponse(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.alice.emoji}</span>
          <span>Alice: Sender & Verifier</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!storedInvoice ? (
          <>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Lightning Address
              </label>
              <Input
                value={addressToUse}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="alice@example.com"
                disabled={isFetching}
              />
              {bobWallet?.lightningAddress && !address && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Using Bob's Lightning Address
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Amount (sats)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                disabled={isFetching}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleFetchInvoice}
              disabled={isFetching || !addressToUse || !amount}
              className="w-full"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Invoice...
                </>
              ) : (
                "Step 1: Fetch Invoice"
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Invoice Details
                </span>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">{storedInvoice.amount} sats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-mono text-xs">
                    {storedInvoice.address}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verify URL:</span>
                  {storedInvoice.verifyUrl ? (
                    <Badge variant="secondary" className="text-xs">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Not supported
                    </Badge>
                  )}
                </div>
              </div>

              {storedInvoice.verifyUrl && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <span className="text-blue-700 dark:text-blue-300 font-mono break-all">
                    {storedInvoice.verifyUrl}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handlePayInvoice}
              disabled={isPaying}
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

            {storedInvoice.verifyUrl && (
              <Button
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                variant={verifyStatus === "paid" ? "outline" : "default"}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify Payment Status
                  </>
                )}
              </Button>
            )}

            {!storedInvoice.verifyUrl && (
              <p className="text-xs text-muted-foreground text-center">
                This lightning address doesn't support LNURL-Verify. Payment was
                sent but cannot be verified via URL.
              </p>
            )}

            {verifyStatus !== null && (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {verifyStatus === "paid" && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          Payment Verified: SETTLED
                        </span>
                      </>
                    )}
                    {verifyStatus === "pending" && (
                      <>
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">
                          Payment Status: PENDING
                        </span>
                      </>
                    )}
                    {verifyStatus === "unknown" && (
                      <>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">
                          Status: Not yet verified
                        </span>
                      </>
                    )}
                  </div>

                  {verifyResponse &&
                    verifyStatus === "paid" &&
                    verifyResponse.preimage && (
                      <div className="text-xs space-y-1">
                        <div className="text-muted-foreground">
                          Preimage (proof):
                        </div>
                        <div className="font-mono bg-background p-2 rounded break-all">
                          {verifyResponse.preimage}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BobPanel() {
  const { getWallet } = useWalletStore();
  const bobWallet = getWallet("bob");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{WALLET_PERSONAS.bob.emoji}</span>
          <span>Bob: Receiver</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Bob's Lightning Address supports LNURL-Verify. When Alice requests an
          invoice, it includes a verify URL that can be used to check payment
          status without needing NWC access.
        </p>

        {bobWallet?.lightningAddress ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm">
                {bobWallet.lightningAddress}
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                How LNURL-Verify Works:
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Invoice response includes a verify URL</li>
                <li>Sender can GET the verify URL anytime</li>
                <li>Response indicates if payment is settled</li>
                <li>No wallet connection needed to verify</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
            <p>Bob's wallet doesn't have a Lightning Address.</p>
            <p className="text-xs mt-1 opacity-75">
              Test wallets from faucet.nwc.dev include a Lightning Address that
              supports LNURL-Verify.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
