import { useState } from "react";
import { Loader2, FileSearch, AlertCircle, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Invoice } from "@getalby/lightning-tools";
import { useTransactionStore } from "@/stores";

type DecodedInvoiceData = {
  paymentRequest: string;
  paymentHash: string;
  satoshi: number;
  timestamp: number;
  createdDate: Date;
  expiry: number | undefined;
  expiryDate: Date | undefined;
  description: string | null;
  hasExpired: boolean;
};

export function DecodeBolt11InvoiceScenario() {
  const [invoiceInput, setInvoiceInput] = useState("");
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedInvoice, setDecodedInvoice] =
    useState<DecodedInvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { addTransaction, addFlowStep } = useTransactionStore();

  const handleDecode = async () => {
    if (!invoiceInput.trim()) return;

    setIsDecoding(true);
    setError(null);
    setDecodedInvoice(null);

    try {
      addTransaction({
        type: "invoice_created",
        status: "pending",
        description: "Decoding BOLT-11 invoice...",
      });

      // Use the Invoice class to decode
      const invoice = new Invoice({ pr: invoiceInput.trim() });

      const decoded: DecodedInvoiceData = {
        paymentRequest: invoice.paymentRequest,
        paymentHash: invoice.paymentHash,
        satoshi: invoice.satoshi,
        timestamp: invoice.timestamp,
        createdDate: invoice.createdDate,
        expiry: invoice.expiry,
        expiryDate: invoice.expiryDate,
        description: invoice.description,
        hasExpired: invoice.hasExpired(),
      };

      setDecodedInvoice(decoded);

      addTransaction({
        type: "invoice_created",
        status: "success",
        amount: decoded.satoshi,
        description: `Invoice decoded: ${decoded.satoshi} sats${decoded.description ? ` - "${decoded.description}"` : ""}`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: `Decoded: ${decoded.satoshi} sats`,
        direction: "right",
        status: "success",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid lightning invoice";
      setError(errorMessage);

      addTransaction({
        type: "invoice_created",
        status: "error",
        description: `Failed to decode invoice: ${errorMessage}`,
      });

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: "Decode failed",
        direction: "right",
        status: "error",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopy = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleString();
  };

  const formatExpiry = (expiry: number | undefined) => {
    if (!expiry) return "N/A";
    const hours = Math.floor(expiry / 3600);
    const minutes = Math.floor((expiry % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m (${expiry}s)`;
    }
    return `${minutes}m (${expiry}s)`;
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-5 w-5" />
            <span>Decode BOLT-11 Invoice</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p>
              Paste a BOLT-11 invoice to decode and view its properties like
              amount, payment hash, description, and expiry.
            </p>
          </div>

          {/* Invoice Input */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              BOLT-11 Invoice
            </label>
            <Input
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder="lnbc..."
              className="font-mono text-xs"
              disabled={isDecoding}
            />
          </div>

          <Button
            onClick={handleDecode}
            disabled={isDecoding || !invoiceInput.trim()}
            className="w-full"
          >
            {isDecoding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Decoding...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4" />
                Decode Invoice
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Invalid Invoice
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Decoded Invoice Display */}
          {decodedInvoice && (
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-sm font-medium">Decoded Fields</h3>

              {/* Amount */}
              <InvoiceField
                label="Amount"
                value={`${decodedInvoice.satoshi.toLocaleString()} sats`}
                highlight
              />

              {/* Description */}
              <InvoiceField
                label="Description"
                value={decodedInvoice.description || "(no description)"}
                muted={!decodedInvoice.description}
              />

              {/* Payment Hash */}
              <InvoiceField
                label="Payment Hash"
                value={decodedInvoice.paymentHash}
                mono
                copyable
                onCopy={() =>
                  handleCopy("paymentHash", decodedInvoice.paymentHash)
                }
                copied={copiedField === "paymentHash"}
              />

              {/* Created Date */}
              <InvoiceField
                label="Created"
                value={formatDate(decodedInvoice.createdDate)}
              />

              {/* Expiry */}
              <InvoiceField
                label="Expiry Duration"
                value={formatExpiry(decodedInvoice.expiry)}
              />

              {/* Expiry Date */}
              <InvoiceField
                label="Expires At"
                value={formatDate(decodedInvoice.expiryDate)}
              />

              {/* Expired Status */}
              {decodedInvoice.hasExpired && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This invoice has expired
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <InvoiceField
                label="Unix Timestamp"
                value={decodedInvoice.timestamp.toString()}
                mono
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceField({
  label,
  value,
  mono = false,
  highlight = false,
  muted = false,
  copyable = false,
  onCopy,
  copied = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  muted?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 p-2 bg-muted rounded text-sm ${
            mono ? "font-mono text-xs break-all" : ""
          } ${highlight ? "font-medium text-primary" : ""} ${
            muted ? "text-muted-foreground italic" : ""
          }`}
        >
          {value}
        </div>
        {copyable && onCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
