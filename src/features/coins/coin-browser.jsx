"use client";

import { useEffect, useState } from "react";
import { Flame, Info, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DepositModal } from "@/features/account/deposit-modal";
import { CoinCard } from "@/features/coins/coin-card";
import { CoinListSkeleton } from "@/features/coins/coin-list-skeleton";
import { selectCoins, sortOptions } from "@/features/coins/select-coins";

export function CoinBrowser() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [feed, setFeed] = useState(null);
  const [failure, setFailure] = useState(null);
  const [retry, setRetry] = useState(0);
  const term = query.trim();
  const currentFeed = feed?.query === term ? feed : null;
  const error = failure?.query === term ? failure.message : "";
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(term ? `/api/coins?q=${encodeURIComponent(term)}` : "/api/coins", { signal: controller.signal });
        if (!response.ok) throw new Error("Coin data is temporarily unavailable. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.coins)) throw new Error("Invalid coin response. Please try again.");
        if (!controller.signal.aborted) { setFeed({ ...data, query: term }); setFailure(null); }
      } catch (cause) {
        if (!controller.signal.aborted) setFailure({ query: term, message: cause.message });
      }
    }
    const debounce = setTimeout(load, term ? 350 : 0);
    const timer = setInterval(load, 60000);
    return () => { controller.abort(); clearTimeout(debounce); clearInterval(timer); };
  }, [retry, term]);
  // Provider results can match contract/pair addresses as well as names/symbols.
  // Do not discard them by applying the former local name-only filter again.
  const coins = selectCoins(currentFeed?.coins ?? [], "", sort);

  return (
    <>
      <header className="coin-toolbar">
        <details className="list-info"><summary aria-label="About this coin list"><Info size={17} /></summary><div className="info-popover">Search  by coin name, symbol, or contract address. Without a search, shows latest-profile tokens. Each token uses its most liquid returned pair. Sorts apply to returned results; Trending uses 24-hour trades and Newest uses pair creation time. Refreshes every minute. Missing values display —.</div></details>
        <div className="sort-controls" role="group" aria-label="Sort coins">{sortOptions.map((option) => <Button key={option.id} variant="tab" aria-pressed={sort === option.id} onClick={() => setSort(option.id)}>{option.id === "trending" && <Flame size={16} className="flame-icon" aria-hidden="true" />}{option.label}</Button>)}</div>
        <div className="coin-toolbar-actions">
          <SearchInput value={query} onChange={setQuery} />
          <DepositModal triggerLabel="Make deposit" triggerClassName="make-deposit-button" />
        </div>
        {/* <span className={`system-status ${error ? "system-status--offline" : ""}`}><i aria-hidden="true" />{error ? "Feed offline" : feed ? "API data" : "Loading"}</span> */}
      </header>
      <section className="coin-content" aria-labelledby="coin-list-title">
        <h1 id="coin-list-title" className="sr-only">Coin discovery</h1>
        <p className="sr-only" role="status">{coins.length} coins shown, sorted by {sortOptions.find((option) => option.id === sort)?.label}.</p>
        {error && <div className="feed-error" role="alert"><p>{error} {currentFeed && "Showing the last successful update for this search."}</p><Button onClick={() => { setFailure(null); setRetry((value) => value + 1); }}>Retry</Button></div>}
        {!currentFeed && !error ? <CoinListSkeleton /> : coins.length ? <ul className="coin-list">{coins.map((coin) => <CoinCard key={coin.id} coin={coin} />)}</ul> : !error && <div className="empty-state"><SearchX size={32} aria-hidden="true" /><h2>No coins found</h2><p>{term ? "Returned no matching tokens. Try the contract address or another name." : "No pair data is currently available for the latest profiles."}</p>{term && <Button onClick={() => setQuery("")}>Clear search</Button>}</div>}
        {/* {currentFeed && <p className="demo-note">DEX Screener · {currentFeed.partial ? "Partial feed · " : ""}Updated {new Date(currentFeed.fetchedAt).toLocaleTimeString()} · Refreshes every minute</p>} */}
      </section>
    </>
  );
}
