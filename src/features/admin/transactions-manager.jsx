"use client";

import { useEffect, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
import styles from "./admin-manager.module.css";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const title = (tx) => tx.description || (tx.type === "subscription" ? "Premium subscription" : tx.type.charAt(0).toUpperCase() + tx.type.slice(1));

export function TransactionsManager() {
  const [transactions, setTransactions] = useState([]); const [pagination, setPagination] = useState(null); const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState(""); const [error, setError] = useState(""); const [retry, setRetry] = useState(0); const [busyId, setBusyId] = useState(""); const [notice, setNotice] = useState("");
  const requestKey = `${page}:${retry}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/transactions?page=${page}`, { cache: "no-store", signal: controller.signal }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load transactions."); if (!controller.signal.aborted) { setTransactions(data.transactions); setPagination(data.pagination); setError(""); setLoadedKey(requestKey); } }).catch((cause) => { if (!controller.signal.aborted) { setError(cause.message); setLoadedKey(requestKey); } });
    return () => controller.abort();
  }, [page, requestKey]);
  async function review(transaction, status) {
    if (busyId) return; setBusyId(transaction.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/transactions/${transaction.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to review transaction.");
      setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, status: data.transaction.status } : item)); setNotice(status === "completed" ? (transaction.type === "deposit" ? "Deposit confirmed and user balance credited." : transaction.type === "subscription" ? "Subscription confirmed and premium plan activated." : "Transaction confirmed.") : "Transaction marked as failed.");
    } catch (cause) { setError(cause.message || "Unable to reach the transaction service."); } finally { setBusyId(""); }
  }
  return <section className={styles.page}>
    <header className={styles.header}><div><h1>Transactions</h1><p>Review user payments and approve or fail pending transactions.</p></div><strong>{pagination?.total ?? "—"} records</strong></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
    {loadedKey !== requestKey && !error ? <div className={styles.empty} role="status">Loading transactions…</div> : transactions.length ? <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>User</th><th>Plan / Type</th><th>Crypto</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>{transactions.map((tx) => <tr key={tx.id}><td>{new Date(tx.createdAt).toLocaleString()}</td><td><strong>{tx.username}</strong><small className={styles.subtext}>{tx.email}</small></td><td>{title(tx)}</td><td>{tx.cryptoMethod}</td><td className={styles.amount}>{money(tx.amount)}</td><td><span className={`${styles.status} ${styles[tx.status]}`}>{tx.status}</span></td><td>{tx.status === "pending" || tx.status === "processing" ? <div className={styles.actions}><button type="button" className={styles.approve} disabled={Boolean(busyId)} onClick={() => review(tx, "completed")}><CircleCheck size={15} />{tx.status === "processing" ? "Resume" : "Confirm"}</button>{tx.status === "pending" && <button type="button" className={styles.fail} disabled={Boolean(busyId)} onClick={() => review(tx, "failed")}><XCircle size={15} />Failed</button>}</div> : <span className={styles.muted}>Reviewed</span>}</td></tr>)}</tbody></table></div> : <div className={styles.empty}>No transactions found.</div>}
    {pagination?.totalPages > 1 && <nav className={styles.pagination} aria-label="Transaction pages"><button className="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button" disabled={page >= pagination.totalPages} onClick={() => setPage((n) => n + 1)}>Next</button></nav>}
  </section>;
}
