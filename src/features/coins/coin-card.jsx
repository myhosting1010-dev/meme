import { formatPrice, formatUsd } from "@/features/coins/format-values";
import { CoinAvatar } from "@/features/coins/coin-avatar";
import { CoinTrend } from "@/features/coins/coin-trend";
import Link from "next/link";

export function CoinCard({ coin, rank }) {
  const metrics = [
    { label: "Market cap", value: coin.marketCap },
    { label: "Volume · 24h", value: coin.volume24h },
    { label: "Liquidity", value: coin.liquidity },
  ];
  return (
    <li><Link className="coin-card coin-card-link" href={`/coins/${encodeURIComponent(coin.chain)}/${encodeURIComponent(coin.pairAddress)}`} aria-label={`View ${coin.name} chart and details`}>
      <span className="coin-row-rank" aria-hidden="true">{rank}</span>
      <div className="coin-identity"><CoinAvatar coin={coin} /><div><h2>{coin.name}</h2><p>{coin.symbol} · {coin.chain}</p></div></div>
      <CoinTrend chain={coin.chain} pair={coin.pairAddress} />
      {metrics.map((metric, index) => <div className={`coin-metric metric-${index + 1}`} key={metric.label} style={index === 0 ? { "--market-cap-scale": `${Math.min(100, Math.max(8, Math.log10(Math.max(1, coin.marketCap ?? 1)) * 20))}%` } : undefined}><span className="live-metric-label">{metric.label}</span><span className={`metric-value ${index === 2 ? "metric-purple" : "metric-positive"}`}>{formatUsd(metric.value)}</span>{index === 0 && <span className="coin-cap-bar" aria-hidden="true" />}</div>)}
      <div className={`coin-multiple ${coin.change24h < 0 ? "change-negative" : ""}`}><span className="live-metric-label">Change · 24h</span><span>{coin.change24h == null ? "—" : `${coin.change24h > 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}</span></div>
      <div className="coin-price"><span className="live-metric-label">Price · USD</span>{formatPrice(coin.priceUsd)}</div>
    </Link></li>
  );
}
