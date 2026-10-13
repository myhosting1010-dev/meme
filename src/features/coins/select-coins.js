export const sortOptions = [
  { id: "trending", label: "Trending", rank: "activity24h" },
  { id: "newest", label: "Newest", rank: "createdAt" },
  { id: "volume", label: "Top volume", rank: "volume24h" },
  { id: "market-cap", label: "Top Market Cap", rank: "marketCap" },
];

export function selectCoins(coins, query, sort) {
  const term = query.trim().toLowerCase();
  const results = coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(term));
  const rank = sortOptions.find((option) => option.id === sort)?.rank;
  return rank ? results.sort((a, b) => (b[rank] ?? -Infinity) - (a[rank] ?? -Infinity)) : results;
}
