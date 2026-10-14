import "server-only";
import { fetchCoinFeed } from "./dexscreener-data.js";

// Coalesce requests and respect upstream rate limits within each Node process.
const cache = globalThis.__mintlineCoinFeedWithPairs ??= { value: null, expiresAt: 0, pending: null };

export async function getCoinFeed() {
  if (cache.value && Date.now() < cache.expiresAt) return cache.value;
  if (!cache.pending) {
    cache.pending = fetchCoinFeed().then((value) => {
      cache.value = value;
      cache.expiresAt = Date.now() + 60000;
      return value;
    }).finally(() => { cache.pending = null; });
  }
  return cache.pending;
}
