"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import styles from "./admin-manager.module.css";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const pnl = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "always" }).format(cents / 100);
const signedInput = (cents) => `${cents >= 0 ? "+" : "-"}${Math.floor(Math.abs(cents) / 100)}.${String(Math.abs(cents) % 100).padStart(2, "0")}`;

export function TradesManager() {
  const [trades, setTrades] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingTradeId, setPendingTradeId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const inFlight = useRef(false);
  const requestKey = `${page}:${retry}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/trades?page=${page}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load trades.");
        if (!controller.signal.aborted) { setTrades(data.trades); setPagination(data.pagination); setError(""); setLoadedKey(requestKey); }
      }).catch((cause) => { if (!controller.signal.aborted) { setError(cause.message); setLoadedKey(requestKey); } });
    return () => controller.abort();
  }, [page, requestKey]);

  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [editor]);

  async function changeStatus(trade) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setPendingTradeId(trade.id); setActionError(""); setNotice("");
    const status = trade.status === "closed" ? "open" : "closed";
    try {
      const response = await fetch("/api/admin/trades", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: trade.userId, tradeId: trade.id, version: trade.statusVersion, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change trade status.");
      setTrades((current) => current.map((item) => item.id === data.tradeId ? { ...item, status: data.status, statusVersion: data.statusVersion } : item));
      setNotice((data.status === "closed" ? "Trade closed. " : "Trade opened. ") + money(Math.abs(data.balanceChange)) + (data.balanceChange < 0 ? " deducted from " : " added to ") + data.username + "'s balance. Updated available balance: " + money(data.balance) + ".");
    } catch (cause) { setActionError(cause.message || "Unable to reach the trade service."); }
    finally { inFlight.current = false; setBusy(false); setPendingTradeId(null); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!editor || inFlight.current) return;
    const form = new FormData(event.currentTarget);
    inFlight.current = true; setBusy(true); setFormError("");
    try {
      const response = await fetch("/api/admin/trades", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editor.userId, tradeId: editor.id, version: editor.pnlVersion, realizedPnl: form.get("realizedPnl"), unrealizedPnl: form.get("unrealizedPnl") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update PNL.");
      setTrades((current) => current.map((trade) => trade.id === data.tradeId ? { ...trade, realizedPnl: data.realizedPnl, unrealizedPnl: data.unrealizedPnl, pnlVersion: data.pnlVersion } : trade));
      setEditor(null); setNotice("Trade PNL updated.");
    } catch (cause) { setFormError(cause.message || "Unable to reach the trade service."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section className={styles.page}>
    <header className={styles.header}><div><h1>Trades</h1><p>All user purchases and their admin-adjusted PNL in USD.</p></div><div className={styles.actions}><strong>{pagination?.total ?? "—"} trades</strong><button className="button" type="button" onClick={() => setRetry((n) => n + 1)}>Refresh</button></div></header>
    <p>{"Manage user's trades"}</p>
    {(actionError || notice) && <div className={styles.tradeNotification}>
      <div className={actionError ? styles.tradeNotificationError : styles.notice} role={actionError ? "alert" : "status"} aria-atomic="true">
        <span>{actionError || notice}</span>
        <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => { setActionError(""); setNotice(""); }}><X size={18} aria-hidden="true" /></button>
      </div>
    </div>}
    {error ? <div className={styles.empty} role="alert"><p>{error}</p><button className="button" onClick={() => setRetry((n) => n + 1)}>Retry</button></div>
      : loadedKey !== requestKey ? <div className={styles.empty} role="status">Loading trades…</div>
        : trades.length ? <div className={styles.tableWrap}><table><thead><tr><th>User</th><th>Coin / Quantity</th><th>Entry price</th><th>Market cap at purchase</th><th>Buy amount</th><th>Realized PNL</th><th>Unrealized PNL</th><th>Purchased</th><th>Status / Action</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}>
          <td><div className={styles.identity}><span><strong>{trade.username}</strong><small>{trade.email}</small></span></div></td>
          <td><strong>{trade.coinName}</strong><span className={styles.subtext}>{new Intl.NumberFormat("en-US", { maximumSignificantDigits: 10 }).format(trade.quantity)} {trade.symbol}</span></td>
          <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumSignificantDigits: 8 }).format(trade.priceUsd)}</td>
          <td>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(trade.marketCap)}</td>
          <td>{money(trade.amount)}</td>
          <td className={trade.realizedPnl < 0 ? styles.loss : styles.gain}>{pnl(trade.realizedPnl)}</td>
          <td className={trade.unrealizedPnl < 0 ? styles.loss : styles.gain}>{pnl(trade.unrealizedPnl)}</td>
          <td>{new Date(trade.createdAt).toLocaleString()}</td>
          <td><div className={styles.actions}><span className={trade.status === "closed" ? styles.subtext : styles.gain}>{trade.status === "closed" ? "Closed" : "Open"}</span><button className="button" type="button" disabled={busy} aria-busy={pendingTradeId === trade.id} onClick={() => changeStatus(trade)}>{pendingTradeId === trade.id ? (trade.status === "closed" ? "Opening..." : "Closing...") : (trade.status === "closed" ? "Open" : "Close")}</button><button className="button" type="button" disabled={busy} onClick={() => { setFormError(""); setEditor(trade); }}><Pencil size={15} aria-hidden="true" /> Edit PNL</button></div></td>
        </tr>)}</tbody></table></div> : <div className={styles.empty}>No trades have been made yet.</div>}
    {pagination?.totalPages > 1 && <nav className={styles.pagination} aria-label="Trade pages"><button className="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button" disabled={page >= pagination.totalPages} onClick={() => setPage((n) => n + 1)}>Next</button></nav>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="trade-pnl-title" onClose={() => setEditor(null)} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setEditor(null); }}>
      {editor && <form className={styles.form} onSubmit={submit}>
        <header><h2 id="trade-pnl-title">Edit trade PNL</h2><button className={styles.close} type="button" disabled={busy} aria-label="Close" onClick={() => setEditor(null)}><X size={20} /></button></header>
        <p className={styles.confirm}>{editor.username} · {editor.coinName}<br />Set the PNL totals in USD. Use + for profit and - for loss. For example, +25.00 or -10.50. These signed values are included when closing the trade. Editing PNL does not change a previously settled balance.</p>
        <label>Realized PNL (USD)<input name="realizedPnl" type="text" required maxLength={22} disabled={busy} defaultValue={signedInput(editor.realizedPnl)} placeholder="+0.00" /></label>
        <label>Unrealized PNL (USD)<input name="unrealizedPnl" type="text" required maxLength={22} disabled={busy} defaultValue={signedInput(editor.unrealizedPnl)} placeholder="-0.00" /></label>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <footer><button type="button" className="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button type="submit" className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save PNL"}</button></footer>
      </form>}
    </dialog>
  </section>;
}
