import { coinPairParamsSchema } from "@/services/dexscreener-data";

const networkByChain = Object.freeze({
  solana: "solana",
  ethereum: "eth",
  eth: "eth",
  base: "base",
  bsc: "bsc",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon_pos",
  avalanche: "avax",
  fantom: "ftm",
});

export async function fetchCoinTrend(chain, pair, fetcher = fetch) {
  const parsed = coinPairParamsSchema.safeParse({ chain, pair });
  if (!parsed.success) throw new Error("Invalid coin pair");
  const network = networkByChain[parsed.data.chain.toLowerCase()];
  if (!network) return [];

  const url = new URL(`https://api.geckoterminal.com/api/v2/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(parsed.data.pair)}/ohlcv/hour`);
  url.searchParams.set("aggregate", "1");
  url.searchParams.set("limit", "24");
  url.searchParams.set("currency", "usd");
  const response = await fetcher(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Coin trend unavailable");
  const data = await response.json();
  const candles = data?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(candles)) return [];

  return candles
    .filter((candle) => Array.isArray(candle) && Number.isFinite(Number(candle[0])) && Number.isFinite(Number(candle[4])) && Number(candle[4]) > 0)
    .map((candle) => ({ time: Number(candle[0]), price: Number(candle[4]) }))
    .sort((a, b) => a.time - b.time)
    .slice(-24);
}
