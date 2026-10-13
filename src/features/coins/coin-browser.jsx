"use client";

import { useEffect, useState } from "react";
import { Flame, Info, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { CoinCard } from "@/features/coins/coin-card";
import { CoinListSkeleton } from "@/features/coins/coin-list-skeleton";
import { selectCoins, sortOptions } from "@/features/coins/select-coins";

export function CoinBrowser() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/coins", { signal: controller.signal });
        if (!response.ok) throw new Error("Coin data is temporarily unavailable. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.coins)) throw new Error("Invalid coin response. Please try again.");
        if (!controller.signal.aborted) { setFeed(data); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.message);
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [retry]);
  const coins = selectCoins(feed?.coins ?? [], query, sort);

  return (
    <>
      <header className="coin-toolbar">
        <details className="list-info"><summary aria-label="About this coin list"><Info size={17} /></summary><div className="info-popover">DEX Screener latest-profile tokens, using each token’s most liquid available pair. Trending sorts by 24-hour trades; other sorts apply within this fetched list. Newest uses pair creation time, not token launch time. Refreshes every minute. Missing values display —.</div></details>
        <div className="sort-controls" role="group" aria-label="Sort coins">{sortOptions.map((option) => <Button key={option.id} variant="tab" aria-pressed={sort === option.id} onClick={() => setSort(option.id)}>{option.id === "trending" && <Flame size={16} className="flame-icon" aria-hidden="true" />}{option.label}</Button>)}</div>
        <SearchInput value={query} onChange={setQuery} />
        {/* <span className={`system-status ${error ? "system-status--offline" : ""}`}><i aria-hidden="true" />{error ? "Feed offline" : feed ? "API data" : "Loading"}</span> */}
      </header>
      <section className="coin-content" aria-labelledby="coin-list-title">
        <h1 id="coin-list-title" className="sr-only">Coin discovery</h1>
        <p className="sr-only" role="status">{coins.length} coins shown, sorted by {sortOptions.find((option) => option.id === sort)?.label}.</p>
        {error && <div className="feed-error" role="alert"><p>{error} {feed && "Showing the last successful update."}</p><Button onClick={() => { setError(""); setRetry((value) => value + 1); }}>Retry</Button></div>}
        {!feed && !error ? <CoinListSkeleton /> : coins.length ? <ul className="coin-list">{coins.map((coin) => <CoinCard key={coin.id} coin={coin} />)}</ul> : !error && <div className="empty-state"><SearchX size={32} aria-hidden="true" /><h2>No coins found</h2><p>{query ? "Try a different coin name or symbol." : "No pair data is currently available for the latest profiles."}</p>{query && <Button onClick={() => setQuery("")}>Clear search</Button>}</div>}
        {feed && <p className="demo-note">DEX Screener · {feed.partial ? "Partial feed · " : ""}Updated {new Date(feed.fetchedAt).toLocaleTimeString()} · Refreshes every minute</p>}
      </section>
    </>
  );
}
