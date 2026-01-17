# Alby Developer Sandbox - Implementation Plan

Based on the current state (empty Vite React TypeScript app with Shadcn configured) and the design documentation, here's the implementation checklist.

While implementing, if there is something missing from the documentation (CLAUDE.md or docs/), ask if it should be added.

---

## Phase 1: Foundation & Layout

### 1.1 Install Required Shadcn Components

- [ ] Card (for wallet cards)
- [ ] Button
- [ ] Tabs (for visualization tabs)
- [ ] Badge (for status indicators)
- [ ] Input (for connection strings)
- [ ] Alert (for warnings/errors)
- [ ] Sidebar (for scenario navigation)
- [ ] Separator
- [ ] Tooltip
- [ ] Sheet (for mobile drawer)
- [ ] Skeleton (for loading states)

### 1.2 Create App Layout Structure

- [ ] Create `Layout.tsx` - Main app shell with sidebar + content area
- [ ] Create `Sidebar.tsx` - Scenario navigation per `docs/design/sidebar.md`
- [ ] Create `Header.tsx` - App header with title/branding
- [ ] Implement responsive behavior (hamburger menu on mobile)

---

## Phase 2: Wallet System

### 2.1 Wallet Types & State Management

- [ ] Create `types/wallet.ts` - Define Wallet interface (id, name, emoji, balance, connectionString, status)
- [ ] Create `types/scenario.ts` - Define Scenario interface (id, title, description, education, complexity, requiredWallets)
- [ ] Create `types/transaction.ts` - Define Transaction/Event types for logging
- [ ] Create `hooks/useWallets.ts` - Wallet state management with localStorage persistence
- [ ] Create `hooks/useScenario.ts` - Current scenario state management

### 2.2 Wallet Card Components

- [ ] Create `components/WalletCard.tsx` - Individual wallet display per `docs/design/main-ui.md`
  - Connection status indicator
  - Balance display (sats + USD conversion)
  - Action buttons (connect/disconnect)
  - Create Test Wallet button
- [ ] Create `components/WalletGrid.tsx` - Container for 2-4 wallet cards
- [ ] Implement wallet states: disconnected → connecting → connected → error

### 2.3 Wallet Connection Logic (via Alby Agent Skill)

- [ ] Use Alby agent skill to integrate wallet functionality
- [ ] Create `lib/create-test-wallet.ts` - Test wallet creation API call (POST to create instant test wallet from the faucet, and return the connection secret)
- [ ] Implement localStorage persistence (wallet-1, wallet-2, etc.)

---

## Phase 3: Visualization Components

### 3.1 Transaction Log

- [ ] Create `components/visualizations/TransactionLog.tsx`
  - Chronological event list
  - Status icons (pending, success, error)
  - Timestamps
  - From/to wallet indicators
  - Amount and description

### 3.2 Flow Diagram

- [ ] Create `components/visualizations/FlowDiagram.tsx`
  - Step-by-step visual sequence
  - Wallet columns with arrows between them
  - Balance change indicators
  - Message/action labels

### 3.3 Balance Chart

- [ ] Install charting library (recharts recommended for React)
- [ ] Create `components/visualizations/BalanceChart.tsx`
  - Line graph with time on X-axis
  - Multiple lines (one per wallet)
  - Real-time updates as transactions occur

### 3.4 Visualization Container

- [ ] Create `components/VisualizationPanel.tsx`
  - Tabs: Log | Flow Diagram | Balance Chart
  - Default to Log view
  - Shared transaction/event data source

---

## Phase 4: Scenario System

### 4.1 Scenario Data

- [ ] Create `data/scenarios.ts` - Define all scenarios with metadata
  - Simple Invoice Payment (simplest)
  - Lightning Address (simple)
  - Notifications (medium)
  - Hold Invoice (medium)
  - Proof of Payment (medium)
  - Transaction History (medium)
  - Nostr Zap (advanced)
  - Fiat Conversion (advanced)
- [ ] Create `components/ScenarioInfo.tsx` - Display scenario education content

### 4.2 Scenario Execution Engine

- [ ] Create `hooks/useScenarioRunner.ts` - Orchestrates scenario steps
- [ ] Create `lib/scenario-executor.ts` - Executes individual scenario actions
- [ ] Implement event emitter for real-time visualization updates

---

## Phase 5: Implement Core Scenarios

### 5.1 Simple Invoice Payment (per `docs/scenarios/simple-payment.md`)

- [ ] Implement Bob creates invoice flow
- [ ] Implement Alice pays invoice flow
- [ ] Wire up all visualizations

### 5.2 Lightning Address (per `docs/scenarios/lightning-address.md`)

- [ ] Implement Lightning Address lookup
- [ ] Implement payment to address
- [ ] Add educational content about addresses

---

## Phase 6: NWC Integration (via Alby Skill)

### 6.1 Core NWC Operations

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
- [ ] Add toast notifications for actions

### 7.2 Educational Enhancements

- [ ] Add tooltips explaining NWC concepts
- [ ] Add "Learn More" links to Alby documentation
- [ ] Display code snippets showing how each operation works

### 7.3 Final Touches

- [ ] Dark mode toggle (theme already supports it)
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Accessibility review (keyboard navigation, screen readers)

---

## Suggested Implementation Order

1. **Week 1**: Phases 1-2 (Layout + Wallet System)
2. **Week 2**: Phase 3 (Visualizations)
3. **Week 3**: Phases 4-5 (Scenarios)
4. **Week 4**: Phases 6-7 (NWC Integration + Polish)

---

## Key Technical Decisions

```
| Decision | Recommendation |
|----------|----------------|
| State Management | Zustand (lightweight, simple API) |
| Charting | Recharts (via Shadcn) (React-native, good for line charts) |
| Flow Diagrams | Custom SVG or react-flow-renderer |
| NWC Library | Use Alby skill guidance for implementation |
| Persistence | localStorage for wallet configs |
| Styling | Tailwind + Shadcn (already configured) |
```
