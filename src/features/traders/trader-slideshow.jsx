/* eslint-disable @next/next/no-img-element -- Trader avatars use admin-provided HTTPS image URLs. */
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Trophy } from "lucide-react";
import styles from "./trader-slideshow.module.css";

const profit = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "always" });

export function TraderSlideshow() {
  const track = useRef(null);
  const [traders, setTraders] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/traders", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load traders.");
      if (!controller.signal.aborted) { setTraders(data.traders.slice(0, 10)); setError(""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [retry]);

  function slide(direction, automatic = false) {
    const element = track.current;
    if (!element || (automatic && document.hidden)) return;
    const step = (element.firstElementChild?.getBoundingClientRect().width ?? 150) + 8;
    const end = element.scrollWidth - element.clientWidth;
    const next = direction > 0
      ? (element.scrollLeft >= end - 2 ? 0 : Math.min(end, element.scrollLeft + step))
      : (element.scrollLeft <= 2 ? end : Math.max(0, element.scrollLeft - step));
    element.scrollTo({ left: next, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  useEffect(() => {
    if (!traders || traders.length < 2 || paused || hovered || focused) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => { if (!reducedMotion.matches) slide(1, true); }, 3000);
    return () => window.clearInterval(timer);
  }, [traders, paused, hovered, focused]);

  return <section className={styles.panel} aria-label="Top traders slideshow" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <header className={styles.header}><h2><Trophy size={15} aria-hidden="true" />Top traders</h2>{traders?.length > 1 && <div className={styles.controls}>
      <button type="button" onClick={() => slide(-1)} aria-label="Previous traders"><ChevronLeft size={14} /></button>
      <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play trader slideshow" : "Pause trader slideshow"}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>
      <button type="button" onClick={() => slide(1)} aria-label="Next traders"><ChevronRight size={14} /></button>
    </div>}</header>
    {error ? <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>
      : !traders ? <p className={styles.state} role="status">Loading traders…</p>
        : !traders.length ? <p className={styles.state}>No trader rankings yet.</p>
          : <><ul ref={track} className={styles.track} tabIndex={0} aria-label="Trader rankings" onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); slide(event.key === "ArrowRight" ? 1 : -1); } }}>
            {traders.map((trader) => <li key={trader.id} className={styles.slide}>
              <div className={styles.name}><span className={styles.avatar}>{trader.avatarUrl ? <img src={trader.avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : trader.username.slice(0, 1).toUpperCase()}</span><span title={trader.username}>{trader.username}</span></div>
              <div className={styles.result}><span className={styles.rank}>#{trader.rank}</span><strong>{profit.format(trader.profitUsdCents / 100)}</strong></div>
            </li>)}
          </ul><p className={styles.caption}>Ranked by profit</p></>}
  </section>;
}
