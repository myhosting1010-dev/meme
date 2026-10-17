"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { CoinAvatar } from "@/features/coins/coin-avatar";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/features/coins/format-values";
import { coinPairUrl } from "@/services/dexscreener-data";
import { useAuth } from "@/features/auth/auth-provider";

export function CoinDetail({ chain, pair }) {
  const { requireSignin } = useAuth();
  const [amount, setAmount] = useState("");
  const [buyMessage, setBuyMessage] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/coins/${encodeURIComponent(chain)}/${encodeURIComponent(pair)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "This pair is no longer available." : "Pair data is temporarily unavailable. Please retry.");
        const value = await response.json();
        if (!controller.signal.aborted) { setData(value); setError(""); }
      } catch (cause) { if (!controller.signal.aborted) setError(cause.message); }
    }
    load();
    const timer = setInterval(load, 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [chain, pair, retry]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(data.coin.id.split(":")[1]);
      setCopied(true); setCopyError(false);
    } catch { setCopyError(true); }
  }

  async function buy(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBuyMessage("");
    if (!await requireSignin()) return;
    if (!form.reportValidity()) return;
    setBuyMessage("Trading is not connected yet. No purchase has been made.");
  }

  const coin = data?.coin?.chain === chain && data?.coin?.pairAddress === pair ? data.coin : null;
  const sourceUrl = coinPairUrl(chain, pair);
  return (
    <div className="coin-detail">
      <header className="detail-toolbar">
        <Link href="/" className="icon-button" aria-label="Back to coins"><ArrowLeft size={20} /></Link>
        {coin ? <div className="detail-identity"><CoinAvatar coin={coin} /><div><span className="detail-symbol">{coin.symbol}</span><h1>{coin.name}</h1><button type="button" className="detail-copy" onClick={copyAddress}><Copy size={14} />{copied ? "Copied" : "Copy token address"}</button>{copyError && <span role="status">Copy unavailable</span>}</div></div> : <h1>Loading coin…</h1>}
        <div className="detail-metrics"><div><span>Market cap</span><strong>{formatUsd(coin?.marketCap)}</strong></div><div><span>24H volume</span><strong>{formatUsd(coin?.volume24h)}</strong></div><div title="The current provider does not report a peak multiplier"><span>Peak</span><strong className="detail-peak">—</strong></div></div>
        <form className="detail-buy" onSubmit={buy} noValidate><input type="number" inputMode="decimal" min="0.01" step="0.01" required aria-label="Buy amount in USD" placeholder="$ 0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setBuyMessage(""); }} /><Button type="submit">BUY</Button></form>
      </header>
      {buyMessage && <p className="detail-note" role="status">{buyMessage}</p>}
      {error && <div className="feed-error" role="alert"><p>{error}{coin && " Showing the last successful update."}</p><Button onClick={() => setRetry((value) => value + 1)}>Retry</Button></div>}
     
      <iframe key={`${chain}:${pair}`} className="detail-chart" src={coinPairUrl(chain, pair, true)} title="Price chart and trade feed" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" />
     
    </div>
  );
}
