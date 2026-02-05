export type SnippetCategory =
  | "this-scenario"
  | "getting-started"
  | "repl"
  | "basics"
  | "payments"
  | "invoices"
  | "lightning-address"
  | "fiat"
  | "advanced";

/**
 * Valid snippet IDs - use this type for type-safe snippet references
 */
export type SnippetId =
  // Getting Started
  | "install-libraries"
  | "init-wallet"
  | "agent-skill"
  // REPL
  | "browser-console"
  | "available-globals"
  // Basics
  | "get-balance"
  | "get-info"
  | "list-transactions"
  // Payments
  | "make-invoice"
  | "pay-invoice"
  | "pay-keysend"
  // Invoices
  | "lookup-invoice"
  | "decode-invoice"
  | "validate-preimage"
  // Lightning Address
  | "fetch-lightning-address"
  | "request-invoice-from-address"
  | "pay-lightning-address"
  | "lnurl-verify"
  // Fiat
  | "get-fiat-currencies"
  | "sats-to-fiat"
  | "fiat-to-sats"
  | "get-btc-rate"
  // Advanced
  | "subscribe-notifications"
  | "subscribe-hold-notifications"
  | "multi-pay"
  | "sign-message"
  | "hold-invoice"
  | "hold-invoice-settle"
  | "hold-invoice-cancel"
  | "wrapped-hold-invoice";

export type CodeLanguage = 'javascript' | 'typescript' | 'bash';

export interface CodeSnippet {
  id: SnippetId;
  title: string;
  description: string;
  code: string;
  category: SnippetCategory;
  language?: CodeLanguage; // defaults to 'typescript'
}

