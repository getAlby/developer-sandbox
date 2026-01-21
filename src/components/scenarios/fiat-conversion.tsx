import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  getFiatCurrencies,
  getFiatValue,
  getSatoshiValue,
  getFiatBtcRate,
  type FiatCurrency,
} from "@getalby/lightning-tools/fiat";
import { useTransactionStore } from "@/stores";

const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"];

export function FiatConversionScenario() {
  const [currencies, setCurrencies] = useState<FiatCurrency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [satsAmount, setSatsAmount] = useState("10000");
  const [fiatAmount, setFiatAmount] = useState("");
  const [btcRate, setBtcRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [lastEdited, setLastEdited] = useState<"sats" | "fiat">("sats");

  const { addTransaction, addFlowStep } = useTransactionStore();

  // Load available currencies on mount
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const allCurrencies = await getFiatCurrencies();
        // Sort by priority, with popular currencies first
        const sorted = allCurrencies.sort((a, b) => {
          const aPopular = POPULAR_CURRENCIES.indexOf(a.code);
          const bPopular = POPULAR_CURRENCIES.indexOf(b.code);
          if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
          if (aPopular !== -1) return -1;
          if (bPopular !== -1) return 1;
          return a.code.localeCompare(b.code);
        });
        setCurrencies(sorted);
      } catch (error) {
        console.error("Failed to load currencies:", error);
        // Fallback to basic currencies
        setCurrencies([
          { code: "USD", name: "US Dollar", symbol: "$", priority: 1 },
          { code: "EUR", name: "Euro", symbol: "\u20ac", priority: 2 },
          { code: "GBP", name: "British Pound", symbol: "\u00a3", priority: 3 },
        ]);
      }
    }
    loadCurrencies();
  }, []);

  // Fetch BTC rate for display
  const fetchBtcRate = useCallback(async (currency: string) => {
    try {
      const rate = await getFiatBtcRate(currency);
      setBtcRate(rate);
      return rate;
    } catch (error) {
      console.error("Failed to fetch BTC rate:", error);
      setBtcRate(null);
      return null;
    }
  }, []);

  // Convert sats to fiat
  const convertSatsToFiat = useCallback(
    async (sats: string, currency: string) => {
      const satsNum = parseInt(sats, 10);
      if (isNaN(satsNum) || satsNum < 0) {
        setFiatAmount("");
        return;
      }

      setIsConverting(true);
      try {
        const fiatValue = await getFiatValue({
          satoshi: satsNum,
          currency,
        });
        setFiatAmount(fiatValue.toFixed(2));

        addTransaction({
          type: "balance_updated",
          status: "success",
          description: `Converted ${satsNum.toLocaleString()} sats to ${fiatValue.toFixed(2)} ${currency}`,
        });
      } catch (error) {
        console.error("Conversion failed:", error);
        setFiatAmount("");
      } finally {
        setIsConverting(false);
      }
    },
    [addTransaction]
  );

  // Convert fiat to sats
  const convertFiatToSats = useCallback(
    async (fiat: string, currency: string) => {
      const fiatNum = parseFloat(fiat);
      if (isNaN(fiatNum) || fiatNum < 0) {
        setSatsAmount("");
        return;
      }

      setIsConverting(true);
      try {
        const satsValue = await getSatoshiValue({
          amount: fiatNum,
          currency,
        });
        setSatsAmount(Math.round(satsValue).toString());

        addTransaction({
          type: "balance_updated",
          status: "success",
          description: `Converted ${fiatNum.toFixed(2)} ${currency} to ${Math.round(satsValue).toLocaleString()} sats`,
        });
      } catch (error) {
        console.error("Conversion failed:", error);
        setSatsAmount("");
      } finally {
        setIsConverting(false);
      }
    },
    [addTransaction]
  );

  // Initial load and currency change handler
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      await fetchBtcRate(selectedCurrency);

      // Convert based on last edited field
      if (lastEdited === "sats" && satsAmount) {
        await convertSatsToFiat(satsAmount, selectedCurrency);
      } else if (lastEdited === "fiat" && fiatAmount) {
        await convertFiatToSats(fiatAmount, selectedCurrency);
      }

      setIsLoading(false);

      addFlowStep({
        fromWallet: "alice",
        toWallet: "alice",
        label: `Rate loaded: 1 BTC = ${selectedCurrency}`,
        direction: "right",
        status: "success",
      });
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const handleSatsChange = (value: string) => {
    // Only allow numeric input
    const cleaned = value.replace(/[^0-9]/g, "");
    setSatsAmount(cleaned);
    setLastEdited("sats");

    if (cleaned) {
      convertSatsToFiat(cleaned, selectedCurrency);
    } else {
      setFiatAmount("");
    }
  };

  const handleFiatChange = (value: string) => {
    // Allow numeric input with decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    const sanitized =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
    setFiatAmount(sanitized);
    setLastEdited("fiat");

    if (sanitized) {
      convertFiatToSats(sanitized, selectedCurrency);
    } else {
      setSatsAmount("");
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);

    addTransaction({
      type: "balance_updated",
      status: "pending",
      description: `Switching to ${currency}...`,
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchBtcRate(selectedCurrency);

    if (lastEdited === "sats" && satsAmount) {
      await convertSatsToFiat(satsAmount, selectedCurrency);
    } else if (lastEdited === "fiat" && fiatAmount) {
      await convertFiatToSats(fiatAmount, selectedCurrency);
    }

    setIsLoading(false);

    addTransaction({
      type: "balance_updated",
      status: "success",
      description: "Exchange rate refreshed",
    });
  };

  const getCurrencySymbol = (code: string) => {
    const currency = currencies.find((c) => c.code === code);
    return currency?.symbol || code;
  };

  const formatBtcRate = () => {
    if (!btcRate) return "Loading...";
    const symbol = getCurrencySymbol(selectedCurrency);
    return `1 BTC = ${symbol}${btcRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedCurrency}`;
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              <span>Bitcoin / Fiat Converter</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p>
              Convert between Bitcoin (satoshis) and fiat currencies. Edit
              either field and the other will update automatically.
            </p>
          </div>

          {/* Currency Selector */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Currency</label>
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bitcoin Amount */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Bitcoin Amount (sats)
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                value={satsAmount}
                onChange={(e) => handleSatsChange(e.target.value)}
                placeholder="0"
                className="pr-16 font-mono"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                sats
              </span>
            </div>
            {satsAmount && (
              <p className="text-xs text-muted-foreground">
                = {(parseInt(satsAmount, 10) / 100_000_000).toFixed(8)} BTC
              </p>
            )}
          </div>

          {/* Conversion indicator */}
          <div className="flex items-center justify-center py-1">
            {isConverting ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Fiat Amount */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Fiat Amount ({selectedCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {getCurrencySymbol(selectedCurrency)}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={fiatAmount}
                onChange={(e) => handleFiatChange(e.target.value)}
                placeholder="0.00"
                className="pl-8 font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Exchange Rate Display */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-center font-medium">{formatBtcRate()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
