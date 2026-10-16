/* eslint-disable @next/next/no-img-element -- Trader avatar URLs are stored as validated HTTPS URLs. */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, RefreshCw, UserRound } from "lucide-react";
import styles from "./alpha-lounge.module.css";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function TraderAvatar({ trader }) {
  return <span className={styles.avatar} aria-hidden="true">
    {trader.avatarUrl ? <img src={trader.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span>{trader.username.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export function AlphaLounge({ viewer }) {
  const [result, setResult] = useState({ traders: [], viewerRank: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadTraders = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/traders", { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load traders.");
      if (!signal.aborted) setResult(data);
    } catch (cause) {
      if (!signal.aborted) setError(cause.message || "Unable to load traders.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTraders(controller.signal);
    return () => controller.abort();
  }, [loadTraders]);

  return <main className={styles.page}>
    <section className={styles.leaderboard} aria-labelledby="lounge-title">
      <header className={styles.heading}>
        <div><span className={styles.eyebrow}>Community</span><h1 id="lounge-title">Alpha Lounge</h1><p>See how the community is performing.</p></div>
        <button type="button" className={styles.refresh} onClick={() => { const controller = new AbortController(); loadTraders(controller.signal); }} disabled={loading} aria-label="Refresh traders"><RefreshCw size={17} />Refresh</button>
      </header>
      <nav className={styles.tabs} aria-label="Alpha Lounge sections"><button type="button" aria-current="page">Traders</button><button type="button" disabled title="Coming soon">Squads</button><button type="button" disabled title="Coming soon">Rewards</button><button type="button" disabled title="Coming soon">Best callouts</button></nav>
      <div className={styles.viewerRank}>
        <span className={styles.viewerAvatar}>{viewer.username.slice(0, 1).toUpperCase()}</span>
        <span className={styles.you}>You</span>
        <span className={styles.rankLabel}>Your rank <strong>{result.viewerRank ? `#${result.viewerRank}` : "—"}</strong></span>
        <span className={styles.viewerProfit}>{result.viewerRank ? currency.format(result.traders[result.viewerRank - 1].profitUsdCents / 100) : "—"}</span>
      </div>
      <div className={styles.listHeader}><h2>Top traders</h2><span>Ranked by reported profit</span></div>
      {loading ? <div className={styles.state} role="status">Loading traders…</div> : error ? <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={() => { const controller = new AbortController(); loadTraders(controller.signal); }}>Try again</button></div> : result.traders.length === 0 ? <div className={styles.state}><UserRound size={28} /><p>No trader rankings are available yet.</p></div> : <ol className={styles.traders}>
        {result.traders.map((trader) => <li className={styles.row} key={trader.id}>
          <span className={`${styles.rank} ${trader.rank <= 3 ? styles[`rank${trader.rank}`] : ""}`}>{trader.rank}</span>
          <TraderAvatar trader={trader} />
          <div className={styles.traderInfo}><div className={styles.name}>{trader.username}{trader.rank <= 3 && <Crown size={16} aria-label={`Rank ${trader.rank}`} />}</div><button type="button" className={styles.follow} disabled title="Follow actions are coming soon">{trader.userId === viewer.id ? "You" : "Follow"}</button></div>
          <strong className={styles.profit}>+{currency.format(trader.profitUsdCents / 100)}</strong>
          <span className={styles.followers} aria-label={`${trader.followersCount} followers`}>{trader.followersCount > 99 ? "99+" : trader.followersCount || "—"}</span>
        </li>)}
      </ol>}
     
    </section>
  </main>;
}
