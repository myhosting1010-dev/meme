"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, X } from "lucide-react";
import styles from "./account-profile.module.css";
import { DepositModal } from "./deposit-modal";
import { TransactionHistory } from "./transaction-history";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const signedMoney = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "always" }).format(cents / 100);

export function AccountProfile({ profile }) {
  const [tab, setTab] = useState("trades");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (window.location.hash === "#history-panel") {
      setTab("history");
      window.requestAnimationFrame(() => document.getElementById("history-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    const toast = window.sessionStorage.getItem("account-toast");
    if (!toast) return;
    window.sessionStorage.removeItem("account-toast");
    setMessage(toast);
    const timer = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  return <section className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={21} />Back to Dashboard</Link><h1>Account Profile</h1></header>
    <div className={styles.cards}>
      <section className={`${styles.card} ${styles.identity}`} aria-label="User information"><div className={styles.avatar}>{profile.username.charAt(0).toUpperCase()}</div><div className={styles.userDetails}><h2>User</h2><strong>{profile.username}</strong><p>{profile.email}</p><div className={styles.social}><X size={20} aria-hidden="true" /><span>{profile.twitterUsername ? `@${profile.twitterUsername}` : "Not linked"}</span><button type="button" onClick={() => setMessage("X account linking is not connected yet.")}>Link</button></div></div></section>
      <section className={`${styles.card} ${styles.membership}`}><h2>Membership status</h2><div><span className={styles.plan}>{profile.membershipPlan === "premium" ? "Premium plan" : "Free plan"}</span><Link href="/premium">Upgrade</Link></div></section>
      <section className={`${styles.card} ${styles.balance}`}><span className={styles.watermark} aria-hidden="true" /><h2>Available balance</h2><strong>{money(profile.balance)}</strong><div className={styles.balanceActions}><DepositModal onDeposited={() => { setHistoryRefresh((value) => value + 1); setTab("history"); }} /><button type="button" onClick={() => setMessage("Withdrawals are not connected yet. Your balance has not changed.")}>Withdraw</button></div></section>
    </div>
    {message && <div className={styles.notice} role="status"><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}><X size={18} /></button></div>}
    <div className={styles.tabs} role="tablist" aria-label="Account activity"><button type="button" id="trades-tab" role="tab" aria-selected={tab === "trades"} aria-controls="trades-panel" tabIndex={tab === "trades" ? 0 : -1} onClick={() => setTab("trades")} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "End"].includes(event.key)) { event.preventDefault(); setTab("history"); document.getElementById("history-tab").focus(); } }}>Trades</button><button type="button" id="history-tab" role="tab" aria-selected={tab === "history"} aria-controls="history-panel" tabIndex={tab === "history" ? 0 : -1} onClick={() => setTab("history")} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) { event.preventDefault(); setTab("trades"); document.getElementById("trades-tab").focus(); } }}>Transaction History</button></div>
    <div id="trades-panel" role="tabpanel" aria-labelledby="trades-tab" hidden={tab !== "trades"} tabIndex={0} className={styles.tablePanel}>
     
      <div className={styles.tableScroll}><table>
        <thead><tr><th>Coin</th><th>Entry price</th><th>Amount USD</th><th>Realized PNL</th><th>Unrealized PNL</th><th>Status / Action</th></tr></thead>
        <tbody>{profile.purchases?.length ? profile.purchases.map((trade) => <tr key={trade.id}>
          <td>{trade.coinName}<br /><small>{new Intl.NumberFormat("en-US", { maximumSignificantDigits: 10 }).format(trade.quantity)} {trade.symbol}</small></td>
          <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumSignificantDigits: 8 }).format(trade.priceUsd)}</td>
          <td>{money(trade.amount)}</td><td>{signedMoney(trade.realizedPnl ?? 0)}</td><td>{signedMoney(trade.unrealizedPnl ?? 0)}</td><td>Purchased</td>
        </tr>) : <tr><td colSpan={6}><div className={styles.empty}><BriefcaseBusiness size={56} aria-hidden="true" /><p>No trades active.</p></div></td></tr>}</tbody>
      </table></div>
    </div>
    <TransactionHistory key={historyRefresh} initialData={{ transactions: profile.transactions, pagination: profile.pagination }} active={tab === "history"} refreshKey={historyRefresh} />
  </section>;
}
