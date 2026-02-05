import { useState, useEffect } from "react";
import {
  launchPaymentModal,
  refreshBalance,
} from "@getalby/bitcoin-connect-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, RefreshCw } from "lucide-react";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WalletCard } from "@/components/wallet-card";
import { WALLET_PERSONAS } from "@/types";

export function PaymentModalScenario() {
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const {
    initializeWallets,
    getWallet,
    areAllWalletsConnected,
    getNWCClient,
    setWalletBalance,
  } = useWalletStore();
  const {
    addTransaction,
    updateTransaction,
    addFlowStep,
    updateFlowStep,
    addBalanceSnapshot,
  } = useTransactionStore();

  const bobWallet = getWallet("bob");
  const bobConnected = areAllWalletsConnected(["bob"]);

  // Initialize Bob's wallet on mount
  useEffect(() => {
    initializeWallets(["bob"]);
  }, [initializeWallets]);

  const handleCreateAndPay = async () => {
    if (!bobConnected) return;

    setIsProcessing(true);
    setIsPaid(false);

    const txId = addTransaction({
      type: "invoice_created",
      status: "pending",
      fromWallet: "bob",
      amount: amount,
      description: `Creating invoice for ${amount} sats...`,
      snippetIds: ["make-invoice"],
    });

    const flowStepId = addFlowStep({
      fromWallet: "bob",
      toWallet: "alice",
      label: `Creating invoice for ${amount} sats...`,
      direction: "left",
      status: "pending",
      snippetIds: ["make-invoice"],
    });

    try {
      const bobClient = getNWCClient("bob");
      if (!bobClient) throw new Error("Bob's wallet not connected");

      // Create invoice using Bob's NWC wallet
      const invoiceResponse = await bobClient.makeInvoice({
        amount: amount * 1000, // Convert to millisats
        description: `Payment of ${amount} sats via Payment Modal`,
      });

      updateTransaction(txId, {
        status: "success",
        description: `Invoice created for ${amount} sats`,
      });

      updateFlowStep(flowStepId, {
        label: `Invoice: ${amount} sats`,
        status: "success",
      });

      // Store the amount for when payment completes
      setPaidAmount(amount);

      // Immediately launch the payment modal
      addFlowStep({
        fromWallet: "alice",
        toWallet: "bob",
        label: "Opening payment modal...",
        direction: "right",
        status: "pending",
        snippetIds: ["bc-launch-payment-modal"],
      });

      launchPaymentModal({
        invoice: invoiceResponse.invoice,
        onPaid: async () => {
          setIsPaid(true);
          setIsProcessing(false);

          addTransaction({
            type: "payment_received",
            status: "success",
            fromWallet: "alice",
            toWallet: "bob",
            amount: amount,
            description: `Alice paid ${amount} sats to Bob via Payment Modal`,
            snippetIds: ["bc-launch-payment-modal"],
          });

          addFlowStep({
            fromWallet: "alice",
            toWallet: "bob",
            label: `Paid ${amount} sats via Payment Modal`,
            direction: "right",
            status: "success",
            snippetIds: ["bc-launch-payment-modal"],
          });

          // Refresh Bob's balance
          try {
            const bobClient = getNWCClient("bob");
            if (bobClient) {
              const bobBalance = await bobClient.getBalance();
              const bobBalanceSats = Math.floor(bobBalance.balance / 1000);
              setWalletBalance("bob", bobBalanceSats);
              addBalanceSnapshot({ walletId: "bob", balance: bobBalanceSats });
            }
          } catch (error) {
            console.error("Failed to refresh Bob's balance:", error);
          }

          // Refresh Bitcoin Connect balance
          refreshBalance();
        },
        onCancelled: () => {
          setIsProcessing(false);

          addTransaction({
            type: "payment_sent",
            status: "error",
            fromWallet: "alice",
            toWallet: "bob",
            amount: amount,
            description: "Payment cancelled by user",
            snippetIds: ["bc-launch-payment-modal"],
          });

          addFlowStep({
            fromWallet: "alice",
            toWallet: "bob",
            label: "Payment cancelled",
            direction: "right",
            status: "error",
            snippetIds: ["bc-launch-payment-modal"],
          });
        },
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      updateTransaction(txId, {
        status: "error",
        description: `Failed to create invoice: ${errorMessage}`,
      });

      updateFlowStep(flowStepId, {
        label: "Invoice creation failed",
        status: "error",
      });

      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setIsPaid(false);
    setPaidAmount(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-md:flex-wrap">
        {/* Alice Card - Pays via Payment Modal */}
        <Card className="flex-1">
          <CardHeader className="pb-2 min-w-xs">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{WALLET_PERSONAS.alice.emoji}</span>
                <span>Alice</span>
              </CardTitle>
              <Badge variant="outline">Bitcoin Connect</Badge>
            </div>
          </CardHeader>
          <div className="flex-1" />
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use <code>launchPaymentModal()</code> to programmatically open the
              payment modal. It creates an invoice and immediately launches the
              modal with callbacks for success and cancellation.
            </p>

            {!bobConnected ? (
              <p className="text-sm text-muted-foreground text-center">
                Connect Bob's wallet to enable payments...
              </p>
            ) : (
              <div className="space-y-3">
                {isPaid && (
                  <div className="text-center space-y-2">
                    <div className="text-green-500 font-medium">
                      Payment Complete! ({paidAmount} sats)
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      New Payment
                    </Button>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Amount (sats)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    placeholder="100"
                    disabled={isProcessing || isPaid}
                  />
                </div>
                <Button
                  onClick={handleCreateAndPay}
                  disabled={isProcessing || amount <= 0 || isPaid}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Pay {amount} sats to Bob
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bob's Wallet Card - Receives payment */}
        {bobWallet && <WalletCard wallet={bobWallet} />}
      </div>
    </div>
  );
}
