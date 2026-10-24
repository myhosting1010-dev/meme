"use client";
import { transactionTabs } from "@/lib/transaction-filters";
import styles from "./transaction-filters.module.css";

export function TransactionFilters({ value, onChange, id, disabled = false }) {
  return <div className={styles.tabs} role="tablist" aria-label="Transaction types">{transactionTabs.map((tab, index) => <button key={tab.value} type="button" role="tab" id={id + "-" + tab.value} aria-controls={id + "-panel"} aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1} disabled={disabled} onClick={() => onChange(tab.value)} onKeyDown={(event) => {
    const next = event.key === "Home" ? 0 : event.key === "End" ? transactionTabs.length - 1 : event.key === "ArrowRight" ? (index + 1) % transactionTabs.length : event.key === "ArrowLeft" ? (index + transactionTabs.length - 1) % transactionTabs.length : null;
    if (next === null) return;
    event.preventDefault(); onChange(transactionTabs[next].value); document.getElementById(id + "-" + transactionTabs[next].value)?.focus();
  }}>{tab.label}</button>)}</div>;
}
export function TransactionTypePill({ type }) {
  const labels = { deposit: "Deposit", withdrawal: "Withdrawal", subscription: "Subscription", buy: "Buy", sell: "Sell" };
  return <span className={styles.pill + " " + (styles[type] || styles.other)}>{labels[type] || type}</span>;
}
