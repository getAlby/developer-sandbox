# Alby Developer Sandbox - Implementation Plan

Based on the current state (empty Vite React TypeScript app with Shadcn configured) and the design documentation, here's the implementation checklist.

While implementing, if there is something missing from the documentation (CLAUDE.md or docs/), ask if it should be added.

---

## Phase 1: Foundation & Layout

### 1.1 Install Required Shadcn Components

- [x] Card (for wallet cards)
- [x] Button
- [x] Tabs (for visualization tabs)
- [x] Badge (for status indicators)
- [x] Input (for connection strings)
- [x] Alert (for warnings/errors)
- [x] Sidebar (for scenario navigation)
- [x] Separator
- [x] Tooltip
- [x] Sheet (for mobile drawer)
- [x] Skeleton (for loading states)
- [x] Chart (for balance visualization)

### 1.2 Create App Layout Structure

- [x] Create `Layout.tsx` - Main app shell with sidebar + content area
- [x] Create `app-sidebar.tsx` - Scenario navigation per `docs/design/sidebar.md`
- [x] Implement responsive behavior (hamburger menu on mobile via Shadcn Sidebar)

---

## Phase 2: Wallet System

### 2.1 Wallet Types & State Management

- [x] Create `types/wallet.ts` - Define Wallet interface (id, name, emoji, balance, connectionString, status)
- [x] Create `types/scenario.ts` - Define Scenario interface (id, title, description, education, complexity, requiredWallets)
- [x] Create `types/transaction.ts` - Define Transaction/Event types for logging
- [x] Create `stores/wallet-store.ts` - Zustand wallet state management with localStorage persistence
- [x] Create `stores/scenario-store.ts` - Current scenario state management
- [x] Create `stores/transaction-store.ts` - Transaction and visualization state

### 2.2 Wallet Card Components

- [x] Create `components/wallet-card.tsx` - Individual wallet display per `docs/design/main-ui.md`
  - [x] Connection status indicator (badge)
  - [x] Balance display (sats + USD conversion)
  - [x] Action buttons (connect/disconnect)
  - [x] Create Test Wallet button
- [x] Create `components/wallet-grid.tsx` - Container for 2-4 wallet cards
- [x] Implement wallet states: disconnected → connecting → connected → error

### 2.3 Wallet Connection Logic (via Alby Agent Skill)

- [x] Basic test wallet creation via faucet API (POST to `https://nwc.getalby.com/api/v1/faucet`)
- [ ] Use Alby agent skill to integrate full NWC wallet functionality
- [ ] Implement actual NWC connection and balance fetching
- [x] Implement localStorage persistence for wallet configs

---

## Phase 3: Visualization Components

### 3.1 Transaction Log

- [x] Create `components/visualizations/transaction-log.tsx`
  - [x] Chronological event list
  - [x] Status icons (pending, success, error)
  - [x] Timestamps
  - [x] From/to wallet indicators
  - [x] Amount and description
  - [x] Clear button

### 3.2 Flow Diagram

- [x] Create `components/visualizations/flow-diagram.tsx`
  - [x] Step-by-step visual sequence
  - [x] Wallet avatars with names and balances
  - [x] Numbered flow steps with labels
  - [x] Status indicators per step

### 3.3 Balance Chart

- [x] Using Shadcn Chart component (Recharts-based)
- [x] Create `components/visualizations/balance-chart.tsx`
  - [x] Line graph with transactions on X-axis
  - [x] Multiple lines (one per wallet, color-coded)
  - [x] Tooltip and legend

### 3.4 Visualization Container

- [x] Create `components/visualization-panel.tsx`
  - [x] Tabs: Log | Flow Diagram | Balance Chart
  - [x] Default to Log view
  - [x] Shared transaction/event data source via Zustand store

---

## Phase 4: Scenario System

### 4.1 Scenario Data

- [x] Create `data/scenarios.ts` - Define all scenarios with metadata
  - [x] Simple Invoice Payment (simplest)
  - [x] Lightning Address (simple)
  - [x] Notifications (medium)
  - [x] Hold Invoice (medium)
  - [x] Proof of Payment (medium)
  - [x] Transaction History (medium)
  - [x] Nostr Zap (advanced)
  - [x] Fiat Conversion (advanced)
- [x] Create `components/scenario-info.tsx` - Display scenario education content

### 4.2 Scenario Execution Engine

- [ ] Create `hooks/useScenarioRunner.ts` - Orchestrates scenario steps
- [ ] Create `lib/scenario-executor.ts` - Executes individual scenario actions
- [ ] Implement event emitter for real-time visualization updates

---

## Phase 5: Implement Core Scenarios

### 5.1 Simple Invoice Payment (per `docs/scenarios/simple-payment.md`)

