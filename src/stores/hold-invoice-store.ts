import { create } from "zustand";

type InvoiceState = "idle" | "created" | "held" | "settled" | "cancelled";

interface HoldInvoiceData {
  invoice: string;
  preimage: string;
  paymentHash: string;
  amount: number;
  description?: string;
  settleDeadline?: number;
}

interface HoldInvoiceStore {
  invoiceData: HoldInvoiceData | null;
  invoiceState: InvoiceState;
  setInvoiceData: (data: HoldInvoiceData | null) => void;
  setInvoiceState: (state: InvoiceState) => void;
  reset: () => void;
}

export const useHoldInvoiceStore = create<HoldInvoiceStore>((set) => ({
  invoiceData: null,
  invoiceState: "idle",

  setInvoiceData: (data) => set({ invoiceData: data }),

  setInvoiceState: (state) => set({ invoiceState: state }),

  reset: () =>
    set({
      invoiceData: null,
      invoiceState: "idle",
    }),
}));
