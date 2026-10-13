import assert from "node:assert/strict";
import test from "node:test";
import { fetchCoinFeed, normalizePairs } from "../../src/services/dexscreener-data.js";
import { formatPrice, formatUsd } from "../../src/features/coins/format-values.js";

const profile = { chainId: "solana", tokenAddress: "abc123" };
const pair = { chainId: "solana", pairAddress: "pair123", baseToken: { address: "abc123", name: "Test token", symbol: "TEST" }, liquidity: { usd: 100 }, marketCap: 1000, volume: { h24: 50 }, priceChange: { h24: -2 }, priceUsd: "0.00000125", pairCreatedAt: 123, txns: { h24: { buys: 2, sells: 3 } } };

test("normalization selects highest liquidity, deduplicates tokens, and skips invalid/unrelated pairs", () => {
  const coins = normalizePairs([pair, { ...pair, liquidity: { usd: 200 } }, {}, { ...pair, baseToken: { ...pair.baseToken, address: "other" } }], [profile]);
  assert.equal(coins.length, 1);
  assert.equal(coins[0].liquidity, 200);
  assert.equal(coins[0].activity24h, 5);
  assert.equal(coins[0].change24h, -2);
  assert.equal(coins[0].priceUsd, 0.00000125);
});

test("missing market values stay missing and tiny real prices retain significant digits", () => {
  const [coin] = normalizePairs([{ chainId: pair.chainId, pairAddress: pair.pairAddress, baseToken: pair.baseToken }], [profile]);
  assert.equal(coin.marketCap, null);
  assert.equal(coin.priceUsd, null);
  assert.equal(formatUsd(null), "—");
  assert.equal(formatPrice(0.00000125), "$0.00000125");
});

test("coin images prefer pair metadata and fall back to profile icons safely", () => {
  const icon = "https://cdn.dexscreener.com/cms/images/profile.webp";
  const pairImage = "https://cdn.dexscreener.com/cms/images/pair.webp";
  const profiles = [{ ...profile, icon }];
  assert.equal(normalizePairs([{ ...pair, info: { imageUrl: pairImage } }], profiles)[0].imageUrl, pairImage);
  assert.equal(normalizePairs([pair], profiles)[0].imageUrl, icon);
  assert.equal(normalizePairs([{ ...pair, info: { imageUrl: "javascript:alert(1)" } }], profiles)[0].imageUrl, icon);
  assert.equal(normalizePairs([pair], [{ ...profile, icon: "http://insecure.example/image.png" }])[0].imageUrl, null);
});

test("feed requests bounded grouped endpoints and rejects upstream failures", async () => {
  const paths = [];
  const feed = await fetchCoinFeed(async (url) => {
    paths.push(url);
    return Response.json(url.includes("token-profiles") ? [{ ...profile, icon: "https://cdn.dexscreener.com/profile.png" }, profile] : [pair]);
  });
  assert.equal(paths.length, 2);
  assert.equal(paths[1], "https://api.dexscreener.com/tokens/v1/solana/abc123");
  assert.equal(feed.coins.length, 1);
  assert.equal(feed.coins[0].imageUrl, "https://cdn.dexscreener.com/profile.png");
  await assert.rejects(fetchCoinFeed(async () => new Response("", { status: 429 })), /unavailable/);
  await assert.rejects(fetchCoinFeed(async () => Response.json({ invalid: true })), /Invalid/);
});

test("partial chain failures preserve successful real rows and flag the incomplete feed", async () => {
  const feed = await fetchCoinFeed(async (url) => {
    if (url.includes("token-profiles")) return Response.json([profile, { chainId: "ethereum", tokenAddress: "0x123" }]);
    if (url.includes("ethereum")) return new Response("", { status: 503 });
    return Response.json([pair]);
  });
  assert.equal(feed.partial, true);
  assert.equal(feed.coins.length, 1);
});
