import type { SnippetId } from '@/data/code-snippets';

export type TransactionStatus = 'pending' | 'success' | 'error';

export type TransactionType =
  | 'invoice_created'
  | 'invoice_paid'
  | 'payment_sent'
  | 'payment_received'
  | 'payment_failed'
  | 'balance_updated'
  | 'fiat_conversion'
  | 'subscription_started'
  | 'lnurl_verify';

export interface Transaction {
  id: string;
  timestamp: Date;
  type: TransactionType;
  status: TransactionStatus;
  fromWallet?: string;
  toWallet?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, unknown>;
  /** Explicit code snippet IDs to show for this transaction */
  snippetIds?: SnippetId[];
}

export interface FlowStep {
  id: string;
  fromWallet: string;
  toWallet: string;
  label: string;
  direction: 'left' | 'right';
  status: TransactionStatus;
  /** Explicit code snippet IDs to show for this flow step */
  snippetIds?: SnippetId[];
}

export interface BalanceSnapshot {
  timestamp: Date;
  walletId: string;
  balance: number;
}
