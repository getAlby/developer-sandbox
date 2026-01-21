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
    title: "Payment Notifications",
    description:
      "Subscribe to real-time payment notifications and react to incoming and outgoing payments.",
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
      "Hold invoices allow you to accept a payment but delay the final settlement. This is useful for escrow-like scenarios where you want to verify something before completing the payment. The invoice must be settled before the specified block time.",
    howItWorks: [
      {
        title: "Create",
        description:
          "Bob generates a preimage and its hash. The hash is included in the invoice.",
      },
      {
        title: "Hold",
        description:
          "Alice pays, but funds are locked. Only Bob has the preimage to claim them.",
      },
      {
        title: "Settle/Cancel",
        description:
          "Bob reveals preimage to receive funds, or cancels to refund Alice.",
      },
    ],
    complexity: "advanced",
    requiredWallets: ["alice", "bob"],
    icon: "🔒",
  },
  {
    id: "proof-of-payment",
    title: "Proof of Payment",
    description:
      "Use the payment preimage as cryptographic proof that a payment was made.",
    education:
      "Every Lightning payment includes a preimage that serves as cryptographic proof of payment. This can be used to unlock content, verify purchases, as a receipt, or to enable atomic swaps. The preimage is atomically revealed on successful payment. Payment hash in a BOLT-11 invoice is the SHA-256 hash of the preimage.",
    complexity: "medium",
    requiredWallets: [],
    icon: "✅",
  },
  // {
  //   id: "transaction-history",
  //   title: "Transaction History",
  //   description: "Fetch and display transaction history from a wallet.",
  //   education:
  //     "NWC allows you to query the transaction history of a wallet, useful for displaying past payments and receipts in your application.",
  //   complexity: "medium",
  //   requiredWallets: ["alice", "bob", "charlie", "david"],
  //   icon: "📜",
  // },
  /*{
    id: "nostr-zap",
    title: "Nostr Zap",
    description: "Send a zap (payment) to a Nostr user or content.",
    education:
      "Zaps are Lightning payments sent through Nostr, typically used to tip content creators. They combine Lightning payments with Nostr social features.",
    complexity: "advanced",
    requiredWallets: ["alice", "bob"],
    icon: "⚡",
  },*/
  {
    id: "payment-forwarding",
    title: "Payment Forwarding",
    description:
      "Listen to incoming payments, and forward a percentage of the value using a recipient lightning address.",
    education:
      "Payment forwarding can be used to make revenue by providing a service for merchants. For example, receive the payment on behalf of a merchant, provide a service, and then forward 99% of the value to the merchant. Keep in mind, you should reserve 1% for routing fees.",
    howItWorks: [
      {
        title: "Configure",
        description:
          "Bob sets up forwarding to Charlie's lightning address with a percentage.",
      },
      {
        title: "Receive",
        description:
          "Alice pays Bob. Bob's wallet receives the payment notification.",
      },
      {
        title: "Forward",
        description:
          "Bob automatically forwards the configured percentage to Charlie.",
      },
    ],
    complexity: "medium",
    requiredWallets: ["alice", "bob", "charlie"],
    icon: "🔀",
  },
  {
    id: "payment-prisms",
    title: "Payment Prisms",
    description:
      "Listen to incoming payments, and forward a percentage of the value to multiple recipients.",
    education:
      "Prisms is an extension of payment forwarding that allows a single initial payment to fund multiple wallets. Prisms can also be recursive. Make sure to consider reserving 1% for routing fees for each payment.",
    howItWorks: [
      {
        title: "Configure",
        description:
          "Bob sets up a prism split with percentages for Charlie and David.",
      },
      {
        title: "Receive",
        description:
          "Alice pays Bob. Bob's wallet receives the payment notification.",
      },
      {
        title: "Split",
        description:
          "Bob automatically splits the payment, forwarding to Charlie and David.",
      },
    ],
    complexity: "medium",
    requiredWallets: ["alice", "bob", "charlie", "david"],
    icon: "🔺",
  },
  {
    id: "fiat-conversion",
    title: "Fiat Conversion",
    description: "Convert between sats and fiat currencies for display.",
    education:
      "Many apps need to display Bitcoin amounts in familiar fiat currencies. Learn how to fetch exchange rates and convert amounts.",
    complexity: "advanced",
    requiredWallets: [],
    icon: "💱",
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
