import type { NWCClient } from '@getalby/sdk/nwc';
import type { LightningAddress, Invoice } from '@getalby/lightning-tools';

// Wallet client type - extends NWCClient with wallet ID
export interface WalletClient extends NWCClient {
  walletId: string;
}

// Alby namespace for organized access
export interface AlbyNamespace {
  wallets: {
    alice?: WalletClient;
    bob?: WalletClient;
    charlie?: WalletClient;
    david?: WalletClient;
  };
  tools: {
    LightningAddress: typeof LightningAddress;
    Invoice: typeof Invoice;
  };
}

// Fiat utility function types - match the actual @getalby/lightning-tools signatures
export interface FiatTools {
  getFiatValue: (params: { satoshi: string | number; currency: string }) => Promise<number>;
  getSatoshiValue: (params: { amount: string | number; currency: string }) => Promise<number>;
  getFiatBtcRate: (currency: string) => Promise<number>;
}

declare global {
  interface Window {
    // Direct wallet access
    alice?: WalletClient;
    bob?: WalletClient;
    charlie?: WalletClient;
    david?: WalletClient;

    // Lightning tools
    LightningAddress: typeof LightningAddress;
    Invoice: typeof Invoice;

    // Fiat utilities
    getFiatValue: FiatTools['getFiatValue'];
    getSatoshiValue: FiatTools['getSatoshiValue'];
    getFiatBtcRate: FiatTools['getFiatBtcRate'];

    // Namespaced access
    alby: AlbyNamespace;
  }
}

export {};
