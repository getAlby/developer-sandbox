import type { Scenario } from "@/types";

export const scenarios: Scenario[] = [
  {
    id: "simple-payment",
    title: "Simple Invoice Payment",
    description:
      "Bob creates a BOLT-11 invoice, Alice pays it. The fundamental Lightning payment flow.",
    education:
      "Lightning invoices can be shared as text or displayed as a QR code, or opened as a link in a lightning wallet. Invoices can only be used once.",
    complexity: "simplest",
    requiredWallets: ["alice", "bob"],
    icon: "💸",
  },
  {
    id: "lightning-address",
    title: "Lightning Address",
    description:
      "Pay to a Lightning Address (like email). The system handles invoice creation automatically.",
    education:
      "You can share a lightning address publicly to receive payments from anyone. Lightning addresses can be shared as text or as a QR code, or opened as a link in a lightning wallet.",
    complexity: "simple",
    requiredWallets: ["alice", "bob"],
    icon: "🔌",
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Subscribe to real-time payment notifications and react to incoming payments.",
    education:
      "NWC supports subscribing to payment notifications, allowing your app to react instantly when payments are received.",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    icon: "🔔",
  },
  {
    id: "hold-invoice",
    title: "Hold Invoice",
    description:
      "Create an invoice that can be conditionally settled or cancelled.",
    education:
      "Hold invoices allow you to accept a payment but delay the final settlement. This is useful for escrow-like scenarios where you want to verify something before completing the payment.",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    icon: "🔒",
  },
  {
    id: "proof-of-payment",
    title: "Proof of Payment",
    description:
      "Use the payment preimage as cryptographic proof that a payment was made.",
    education:
      "Every Lightning payment includes a preimage that serves as cryptographic proof of payment. This can be used to unlock content, verify purchases, or as a receipt.",
    complexity: "medium",
    requiredWallets: ["alice", "bob"],
    icon: "✅",
  },
  {
    id: "transaction-history",
    title: "Transaction History",
    description: "Fetch and display transaction history from a wallet.",
    education:
      "NWC allows you to query the transaction history of a wallet, useful for displaying past payments and receipts in your application.",
    complexity: "medium",
    requiredWallets: ["alice"],
    icon: "📜",
  },
  {
    id: "nostr-zap",
    title: "Nostr Zap",
    description: "Send a zap (payment) to a Nostr user or content.",
    education:
      "Zaps are Lightning payments sent through Nostr, typically used to tip content creators. They combine Lightning payments with Nostr social features.",
    complexity: "advanced",
    requiredWallets: ["alice", "bob"],
    icon: "⚡",
  },
  {
    id: "fiat-conversion",
    title: "Fiat Conversion",
    description: "Convert between sats and fiat currencies for display.",
    education:
      "Many apps need to display Bitcoin amounts in familiar fiat currencies. Learn how to fetch exchange rates and convert amounts.",
    complexity: "advanced",
    requiredWallets: ["alice"],
    icon: "💱",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
