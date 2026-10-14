import { z } from "zod";

const identifier = z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/);
const profileSchema = z.object({ chainId: identifier, tokenAddress: identifier, icon: z.string().nullable().optional().catch(null) });
const optionalNumber = z.number().finite().nullable().optional();
const pairSchema = z.object({
  chainId: identifier,
  pairAddress: identifier,
  baseToken: z.object({ address: identifier, name: z.string().max(300), symbol: z.string().max(100) }),
  marketCap: optionalNumber,
  liquidity: z.object({ usd: optionalNumber }).nullable().optional(),
  volume: z.object({ h24: optionalNumber }).optional(),
  priceChange: z.object({ h24: optionalNumber }).nullable().optional(),
  priceUsd: z.string().nullable().optional(),
  pairCreatedAt: optionalNumber,
  info: z.object({ imageUrl: z.string().nullable().optional().catch(null) }).nullable().optional().catch(null),
  txns: z.object({ h24: z.object({ buys: z.number().nonnegative(), sells: z.number().nonnegative() }).optional() }).optional(),
});

function imageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizePairs(pairs, profiles = null) {
  if (profiles === null) {
    const tokens = new Map();
    for (const raw of pairs) {
      const result = pairSchema.safeParse(raw);
      if (!result.success) continue;
      const pair = result.data;
      tokens.set(`${pair.chainId}:${pair.baseToken.address}`, { chainId: pair.chainId, tokenAddress: pair.baseToken.address });
    }
    profiles = [...tokens.values()];
  }
  const byToken = new Map();
  const wanted = new Set(profiles.map((profile) => `${profile.chainId}:${profile.tokenAddress}`));
  for (const raw of pairs) {
    const result = pairSchema.safeParse(raw);
    if (!result.success) continue;
    const pair = result.data;
    const key = `${pair.chainId}:${pair.baseToken.address}`;
    if (!wanted.has(key)) continue;
    // One row per token, using its most liquid available pair.
    const previous = byToken.get(key);
    if (previous && (previous.liquidity?.usd ?? 0) >= (pair.liquidity?.usd ?? 0)) continue;
    byToken.set(key, pair);
  }
  return profiles.flatMap((profile) => {
    const id = `${profile.chainId}:${profile.tokenAddress}`;
    const pair = byToken.get(id);
    if (!pair) return [];
    const price = pair.priceUsd == null || pair.priceUsd.trim() === "" ? null : Number(pair.priceUsd);
    return [{
      id, name: pair.baseToken.name, symbol: pair.baseToken.symbol, chain: pair.chainId,
      pairAddress: pair.pairAddress,
      imageUrl: imageUrl(pair.info?.imageUrl) ?? imageUrl(profile.icon),
      marketCap: pair.marketCap ?? null, volume24h: pair.volume?.h24 ?? null,
      liquidity: pair.liquidity?.usd ?? null, change24h: pair.priceChange?.h24 ?? null,
      priceUsd: price !== null && Number.isFinite(price) && price >= 0 ? price : null,
      createdAt: pair.pairCreatedAt ?? null,
      activity24h: pair.txns?.h24 ? pair.txns.h24.buys + pair.txns.h24.sells : null,
    }];
  });
}

export const coinSearchSchema = z.string().trim().max(200);

export const coinPairParamsSchema = z.object({ chain: identifier, pair: identifier });

export function coinPairUrl(chain, pair, embed = false) {
  coinPairParamsSchema.parse({ chain, pair });
  const url = `https://dexscreener.com/${encodeURIComponent(chain)}/${encodeURIComponent(pair)}`;
  return embed ? `${url}?embed=1&theme=dark&chartTheme=dark&info=0&trades=1` : url;
}

export async function fetchCoinPair(chain, pair, fetcher = fetch) {
  coinPairParamsSchema.parse({ chain, pair });
  const response = await fetcher(`https://api.dexscreener.com/latest/dex/pairs/${encodeURIComponent(chain)}/${encodeURIComponent(pair)}`, {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), next: { revalidate: 15 },
  });
  if (!response.ok) throw new Error("Pair data unavailable");
  const data = await response.json();
  if (data.pairs === null) return null;
  if (!Array.isArray(data.pairs)) throw new Error("Invalid pair response");
  const match = data.pairs.filter((item) => item.chainId === chain && item.pairAddress === pair);
  return normalizePairs(match)[0] ?? null;
}

export async function searchCoins(query, fetcher = fetch) {
  const term = coinSearchSchema.parse(query);
  if (!term) throw new Error("Search query required");
  const response = await fetcher(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(term)}`, {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), next: { revalidate: 30 },
  });
  if (!response.ok) throw new Error("Coin search unavailable");
  const data = await response.json();
  if (!Array.isArray(data.pairs)) throw new Error("Invalid coin search response");
  return { coins: normalizePairs(data.pairs.slice(0, 100)), source: "DEX Screener", fetchedAt: new Date().toISOString(), partial: false };
}

export async function fetchCoinFeed(fetcher = fetch) {
  const request = async (path) => {
    const response = await fetcher(`https://api.dexscreener.com${path}`, {
      headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Coin provider unavailable");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid coin provider response");
    return data;
  };
  const rawProfiles = await request("/token-profiles/latest/v1");
  const seen = new Set();
  const profiles = rawProfiles.slice(0, 100).flatMap((raw) => {
    const result = profileSchema.safeParse(raw);
    if (!result.success) return [];
    const key = `${result.data.chainId}:${result.data.tokenAddress}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [result.data];
  }).slice(0, 30);
  if (rawProfiles.length && !profiles.length) throw new Error("Invalid token profiles");
  const groups = Map.groupBy(profiles, (profile) => profile.chainId);
  const results = await Promise.allSettled([...groups].map(([chain, tokens]) =>
    request(`/tokens/v1/${encodeURIComponent(chain)}/${tokens.map((token) => encodeURIComponent(token.tokenAddress)).join(",")}`),
  ));
  if (results.length && results.every((result) => result.status === "rejected")) throw new Error("Coin provider unavailable");
  return {
    coins: normalizePairs(results.flatMap((result) => result.status === "fulfilled" ? result.value : []), profiles),
    source: "DEX Screener", fetchedAt: new Date().toISOString(),
    partial: results.some((result) => result.status === "rejected"),
  };
}
