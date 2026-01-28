import { create } from "zustand";

export type WrappedInvoiceState =
  | "idle"
  | "charlie_invoice_created"
  | "bob_wrapped"
  | "alice_paid"
  | "bob_paid_charlie"
  | "settled";

export interface CharlieInvoiceData {
  invoice: string;
  paymentHash: string;
  amount: number;
}

export interface BobWrappedData {
  wrappedInvoice: string;
  preimage: string;
  paymentHash: string;
  totalAmount: number;
  fee: number;
  charlieAmount: number;
}

interface WrappedInvoiceStore {
  state: WrappedInvoiceState;
  charlieInvoice: CharlieInvoiceData | null;
  bobWrapped: BobWrappedData | null;
  receivedPreimage: string | null;

  setState: (state: WrappedInvoiceState) => void;
  setCharlieInvoice: (data: CharlieInvoiceData | null) => void;
  setBobWrapped: (data: BobWrappedData | null) => void;
  setReceivedPreimage: (preimage: string | null) => void;
  reset: () => void;
}

export const useWrappedInvoiceStore = create<WrappedInvoiceStore>((set) => ({
  state: "idle",
  charlieInvoice: null,
  bobWrapped: null,
  receivedPreimage: null,

  setState: (state) => set({ state }),
  setCharlieInvoice: (data) => set({ charlieInvoice: data }),
  setBobWrapped: (data) => set({ bobWrapped: data }),
  setReceivedPreimage: (preimage) => set({ receivedPreimage: preimage }),

  reset: () =>
    set({
      state: "idle",
      charlieInvoice: null,
      bobWrapped: null,
      receivedPreimage: null,
    }),
}));
