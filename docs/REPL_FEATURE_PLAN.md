# Plan: Hybrid REPL / Code Snippets Feature

## Overview

Add a hybrid REPL feature that:

1. **Window Globals**: Expose wallet clients (`alice`, `bob`, `charlie`, `david`) and Lightning tools on `window` for browser console use
2. **Code Snippets Tab**: New visualization tab with categorized, copy-paste code examples
3. **Contextual Snippets**: Show relevant code snippets on Transaction Log and Flow Diagram items (expandable)

---

## Part 1: Window Globals

### 1.1 TypeScript Window Declarations

**Create**: `src/types/global.d.ts`

Extend the `Window` interface to include:

- Wallet clients: `alice`, `bob`, `charlie`, `david` (optional, when connected)
- Lightning tools: `LightningAddress`, `Invoice`
- Fiat utilities: `getFiatValue`, `getSatoshiValue`, `getFiatBtcRate`, `getFiatCurrencies`
- Namespaced object: `alby.wallets.*` and `alby.tools.*`

### 1.2 Dev Console Hook

**Create**: `src/hooks/use-dev-console.ts`

Hook responsibilities:

- On mount: Expose Lightning tools to `window` and log helpful console message
- When wallet connects: Add client to `window[walletId]` and `window.alby.wallets[walletId]`
- When wallet disconnects: Remove from window
- On unmount: Clean up all globals

### 1.3 Integration

**Modify**: `src/App.tsx`

- Import and call `useDevConsole()` hook

---

## Part 2: Code Snippets Data

### 2.1 Snippets Data File

**Create**: `src/data/code-snippets.ts`

Data structure:

```typescript
export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  category: SnippetCategory;
  // For linking to transaction/flow step types
  relatedTransactionTypes?: TransactionType[];
}

export type SnippetCategory =
  | 'getting-started'  // How to use browser console
  | 'basics'
  | 'payments'
  | 'invoices'
  | 'lightning-address'
  | 'fiat'
  | 'advanced';

export const SNIPPET_CATEGORIES = [...];
export const CODE_SNIPPETS: CodeSnippet[] = [...];

// Helper to get snippets by transaction type
export function getSnippetsForTransactionType(type: TransactionType): CodeSnippet[];
```

### 2.2 Snippet Categories

1. **Getting Started**
   - "How to Use Browser Console" - Instructions on opening DevTools and using globals
   - "Available Globals" - Quick reference of what's exposed

2. **Basics** - `getBalance()`, `getInfo()`, `listTransactions()`

3. **Payments** - `makeInvoice()`, `payInvoice()`, `payKeysend()`

4. **Invoices** - `lookupInvoice()`, `new Invoice()` (decode), `validatePreimage()`

5. **Lightning Address** - `LightningAddress.fetch()`, `requestInvoice()`

6. **Fiat Conversion** - `getFiatValue()`, `getSatoshiValue()`, `getFiatBtcRate()`

7. **Advanced** - Hold invoices, notifications, multi-pay, sign message

### 2.3 Transaction Type Mapping

Map snippets to `TransactionType` for contextual display:

| TransactionType    | Related Snippets                |
| ------------------ | ------------------------------- |
| `invoice_created`  | makeInvoice, decode invoice     |
| `invoice_paid`     | lookupInvoice, validatePreimage |
| `payment_sent`     | payInvoice                      |
| `payment_received` | subscribeNotifications          |
| `balance_updated`  | getBalance                      |

---

## Part 3: Code Snippets Tab

### 3.1 Component

**Create**: `src/components/visualizations/code-snippets.tsx`

Layout:

- Left sidebar with category buttons (icons + labels)
- Main content area with snippet cards
- Each card: title, description, code block (monospace), copy button

Features:

- Category filtering via sidebar
- Copy-to-clipboard with visual feedback
- Syntax styling via monospace + subtle background

### 3.2 Register Tab

**Modify**: `src/components/visualizations/index.ts`

- Export `CodeSnippets`

**Modify**: `src/components/visualization-panel.tsx`

- Import `Code2` icon from lucide-react
- Import `CodeSnippets` component
- Add new `TabsTrigger` with value "snippets"
- Add corresponding `TabsContent`

---

## Part 4: Contextual Snippets on Transaction Log

### 4.1 Expandable Snippet Component

**Create**: `src/components/ui/expandable-snippet.tsx`

A collapsible component that shows:

- Collapsed: Small code icon or "View code" link
- Expanded: Code block with copy button

### 4.2 Update Transaction Log

**Modify**: `src/components/visualizations/transaction-log.tsx`

Changes to `TransactionRow`:

- Import `getSnippetsForTransactionType` from data
- Look up relevant snippets based on `transaction.type`
- If snippets exist, show expandable snippet section below the row
- Use `Collapsible` from Shadcn or simple state toggle

