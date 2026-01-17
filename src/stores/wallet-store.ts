import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NWCClient } from '@getalby/sdk/nwc';
import type { Wallet, WalletStatus } from '@/types';
import { createWallet } from '@/types';

// Store NWC clients separately (not persisted)
const nwcClients = new Map<string, NWCClient>();

interface WalletState {
  wallets: Record<string, Wallet>;
  initializeWallets: (walletIds: string[]) => void;
  setWalletStatus: (walletId: string, status: WalletStatus, error?: string) => void;
  setWalletConnection: (walletId: string, connectionString: string, lightningAddress?: string) => void;
  setWalletBalance: (walletId: string, balance: number) => void;
  disconnectWallet: (walletId: string) => void;
  getWallet: (walletId: string) => Wallet | undefined;
  areAllWalletsConnected: (walletIds: string[]) => boolean;
  setNWCClient: (walletId: string, client: NWCClient) => void;
  getNWCClient: (walletId: string) => NWCClient | undefined;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: {},

      initializeWallets: (walletIds: string[]) => {
        set((state) => {
          const wallets = { ...state.wallets };
          for (const id of walletIds) {
            if (!wallets[id]) {
              wallets[id] = createWallet(id);
            }
          }
          return { wallets };
        });
      },

      setWalletStatus: (walletId: string, status: WalletStatus, error?: string) => {
        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: { ...wallet, status, error },
            },
          };
        });
      },

      setWalletConnection: (walletId: string, connectionString: string, lightningAddress?: string) => {
        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: {
                ...wallet,
                connectionString,
                lightningAddress: lightningAddress ?? null,
                status: 'connected',
                error: undefined,
              },
            },
          };
        });
      },

      setWalletBalance: (walletId: string, balance: number) => {
        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: { ...wallet, balance },
            },
          };
        });
      },

      disconnectWallet: (walletId: string) => {
        // Close and remove the NWC client
        const client = nwcClients.get(walletId);
        if (client) {
          client.close();
          nwcClients.delete(walletId);
        }

        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: {
                ...wallet,
                connectionString: null,
                lightningAddress: null,
                balance: null,
                status: 'disconnected',
                error: undefined,
              },
            },
          };
        });
      },

      getWallet: (walletId: string) => {
        return get().wallets[walletId];
      },

      areAllWalletsConnected: (walletIds: string[]) => {
        const { wallets } = get();
        return walletIds.every((id) => wallets[id]?.status === 'connected');
      },

      setNWCClient: (walletId: string, client: NWCClient) => {
        nwcClients.set(walletId, client);
      },

      getNWCClient: (walletId: string) => {
        return nwcClients.get(walletId);
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        wallets: Object.fromEntries(
          Object.entries(state.wallets).map(([id, wallet]) => [
            id,
            {
              ...wallet,
              // Reset status on reload - will need to reconnect
              status: wallet.connectionString ? 'disconnected' : 'disconnected',
            },
          ])
        ),
      }),
    }
  )
);
