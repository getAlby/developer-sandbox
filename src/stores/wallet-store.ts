import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wallet, WalletStatus } from '@/types';
import { createWallet } from '@/types';

interface WalletState {
  wallets: Record<string, Wallet>;
  initializeWallets: (walletIds: string[]) => void;
  setWalletStatus: (walletId: string, status: WalletStatus, error?: string) => void;
  setWalletConnection: (walletId: string, connectionString: string) => void;
  setWalletBalance: (walletId: string, balance: number) => void;
  disconnectWallet: (walletId: string) => void;
  getWallet: (walletId: string) => Wallet | undefined;
  areAllWalletsConnected: (walletIds: string[]) => boolean;
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

      setWalletConnection: (walletId: string, connectionString: string) => {
        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: {
                ...wallet,
                connectionString,
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
        set((state) => {
          const wallet = state.wallets[walletId];
          if (!wallet) return state;
          return {
            wallets: {
              ...state.wallets,
              [walletId]: {
                ...wallet,
                connectionString: null,
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
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        wallets: Object.fromEntries(
          Object.entries(state.wallets).map(([id, wallet]) => [
            id,
            {
              ...wallet,
              status: wallet.connectionString ? 'disconnected' : 'disconnected',
            },
          ])
        ),
      }),
    }
  )
);