export const SNIPPET_CATEGORIES: {
  id: SnippetCategory;
  label: string;
  icon: string;
}[] = [
  { id: "this-scenario", label: "This Scenario", icon: "play" },
  { id: "getting-started", label: "Getting Started", icon: "rocket" },
  { id: "repl", label: "REPL", icon: "terminal" },
  { id: "basics", label: "Basics", icon: "info" },
  { id: "payments", label: "Payments", icon: "send" },
  { id: "invoices", label: "Invoices", icon: "receipt" },
  { id: "lightning-address", label: "Lightning Address", icon: "at-sign" },
  { id: "fiat", label: "Fiat Conversion", icon: "dollar-sign" },
  { id: "advanced", label: "Advanced", icon: "code" },
];

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: "agent-skill",
    title: "Alby Agent Skill",
    description:
      "Let your agent write the code for you, without making mistakes. Run the following command inside your project:",
    category: "getting-started",
    language: "bash",
    code: `npx skills add getAlby/alby-agent-skill

# No need to follow the code examples below. Jump directly to the example prompts!
`,
  },
  {
    id: "install-libraries",
    title: "Manual Install",
    description:
      "Install the Alby SDK and Lightning Tools packages. The SDK provides wallet connectivity via Nostr Wallet Connect, while Lightning Tools offers utilities like invoice decoding, lightning address resolution, and fiat conversion.",
    category: "getting-started",
    language: "bash",
    code: `npm install @getalby/sdk @getalby/lightning-tools

# README links:
# @getalby/sdk: https://github.com/getAlby/js-sdk
# @getalby/lightning-tools: https://github.com/getAlby/lightning-tools`,
  },
  {
    id: "init-wallet",
    title: "Initialize a Wallet",
    description:
      "Connect to a wallet using a Nostr Wallet Connect (NWC) connection string.",
    category: "getting-started",
    code: `import { nwc } from "@getalby/sdk"

// Create a NWC client with your connection secret
const client = new nwc.NWCClient({
  nostrWalletConnectUrl: "nostr+walletconnect://...",
})

// Verify the connection
const info = await client.getInfo()
console.log('Connected to:', info.alias)

const balance = await client.getBalance()
console.log('Balance:', Math.floor(balance.balance / 1000), 'sats')

// README links:
// @getalby/sdk: https://github.com/getAlby/js-sdk
// @getalby/lightning-tools: https://github.com/getAlby/lightning-tools`,
  },
  // REPL
  {
    id: "browser-console",
    title: "Using the Browser Console",
    description:
      "Open DevTools (F12 or Cmd+Opt+I) and use the Console tab to interact with wallets",
    code: `// Open browser DevTools: F12 or Cmd+Opt+I (Mac) / Ctrl+Shift+I (Windows)
// Once wallets are connected, they're available as globals:
// alice, bob, charlie, david

// Try these commands after connecting a wallet:
await alice.getBalance()
await alice.getInfo()`,
    category: "repl",
  },
  {
    id: "available-globals",
    title: "Available Globals",
    description: "Quick reference of all globals exposed on the window object",
    code: `// Wallet clients (when connected):
alice, bob, charlie, david

// Lightning tools:
LightningAddress  // Fetch and interact with lightning addresses
Invoice           // Decode BOLT-11 invoices

// Fiat utilities:
getFiatValue({ satoshi: 1000, currency: 'USD' })
getSatoshiValue({ amount: 10, currency: 'USD' })
getFiatBtcRate('USD')

// Namespaced access:
alby.wallets.alice
alby.tools.LightningAddress`,
    category: "repl",
  },

  // Basics
  {
    id: "get-balance",
    title: "Get Wallet Balance",
    description: "Fetch the current balance of a connected wallet",
    code: `const result = await alice.getBalance()
// NWC returns balance in millisatoshis (1 sat = 1000 msats)
const balanceSats = Math.floor(result.balance / 1000)
console.log('Balance:', balanceSats, 'sats')`,
    category: "basics",
  },
  {
    id: "get-info",
    title: "Get Wallet Info",
    description:
      "Get information about the connected wallet and its capabilities",
    code: `const info = await alice.getInfo()
console.log('Alias:', info.alias)
console.log('Network:', info.network)
console.log('Methods:', info.methods)`,
    category: "basics",
  },
  {
    id: "list-transactions",
    title: "List Transactions",
    description: "Get transaction history from the wallet",
    code: `const { transactions } = await alice.listTransactions({
  limit: 10,
  type: 'incoming', // or 'outgoing'
})

transactions.forEach(tx => {
  // amount is in millisatoshis
  const amountSats = Math.floor(tx.amount / 1000)
  console.log(tx.type, amountSats, 'sats', tx.description)
})`,
    category: "basics",
  },

  // Payments
  {
    id: "make-invoice",
    title: "Create Invoice",
    description: "Generate a new lightning invoice to receive payment",
    code: `// NWC uses millisatoshis: 1 sat = 1000 msats
const amountSats = 1000
const invoice = await alice.makeInvoice({
  amount: amountSats * 1000, // convert sats to msats
  description: 'Coffee payment',
  // Optional: expiry in seconds (default: 3600)
  // expiry: 600,
})

console.log('Invoice:', invoice.invoice)
console.log('Payment hash:', invoice.payment_hash)`,
    category: "payments",
  },
  {
    id: "pay-invoice",
    title: "Pay Invoice",
    description: "Pay a BOLT-11 lightning invoice",
    code: `const result = await alice.payInvoice({
  invoice: 'lnbc...', // BOLT-11 invoice string
})

console.log('Preimage:', result.preimage)
// fees_paid is in millisatoshis
const feesSats = Math.floor(result.fees_paid / 1000)
console.log('Fees paid:', feesSats, 'sats')`,
    category: "payments",
  },
  {
    id: "pay-keysend",
    title: "Pay via Keysend",
    description:
      "Send a spontaneous payment without an invoice (requires destination pubkey)",
    code: `// NWC uses millisatoshis: 1 sat = 1000 msats
const amountSats = 1000
const result = await alice.payKeysend({
  amount: amountSats * 1000, // convert sats to msats
  destination: '02...', // node pubkey
  // Optional: custom TLV records
  // tlv_records: [{ type: 5482373484, value: 'hello' }]
})

console.log('Preimage:', result.preimage)`,
    category: "payments",
  },

  // Invoices
  {
    id: "lookup-invoice",
    title: "Lookup Invoice",
    description:
      "Check the status of an invoice by payment hash or invoice string",
    code: `// Lookup by payment hash
const result = await alice.lookupInvoice({
  payment_hash: 'abc123...', // 64-char hex string
})

// Or lookup by invoice
const result2 = await alice.lookupInvoice({
  invoice: 'lnbc...',
})

console.log('Paid:', result.settled_at !== undefined)
// amount is in millisatoshis
const amountSats = Math.floor(result.amount / 1000)
console.log('Amount:', amountSats, 'sats')`,
    category: "invoices",
  },
  {
    id: "decode-invoice",
    title: "Decode Invoice",
    description: "Parse and decode a BOLT-11 invoice to inspect its contents",
    code: `const invoice = new Invoice({ pr: 'lnbc...' })

console.log('Amount:', invoice.satoshi, 'sats')
console.log('Description:', invoice.description)
console.log('Expires:', invoice.expiry, 'seconds')
console.log('Payment hash:', invoice.paymentHash)
console.log('Destination:', invoice.payeePubkey)`,
    category: "invoices",
  },
  {
    id: "validate-preimage",
    title: "Validate Preimage",
    description:
      "Verify that a preimage matches a payment hash (proof of payment)",
    code: `import { Invoice } from "@getalby/lightning-tools/bolt11"

// Decode the invoice
const decodedInvoice = new Invoice({ pr: paymentRequest })

// Validate the preimage against the invoice's payment hash
const isValid = decodedInvoice.validatePreimage(preimage)

if (isValid) {
  console.log('Valid proof of payment!')
  console.log('Amount:', decodedInvoice.satoshi, 'sats')
} else {
  console.log('Invalid preimage')
}`,
    category: "invoices",
  },

  // Lightning Address
  {
    id: "fetch-lightning-address",
    title: "Fetch Lightning Address",
    description: "Lookup a lightning address and get its metadata",
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

console.log('Domain:', ln.domain)
console.log('Username:', ln.username)
console.log('Keysend pubkey:', ln.keysendPubkey)
console.log('Min sendable:', ln.lnurlpData?.minSendable)
console.log('Max sendable:', ln.lnurlpData?.maxSendable)`,
    category: "lightning-address",
  },
  {
    id: "request-invoice-from-address",
    title: "Request Invoice from Address",
    description: "Request a payment invoice from a lightning address",
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

const invoice = await ln.requestInvoice({
  satoshi: 1000,
  comment: 'Thanks for the coffee!', // Optional
})

console.log('Invoice:', invoice.paymentRequest)
console.log('Payment hash:', invoice.paymentHash)

// Now you can pay it:
// await alice.payInvoice({ invoice: invoice.paymentRequest })`,
    category: "lightning-address",
  },
  {
    id: "pay-lightning-address",
    title: "Pay Lightning Address",
    description: "Send a payment directly to a lightning address",
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

// Request invoice and pay in one step
const invoice = await ln.requestInvoice({ satoshi: 1000 })
const result = await alice.payInvoice({ invoice: invoice.paymentRequest })

console.log('Paid! Preimage:', result.preimage)`,
    category: "lightning-address",
  },
  {
    id: "lnurl-verify",
    title: "LNURL-Verify Payment",
    description:
      "Verify payment status using LNURL-verify (if supported by recipient)",
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

// Request invoice (includes verify URL if supported)
const invoice = await ln.requestInvoice({ satoshi: 1000 })

// Check if verify URL is available
if (invoice.verify) {
  console.log('Verify URL:', invoice.verify)
}

// After payment, check if it was settled
const isPaid = await invoice.isPaid()
console.log('Payment settled:', isPaid)

// If paid, preimage is available
if (isPaid && invoice.preimage) {
  console.log('Preimage:', invoice.preimage)
}`,
    category: "lightning-address",
  },

  // Fiat Conversion
  {
    id: "get-fiat-currencies",
    title: "Get Available Currencies",
    description: "Fetch the list of supported fiat currencies for conversion",
    code: `import { getFiatCurrencies } from '@getalby/lightning-tools/fiat'

const currencies = await getFiatCurrencies()

// currencies is an array of { code, name, symbol, priority }
currencies.forEach(currency => {
  console.log(currency.code, currency.name, currency.symbol)
})
// e.g., "USD", "US Dollar", "$"`,
    category: "fiat",
  },
  {
    id: "sats-to-fiat",
    title: "Convert Sats to Fiat",
    description: "Convert a satoshi amount to fiat currency",
    code: `const fiatValue = await getFiatValue({
  satoshi: 10000,
  currency: 'USD', // or 'EUR', 'GBP', etc.
})

console.log('10,000 sats =', fiatValue.toFixed(2), 'USD')`,
    category: "fiat",
  },
  {
    id: "fiat-to-sats",
    title: "Convert Fiat to Sats",
    description: "Convert a fiat amount to satoshis",
    code: `const satoshis = await getSatoshiValue({
  amount: 10, // fiat amount
  currency: 'USD',
})

console.log('$10 =', satoshis, 'sats')`,
    category: "fiat",
  },
  {
    id: "get-btc-rate",
    title: "Get BTC Exchange Rate",
    description: "Fetch the current BTC price in a fiat currency",
    code: `const rate = await getFiatBtcRate('USD')
console.log('1 BTC =', rate.toLocaleString(), 'USD')

// Calculate sat price
const satPrice = rate / 100_000_000
console.log('1 sat =', satPrice.toFixed(8), 'USD')`,
    category: "fiat",
  },

  // Advanced
  {
    id: "subscribe-notifications",
    title: "Subscribe to Notifications",
    description: "Listen for incoming payments and other wallet events",
    code: `// Subscribe to payment notifications
const unsub = await alice.subscribeNotifications(
  (notification) => {
    if (notification.notification_type === 'payment_received') {
      console.log('Payment received!')
      // amount is in millisatoshis
      const amountSats = Math.floor(notification.notification.amount / 1000)
      console.log('Amount:', amountSats, 'sats')
      console.log('Description:', notification.notification.description)
    }
  },
  ['payment_received']
)

// To unsubscribe later:
// unsub()`,
    category: "advanced",
  },
  {
    id: "multi-pay",
    title: "Multi-Pay (Batch Payments)",
    description: "Send multiple payments in a single call",
    code: `const invoices = [
  { invoice: 'lnbc1...', amount: 1000 },
  { invoice: 'lnbc2...', amount: 2000 },
  { invoice: 'lnbc3...', amount: 3000 },
]

const results = await alice.multiPayInvoice({ invoices })

results.forEach((result, i) => {
  if (result.preimage) {
    console.log('Payment', i + 1, 'succeeded')
  } else {
    console.log('Payment', i + 1, 'failed:', result.error)
  }
})`,
    category: "advanced",
  },
  {
    id: "sign-message",
    title: "Sign Message",
    description: "Sign a message with the wallet node key",
    code: `const { signature, message } = await alice.signMessage({
  message: 'Hello, Lightning!',
})

console.log('Signature:', signature)

// The signature can be verified by anyone who knows your node pubkey`,
    category: "advanced",
  },
  {
    id: "hold-invoice",
    title: "Create Hold Invoice",
    description: "Create an invoice that can be settled or cancelled later",
    code: `// Generate preimage and payment hash
const toHexString = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "")

const preimageBytes = crypto.getRandomValues(new Uint8Array(32))
const preimage = toHexString(preimageBytes)

const hashBuffer = await crypto.subtle.digest("SHA-256", preimageBytes)
const paymentHashBytes = new Uint8Array(hashBuffer)
const paymentHash = toHexString(paymentHashBytes)

// Create the hold invoice with the payment hash
const response = await client.makeHoldInvoice({
  amount: 1000 * 1000, // amount in millisats
  description: "Hold invoice example",
  payment_hash: paymentHash,
})

console.log('Invoice:', response.invoice)

// Subscribe to hold invoice accepted notifications
const unsub = await client.subscribeNotifications(
  (notification) => {
    if (notification.notification.payment_hash === paymentHash) {
      console.log('Payment held! Ready to settle or cancel.')
    }
  },
  ["hold_invoice_accepted"]
)`,
    category: "advanced",
  },
  {
    id: "subscribe-hold-notifications",
    title: "Subscribe Hold Invoice",
    description: "Subscribe to accepted payments for HOLD invoices",
    code: `// Subscribe to hold invoice accepted notifications
const unsub = await client.subscribeNotifications(
  (notification) => {
    if (notification.notification.payment_hash === paymentHash) {
      console.log('Payment held! Ready to settle or cancel.')
    }
  },
  ["hold_invoice_accepted"]
)`,
    category: "advanced",
  },
  {
    id: "hold-invoice-settle",
    title: "Settle Hold Invoice",
    description: "Settle a held invoice to receive the payment",
    code: `// Settle the hold invoice using the preimage
// This completes the payment and you receive the funds
await client.settleHoldInvoice({ preimage })

console.log('Invoice settled! Payment received.')`,
    category: "advanced",
  },
  {
    id: "hold-invoice-cancel",
    title: "Cancel Hold Invoice",
    description: "Cancel a held invoice to refund the payer",
    code: `// Cancel the hold invoice using the payment hash
// This refunds the payer's funds
await client.cancelHoldInvoice({ payment_hash: paymentHash })

console.log('Invoice cancelled! Payer refunded.')`,
    category: "advanced",
  },
  {
    id: "wrapped-hold-invoice",
    title: "Wrapped Hold Invoice",
    description:
      "Create a hold invoice using another invoice's payment hash (for non-custodial intermediary patterns)",
    code: `// First, decode another invoice to get its payment hash
const originalInvoice = new Invoice({ pr: 'lnbc...' })
const paymentHash = originalInvoice.paymentHash

// Create a hold invoice with the SAME payment hash
// but a higher amount (original + your fee)
const feeAmount = 100 // sats
const totalAmount = originalInvoice.satoshi + feeAmount

const response = await bob.makeHoldInvoice({
  amount: totalAmount * 1000, // millisats
  description: 'Wrapped invoice',
  payment_hash: paymentHash, // Use the original invoice's hash
})

console.log('Wrapped invoice:', response.invoice)

// When someone pays your wrapped invoice:
// 1. Their payment is HELD (not in your wallet)
// 2. Pay the original invoice to get the preimage
// 3. Use the preimage to settle your held payment
// 4. You keep the fee difference!

// This is non-custodial: you never hold the payer's funds.
// They remain locked in the network until you settle.`,
    category: "advanced",
  },
];

/**
 * Get snippets by their IDs (primary lookup method)
 */
export function getSnippetsById(ids: SnippetId[]): CodeSnippet[] {
  return ids
    .map((id) => CODE_SNIPPETS.find((snippet) => snippet.id === id))
    .filter((snippet): snippet is CodeSnippet => snippet !== undefined);
}

/**
 * Get a single snippet by ID
 */
export function getSnippetById(id: SnippetId): CodeSnippet | undefined {
  return CODE_SNIPPETS.find((snippet) => snippet.id === id);
}

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(
  category: SnippetCategory,
): CodeSnippet[] {
  return CODE_SNIPPETS.filter((snippet) => snippet.category === category);
}
