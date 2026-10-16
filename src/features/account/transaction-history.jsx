"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import styles from "./account-profile.module.css";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const labels = { deposit: "Deposit", withdrawal: "Withdrawal", subscription: "Premium subscription", buy: "Buy", sell: "Sell" };
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function TransactionHistory({ initialData, active, refreshKey }) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState({ key: refreshKey === 0 ? "1:0:0" : "", data: initialData, error: "" });
  const key = `${page}:${refreshKey}:${retry}`;
  const loading = result.key !== key;
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    fetch(`/api/transactions?page=${page}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load transactions.");
      if (!controller.signal.aborted) setResult({ key, data, error: "" });
    }).catch((error) => { if (!controller.signal.aborted) setResult((current) => ({ ...current, key, error: error.message })); });
    return () => controller.abort();
  }, [active, key, page]);
  const { transactions, pagination } = result.data;
  return <div id="history-panel" role="tabpanel" aria-labelledby="history-tab" hidden={!active} tabIndex={0} className={styles.tablePanel} aria-busy={loading}>
    <div className={styles.tableScroll}><table><caption className="sr-only">Your transactions, 10 per page. Dates shown in Africa/Lagos time.</caption><thead><tr><th>Date</th><th>Plan / Type</th><th>Crypto method</th><th>Amount</th><th>Status</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={5}><p className={styles.empty} role="status">Loading transactions…</p></td></tr> : result.error ? <tr><td colSpan={5}><div className={styles.empty} role="alert"><p>{result.error}</p><button type="button" className="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div></td></tr> : transactions.length ? transactions.map((item) => <tr key={item.id}><td><time dateTime={item.date}>{dateFormat.format(new Date(item.date))}</time></td><td className={styles.transactionName}>{item.description || labels[item.type]}</td><td>{item.cryptoMethod === "UNSPECIFIED" ? item.walletName || "Not specified" : item.cryptoMethod}</td><td className={styles.amount}>{money(item.amount)}</td><td><span className={`${styles.status} ${styles[item.status]}`}>{item.status}</span></td></tr>) : <tr><td colSpan={5}><div className={styles.empty}><BriefcaseBusiness size={56} aria-hidden="true" /><p>{page === 1 ? "No transactions yet." : "No transactions on this page."}</p></div></td></tr>}
    </tbody></table></div>
    <nav className={styles.pagination} aria-label="Transaction history pages"><button type="button" className="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span aria-live="polite">Page {page} of {Math.max(page, pagination.totalPages)} · {pagination.total} transactions</span><button type="button" className="button" disabled={loading || !!result.error || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></nav>
  </div>;
}
