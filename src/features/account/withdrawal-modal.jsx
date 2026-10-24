"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, X } from "lucide-react";
import { withdrawalNetworks } from "@/schemas/withdrawal";
import styles from "./withdrawal-modal.module.css";
const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function WithdrawalModal({ onRequested }) {
  const dialog = useRef(null);
  const inFlight = useRef(false);
  const submission = useRef(null);
  const loader = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("SOL");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => loader.current?.abort(), []);

  useEffect(() => { if (portalTarget) dialog.current?.showModal(); }, [portalTarget]);

  async function load() {
    loader.current?.abort();
    const controller = new AbortController(); loader.current = controller;
    setLoading(true); setError(""); setDetails(null);
    try {
      const response = await fetch("/api/withdrawals", { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load withdrawal details.");
      if (!controller.signal.aborted) setDetails(data);
    } catch (cause) { if (!controller.signal.aborted) setError(cause.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  function open() {
    if (completed) { submission.current = null; setAmount(""); setAddress(""); }
    setCompleted(false); if (portalTarget) dialog.current.showModal(); else setPortalTarget(document.body); load();
  }
  function changed(setter, value) { submission.current = null; setError(""); setter(value); }
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || completed || !details) return;
    inFlight.current = true; setBusy(true); setError("");
    submission.current ??= { amount, network, destinationAddress: address, idempotencyKey: crypto.randomUUID() };
    try {
      const response = await fetch("/api/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submission.current) });
      const data = await response.json();
      if (!response.ok) {
        if (data.minimumWithdrawal !== undefined) setDetails({ minimumWithdrawal: data.minimumWithdrawal, balance: data.balance });
        throw new Error(data.error || "Unable to request withdrawal.");
      }
      setCompleted(true); onRequested?.();
    } catch (cause) { setError(cause.message || "Unable to request withdrawal. Please retry."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const disabled = busy || completed;
  return <>
    <button type="button" onClick={open}>Withdraw</button>
    {portalTarget && createPortal(<dialog ref={dialog} className={styles.modal} aria-labelledby="withdraw-title" onClose={() => loader.current?.abort()} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) dialog.current.close(); }}>
      <header className={styles.header}><h2 id="withdraw-title"><CircleCheck size={27} aria-hidden="true" />Withdraw Funds</h2><button type="button" disabled={busy} aria-label="Close withdrawal" onClick={() => dialog.current.close()}><X size={22} /></button></header>
      <form onSubmit={submit} className={styles.form}>
        <section className={styles.balance}><span>Available balance</span><strong>{details ? money(details.balance) : "Loading..."}</strong></section>
        {loading && <p role="status">Loading withdrawal details...</p>}
        {!loading && !details && <button type="button" className="button" onClick={load}>Retry</button>}
        <div><div className={styles.amountLabel}><label htmlFor="withdraw-amount">Withdrawal amount (USD)</label><strong>{details ? "Min: " + money(details.minimumWithdrawal) : "Min: ..."}</strong></div>
          <div className={styles.amount}><span aria-hidden="true">$</span><input id="withdraw-amount" type="number" inputMode="decimal" placeholder="0.00" min={details ? details.minimumWithdrawal / 100 : 0.01} max={details ? details.balance / 100 : undefined} step="0.01" required disabled={disabled || !details} value={amount} onChange={(event) => changed(setAmount, event.target.value)} /><button type="button" disabled={disabled || !details} onClick={() => changed(setAmount, (details.balance / 100).toFixed(2))}>MAX</button></div>
        </div>
        <label className={styles.field}>Select network<select disabled={disabled} value={network} onChange={(event) => changed(setNetwork, event.target.value)}>{Object.entries(withdrawalNetworks).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className={styles.field}>Destination address<input type="text" autoComplete="off" spellCheck={false} required minLength={26} maxLength={90} placeholder="Enter wallet address..." disabled={disabled} value={address} onChange={(event) => changed(setAddress, event.target.value)} /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {completed && <p className={styles.success} role="status">Withdrawal recorded. Status: Pending. You can follow it in Transaction History.</p>}
        <button className={styles.submit} type="submit" disabled={disabled || !details || loading || details.balance < details.minimumWithdrawal}>{busy ? "Submitting..." : completed ? "Withdrawal Pending" : "Request Withdrawal"}</button>
        <p className={styles.footnote}>Withdrawals are reviewed manually. Your balance is deducted when the request is approved.</p>
      </form>
    </dialog>, portalTarget)}
  </>;
}
