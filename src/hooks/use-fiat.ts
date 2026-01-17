import { useState, useEffect } from 'react';
import { getFiatValue } from '@getalby/lightning-tools/fiat';

const CURRENCY = 'USD';
const CACHE_DURATION = 60000; // 1 minute

let cachedRate: { value: number; timestamp: number } | null = null;

async function fetchFiatRate(): Promise<number> {
  // Use cached rate if still valid
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.value;
  }

  try {
    // Fetch rate for 1 sat
    const fiatValue = await getFiatValue({ satoshi: 1, currency: CURRENCY });
    cachedRate = { value: fiatValue, timestamp: Date.now() };
    return fiatValue;
  } catch (error) {
    console.error('Failed to fetch fiat rate:', error);
    // Fallback rate (approximate)
    return 0.00095;
  }
}

export function useFiatValue(satoshis: number): string {
  const [fiatDisplay, setFiatDisplay] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function updateFiatValue() {
      if (satoshis === 0) {
        setFiatDisplay('≈ $0.00');
        return;
      }

      try {
        const rate = await fetchFiatRate();
        if (!cancelled) {
          const fiatAmount = satoshis * rate;
          setFiatDisplay(`≈ $${fiatAmount.toFixed(2)}`);
        }
      } catch {
        if (!cancelled) {
          // Fallback display
          setFiatDisplay(`≈ $${(satoshis * 0.00095).toFixed(2)}`);
        }
      }
    }

    updateFiatValue();

    return () => {
      cancelled = true;
    };
  }, [satoshis]);

  return fiatDisplay;
}
