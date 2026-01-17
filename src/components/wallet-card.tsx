import { useState } from 'react';
import { Loader2, Wallet, Unplug, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Wallet as WalletType } from '@/types';
import { useWalletStore } from '@/stores';

interface WalletCardProps {
  wallet: WalletType;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const [connectionInput, setConnectionInput] = useState('');
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const { setWalletConnection, setWalletStatus, disconnectWallet, setWalletBalance } = useWalletStore();

  const handleConnect = async (connectionString: string) => {
    if (!connectionString.trim()) return;

    setWalletStatus(wallet.id, 'connecting');

    try {
      // TODO: Implement actual NWC connection via Alby SDK
      // For now, simulate connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setWalletConnection(wallet.id, connectionString.trim());
      setWalletBalance(wallet.id, 10000); // Simulated balance
      setConnectionInput('');
    } catch {
      setWalletStatus(wallet.id, 'error', 'Failed to connect wallet');
    }
  };

  const handleCreateTestWallet = async () => {
    setIsCreatingWallet(true);
    setWalletStatus(wallet.id, 'connecting');

    try {
      // Create test wallet via faucet API
      const response = await fetch('https://nwc.getalby.com/api/v1/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create test wallet');
      }

      const data = await response.json();
      const connectionSecret = data.connection_secret || data.connectionSecret;

      if (connectionSecret) {
        setWalletConnection(wallet.id, connectionSecret);
        setWalletBalance(wallet.id, 10000); // Faucet typically provides some sats
      } else {
        throw new Error('No connection secret received');
      }
    } catch (error) {
      console.error('Failed to create test wallet:', error);
      setWalletStatus(wallet.id, 'error', 'Failed to create test wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet(wallet.id);
  };

  const isConnecting = wallet.status === 'connecting';
  const isConnected = wallet.status === 'connected';
  const hasError = wallet.status === 'error';

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{wallet.emoji}</span>
            <span>{wallet.name}'s Wallet</span>
          </CardTitle>
          <StatusBadge status={wallet.status} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {isConnected ? (
          <ConnectedState
            wallet={wallet}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <DisconnectedState
            wallet={wallet}
            connectionInput={connectionInput}
            isCreatingWallet={isCreatingWallet}
            isConnecting={isConnecting}
            hasError={hasError}
            onConnectionInputChange={setConnectionInput}
            onConnect={() => handleConnect(connectionInput)}
            onCreateTestWallet={handleCreateTestWallet}
          />
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: WalletType['status'] }) {
  switch (status) {
    case 'connected':
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    case 'connecting':
      return <Badge variant="secondary">Connecting...</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Disconnected</Badge>;
  }
}

interface ConnectedStateProps {
  wallet: WalletType;
  onDisconnect: () => void;
}

function ConnectedState({ wallet, onDisconnect }: ConnectedStateProps) {
  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Wallet className="h-4 w-4" />
          <span>NWC</span>
        </div>
        <div className="text-2xl font-bold">
          {wallet.balance?.toLocaleString() ?? '—'} sats
        </div>
        <div className="text-sm text-muted-foreground">
          ≈ ${((wallet.balance ?? 0) * 0.00095).toFixed(2)}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onDisconnect}
        className="w-full"
      >
        <Unplug className="mr-2 h-4 w-4" />
        Disconnect Wallet
      </Button>
    </>
  );
}

interface DisconnectedStateProps {
  wallet: WalletType;
  connectionInput: string;
  isCreatingWallet: boolean;
  isConnecting: boolean;
  hasError: boolean;
  onConnectionInputChange: (value: string) => void;
  onConnect: () => void;
  onCreateTestWallet: () => void;
}

function DisconnectedState({
  wallet,
  connectionInput,
  isCreatingWallet,
  isConnecting,
  hasError,
  onConnectionInputChange,
  onConnect,
  onCreateTestWallet,
}: DisconnectedStateProps) {
  return (
    <>
      <div className="text-2xl font-bold text-muted-foreground">— sats</div>

      {hasError && wallet.error && (
        <p className="text-sm text-destructive">{wallet.error}</p>
      )}

      <p className="text-sm text-muted-foreground">
        Connect {wallet.name}'s wallet to try this scenario
      </p>

      <Button
        onClick={onCreateTestWallet}
        disabled={isConnecting || isCreatingWallet}
        className="w-full"
      >
        {isCreatingWallet ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-4 w-4" />
            Create Test Wallet
          </>
        )}
      </Button>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Or paste connection secret:</p>
        <Input
          placeholder="nostr+walletconnect://..."
          value={connectionInput}
          onChange={(e) => onConnectionInputChange(e.target.value)}
          disabled={isConnecting}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onConnect}
          disabled={!connectionInput.trim() || isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </>
  );
}
