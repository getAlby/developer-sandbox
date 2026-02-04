import { WalletCard } from './wallet-card';
import { useWalletStore, useScenarioStore } from '@/stores';
import { useEffect } from 'react';

export function WalletGrid() {
  const { currentScenario } = useScenarioStore();
  const { wallets, initializeWallets } = useWalletStore();

  // Use the original array reference for stable dependency
  const requiredWalletIds = currentScenario.requiredWallets;

  useEffect(() => {
    initializeWallets(requiredWalletIds ?? []);
  }, [requiredWalletIds, initializeWallets]);

  const requiredWallets = (requiredWalletIds ?? [])
    .map((id) => wallets[id])
    .filter(Boolean);

  if (requiredWallets.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {requiredWallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}
