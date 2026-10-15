/* eslint-disable @next/next/no-img-element -- Wallet pictures are admin-provided external image URLs. */
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, Star, X } from "lucide-react";
import styles from "./deposit-modal.module.css";

const networks = { SOL: "Solana Network", BTC: "Bitcoin Network", ETH: "Ethereum Network", XRP: "XRP Ledger" };

export function DepositModal() {
  const dialog = useRef(null);
  const request = useRef(null);
  const copyVersion = useRef(0);
  const [wallets, setWallets] = useState([]);
  const [portalTarget, setPortalTarget] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("100.00");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const selected = wallets.find((wallet) => wallet.id === selectedId);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (portalTarget) dialog.current.showModal(); }, [portalTarget]);

  async function loadWallets() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(""); setWallets([]); setSelectedId(""); setCopied(false); setMessage("");
    try {
      const response = await fetch("/api/wallets", { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load deposit wallets.");
      if (!controller.signal.aborted) { setWallets(data.wallets); setSelectedId(data.wallets[0]?.id || ""); }
    } catch (cause) { if (!controller.signal.aborted) setError(cause.message || "Unable to load deposit wallets."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }

  function open() { if (portalTarget) dialog.current.showModal(); else setPortalTarget(document.body); loadWallets(); }
  function close() { request.current?.abort(); copyVersion.current++; setCopied(false); }
  async function copyAddress() {
    const version = ++copyVersion.current;
    try { await navigator.clipboard.writeText(selected.walletAddress); if (version === copyVersion.current) { setCopied(true); setMessage(""); } }
    catch { if (version === copyVersion.current) setMessage("Copy unavailable. Select the address below to copy it manually."); }
  }

  return <>
    <button type="button" onClick={open}>Deposit</button>
    {portalTarget && createPortal(<dialog ref={dialog} className={styles.modal} aria-labelledby="deposit-title" onClose={close} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <header className={styles.header}><h2 id="deposit-title"><Star size={25} fill="currentColor" aria-hidden="true" />Complete Checkout</h2><button type="button" aria-label="Close deposit" onClick={() => dialog.current.close()}><X size={21} /></button></header>
      <form className={styles.body} onSubmit={(event) => { event.preventDefault(); setMessage("Payment confirmation is not connected yet. Your balance has not been changed."); }}>
        <label className={styles.amountLabel} htmlFor="deposit-amount">Enter deposit amount (USD)</label>
        <div className={styles.amount}><span aria-hidden="true">$</span><input id="deposit-amount" type="number" inputMode="decimal" required min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setMessage(""); }} /></div>
        <section className={styles.selection} aria-label="Deposit wallet selection"><h3>Select Cryptocurrency</h3>
          {loading ? <p className={styles.status} role="status">Loading wallets…</p> : error ? <div role="alert" className={styles.status}><p>{error}</p><button type="button" className="button" onClick={loadWallets}>Retry</button></div> : !wallets.length ? <p className={styles.status}>No deposit wallets are available yet. Please check back later.</p> : <div className={styles.options} role="group" aria-label="Available wallets">{wallets.map((wallet) => <button type="button" key={wallet.id} aria-pressed={wallet.id === selectedId} title={wallet.walletAddress} onClick={() => { copyVersion.current++; setSelectedId(wallet.id); setCopied(false); setMessage(""); }}>{wallet.walletName}</button>)}</div>}
        </section>
        {selected && <section className={styles.destination} aria-label="Selected receiving wallet"><div className={styles.destinationTitle}><span>Send payment to:</span><strong>{networks[selected.cryptoMethod] || (selected.cryptoMethod ? `${selected.cryptoMethod} · confirm network` : "Network not specified")}</strong></div><div className={styles.walletAddress}><code>{selected.walletAddress}</code><button type="button" onClick={copyAddress}>{copied ? "Copied!" : "Copy"}</button></div><details key={selected.id} className={styles.picture}><summary> Scan Qr Code</summary><a href={selected.picture} target="_blank" rel="noopener noreferrer"><img src={selected.picture} alt="Selected wallet payment details" referrerPolicy="no-referrer" /></a></details></section>}
        <button type="submit" className={styles.confirm} disabled={loading || !selected}><CircleCheck size={23} aria-hidden="true" />I Have Made The Payment</button>
        {message && <p className={styles.status} role="status">{message}</p>}
        <p className={styles.footnote}>Confirm the cryptocurrency and network before sending. </p>
      </form>
    </dialog>, portalTarget)}
  </>;
}