UI when expanded:

```
[Check] 14:32:15  Alice → Bob  1000 sats  Invoice created
        ↳ [Code]  makeInvoice({ amount: 1000 * 1000, description: '...' })  [Copy]
```

---

## Part 5: Contextual Snippets on Flow Diagram

### 5.1 Update FlowStep Type

**Modify**: `src/types/transaction.ts`

Add optional field to `FlowStep`:

```typescript
export interface FlowStep {
  // ... existing fields
  operationType?: 'makeInvoice' | 'payInvoice' | 'lookupInvoice' | ...;
}
```

### 5.2 Update Flow Diagram

**Modify**: `src/components/visualizations/flow-diagram.tsx`

Changes to `FlowStepRow`:

- Add expandable section below each step
- When expanded, show relevant code snippet based on `step.operationType` or `step.label`
- Include copy button

UI:

```
┌─────────────────────────────────────┐
│ 1  Alice → Bob  Creates Invoice ✓  │
│    ▼ Show Code                     │
└─────────────────────────────────────┘
   ┌─────────────────────────────────┐
   │ await alice.makeInvoice({...}) │  [Copy]
   └─────────────────────────────────┘
```

---

## Files Summary

### Create

| File                                              | Purpose                               |
| ------------------------------------------------- | ------------------------------------- |
| `src/types/global.d.ts`                           | TypeScript window interface extension |
| `src/hooks/use-dev-console.ts`                    | Hook to expose globals on window      |
| `src/data/code-snippets.ts`                       | All snippets data + helpers           |
| `src/components/visualizations/code-snippets.tsx` | Code Snippets tab                     |
| `src/components/ui/expandable-snippet.tsx`        | Reusable expandable code block        |

### Modify

| File                                                | Change                           |
| --------------------------------------------------- | -------------------------------- |
| `src/App.tsx`                                       | Call `useDevConsole()`           |
| `src/components/visualizations/index.ts`            | Export `CodeSnippets`            |
| `src/components/visualization-panel.tsx`            | Add new tab                      |
| `src/components/visualizations/transaction-log.tsx` | Add expandable snippets to rows  |
| `src/components/visualizations/flow-diagram.tsx`    | Add expandable snippets to steps |
| `src/types/transaction.ts`                          | Add `operationType` to FlowStep  |

---

## Verification

1. **Window Globals**:
   - Open browser DevTools console
   - Verify console shows "Lightning tools available" message on load
   - Connect Alice wallet
   - Verify `window.alice` is defined
   - Run `await alice.getBalance()` - should return balance
   - Verify `LightningAddress`, `getFiatValue`, etc. are available

2. **Code Snippets Tab**:
   - Click "Code Snippets" tab in visualization panel
   - Verify "Getting Started" category explains browser console usage
   - Click each category, verify snippets display
   - Click "Copy" on a snippet, paste in console, verify it runs

3. **Transaction Log Snippets**:
   - Run a scenario (e.g., Simple Payment)
   - In Transaction Log, find an "invoice_created" entry
   - Click expand/code icon
   - Verify relevant `makeInvoice` snippet shows
   - Verify copy button works

4. **Flow Diagram Snippets**:
   - Run a scenario
   - In Flow Diagram, click a step to expand
   - Verify relevant code snippet shows with copy button

---

## Code Snippets Reference

### Getting Started

#### How to Use Browser Console

```javascript
// Open your browser's Developer Tools:
// - Chrome/Edge: Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
// - Firefox: Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
// - Safari: Press Cmd+Option+I (enable in Preferences > Advanced first)

// Go to the "Console" tab

// When wallets are connected, they're available as globals:
// alice, bob, charlie, david

// Lightning tools are also available:
// LightningAddress, Invoice, getFiatValue, getSatoshiValue, getFiatBtcRate
```

#### Available Globals

```javascript
// Wallet clients (when connected)
alice; // NWCClient for Alice's wallet
bob; // NWCClient for Bob's wallet
charlie; // NWCClient for Charlie's wallet
david; // NWCClient for David's wallet

// Lightning tools
LightningAddress; // Fetch/pay lightning addresses
Invoice; // Decode BOLT-11 invoices

// Fiat conversion
getFiatValue; // Convert sats to fiat
getSatoshiValue; // Convert fiat to sats
getFiatBtcRate; // Get BTC exchange rate
getFiatCurrencies; // List supported currencies

// Namespaced alternative
alby.wallets.alice;
alby.tools.LightningAddress;
```

### Basics

#### Get Wallet Balance

```javascript
// Get Alice's wallet balance
const { balance } = await alice.getBalance();
console.log("Balance:", balance / 1000, "sats");
// balance is in millisatoshis (1 sat = 1000 msats)
```

