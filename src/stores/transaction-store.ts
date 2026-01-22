import { create } from 'zustand';
import type { Transaction, FlowStep, BalanceSnapshot } from '@/types';

interface TransactionState {
  transactions: Transaction[];
  flowSteps: FlowStep[];
  balanceHistory: BalanceSnapshot[];

  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => void;
  addFlowStep: (step: Omit<FlowStep, 'id'>) => void;
  addBalanceSnapshot: (snapshot: Omit<BalanceSnapshot, 'timestamp'>) => void;
  clearAll: () => void;
}

let transactionCounter = 0;
let flowStepCounter = 0;

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  flowSteps: [],
  balanceHistory: [],

  addTransaction: (transaction) => {
    const id = `tx-${++transactionCounter}`;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      transactions: [...state.transactions, newTransaction],
    }));
    return id;
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    }));
  },

  addFlowStep: (step) => {
    const newStep: FlowStep = {
      ...step,
      id: `step-${++flowStepCounter}`,
    };
    set((state) => ({
      flowSteps: [...state.flowSteps, newStep],
    }));
  },

  addBalanceSnapshot: (snapshot) => {
    const newSnapshot: BalanceSnapshot = {
      ...snapshot,
      timestamp: new Date(),
    };
    set((state) => ({
      balanceHistory: [...state.balanceHistory, newSnapshot],
    }));
  },

  clearAll: () => {
    transactionCounter = 0;
    flowStepCounter = 0;
    set({
      transactions: [],
      flowSteps: [],
      balanceHistory: [],
    });
  },
}));
