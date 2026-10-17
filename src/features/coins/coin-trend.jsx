"use client";

import { useEffect, useRef, useState } from "react";

export function CoinTrend({ chain, pair }) {
  const element = useRef(null);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 650px)");
    const controller = new AbortController();
    let observer;
    let started = false;

    async function load() {
      if (started || !media.matches) return;
      started = true;
      try {
        const response = await fetch(`/api/coins/${encodeURIComponent(chain)}/${encodeURIComponent(pair)}/trend`, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data.points)) setPoints(data.points);
      } catch { /* Keep the graph empty when historical data is unavailable. */ }
    }

    function observe() {
      observer?.disconnect();
      if (!media.matches || !element.current) return;
      if (!("IntersectionObserver" in window)) { load(); return; }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      }, { rootMargin: "80px" });
      observer.observe(element.current);
    }

    observe();
    media.addEventListener("change", observe);
    return () => { controller.abort(); observer?.disconnect(); media.removeEventListener("change", observe); };
  }, [chain, pair]);

  const prices = points.map((point) => point.price).filter((price) => Number.isFinite(price) && price > 0);
  const rising = prices.length > 1 && prices.at(-1) >= prices[0];
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const width = 54;
  const height = 22;
  const line = prices.map((price, index) => {
    const x = prices.length === 1 ? width / 2 : 1 + index * (width - 2) / (prices.length - 1);
    const y = high === low ? height / 2 : height - 2 - ((price - low) / (high - low)) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return <div ref={element} className={`coin-mini-chart ${prices.length > 1 ? rising ? "coin-mini-chart--up" : "coin-mini-chart--down" : "coin-mini-chart--unknown"}`} aria-label={prices.length > 1 ? `Recent hourly price graph, ${rising ? "trending up" : "trending down"}` : "Recent price graph unavailable"}>
    {line && <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={line} /></svg>}
  </div>;
}
