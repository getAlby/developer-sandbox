const FAUCET_URL = import.meta.env.VITE_FAUCET_URL || "https://faucet.nwc.dev";

export async function createTestWallet(balance = 10000): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${FAUCET_URL}?balance=${balance}`, {
      method: "POST",
    });

    if (!response.ok) {
      if (attempt < 2) continue;
      throw new Error("Failed to create test wallet");
    }

    const connectionSecret = await response.text();

    if (!connectionSecret?.startsWith("nostr+walletconnect://")) {
      throw new Error("Invalid connection secret received");
    }

    return connectionSecret;
  }

  throw new Error("Failed to create test wallet after retries");
}

export async function topUpWallet(username: string, amount = 10000): Promise<void> {
  const response = await fetch(
    `${FAUCET_URL}/wallets/${username}/topup?amount=${amount}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error("Top-up request failed");
  }
}
