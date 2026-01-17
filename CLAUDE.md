# Alby Developer Sandbox - Development Guide

## Project Overview

Educational Lightning Network payment demo application. Allows users to try scenarios that simulate
Lightning payments between wallets and learn about usecases supported by Alby
development tools and NWC wallets such as Alby Hub. Helps developers explore
and understand Lightning payment flows and capabilities.

## Architecture

- Package Manager: Yarn
- Frontend: React + TypeScript
- UI Components: Shadcn
- Lightning: Nostr Wallet Connect (NWC) protocol
- Visualization: Multiple tabs (Log, Flow Diagram, Balance Chart, Network Graph)
- MCP: Shadcn MCP installed (for UI development assistance)
- Skills: Alby Agent skill installed (for wallet functionality implementation)

## Current UI/UX Requirements

### Wallet System

- Each scenario determines the number of wallets required
- Display as cards showing balance, connection status
- Wallets: Alice 👩, Bob 👨‍🦱, Charlie 👨‍🦰, David 👱‍♂️ (as needed per scenario)

Instant test wallets can be created with a single command (as per the Alby skill - here should be a single button that the user can do which will do a FETCH POST call to create the wallet).

Wallets are saved to local storage under key wallet-N (wallet-1, etc).

### Visualization Tabs (bottom half of screen)

1. **Transaction Log** - Chronological list of events
2. **Flow Diagram** - Step-by-step visual sequence of payment interactions
3. **Balance Chart** - Line graph showing balance changes over time
4. **Network Graph** - Topology view of wallet connections and payment paths

Visualization should update in real-time.

### Design Goals

- Fast demo starts
- Multiple learning modalities (visual, textual, graph-based)
- Support scenarios with 2-4 wallets
- Clear educational flow
- Scenarios should be sorted from simplest to most complicated
- Showcase Alby development capabilities

## Key Components

- WalletCard: Individual wallet display with status
- TransactionLog: Event timeline
- FlowDiagram: Sequential interaction visualizer
- BalanceChart: Historical balance tracking

## Development Notes

- Prioritize user experience speed over configurability initially
- Keep UI clean and educational-focused
- Ensure all visualizations update in real-time as transactions occur
- Leverage Shadcn MCP for UI component development
- Use Alby Agent skill for wallet integration guidance

## Scenarios

Each scenario has a title, description, education (content for the user to be displayed), and complexity. More complex scenarios should be lower in the list.

## User Flow

When user first opens app they will be presented with the first scenario.

Before they can execute the scenario they must connect the wallets required by the scenario.

## Referenced documentation

- Read the [design docs folder](./docs/design/) when working on the design
- Read the [scenarios docs folder](./docs/scenarios/) when working on payment scenarios
