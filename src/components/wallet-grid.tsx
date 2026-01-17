import { WalletCard } from './wallet-card';
import { useWalletStore, useScenarioStore } from '@/stores';
import { useEffect } from 'react';

export function WalletGrid() {
  const { currentScenario } = useScenarioStore();
  const { wallets, initializeWallets } = useWalletStore();

  useEffect(() => {
    initializeWallets(currentScenario.requiredWallets);
  }, [currentScenario.requiredWallets, initializeWallets]);

  const requiredWallets = currentScenario.requiredWallets
    .map((id) => wallets[id])
    .filter(Boolean);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {requiredWallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}
