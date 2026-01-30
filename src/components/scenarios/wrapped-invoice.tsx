import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Copy, Check, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore, useTransactionStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";
import type { Nip47Notification } from "@getalby/sdk/nwc";
import { Invoice } from "@getalby/lightning-tools";

interface WrappedInvoiceData {
    originalInvoice: string;
    wrappedInvoice: string;
    originalAmount: number;
    fee: number;
    totalAmount: number;
}

export function WrappedInvoiceScenario() {
    const { areAllWalletsConnected } = useWalletStore();
    const allConnected = areAllWalletsConnected(["alice", "bob", "charlie"]);

    if (!allConnected) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <BobPanel />
            <CharliePanel />
            <AlicePanel />
        </div>
    );
}

function BobPanel() {
    const [amount, setAmount] = useState("1000");
    const [isCreating, setIsCreating] = useState(false);
    const [invoice, setInvoice] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);

    const { getNWCClient, setWalletBalance } = useWalletStore();
    const { addTransaction, updateTransaction, addFlowStep, addBalanceSnapshot } =
        useTransactionStore();

    const handleNotification = useCallback(
        (notification: Nip47Notification) => {
            if (notification.notification_type === "payment_received") {
                const tx = notification.notification;
                const amountSats = Math.floor(tx.amount / 1000);

                setReceivedAmount(amountSats);

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
            }
        },
        [addTransaction, addFlowStep, addBalanceSnapshot, getNWCClient, setWalletBalance]
    );

    const createInvoice = async () => {
        const client = getNWCClient("bob");
        if (!client) {
            setError("Bob wallet not connected");
            return;
        }

        setIsCreating(true);
        setError(null);
        setReceivedAmount(null);

        const satoshi = parseInt(amount);
        const txId = addTransaction({
            type: "invoice_created",
            status: "pending",
            description: `Creating invoice for ${satoshi} sats...`,
            snippetIds: ["make-invoice"],
        });

        try {
            const response = await client.makeInvoice({
                amount: satoshi * 1000,
                description: "Wrapped invoice demo",
            });

            setInvoice(response.invoice);

            updateTransaction(txId, {
                status: "success",
                amount: satoshi,
                description: `Invoice created for ${satoshi} sats`,
            });

            addFlowStep({
                fromWallet: "bob",
                toWallet: "charlie",
                label: `📄 Created invoice: ${satoshi} sats`,
                direction: "right",
                status: "success",
                snippetIds: ["make-invoice"],
            });

            // Start listening for payment
            if (!isListening) {
                const unsub = await client.subscribeNotifications(handleNotification, [
                    "payment_received",
                ]);
                unsubRef.current = unsub;
                setIsListening(true);
            }
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
        if (!invoice) return;
        await navigator.clipboard.writeText(invoice);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setInvoice(null);
        setReceivedAmount(null);
        setError(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubRef.current) {
                unsubRef.current();
            }
        };
    }, []);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>{WALLET_PERSONAS.bob.emoji}</span>
                    <span>Bob: Recipient</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    <p>
                        Bob creates an invoice that will be wrapped by Charlie's service.
                    </p>
                </div>

                {!invoice ? (
                    <>
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

                        {error && <p className="text-xs text-destructive">{error}</p>}

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
                ) : (
                    <>
                        <div className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Invoice</span>
                                <span className="text-sm font-mono">{amount} sats</span>
                            </div>
                            <p className="font-mono text-xs break-all">{invoice}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyInvoice}
                                className="w-full"
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

                        {receivedAmount ? (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
                                ✅ Received {receivedAmount} sats!
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                Waiting for payment... (Listening)
                            </p>
                        )}

                        <Button onClick={reset} variant="outline" className="w-full">
                            Create New Invoice
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function CharliePanel() {
    const [originalInvoice, setOriginalInvoice] = useState("");
    const [feePercent, setFeePercent] = useState("1");
    const [isWrapping, setIsWrapping] = useState(false);
    const [wrappedData, setWrappedData] = useState<WrappedInvoiceData | null>(
        null
    );
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const unsubRef = useRef<(() => void) | null>(null);
    const wrappedDataRef = useRef<WrappedInvoiceData | null>(null);

    const { getNWCClient, setWalletBalance } = useWalletStore();
    const {
        addTransaction,
        updateTransaction,
        addFlowStep,
        updateFlowStep,
        addBalanceSnapshot,
    } = useTransactionStore();

    const handleNotification = useCallback(
        async (notification: Nip47Notification) => {
            if (
                notification.notification_type === "payment_received" &&
                wrappedDataRef.current &&
                !isProcessing
            ) {
                const tx = notification.notification;
                const amountSats = Math.floor(tx.amount / 1000);

                setIsProcessing(true);

                addTransaction({
                    type: "payment_received",
                    status: "success",
                    toWallet: "charlie",
                    amount: amountSats,
                    description: `Charlie received ${amountSats} sats`,
                    snippetIds: ["subscribe-notifications"],
                });

                addFlowStep({
                    fromWallet: "charlie",
                    toWallet: "charlie",
                    label: `🔔 Received ${amountSats} sats`,
                    direction: "right",
                    status: "success",
                    snippetIds: ["subscribe-notifications"],
                });

                // Update Charlie's balance
                const client = getNWCClient("charlie");
                if (client) {
                    const balance = await client.getBalance();
                    const balanceSats = Math.floor(balance.balance / 1000);
                    setWalletBalance("charlie", balanceSats);
                    addBalanceSnapshot({ walletId: "charlie", balance: balanceSats });
                }

                // Now forward payment to Bob
                const forwardTxId = addTransaction({
                    type: "payment_sent",
                    status: "pending",
                    fromWallet: "charlie",
                    toWallet: "bob",
                    amount: wrappedDataRef.current.originalAmount,
                    description: `Charlie forwarding ${wrappedDataRef.current.originalAmount} sats to Bob...`,
                    snippetIds: ["pay-invoice"],
                });

                const flowStepId = addFlowStep({
                    fromWallet: "charlie",
                    toWallet: "bob",
                    label: `Forwarding ${wrappedDataRef.current.originalAmount} sats...`,
                    direction: "right",
                    status: "pending",
                    snippetIds: ["pay-invoice"],
                });

                try {
                    if (!client) return;

                    await client.payInvoice({
                        invoice: wrappedDataRef.current.originalInvoice,
                    });

                    // Update Charlie's balance after paying
                    const newBalance = await client.getBalance();
                    const newBalanceSats = Math.floor(newBalance.balance / 1000);
                    setWalletBalance("charlie", newBalanceSats);
                    addBalanceSnapshot({ walletId: "charlie", balance: newBalanceSats });

                    updateTransaction(forwardTxId, {
                        status: "success",
                        description: `Charlie paid ${wrappedDataRef.current.originalAmount} sats to Bob (kept ${wrappedDataRef.current.fee} sats fee)`,
                    });

                    updateFlowStep(flowStepId, {
                        label: `✅ Forwarded: ${wrappedDataRef.current.originalAmount} sats (fee: ${wrappedDataRef.current.fee})`,
                        status: "success",
                    });
                } catch (err) {
                    console.error("Failed to forward payment:", err);
                    const errorMessage = err instanceof Error ? err.message : String(err);

                    updateTransaction(forwardTxId, {
                        status: "error",
                        description: `Failed to forward payment: ${errorMessage}`,
                    });

                    updateFlowStep(flowStepId, {
                        label: `❌ Forward failed: ${errorMessage}`,
                        status: "error",
                    });
                } finally {
                    setIsProcessing(false);
                }
            }
        },
        [
            addTransaction,
            updateTransaction,
            addFlowStep,
            updateFlowStep,
            addBalanceSnapshot,
            getNWCClient,
            setWalletBalance,
            isProcessing,
        ]
    );

    const wrapInvoice = async () => {
        const client = getNWCClient("charlie");
        if (!client) {
            setError("Charlie wallet not connected");
            return;
        }

        if (!originalInvoice.trim()) {
            setError("Please paste Bob's invoice");
            return;
        }

        setIsWrapping(true);
        setError(null);

        const txId = addTransaction({
            type: "invoice_created",
            status: "pending",
            description: "Charlie wrapping invoice...",
            snippetIds: ["make-invoice"],
        });

        try {
            // Decode the original invoice using the Invoice class
            const decodedInvoice = new Invoice({ pr: originalInvoice.trim() });

            const originalAmountSats = decodedInvoice.satoshi;
            const fee = Math.ceil(
                (originalAmountSats * parseFloat(feePercent)) / 100
            );
            const totalAmount = originalAmountSats + fee;

            // Create wrapped invoice
            const response = await client.makeInvoice({
                amount: totalAmount * 1000,
                description: `Wrapped invoice (${originalAmountSats} sats + ${fee} sats fee)`,
            });

            const newWrappedData: WrappedInvoiceData = {
                originalInvoice: originalInvoice.trim(),
                wrappedInvoice: response.invoice,
                originalAmount: originalAmountSats,
                fee,
                totalAmount,
            };

            wrappedDataRef.current = newWrappedData;
            setWrappedData(newWrappedData);

            updateTransaction(txId, {
                status: "success",
                amount: totalAmount,
                description: `Wrapped invoice created: ${totalAmount} sats (${originalAmountSats} + ${fee} fee)`,
            });

            addFlowStep({
                fromWallet: "charlie",
                toWallet: "alice",
                label: `📦 Wrapped invoice: ${totalAmount} sats`,
                direction: "right",
                status: "success",
                snippetIds: ["make-invoice"],
            });

            // Start listening for payment
            if (!isListening) {
                const unsub = await client.subscribeNotifications(handleNotification, [
                    "payment_received",
                ]);
                unsubRef.current = unsub;
                setIsListening(true);
            }
        } catch (err) {
            console.error("Failed to wrap invoice:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);

            updateTransaction(txId, {
                status: "error",
                description: `Failed to wrap invoice: ${errorMessage}`,
            });
        } finally {
            setIsWrapping(false);
        }
    };

    const copyWrappedInvoice = async () => {
        if (!wrappedData) return;
        await navigator.clipboard.writeText(wrappedData.wrappedInvoice);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setWrappedData(null);
        wrappedDataRef.current = null;
        setOriginalInvoice("");
        setError(null);
        setIsProcessing(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubRef.current) {
                unsubRef.current();
            }
        };
    }, []);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <span>{WALLET_PERSONAS.charlie.emoji}</span>
                    <span>Charlie: Wrapper Service</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-200">
                    <p>
                        Charlie wraps Bob's invoice, adds a fee, and auto-forwards payments.
                    </p>
                </div>

                {!wrappedData ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                                Paste Bob's Invoice
                            </label>
                            <Input
                                value={originalInvoice}
                                onChange={(e) => setOriginalInvoice(e.target.value)}
                                placeholder="lnbc..."
                                disabled={isWrapping}
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">
                                Fee Percentage
                            </label>
                            <Input
                                type="number"
                                value={feePercent}
                                onChange={(e) => setFeePercent(e.target.value)}
                                placeholder="1"
                                disabled={isWrapping}
                                min="0"
                                step="0.1"
                            />
                        </div>

                        {error && <p className="text-xs text-destructive">{error}</p>}

                        <Button
                            onClick={wrapInvoice}
                            disabled={isWrapping || !originalInvoice}
                            className="w-full"
                        >
                            {isWrapping ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Wrapping...
                                </>
                            ) : (
                                <>
                                    <Package className="mr-2 h-4 w-4" />
                                    Wrap Invoice
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Original</span>
                                    <span className="font-mono">{wrappedData.originalAmount} sats</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Fee ({feePercent}%)</span>
                                    <span className="font-mono">+{wrappedData.fee} sats</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-1">
                                    <span className="font-medium">Total</span>
                                    <span className="font-mono font-medium">
                                        {wrappedData.totalAmount} sats
                                    </span>
                                </div>
                            </div>
                            <p className="font-mono text-xs break-all">
                                {wrappedData.wrappedInvoice}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyWrappedInvoice}
                                className="w-full"
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-1 h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-1 h-4 w-4" />
                                        Copy Wrapped Invoice
                                    </>
                                )}
                            </Button>
                        </div>

                        {isProcessing ? (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Processing payment...
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                {isListening ? "Listening for payment..." : "Ready"}
                            </p>
                        )}

                        <Button onClick={reset} variant="outline" className="w-full">
                            Wrap New Invoice
                        </Button>
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
    const [lastPayment, setLastPayment] = useState<{
        amount: number;
        success: boolean;
    } | null>(null);

    const { getNWCClient, setWalletBalance } = useWalletStore();
    const {
        addTransaction,
        updateTransaction,
        addFlowStep,
        updateFlowStep,
        addBalanceSnapshot,
    } = useTransactionStore();

    const handlePay = async () => {
        if (!invoiceInput.trim()) return;

        const client = getNWCClient("alice");
        if (!client) return;

        setIsPaying(true);
        setError(null);
        setLastPayment(null);

        const txId = addTransaction({
            type: "payment_sent",
            status: "pending",
            fromWallet: "alice",
            toWallet: "charlie",
            description: "Alice paying wrapped invoice...",
            snippetIds: ["pay-invoice"],
        });

        const flowStepId = addFlowStep({
            fromWallet: "alice",
            toWallet: "charlie",
            label: "Paying wrapped invoice...",
            direction: "right",
            status: "pending",
            snippetIds: ["pay-invoice"],
        });

        try {
            await client.payInvoice({ invoice: invoiceInput.trim() });

            // Update Alice's balance
            const aliceBalance = await client.getBalance();
            const aliceBalanceSats = Math.floor(aliceBalance.balance / 1000);
            setWalletBalance("alice", aliceBalanceSats);
            addBalanceSnapshot({ walletId: "alice", balance: aliceBalanceSats });

            // Update Charlie's balance
            const charlieClient = getNWCClient("charlie");
            if (charlieClient) {
                const charlieBalance = await charlieClient.getBalance();
                const charlieBalanceSats = Math.floor(charlieBalance.balance / 1000);
                setWalletBalance("charlie", charlieBalanceSats);
                addBalanceSnapshot({ walletId: "charlie", balance: charlieBalanceSats });
            }

            updateTransaction(txId, {
                status: "success",
                description: "Alice paid wrapped invoice",
            });

            updateFlowStep(flowStepId, {
                label: "✅ Payment confirmed",
                status: "success",
            });

            setLastPayment({ amount: 0, success: true });
        } catch (err) {
            console.error("Failed to pay:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setLastPayment({ amount: 0, success: false });

            updateTransaction(txId, {
                status: "error",
                description: `Payment failed: ${errorMessage}`,
            });

            updateFlowStep(flowStepId, {
                label: `Payment failed: ${errorMessage}`,
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
                    <span>Alice: Sender</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200">
                    <p>
                        Alice pays Charlie's wrapped invoice (she doesn't see Bob's original).
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                        Paste Wrapped Invoice
                    </label>
                    <Input
                        value={invoiceInput}
                        onChange={(e) => setInvoiceInput(e.target.value)}
                        placeholder="lnbc..."
                        disabled={isPaying}
                        className="font-mono text-xs"
                    />
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                {lastPayment && (
                    <div
                        className={`p-2 rounded-lg text-xs ${lastPayment.success
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}
                    >
                        {lastPayment.success ? "✅ Payment sent!" : "❌ Payment failed"}
                    </div>
                )}

                <Button
                    onClick={handlePay}
                    disabled={isPaying || !invoiceInput.trim()}
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
            </CardContent>
        </Card>
    );
}
