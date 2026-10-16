"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Star, TrendingUp, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { DepositModal } from "@/features/account/deposit-modal";
import styles from "./premium-page.module.css";

const plans = [
  { id: "week", name: "1 Week", period: "/wk", price: "$300.00", total: "$300", save: "Starter", features: ["Alpha lounge room", "Top 30 trending list", "Real-time performance tracking"] },
  { id: "month", name: "1 Month", period: "/mo", price: "$175.00", total: "$700", save: "Save 41%", features: ["Alpha lounge room", "Top 30 trending list", "Real-time performance tracking", "Catch big plays early"] },
  { id: "quarter", name: "3 Months", period: "/mo", price: "$92.30", total: "$1,200", save: "Save 69%", popular: true, features: ["Alpha lounge room", "Top 30 trending list", "Real-time performance tracking", "Catch big plays early", "Big move alerts (2x+)", "Private Discord"] },
  { id: "half-year", name: "6 Months", period: "/mo", price: "$61.53", total: "$1,600", save: "Save 79%", features: ["Alpha lounge room", "Top 30 trending list", "Real-time performance tracking", "Catch big plays early", "Big move alerts (2x+)", "Private Discord", "70%+ 2x win-rate days (under 25 calls)"] },
  { id: "year", name: "12 Months", period: "/mo", price: "$38.46", total: "$2,000", save: "Save 87%", features: ["Alpha lounge room", "Top 30 trending list", "Real-time performance tracking", "Catch big plays early", "Big move alerts (2x+)", "Private Discord", "70%+ 2x win-rate days (under 25 calls)", "20K+ daily launches narrowed to <1%"] },
  { id: "two-years", name: "24 Months", period: "/mo", price: "$25.00", total: "$2,400", save: "Save 92%", features: ["Everything in 12 Months", "Two years of premium access", "Priority market alerts", "Private Discord"] },
];

function ChartArtwork() {
  const bars = [
    [70, 175, 30, 18, "up"], [108, 157, 23, 25, "up"], [145, 129, 32, 20, "up"],
    [184, 107, 25, 29, "down"], [220, 85, 36, 22, "up"], [261, 55, 29, 24, "up"],
    [301, 35, 34, 22, "up"],
  ];
  return <svg className={styles.chart} viewBox="0 0 360 230" role="img" aria-label="Rising market chart illustration">
    <path d="M18 190H342" className={styles.chartBase} />
    <path d="M40 180H91" className={styles.chartGuide} />
    <path d="M91 38V198" className={styles.chartGuide} />
    <path d="M91 37l8 13H83z" className={styles.gem} />
    <circle cx="91" cy="199" r="4" className={styles.gem} />
    {bars.map(([x, y, height, wick, direction]) => <g key={x} className={direction === "up" ? styles.candleUp : styles.candleDown}><path d={`M${x + 8} ${y - 12}v${height + wick}`} /><rect x={x} y={y} width="16" height={height} rx="1" /></g>)}
  </svg>;
}

export function PremiumPage() {
  const { user, requireSignin } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  async function selectPlan(plan) {
    const currentUser = user || await requireSignin();
    if (!currentUser) return;
    setSelectedPlan(plan);
  }
  return <main className={styles.page}>
    <header className={styles.topbar}><Link href="/" className={styles.back}><ArrowLeft size={20} />Back to Dashboard</Link><a href="#plans" className={styles.topCta}><Star size={18} fill="currentColor" />Get Premium</a></header>
    <section className={styles.hero} aria-labelledby="premium-title"><div className={styles.heroCopy}><h1 id="premium-title">Get in before<br /><span>coins pump</span></h1><div className={styles.proof}><span><UserRound size={17} />Used by 2,300+ traders</span><span><TrendingUp size={18} />$250K+ profit generated</span></div></div><ChartArtwork /></section>
    <section id="plans" className={styles.plans} aria-label="Premium subscription plans">
      {plans.map((plan) => <article key={plan.name} className={`${styles.plan} ${plan.popular ? styles.popular : ""}`}>
        {plan.popular && <span className={styles.popularBadge}>Most Popular</span>}
        <div className={`${styles.saving} ${plan.save === "Starter" ? styles.starter : ""} ${plan.name === "12 Months" ? styles.gold : ""}`}>{plan.save}</div>
        <h2>{plan.name}</h2>
        <p className={styles.price}>{plan.price}<span>{plan.period}</span></p>
        <p className={styles.total}>Total: {plan.total}</p>
        <ul>{plan.features.map((feature) => <li key={feature}><Check size={17} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
        <button type="button" className={styles.choose} onClick={() => selectPlan(plan)}>Choose plan <ArrowUpRight size={17} /></button>
      </article>)}
    </section>
    {selectedPlan && <DepositModal key={selectedPlan.id} plan={selectedPlan} openOnMount onDismiss={() => setSelectedPlan(null)} onPlanSubmitted={() => { window.sessionStorage.setItem("account-toast", "Payment submitted, awaiting approval"); router.push("/profile#history-panel"); }} />}
  </main>;
}