#### Get Wallet Info

```javascript
// Get wallet node information
const info = await alice.getInfo();
console.log("Alias:", info.alias);
console.log("Network:", info.network);
console.log("Lightning Address:", info.lud16);
console.log("Supported methods:", info.methods);
```

#### List Transactions

```javascript
// List last 10 transactions
const { transactions } = await alice.listTransactions({
  limit: 10,
});
transactions.forEach((tx) => {
  const sats = tx.amount / 1000;
  console.log(`${tx.type}: ${sats} sats - ${tx.description}`);
});
```

### Payments

#### Create Invoice

```javascript
// Create a 1000 sat invoice
const invoice = await alice.makeInvoice({
  amount: 1000 * 1000, // millisats
  description: "Test payment",
  expiry: 3600, // optional: 1 hour
});
console.log("Invoice:", invoice.invoice);
console.log("Payment hash:", invoice.payment_hash);
```

#### Pay Invoice

```javascript
// Pay an invoice with Bob's wallet
const invoice = "lnbc10u1p..."; // paste invoice here
const result = await bob.payInvoice({ invoice });
console.log("Payment preimage:", result.preimage);
console.log("Fees paid:", result.fees_paid / 1000, "sats");
```

#### Keysend Payment

```javascript
// Send sats directly without an invoice (keysend)
const result = await alice.payKeysend({
  amount: 1000 * 1000, // millisats
  pubkey: "02...destination_node_pubkey",
});
console.log("Preimage:", result.preimage);
```

### Invoices

#### Lookup Invoice Status

```javascript
// Check if an invoice has been paid
const tx = await alice.lookupInvoice({
  payment_hash: "abc123...", // or use invoice string
});
console.log("State:", tx.state);
// States: 'pending', 'settled', 'failed', 'accepted'
if (tx.settled_at) {
  console.log("Paid at:", new Date(tx.settled_at * 1000));
}
```

#### Decode BOLT-11 Invoice

```javascript
// Parse invoice details without paying
const decoded = new Invoice({ pr: "lnbc10u1p..." });
console.log("Amount:", decoded.satoshi, "sats");
console.log("Description:", decoded.description);
console.log("Expires:", decoded.expiryDate);
console.log("Payment hash:", decoded.paymentHash);
console.log("Has expired?", decoded.hasExpired());
```

#### Verify Payment Preimage

```javascript
// Verify proof of payment
const invoice = new Invoice({ pr: "lnbc10u1p..." });
const preimage = "abc123..."; // from payInvoice result
const isValid = invoice.validatePreimage(preimage);
console.log("Valid proof of payment:", isValid);
```

### Lightning Address

#### Fetch Lightning Address Info

```javascript
// Lookup a lightning address
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();
console.log("Min sendable:", ln.lnurlpData.min / 1000, "sats");
console.log("Max sendable:", ln.lnurlpData.max / 1000, "sats");
console.log("Description:", ln.lnurlpData.description);
console.log("Allows comments:", !!ln.lnurlpData.commentAllowed);
```

#### Request Invoice from Lightning Address

```javascript
// Get an invoice to pay a lightning address
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();
const invoice = await ln.requestInvoice({
  satoshi: 1000,
  comment: "Hello from the sandbox!",
});
console.log("Invoice:", invoice.paymentRequest);
// Pay it:
await bob.payInvoice({ invoice: invoice.paymentRequest });
```

#### Check Payment via LNURL-verify

```javascript
// Verify payment using LNURL-verify (if supported)
const ln = new LightningAddress("hello@getalby.com");
await ln.fetch();
const invoice = await ln.requestInvoice({ satoshi: 100 });
// ... after payment ...
const isPaid = await invoice.isPaid();
console.log("Invoice paid:", isPaid);
```

### Fiat Conversion

#### Convert Sats to Fiat

```javascript
// Get USD value of sats
const usd = await getFiatValue({
  satoshi: 100000,
  currency: "USD",
});
console.log("100,000 sats =", usd.toFixed(2), "USD");
```

#### Convert Fiat to Sats

```javascript
// Calculate sats for a fiat amount
const sats = await getSatoshiValue({
  amount: 10,
  currency: "USD",
});
console.log("$10 USD =", Math.round(sats), "sats");
```

#### Get BTC Exchange Rate

```javascript
// Get current BTC price
const usdRate = await getFiatBtcRate("USD");
console.log("1 BTC =", usdRate.toLocaleString(), "USD");

const eurRate = await getFiatBtcRate("EUR");
console.log("1 BTC =", eurRate.toLocaleString(), "EUR");
```

#### List Supported Currencies

