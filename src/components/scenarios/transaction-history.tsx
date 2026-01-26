import { useState } from 'react';
import { Loader2, RefreshCw, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWalletStore, useTransactionStore } from '@/stores';
import { WALLET_PERSONAS } from '@/types';

interface Transaction {
  type: 'incoming' | 'outgoing';
  state: 'settled' | 'pending' | 'failed' | 'accepted';
  amount: number;
  description: string;
  settled_at: number;
  created_at: number;
  payment_hash: string;
}

const ALL_WALLET_IDS = ['alice', 'bob', 'charlie', 'david'] as const;
type WalletId = (typeof ALL_WALLET_IDS)[number];

export function TransactionHistoryScenario() {
  const [selectedWallet, setSelectedWallet] = useState<WalletId>('alice');
  const { wallets, getNWCClient } = useWalletStore();

  // Get connected wallets
  const connectedWallets = ALL_WALLET_IDS.filter(
    (id) => wallets[id]?.status === 'connected' && getNWCClient(id)
  );

  if (connectedWallets.length === 0) {
    return null;
  }

  // If selected wallet is not connected, switch to first connected one
  const activeWallet = connectedWallets.includes(selectedWallet)
    ? selectedWallet
    : connectedWallets[0];

  return (
    <div className="grid gap-4">
      {connectedWallets.length > 1 && (
        <div className="flex gap-2">
          {connectedWallets.map((walletId) => {
            const persona = WALLET_PERSONAS[walletId];
            const isActive = walletId === activeWallet;
            return (
              <Button
                key={walletId}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWallet(walletId)}
                className="gap-1"
              >
                <span>{persona.emoji}</span>
                <span>{persona.name}</span>
              </Button>
            );
          })}
        </div>
      )}
      <WalletTransactionHistory walletId={activeWallet} />
    </div>
  );
}

interface WalletTransactionHistoryProps {
  walletId: WalletId;
}

function WalletTransactionHistory({ walletId }: WalletTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const { getNWCClient } = useWalletStore();
  const { addTransaction: addLogTransaction } = useTransactionStore();

  const persona = WALLET_PERSONAS[walletId];

  const fetchTransactions = async () => {
    const client = getNWCClient(walletId);
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      addLogTransaction({
        type: 'invoice_created',
        status: 'pending',
        description: `Fetching ${persona.name}'s transaction history...`,
      });

      const result = await client.listTransactions({
        limit: 20,
      });

      setTransactions(result.transactions as Transaction[]);
      setTotalCount(result.total_count);

      addLogTransaction({
        type: 'invoice_created',
        status: 'success',
        description: `Fetched ${result.transactions.length} transactions for ${persona.name} (${result.total_count} total)`,
      });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);

      addLogTransaction({
        type: 'payment_failed',
        status: 'error',
        description: `Failed to fetch ${persona.name}'s transaction history: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '—';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    // Amount is in millisats
    const sats = Math.floor(amount / 1000);
    return sats.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span>{persona.emoji}</span>
            <span>{persona.name}: Transaction History</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The <code className="text-xs bg-muted px-1 py-0.5 rounded">listTransactions</code> method
          retrieves the wallet's transaction history. Click refresh to fetch recent transactions.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {totalCount !== null && (
          <p className="text-xs text-muted-foreground">
            Showing {transactions.length} of {totalCount} total transactions
          </p>
        )}

        {transactions.length === 0 && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs">Click refresh to load transaction history</p>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.map((tx, index) => (
              <TransactionRow
                key={tx.payment_hash || index}
                transaction={tx}
                formatDate={formatDate}
                formatAmount={formatAmount}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  formatDate: (timestamp: number) => string;
  formatAmount: (amount: number) => string;
}

function TransactionRow({ transaction: tx, formatDate, formatAmount }: TransactionRowProps) {
  const isIncoming = tx.type === 'incoming';

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div
        className={`p-2 rounded-full ${
          isIncoming
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
        }`}
      >
        {isIncoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isIncoming ? '+' : '-'}
            {formatAmount(tx.amount)} sats
          </span>
          <StateBadge state={tx.state} />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {tx.description || 'No description'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(tx.settled_at || tx.created_at)}
        </p>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: Transaction['state'] }) {
  switch (state) {
    case 'settled':
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          Settled
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="text-xs">
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="text-xs">
          Failed
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="outline" className="text-xs">
          Accepted
        </Badge>
      );
    default:
      return null;
  }
}
