export type SnippetCategory =
  | 'getting-started'
  | 'basics'
  | 'payments'
  | 'invoices'
  | 'lightning-address'
  | 'fiat'
  | 'advanced';

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  category: SnippetCategory;
}

export const SNIPPET_CATEGORIES: { id: SnippetCategory; label: string; icon: string }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: 'rocket' },
  { id: 'basics', label: 'Basics', icon: 'info' },
  { id: 'payments', label: 'Payments', icon: 'send' },
  { id: 'invoices', label: 'Invoices', icon: 'receipt' },
  { id: 'lightning-address', label: 'Lightning Address', icon: 'at-sign' },
  { id: 'fiat', label: 'Fiat Conversion', icon: 'dollar-sign' },
  { id: 'advanced', label: 'Advanced', icon: 'code' },
];

export const CODE_SNIPPETS: CodeSnippet[] = [
  // Getting Started
  {
    id: 'browser-console',
    title: 'Using the Browser Console',
    description: 'Open DevTools (F12 or Cmd+Opt+I) and use the Console tab to interact with wallets',
    code: `// Open browser DevTools: F12 or Cmd+Opt+I (Mac) / Ctrl+Shift+I (Windows)
// Once wallets are connected, they're available as globals:
// alice, bob, charlie, david

// Try these commands after connecting a wallet:
await alice.getBalance()
await alice.getInfo()`,
    category: 'getting-started',
  },
  {
    id: 'available-globals',
    title: 'Available Globals',
    description: 'Quick reference of all globals exposed on the window object',
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
    category: 'getting-started',
  },

  // Basics
  {
    id: 'get-balance',
    title: 'Get Wallet Balance',
    description: 'Fetch the current balance of a connected wallet',
    code: `const result = await alice.getBalance()
// NWC returns balance in millisatoshis (1 sat = 1000 msats)
const balanceSats = Math.floor(result.balance / 1000)
console.log('Balance:', balanceSats, 'sats')`,
    category: 'basics',
  },
  {
    id: 'get-info',
    title: 'Get Wallet Info',
    description: 'Get information about the connected wallet and its capabilities',
    code: `const info = await alice.getInfo()
console.log('Alias:', info.alias)
console.log('Network:', info.network)
console.log('Methods:', info.methods)`,
    category: 'basics',
  },
  {
    id: 'list-transactions',
    title: 'List Transactions',
    description: 'Get transaction history from the wallet',
    code: `const { transactions } = await alice.listTransactions({
  limit: 10,
  type: 'incoming', // or 'outgoing'
})

transactions.forEach(tx => {
  // amount is in millisatoshis
  const amountSats = Math.floor(tx.amount / 1000)
  console.log(tx.type, amountSats, 'sats', tx.description)
})`,
    category: 'basics',
  },

  // Payments
  {
    id: 'make-invoice',
    title: 'Create Invoice',
    description: 'Generate a new lightning invoice to receive payment',
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
    category: 'payments',
  },
  {
    id: 'pay-invoice',
    title: 'Pay Invoice',
    description: 'Pay a BOLT-11 lightning invoice',
    code: `const result = await alice.payInvoice({
  invoice: 'lnbc...', // BOLT-11 invoice string
})

console.log('Preimage:', result.preimage)
// fees_paid is in millisatoshis
const feesSats = Math.floor(result.fees_paid / 1000)
console.log('Fees paid:', feesSats, 'sats')`,
    category: 'payments',
  },
  {
    id: 'pay-keysend',
    title: 'Pay via Keysend',
    description: 'Send a spontaneous payment without an invoice (requires destination pubkey)',
    code: `// NWC uses millisatoshis: 1 sat = 1000 msats
const amountSats = 1000
const result = await alice.payKeysend({
  amount: amountSats * 1000, // convert sats to msats
  destination: '02...', // node pubkey
  // Optional: custom TLV records
  // tlv_records: [{ type: 5482373484, value: 'hello' }]
})

console.log('Preimage:', result.preimage)`,
    category: 'payments',
  },

  // Invoices
  {
    id: 'lookup-invoice',
    title: 'Lookup Invoice',
    description: 'Check the status of an invoice by payment hash or invoice string',
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
    category: 'invoices',
  },
  {
    id: 'decode-invoice',
    title: 'Decode Invoice',
    description: 'Parse and decode a BOLT-11 invoice to inspect its contents',
    code: `const invoice = new Invoice({ pr: 'lnbc...' })

console.log('Amount:', invoice.satoshi, 'sats')
console.log('Description:', invoice.description)
console.log('Expires:', invoice.expiry, 'seconds')
console.log('Payment hash:', invoice.paymentHash)
console.log('Destination:', invoice.payeePubkey)`,
    category: 'invoices',
  },
  {
    id: 'validate-preimage',
    title: 'Validate Preimage',
    description: 'Verify that a preimage matches a payment hash (proof of payment)',
    code: `// The preimage is proof that a payment was made
// Hash the preimage with SHA-256 and compare to payment_hash

async function validatePreimage(preimage: string, paymentHash: string) {
  const preimageBytes = hexToBytes(preimage)
  const hashBuffer = await crypto.subtle.digest('SHA-256', preimageBytes)
  const computedHash = bytesToHex(new Uint8Array(hashBuffer))
  return computedHash === paymentHash
}

// Helper functions
function hexToBytes(hex: string) {
  return new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
}
function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}`,
    category: 'invoices',
  },

  // Lightning Address
  {
    id: 'fetch-lightning-address',
    title: 'Fetch Lightning Address',
    description: 'Lookup a lightning address and get its metadata',
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

console.log('Domain:', ln.domain)
console.log('Username:', ln.username)
console.log('Keysend pubkey:', ln.keysendPubkey)
console.log('Min sendable:', ln.lnurlpData?.minSendable)
console.log('Max sendable:', ln.lnurlpData?.maxSendable)`,
    category: 'lightning-address',
  },
  {
    id: 'request-invoice-from-address',
    title: 'Request Invoice from Address',
    description: 'Request a payment invoice from a lightning address',
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
    category: 'lightning-address',
  },
  {
    id: 'pay-lightning-address',
    title: 'Pay Lightning Address',
    description: 'Send a payment directly to a lightning address',
    code: `const ln = new LightningAddress('hello@getalby.com')
await ln.fetch()

// Request invoice and pay in one step
const invoice = await ln.requestInvoice({ satoshi: 1000 })
const result = await alice.payInvoice({ invoice: invoice.paymentRequest })

console.log('Paid! Preimage:', result.preimage)`,
    category: 'lightning-address',
  },
  {
    id: 'lnurl-verify',
    title: 'LNURL-Verify Payment',
    description: 'Verify payment status using LNURL-verify (if supported by recipient)',
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
    category: 'lightning-address',
  },

  // Fiat Conversion
  {
    id: 'sats-to-fiat',
    title: 'Convert Sats to Fiat',
    description: 'Convert a satoshi amount to fiat currency',
    code: `const fiatValue = await getFiatValue({
  satoshi: 10000,
  currency: 'USD', // or 'EUR', 'GBP', etc.
})

console.log('10,000 sats =', fiatValue.toFixed(2), 'USD')`,
    category: 'fiat',
  },
  {
    id: 'fiat-to-sats',
    title: 'Convert Fiat to Sats',
    description: 'Convert a fiat amount to satoshis',
    code: `const satoshis = await getSatoshiValue({
  amount: 10, // fiat amount
  currency: 'USD',
})

console.log('$10 =', satoshis, 'sats')`,
    category: 'fiat',
  },
  {
    id: 'get-btc-rate',
    title: 'Get BTC Exchange Rate',
    description: 'Fetch the current BTC price in a fiat currency',
    code: `const rate = await getFiatBtcRate('USD')
console.log('1 BTC =', rate.toLocaleString(), 'USD')

// Calculate sat price
const satPrice = rate / 100_000_000
console.log('1 sat =', satPrice.toFixed(8), 'USD')`,
    category: 'fiat',
  },

  // Advanced
  {
    id: 'subscribe-notifications',
    title: 'Subscribe to Notifications',
    description: 'Listen for incoming payments and other wallet events',
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
  ['payment_received', 'payment_sent']
)

// To unsubscribe later:
// unsub()`,
    category: 'advanced',
  },
  {
    id: 'multi-pay',
    title: 'Multi-Pay (Batch Payments)',
    description: 'Send multiple payments in a single call',
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
    category: 'advanced',
  },
  {
    id: 'sign-message',
    title: 'Sign Message',
    description: 'Sign a message with the wallet node key',
    code: `const { signature, message } = await alice.signMessage({
  message: 'Hello, Lightning!',
})

console.log('Signature:', signature)

// The signature can be verified by anyone who knows your node pubkey`,
    category: 'advanced',
  },
  {
    id: 'hold-invoice',
    title: 'Hold Invoice (Hodl Invoice)',
    description: 'Create an invoice that can be settled or cancelled later',
    code: `// Note: Requires wallet support for NIP-47 hold invoices
const invoice = await alice.makeInvoice({
  amount: 1000,
  description: 'Hold invoice example',
  // Additional params may be needed depending on implementation
})

// Later, when ready to settle:
// await alice.settleHoldInvoice({ preimage: '...' })

// Or to cancel:
// await alice.cancelHoldInvoice({ payment_hash: invoice.payment_hash })`,
    category: 'advanced',
  },
];

/**
 * Get snippets by their IDs (primary lookup method)
 */
export function getSnippetsById(ids: string[]): CodeSnippet[] {
  return ids
    .map((id) => CODE_SNIPPETS.find((snippet) => snippet.id === id))
    .filter((snippet): snippet is CodeSnippet => snippet !== undefined);
}

/**
 * Get a single snippet by ID
 */
export function getSnippetById(id: string): CodeSnippet | undefined {
  return CODE_SNIPPETS.find((snippet) => snippet.id === id);
}

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: SnippetCategory): CodeSnippet[] {
  return CODE_SNIPPETS.filter((snippet) => snippet.category === category);
}