```javascript
// Get all available fiat currencies
const currencies = await getFiatCurrencies();
currencies.slice(0, 5).forEach((c) => {
  console.log(`${c.code} - ${c.name} (${c.symbol})`);
});
// Output: USD - US Dollar ($), EUR - Euro (€), etc.
```

### Advanced

#### Create Hold Invoice

```javascript
// Generate preimage and payment hash
const preimageBytes = crypto.getRandomValues(new Uint8Array(32));
const preimage = Array.from(preimageBytes)
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
const hashBuffer = await crypto.subtle.digest("SHA-256", preimageBytes);
const paymentHash = Array.from(new Uint8Array(hashBuffer))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

// Create hold invoice
const invoice = await alice.makeHoldInvoice({
  amount: 1000 * 1000, // millisats
  description: "Conditional payment",
  payment_hash: paymentHash,
});
console.log("Invoice:", invoice.invoice);
console.log("Save this preimage:", preimage);
```

#### Settle Hold Invoice

```javascript
// Release the payment (accept)
await alice.settleHoldInvoice({
  preimage: "abc123...", // your saved preimage
});
console.log("Payment settled!");
```

#### Cancel Hold Invoice

```javascript
// Reject/refund the payment
await alice.cancelHoldInvoice({
  payment_hash: "def456...",
});
console.log("Payment cancelled, funds returned to sender");
```

#### Subscribe to Incoming Payments

```javascript
// Listen for incoming payments
const unsub = await alice.subscribeNotifications(
  (notification) => {
    if (notification.notification_type === "payment_received") {
      const tx = notification.notification;
      console.log("Received:", tx.amount / 1000, "sats");
      console.log("Description:", tx.description);
    }
  },
  ["payment_received"],
);

// Later, stop listening:
// unsub();
```

#### Subscribe to All Payment Events

```javascript
// Listen for all payment activity
const unsub = await alice.subscribeNotifications((n) => {
  switch (n.notification_type) {
    case "payment_received":
      console.log("Received:", n.notification.amount / 1000, "sats");
      break;
    case "payment_sent":
      console.log("Sent:", n.notification.amount / 1000, "sats");
      break;
    case "hold_invoice_accepted":
      console.log("Hold invoice accepted!");
      break;
  }
});
```

### Feedback

- [x] need "?" button
- [x] Add a close button on the flow diagram similar to the transaction log.
- [x] expandable snippet should have a code icon on the flow diagram entry. When expanding the flow diagram entry to show the code snippet, the expanded section should be a fixed width and have a close icon on the top right.
- [x] colors in console are hard to read
- [x] the code snippets mention sats when NWC uses millisats
- [x] Converted 10,000 sats to 8.99 USD shows the wrong code snippet (it shows "Get wallet balance")
- [x] LNURL-Verify verify payment status shows the wrong code snippet (it shows "Create Invoice")
- [x] Payment to lightning address (e.g. in Notifications scenario) only shows a "Pay Invoice" snippet. It should also show the snippet for fetching an invoice from a lightning address (show multiple snippets)
- [x] Notifications scenario "start listening" shows the wrong code snippet (it shows "Create Invoice", should be "Subscribe to Notifications")
- [x] there is a problem that it's guessing what code snippets to use. Remove "OperationType" and pass a list of snippet IDs instead for new transaction log and flow diagram entries. This way we have full control.
- [x] some scenarios are not adding code snippets to the transaction log: lookup-invoice, lightning-address, decode-bolt11-invoice, proof-of-payment, payment-forwarding, hold-invoice, payment-prisms.
- [x] fiat conversion scenario is not showing that it fetched the list of currencies in the transaction log
- [x] "Bob received 100 sats via notification" is not showing the code example (should be "Subscribe to Notifications")
- [x] snippet IDs should not be considered a string, use proper type checking so that only real snippet ids can be used
- [x] some example snippets are missing from the Code Snippets tab. For example, getting a list of fiat currencies.

---

- [ ] add a ? button on the flow diagram code snippet
- [ ] validate preimage snippet is not using the alby agent skill (please read it to use the correct code)
- [ ] in the "payment-forwarding" scenario transaction log, "Charlie received 10 sats" is not showing the code example (should be "Subscribe to Notifications")
- [ ] HOLD invoice code snippet is incorrect (creating the invoice, and subscribing to notifications for accepted payments, cancelling hold invoice, settling hold invoice). Check the alby agent skill.
- [ ] Wrong code snippet for "Prism split: Charlie 5 sats, David 10 sats, kept 85 sats" - should be pay to lightning address
- [ ] payment-prisms: "Charlie received 5 sats" is showing 2 times, the second without a code example. Remove the second one. Also in the flow diagram the notifications for charlie and david are buggy. It shows 3 entries for charlie to receive 1 payment (+5 sats, Charlie received 5 sats, +5 sats), and 2 duplicated entries for David (+10 sats).
