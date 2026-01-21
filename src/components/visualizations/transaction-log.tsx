import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactionStore } from '@/stores';
import type { Transaction } from '@/types';
import { WALLET_PERSONAS } from '@/types';

export function TransactionLog() {
  const { transactions, clearAll } = useTransactionStore();

  if (transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No events yet. Connect all wallets to start the scenario.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="font-medium">Transaction Log</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-4">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getWalletName = (id?: string) => {
    if (!id) return '';
    return WALLET_PERSONAS[id]?.name ?? id;
  };

  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
      <StatusIcon status={transaction.status} />
      <span className="text-sm text-muted-foreground font-mono shrink-0">
        {formatTime(transaction.timestamp)}
      </span>
      {transaction.fromWallet && transaction.toWallet && (
        <span className="text-sm shrink-0">
          {getWalletName(transaction.fromWallet)} → {getWalletName(transaction.toWallet)}
        </span>
      )}
      {transaction.amount && (
        <span className="text-sm font-medium shrink-0">
          {transaction.amount.toLocaleString()} sats
        </span>
      )}
      <span className="text-sm text-muted-foreground break-all">{transaction.description}</span>
    </div>
  );
}

function StatusIcon({ status }: { status: Transaction['status'] }) {
  switch (status) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'error':
      return <X className="h-4 w-4 text-destructive" />;
    case 'pending':
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
}
