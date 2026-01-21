Title: Simple Invoice Payment
Description: Alice creates a BOLT-11 invoice, Bob pays it. Alice can look up the status of the invoice at any time.
Complexity: Simple

## Flow

Initial state

```txt
│  👤 Bob              │  👤 Alice                           │
│                                 │                                            │
│  BOLT-11 Invoice                │  Amount (sats)                             │
│  ┌──────────────────────────┐  │  ┌──────────────────────────────────────┐ │
│  │ lnbc...                  │  │  │ 1000                                 │ │
│  └──────────────────────────┘  │  └──────────────────────────────────────┘ │
│                                 │                                            │
│  [Pay Invoice]                  │  Description (optional)                    │
│                                 │  ┌──────────────────────────────────────┐ │
│                                 │  │ What's this payment for?             │ │
│                                 │  └──────────────────────────────────────┘ │
│                                 │                                            │
│                                 │  [Create Invoice]                          │
│                                 │                                            │
```

Lookup Invoice

```txt
│  👤 Bob              │  👤 Alice                           │
│                                 │                                            │
│  BOLT-11 Invoice                │                                          │
│  ┌──────────────────────────┐  │                                          │
│  │ lnbc...                  │  │                                          │
│  └──────────────────────────┘  │                                          │
│                                 │                                            │
│  [Pay Invoice]                  │  Invoice                    │
│                                 │  ┌──────────────────────────────────────┐ │
│                                 │  │ lnbc....             │ │
│                                 │  └──────────────────────────────────────┘ │
│                                 │                                            │
│                                 │  [Lookup Invoice]                          │
│                                 │                                            │
│                                 │                                            │
│                                 │    Paid/Pending                           │
```
