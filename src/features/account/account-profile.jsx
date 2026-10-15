"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, X } from "lucide-react";
import styles from "./account-profile.module.css";
import { DepositModal } from "./deposit-modal";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const typeLabels = { deposit: "Deposit", withdrawal: "Withdrawal", subscription: "Premium subscription", buy: "Buy", sell: "Sell" };
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function AccountProfile({ profile }) {
  const [tab, setTab] = useState("trades");
  const [message, setMessage] = useState("");
  return <section className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={21} />Back to Dashboard</Link><h1>Account Profile</h1></header>
    <div className={styles.cards}>
      <section className={`${styles.card} ${styles.identity}`} aria-label="User information"><div className={styles.avatar}>{profile.username.charAt(0).toUpperCase()}</div><div className={styles.userDetails}><h2>User</h2><strong>{profile.username}</strong><p>{profile.email}</p><div className={styles.social}><X size={20} aria-hidden="true" /><span>{profile.twitterUsername ? `@${profile.twitterUsername}` : "Not linked"}</span><button type="button" onClick={() => setMessage("X account linking is not connected yet.")}>Link</button></div></div></section>
      <section className={`${styles.card} ${styles.membership}`}><h2>Membership status</h2><div><span className={styles.plan}>{profile.membershipPlan === "premium" ? "Premium plan" : "Free plan"}</span><button type="button" onClick={() => setMessage("Membership upgrades are not available yet.")}>Upgrade</button></div></section>
      <section className={`${styles.card} ${styles.balance}`}><span className={styles.watermark} aria-hidden="true" /><h2>Available balance</h2><strong>{money(profile.balance)}</strong><div className={styles.balanceActions}><DepositModal /><button type="button" onClick={() => setMessage("Withdrawals are not connected yet. Your balance has not changed.")}>Withdraw</button></div></section>
    </div>
    {message && <div className={styles.notice} role="status"><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}><X size={18} /></button></div>}
    <div className={styles.tabs} role="tablist" aria-label="Account activity"><button type="button" id="trades-tab" role="tab" aria-selected={tab === "trades"} aria-controls="trades-panel" tabIndex={tab === "trades" ? 0 : -1} onClick={() => setTab("trades")} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "End"].includes(event.key)) { event.preventDefault(); setTab("history"); document.getElementById("history-tab").focus(); } }}>Trades</button><button type="button" id="history-tab" role="tab" aria-selected={tab === "history"} aria-controls="history-panel" tabIndex={tab === "history" ? 0 : -1} onClick={() => setTab("history")} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) { event.preventDefault(); setTab("trades"); document.getElementById("trades-tab").focus(); } }}>Transaction History</button></div>
    <div id="trades-panel" role="tabpanel" aria-labelledby="trades-tab" hidden={tab !== "trades"} tabIndex={0} className={styles.tablePanel}><div className={styles.tableScroll}><table><thead><tr><th>Coin</th><th>Entry price</th><th>Amount USD</th><th>Unrealized PNL</th><th>Status / Action</th></tr></thead><tbody><tr><td colSpan={5}><div className={styles.empty}><BriefcaseBusiness size={56} aria-hidden="true" /><p>No trades active.</p></div></td></tr></tbody></table></div></div>
    <div id="history-panel" role="tabpanel" aria-labelledby="history-tab" hidden={tab !== "history"} tabIndex={0} className={styles.tablePanel}><div className={styles.tableScroll}><table><caption className="sr-only">Your latest 100 transactions. Dates shown in Africa/Lagos time.</caption><thead><tr><th>Date</th><th>Plan / Type</th><th>Crypto method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{profile.transactions.length ? profile.transactions.map((item) => <tr key={item.id}><td><time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time></td><td className={styles.transactionName}>{item.description || typeLabels[item.type]}</td><td>{item.cryptoMethod}</td><td className={styles.amount}>{money(item.amount)}</td><td><span className={`${styles.status} ${styles[item.status]}`}>{item.status}</span></td></tr>) : <tr><td colSpan={5}><div className={styles.empty}><BriefcaseBusiness size={56} aria-hidden="true" /><p>No transactions yet.</p></div></td></tr>}</tbody></table></div></div>
  </section>;
}
