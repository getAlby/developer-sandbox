export type TransactionStatus = 'pending' | 'success' | 'error';

export type TransactionType =
  | 'invoice_created'
  | 'invoice_paid'
  | 'payment_sent'
  | 'payment_received'
  | 'payment_failed'
  | 'balance_updated';

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
}

export interface FlowStep {
  id: string;
  fromWallet: string;
  toWallet: string;
  label: string;
  direction: 'left' | 'right';
  status: TransactionStatus;
}

export interface BalanceSnapshot {
  timestamp: Date;
  walletId: string;
  balance: number;
}
