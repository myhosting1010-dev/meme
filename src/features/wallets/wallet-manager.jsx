/* eslint-disable @next/next/no-img-element -- Wallet previews use admin-provided external image URLs. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import styles from "./wallet-manager.module.css";

export function WalletManager() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/wallets", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load wallets.");
      setWallets(data.wallets); setFailure(""); setLoading(false);
    }).catch((error) => { if (!controller.signal.aborted) { setFailure(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (editor) dialog.current.showModal();
    else dialog.current.close();
  }, [editor]);

  function open(mode, wallet = null) {
    setFormError(""); setNotice(""); setEditor({ mode, wallet });
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setFormError("");
    const deleting = editor.mode === "delete";
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch(editor.wallet ? `/api/wallets/${editor.wallet.id}` : "/api/wallets", {
        method: deleting ? "DELETE" : editor.wallet ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(deleting ? {} : { body: JSON.stringify({ walletName: values.get("walletName"), walletAddress: values.get("walletAddress"), picture: values.get("picture"), cryptoMethod: values.get("cryptoMethod") }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save changes.");
      setWallets((current) => deleting ? current.filter((wallet) => wallet.id !== data.deletedId) : editor.wallet ? current.map((wallet) => wallet.id === data.wallet.id ? data.wallet : wallet) : [data.wallet, ...current]);
      setNotice(deleting ? "Wallet deleted." : editor.wallet ? "Wallet updated." : "Wallet added.");
      setEditor(null);
    } catch (error) { setFormError(error.message || "Unable to reach the wallet service."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section className={styles.page}>
    <header className={styles.header}><button type="button" className={styles.add} onClick={() => open("add")}><Plus size={20} />Add Wallet</button><div><h1>Wallets</h1><p>Manage receiving addresses and wallet pictures.</p></div></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {failure ? <div className={styles.empty} role="alert"><p>{failure}</p><button type="button" className="button" onClick={() => { setLoading(true); setFailure(""); setRetry((value) => value + 1); }}>Retry</button></div> : loading ? <p className={styles.empty} role="status">Loading wallets…</p> : wallets.length ? <ul className={styles.list}>{wallets.map((wallet) => <li key={wallet.id} className={styles.card}><div className={styles.picture}><Wallet size={32} aria-hidden="true" /><img src={wallet.picture} alt={`Wallet ${wallet.walletAddress}`} loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} /></div><div className={styles.details}><h2>{wallet.walletName}</h2><span>Wallet address</span><p>{wallet.walletAddress}</p><a href={wallet.picture} target="_blank" rel="noopener noreferrer">Scan Wallet QR</a></div><div className={styles.actions}><button type="button" className="button" aria-label={`Edit ${wallet.walletAddress}`} onClick={() => open("edit", wallet)}><Pencil size={16} />Edit</button><button type="button" className={`button ${styles.danger}`} aria-label={`Delete ${wallet.walletAddress}`} onClick={() => open("delete", wallet)}><Trash2 size={16} />Delete</button></div></li>)}</ul> : <div className={styles.empty}><Wallet size={42} aria-hidden="true" /><h2>No wallets yet</h2><p>Use Add Wallet to create your first wallet.</p></div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="wallet-editor-title" onClose={() => setEditor(null)} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setEditor(null); }}>
      {editor && <form key={`${editor.mode}-${editor.wallet?.id ?? "new"}`} onSubmit={submit} className={styles.form}>
        <header><h2 id="wallet-editor-title">{editor.mode === "delete" ? "Delete wallet" : editor.mode === "edit" ? "Edit wallet" : "Add wallet"}</h2><button type="button" className={styles.close} aria-label="Close wallet form" disabled={busy} onClick={() => setEditor(null)}><X size={22} /></button></header>
        {editor.mode === "delete" ? <p className={styles.confirm}>Delete <strong>{editor.wallet.walletName}</strong> ({editor.wallet.walletAddress})? This removes the wallet from the available wallet list.</p> : <><label>Wallet name<input name="walletName" defaultValue={editor.wallet?.walletName ?? ""} required maxLength={100} placeholder="Enter wallet name" disabled={busy} autoFocus /></label><label>Wallet address<input name="walletAddress" defaultValue={editor.wallet?.walletAddress ?? ""} placeholder="Enter wallet address" disabled={busy} /></label><label>Picture URL<input name="picture" type="url" defaultValue={editor.wallet?.picture ?? ""} required maxLength={2048} pattern="https://.*" placeholder="https://example.com/wallet.png" disabled={busy} /><small>Use an HTTPS image URL.</small></label></>}
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        {editor.mode !== "delete" && <label>Cryptocurrency<select name="cryptoMethod" defaultValue={editor.wallet?.cryptoMethod || ""} disabled={busy}><option value="">Not specified</option>{["SOL", "BTC", "ETH", "XRP", "USDC", "BEP-20", "USDT"].map((method) => <option key={method}>{method}</option>)}</select></label>}
        <footer><button type="button" className="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button type="submit" className={editor.mode === "delete" ? styles.remove : styles.add} disabled={busy}>{busy ? "Please wait…" : editor.mode === "delete" ? "Delete wallet" : "Save wallet"}</button></footer>
      </form>}
    </dialog>
  </section>;
}
