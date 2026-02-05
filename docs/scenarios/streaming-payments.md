# Streaming Payments Scenario

## Overview

Streaming payments enable continuous micropayments while consuming content. Users pay sats-per-minute as they listen to podcasts, watch videos, or consume other content. Payments automatically start when play begins and stop when paused.

## Concept

Traditional content monetization requires upfront payment for entire albums, subscriptions, or pay-per-view. Streaming payments flip this model - you only pay for what you actually consume. This **Value4Value** model is revolutionizing podcasting (Podcasting 2.0) and content creation.

## How It Works

1. **Alice (Consumer)** presses play on Bob's podcast episode
2. **Streaming Begins**: Small payments are automatically sent every 10 seconds
3. **Rate Calculation**: If Alice sets 100 sats/minute, she pays ~16-17 sats every 10 seconds
4. **Pause/Resume**: When Alice pauses, payments immediately stop. Resume to continue.
5. **Progress Tracking**: Both parties see real-time stats: time streamed, total paid/earned

## Technical Implementation

### Using NWC (Nostr Wallet Connect)

```typescript
// 1. Calculate amount per payment interval
const satsPerMinute = 100;
const paymentInterval = 10; // seconds
const amountPerPayment = Math.floor((satsPerMinute / 60) * paymentInterval);

// 2. Set up streaming interval
const intervalId = setInterval(async () => {
  // Request invoice from creator's Lightning Address
  const ln = new LightningAddress(creatorAddress);
  await ln.fetch();
  const invoice = await ln.requestInvoice({ satoshi: amountPerPayment });

  // Pay the invoice
  await nwcClient.payInvoice({ invoice: invoice.paymentRequest });

  // Update totals and UI
}, paymentInterval * 1000);

// 3. Stop streaming on pause
clearInterval(intervalId);
```

### Creator's Side (Receiving)

```typescript
// Subscribe to payment notifications
const unsub = await nwcClient.subscribeNotifications(
  (notification) => {
    if (notification.notification_type === "payment_received") {
      const amountSats = Math.floor(notification.notification.amount / 1000);
      // Update earnings dashboard
      updateEarnings(amountSats);
    }
  },
  ["payment_received"],
);
```

## Real-World Examples

### Podcasting 2.0

Apps like **Fountain**, **Breez**, and **Castamatic** support streaming sats to podcasters:

- Listener sets sats/minute rate (e.g., 100 sats/min)
- Payments stream while episode plays
- Podcaster receives micropayments in real-time
- No middlemen, no platform fees
- Instant global payments

### Music Streaming

Imagine Spotify, but artists get paid instantly per second of playback:

- 50-200 sats per minute depending on listener's generosity
- Artists earn from first listen (no streaming threshold)
- Transparent payments (see exactly what you earned)
- Fans can "boost" favorite songs with larger tips

### Video Consultations

Experts can charge per minute for video calls:

- Set rate: 500 sats/minute for consulting
- Client's wallet streams payments while connected
- Expert sees real-time earnings
- Call ends = payments stop automatically

### Live Streaming

Twitch-style streaming with Lightning:

- Viewers stream donations while watching
- Streamer sees live earnings counter
- Viewers can adjust rate on-the-fly
- "Boost" button for big tips

## Advantages

✅ **Pay for what you consume** - Only pay for content you actually watch/listen to  
✅ **No subscriptions** - No monthly commitments, pay as you go  
✅ **Creator-friendly** - Artists earn from first play, no minimums  
✅ **Global & instant** - Works anywhere, payments settle in seconds  
✅ **Transparent** - Both parties see exact amounts in real-time  
✅ **Privacy-preserving** - No credit cards, no geographic restrictions

## User Experience Flow

### Consumer (Alice)

1. Browse content (podcast, music, video)
2. Press **Play** button
3. Content plays, sats automatically stream
4. See real-time stats: time played, sats streamed
5. Press **Pause** to stop payments
6. Optional: **Boost** to send extra tip

### Creator (Bob)

1. Publish content with Lightning Address
2. Share with audience
3. Automatically receive streaming payments
4. See real-time dashboard: earnings, active listeners
5. No setup required beyond Lightning Address

## Configuration Options

### Streaming Rates

- **Low**: 50 sats/minute (~$0.01 USD/min at current rates)
- **Medium**: 100 sats/minute (~$0.02 USD/min)
- **High**: 500 sats/minute (~$0.10 USD/min)
- **Custom**: User sets own rate

### Payment Intervals

- **Fast**: Every 5 seconds (frequent, smaller payments)
- **Standard**: Every 10 seconds (balanced)
- **Slow**: Every 30 seconds (fewer, larger payments)

**Trade-off**: More frequent = better granularity but higher routing fees

## Educational Value

This scenario demonstrates:

1. **Automated recurring payments** using setInterval + NWC
2. **Lightning Address invoice requests** for dynamic invoicing
3. **Real-time notifications** for payment confirmations
4. **Payment subscription management** (start/stop/resume)
5. **State synchronization** between consumer and creator
6. **Micropayment economics** and routing considerations

## Common Use Cases

| Use Case    | Sats/Min | Payment Interval | Description                               |
| ----------- | -------- | ---------------- | ----------------------------------------- |
| Podcast     | 100      | 10s              | Listener supports creator while listening |
| Music       | 50-200   | 10s              | Fan pays per minute of playback           |
| Video Call  | 500+     | 10s              | Expert consultation fee                   |
| Live Stream | 100      | 10s              | Viewer donates while watching             |
| API Access  | 1000     | 60s              | Pay for ongoing API service               |

## Implementation Considerations

### For Consumers

- **Balance Management**: Ensure sufficient balance for streaming session
- **Payment Failures**: Handle gracefully (pause playback or notify user)
- **Rate Adjustment**: Allow changing rate without stopping stream
- **Total Tracking**: Show running total to avoid surprises

### For Creators

- **Address Uptime**: Lightning Address must remain accessible
- **Invoice Generation**: Must support rapid invoice creation
- **Notification Handling**: Process payment notifications efficiently
- **Analytics**: Track total earnings, unique listeners, peak times

## Podcasting 2.0 Context

The **Podcasting 2.0** movement uses `<podcast:value>` tags in RSS feeds to specify Lightning payment details:

```xml
<podcast:value type="lightning" method="keysend">
  <podcast:valueRecipient
    name="Host"
    type="node"
    address="[node_address]"
    split="90"
  />
  <podcast:valueRecipient
    name="Producer"
    type="node"
    address="[node_address]"
    split="10"
  />
</podcast:value>
```

Apps read this data and automatically split streaming payments among multiple recipients!

## Resources

- **Podcasting 2.0**: https://podcastindex.org/
- **Value4Value**: https://value4value.info/
- **Fountain App**: https://fountain.fm/
- **Alby**: https://getalby.com/

## Try It

In this scenario:

1. Connect Alice and Bob's wallets
2. Press **Play** on Alice's simulated podcast player
3. Watch real-time streaming payments flow
4. See Bob's earnings counter increase
5. Pause to stop, resume to continue
6. Observe the "next payment in X seconds" countdown

This demonstrates the core mechanic behind Value4Value content monetization!
