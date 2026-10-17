/* eslint-disable @next/next/no-img-element -- Wallet pictures are admin-provided external image URLs. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, Star, X } from "lucide-react";
import styles from "./deposit-modal.module.css";

const networks = { SOL: "Solana Network", BTC: "Bitcoin Network", ETH: "Ethereum Network", XRP: "XRP Ledger" };
const planNetworks = ["SOL", "BTC", "ETH", "XRP"];

export function DepositModal({ onDeposited, onPlanSubmitted, plan = null, openOnMount = false, onDismiss, triggerLabel = "Deposit", triggerClassName = "" }) {
  const dialog = useRef(null);
  const request = useRef(null);
  const copyVersion = useRef(0);
  const submission = useRef(null);
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [portalTarget, setPortalTarget] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("100.00");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const selected = wallets.find((wallet) => wallet.id === selectedId);

  useEffect(() => () => request.current?.abort(), []);
  const loadWallets = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(""); setWallets([]); setSelectedId(""); setCopied(false); setMessage("");
    try {
      const response = await fetch("/api/wallets", { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load payment wallets.");
      if (!controller.signal.aborted) {
        setWallets(data.wallets);
        const firstPlanWallet = plan && data.wallets.find((wallet) => planNetworks.includes(wallet.cryptoMethod));
        setSelectedId(firstPlanWallet?.id || (plan ? "" : data.wallets[0]?.id) || "");
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message || "Unable to load payment wallets.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (!openOnMount) return;
    setPortalTarget(document.body);
    loadWallets();
  }, [openOnMount, loadWallets]);
  useEffect(() => {
    if (portalTarget && (openOnMount || !plan) && !dialog.current.open) dialog.current.showModal();
  }, [portalTarget, openOnMount, plan]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function open() {
    submission.current = null;
    setCompleted(false);
    if (portalTarget) dialog.current.showModal();
    else setPortalTarget(document.body);
    loadWallets();
  }

  function close() {
    request.current?.abort();
    copyVersion.current++;
    setCopied(false);
    onDismiss?.();
  }

  async function copyAddress() {
    const version = ++copyVersion.current;
    try {
      await navigator.clipboard.writeText(selected.walletAddress);
      if (version === copyVersion.current) { setCopied(true); setMessage(""); }
    } catch {
      if (version === copyVersion.current) setMessage("Copy unavailable. Select the address below to copy it manually.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!selected || inFlight.current || completed) return;
    inFlight.current = true; setSubmitting(true); setMessage("");
    if (!submission.current) {
      submission.current = plan
        ? { type: "subscription", planId: plan.id, walletId: selected.id, idempotencyKey: crypto.randomUUID() }
        : { type: "deposit", walletId: selected.id, amount, idempotencyKey: crypto.randomUUID() };
    }
    try {
      const response = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submission.current) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record the payment.");
      setCompleted(true);
      setMessage(plan ? "Payment submitted. Status: Pending approval." : "Deposit recorded. Status: Pending. Your balance will update after payment approval.");
      setToast(plan ? "Payment submitted, awaiting approval" : "Deposit submitted successfully. It is pending review.");
      onDeposited?.();
      if (plan) onPlanSubmitted?.();
    } catch (cause) {
      setMessage(cause.message || "Unable to record the payment. Please retry.");
    } finally {
      inFlight.current = false; setSubmitting(false);
    }
  }

  return <>
    {!plan && <button type="button" className={triggerClassName} onClick={open}>{triggerLabel}</button>}
    {portalTarget && createPortal(<dialog ref={dialog} className={styles.modal} aria-labelledby="deposit-title" onClose={close} onCancel={(event) => { if (submitting) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !submitting) dialog.current.close(); }}>
      {toast && <div className={styles.toast} role="status"><CircleCheck size={20} aria-hidden="true" /><span>{toast}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast("")}><X size={17} /></button></div>}
      <header className={styles.header}><h2 id="deposit-title"><Star size={25} fill="currentColor" aria-hidden="true" />Complete Checkout</h2><button type="button" aria-label="Close payment" disabled={submitting} onClick={() => dialog.current.close()}><X size={21} /></button></header>
      <form className={styles.body} onSubmit={submit}>
        {plan ? <section className={styles.planSummary} aria-label="Selected premium plan"><div><span>Plan selected</span><strong>{plan.name} Premium</strong></div><div><span>Total to pay</span><strong>{plan.total}</strong></div></section> : <><label className={styles.amountLabel} htmlFor="deposit-amount">Enter deposit amount (USD)</label><div className={styles.amount}><span aria-hidden="true">$</span><input id="deposit-amount" disabled={submitting || completed} type="number" inputMode="decimal" required min="0.01" step="0.01" value={amount} onChange={(event) => { submission.current = null; setAmount(event.target.value); setMessage(""); }} /></div></>}
        <section className={styles.selection} aria-label="Payment wallet selection"><h3>Select Cryptocurrency</h3>
          {loading ? <p className={styles.status} role="status">Loading wallets…</p> : error ? <div role="alert" className={styles.status}><p>{error}</p><button type="button" className="button" onClick={loadWallets}>Retry</button></div> : plan ? <div className={styles.options} role="group" aria-label="Available cryptocurrencies">{planNetworks.map((network) => { const wallet = wallets.find((item) => item.cryptoMethod === network); return <button type="button" key={network} disabled={!wallet || submitting || completed} aria-pressed={wallet?.id === selectedId} onClick={() => { if (!wallet) return; submission.current = null; copyVersion.current++; setSelectedId(wallet.id); setCopied(false); setMessage(""); }}>{network}</button>; })}</div> : !wallets.length ? <p className={styles.status}>No deposit wallets are available yet. Please check back later.</p> : <div className={styles.options} role="group" aria-label="Available wallets">{wallets.map((wallet) => <button type="button" key={wallet.id} disabled={submitting || completed} aria-pressed={wallet.id === selectedId} title={wallet.walletAddress} onClick={() => { submission.current = null; copyVersion.current++; setSelectedId(wallet.id); setCopied(false); setMessage(""); }}>{wallet.walletName}</button>)}</div>}
        </section>
        {selected && <section className={styles.destination} aria-label="Selected receiving wallet"><div className={styles.destinationTitle}><span>Send exact amount to:</span><strong>{networks[selected.cryptoMethod] || (selected.cryptoMethod ? `${selected.cryptoMethod} · confirm network` : "Network not specified")}</strong></div><div className={styles.walletAddress}><code>{selected.walletAddress}</code><button type="button" onClick={copyAddress}>{copied ? "Copied!" : "Copy"}</button></div><details key={selected.id} className={styles.picture}><summary>Scan QR code</summary><a href={selected.picture} target="_blank" rel="noopener noreferrer"><img src={selected.picture} alt="Selected wallet payment details" referrerPolicy="no-referrer" /></a></details></section>}
        {plan && !loading && !error && !selected && <p className={styles.status} role="status">No SOL, BTC, ETH, or XRP payment wallet is available right now.</p>}
        <button type="submit" className={styles.confirm} disabled={loading || !selected || submitting || completed}><CircleCheck size={23} aria-hidden="true" />{submitting ? "Submitting payment…" : completed ? "Payment Submitted — Pending" : "I Have Made The Payment"}</button>
        {message && <p className={styles.status} role="status">{message}</p>}
        <p className={styles.footnote}>Transactions are reviewed by our team. Your plan activates after approval.</p>
      </form>
    </dialog>, portalTarget)}
  </>;
}