- [ ] Create scenario-specific UI panel for Bob (amount input, description, create invoice button)
- [ ] Create scenario-specific UI panel for Alice (invoice input, pay button)
- [ ] Implement Bob creates invoice flow (NWC `make_invoice`)
- [ ] Implement Alice pays invoice flow (NWC `pay_invoice`)
- [ ] Wire up all visualizations with real transaction data

### 5.2 Lightning Address (per `docs/scenarios/lightning-address.md`)

- [ ] Implement Lightning Address lookup (LNURL-pay)
- [ ] Implement payment to address
- [ ] Add educational content about addresses

---

## Phase 6: NWC Integration (via Alby Skill)

### 6.1 Core NWC Operations

- [ ] Create `lib/nwc-client.ts` - NWC client wrapper
- [ ] Implement `make_invoice` - Create BOLT-11 invoice
- [ ] Implement `pay_invoice` - Pay a BOLT-11 invoice
- [ ] Implement `get_balance` - Fetch wallet balance
- [ ] Implement `lookup_invoice` - Check invoice status
- [ ] Implement `list_transactions` - Get transaction history

### 6.2 Real-time Updates

- [ ] Implement NWC notification subscriptions
- [ ] Update visualizations on payment events
- [ ] Handle connection drops gracefully

---

## Phase 7: Polish & UX

### 7.1 Loading & Error States

- [ ] Add skeleton loaders during wallet connection
- [ ] Implement error boundaries
- [ ] Add toast notifications for actions (install Shadcn Sonner)

### 7.2 Educational Enhancements

- [ ] Add tooltips explaining NWC concepts
- [ ] Add "Learn More" links to Alby documentation
- [ ] Display code snippets showing how each operation works

### 7.3 Final Touches

- [ ] Dark mode toggle (theme already supports it)
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Accessibility review (keyboard navigation, screen readers)

## Phase 8: Github Pages

- [ ] Make necessary changes so the app is automatically deployed. The repository name is developer-sandbox and the organization is getAlby.

---

## Progress Summary

| Phase                             | Status                                          |
| --------------------------------- | ----------------------------------------------- |
| Phase 1: Foundation & Layout      | ✅ Complete                                     |
| Phase 2: Wallet System            | 🟡 UI complete, NWC integration pending         |
| Phase 3: Visualization Components | ✅ Complete                                     |
| Phase 4: Scenario System          | 🟡 Data & UI complete, execution engine pending |
| Phase 5: Core Scenarios           | ⬜ Not started                                  |
| Phase 6: NWC Integration          | ⬜ Not started                                  |
| Phase 7: Polish & UX              | ⬜ Not started                                  |
| Phase 8: Github Pages             | ⬜ Not started                                  |

---

## Key Technical Decisions

| Decision         | Recommendation                             |
| ---------------- | ------------------------------------------ |
| Package Manager  | Yarn (npx for shadcn CLI)                  |
| State Management | Zustand (lightweight, simple API)          |
| Charting         | Shadcn Chart (Recharts wrapper)            |
| Flow Diagrams    | Custom React component                     |
| NWC Library      | Use Alby skill guidance for implementation |
| Persistence      | localStorage for wallet configs            |
| Styling          | Tailwind + Shadcn (already configured)     |

---

## File Structure (Current)

```
src/
├── App.tsx                          # Main app component
├── main.tsx                         # Entry point
├── index.css                        # Global styles + Tailwind
├── components/
│   ├── app-sidebar.tsx              # Scenario navigation sidebar
│   ├── layout.tsx                   # Main layout shell
│   ├── scenario-info.tsx            # Scenario title, description, education
│   ├── visualization-panel.tsx      # Tabbed visualization container
│   ├── wallet-card.tsx              # Individual wallet card
│   ├── wallet-grid.tsx              # Grid of wallet cards
│   ├── ui/                          # Shadcn UI components
│   └── visualizations/
│       ├── balance-chart.tsx        # Line chart
│       ├── flow-diagram.tsx         # Step sequence diagram
│       ├── transaction-log.tsx      # Event log
│       └── index.ts
├── data/
│   └── scenarios.ts                 # Scenario definitions
├── hooks/
│   └── use-mobile.ts                # Mobile detection (Shadcn)
├── lib/
│   └── utils.ts                     # Utility functions (cn helper)
├── stores/
│   ├── index.ts
│   ├── scenario-store.ts            # Current scenario state
│   ├── transaction-store.ts         # Transaction/flow/balance state
│   └── wallet-store.ts              # Wallet state with persistence
└── types/
    ├── index.ts
    ├── scenario.ts                  # Scenario type definitions
    ├── transaction.ts               # Transaction/FlowStep types
    └── wallet.ts                    # Wallet type definitions
```
