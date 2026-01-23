import { useState } from "react";
import { CheckCircle, XCircle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@getalby/lightning-tools";
import { useTransactionStore } from "@/stores";

type VerificationResult = "idle" | "success" | "error";

export function ProofOfPaymentScenario() {
  const [invoice, setInvoice] = useState("");
  const [preimage, setPreimage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult>("idle");
  const [error, setError] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<{
    amount: number;
    paymentHash: string;
    description: string | null;
  } | null>(null);

  const { addTransaction, updateTransaction, addFlowStep, updateFlowStep } = useTransactionStore();

  const verifyProof = async () => {
    if (!invoice || !preimage) {
      setError("Both invoice and preimage are required");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult("idle");

    const txId = addTransaction({
      type: "payment_received",
      status: "pending",
      description: "Verifying proof of payment...",
    });

    const flowStepId = addFlowStep({
      fromWallet: "alice",
      toWallet: "bob",
      label: "Verifying preimage...",
      direction: "right",
      status: "pending",
      snippetIds: ["validate-preimage"],
    });

    try {
      // Parse the invoice
      const parsedInvoice = new Invoice({ pr: invoice });

      setInvoiceDetails({
        amount: parsedInvoice.satoshi,
        paymentHash: parsedInvoice.paymentHash,
        description: parsedInvoice.description,
      });

      // Validate the preimage against the invoice's payment hash
      const isValid = parsedInvoice.validatePreimage(preimage);

      if (isValid) {
        setResult("success");

        updateTransaction(txId, {
          status: "success",
          amount: parsedInvoice.satoshi,
          description: `Valid proof of payment verified for ${parsedInvoice.satoshi} sats`,
        });

        // Update flow step to success
        updateFlowStep(flowStepId, {
          label: `Proof verified: ${parsedInvoice.satoshi} sats`,
          status: "success",
        });
      } else {
        setResult("error");

        updateTransaction(txId, {
          type: "payment_failed",
          status: "error",
          description: "Invalid preimage - does not match payment hash",
        });

        // Update flow step to error
        updateFlowStep(flowStepId, {
          label: "Invalid proof",
          status: "error",
        });
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setResult("error");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify proof of payment",
      );

      updateTransaction(txId, {
        status: "error",
        description: "Verification failed - invalid invoice format",
      });

      // Update flow step to error
      updateFlowStep(flowStepId, {
        label: "Verification failed",
        status: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = (clearFields: boolean) => {
    if (clearFields) {
      setInvoice("");
      setPreimage("");
    }
    setResult("idle");
    setError(null);
    setInvoiceDetails(null);
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            <span>Verify Payment Proof</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p>
              Every Lightning payment has a preimage that proves the payment was
              made. The SHA-256 hash of the preimage equals the invoice's
              payment hash.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              BOLT-11 Invoice
            </label>
            <Input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="lnbc..."
              disabled={isVerifying}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Preimage (Proof of Payment)
            </label>
            <Input
              value={preimage}
              onChange={(e) => setPreimage(e.target.value)}
              placeholder="64 character hex string..."
              disabled={isVerifying}
              className="font-mono text-xs"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result === "idle" && (
            <Button
              onClick={verifyProof}
              disabled={isVerifying || !invoice || !preimage}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Proof
                </>
              )}
            </Button>
          )}

          {result === "success" && (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Valid Proof of Payment
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      The preimage correctly matches the invoice payment hash.
                      This confirms the payment was successfully completed.
                    </p>
                  </div>
                </div>
              </div>

              {invoiceDetails && (
                <div className="p-3 bg-muted rounded-lg text-xs font-mono space-y-1">
                  <p>
                    <span className="text-muted-foreground">amount:</span>{" "}
                    {invoiceDetails.amount} sats
                  </p>
                  <p>
                    <span className="text-muted-foreground">payment_hash:</span>{" "}
                    {invoiceDetails.paymentHash}
                  </p>
                  {invoiceDetails.description && (
                    <p>
                      <span className="text-muted-foreground">
                        description:
                      </span>{" "}
                      {invoiceDetails.description}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={() => reset(true)}
                variant="outline"
                className="w-full"
              >
                Verify Another
              </Button>
            </>
          )}

          {result === "error" && !error && (
            <>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Invalid Proof of Payment
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      The preimage does not match the invoice payment hash.
                      Please verify you have the correct preimage for this
                      invoice.
                    </p>
                  </div>
                </div>
              </div>

              {invoiceDetails && (
                <div className="p-3 bg-muted rounded-lg text-xs font-mono space-y-1">
                  <p>
                    <span className="text-muted-foreground">
                      expected payment_hash:
                    </span>{" "}
                    {invoiceDetails.paymentHash}
                  </p>
                </div>
              )}

              <Button
                onClick={() => reset(false)}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
