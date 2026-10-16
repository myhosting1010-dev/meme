/* eslint-disable @next/next/no-img-element -- Trader avatars are admin-provided HTTPS image URLs. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import styles from "./traders-manager.module.css";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function TradersManager() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/traders", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load traders.");
      if (!controller.signal.aborted) { setTraders(data.traders); setFailure(""); setLoading(false); }
    }).catch((error) => { if (!controller.signal.aborted) { setFailure(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (editor) dialog.current.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [editor]);

  function open(mode, trader = null) {
    setFormError(""); setNotice(""); setEditor({ mode, trader });
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setFormError("");
    const deleting = editor.mode === "delete";
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch(editor.trader ? `/api/admin/traders/${editor.trader.id}` : "/api/admin/traders", {
        method: deleting ? "DELETE" : editor.trader ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(!deleting ? { body: JSON.stringify({
          username: values.get("username"), userId: values.get("userId"), avatarUrl: values.get("avatarUrl"),
          profitUsd: values.get("profitUsd"), followersCount: Number(values.get("followersCount")), listed: values.get("listed") === "true",
        }) } : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save trader changes.");
      setTraders((current) => deleting ? current.filter((trader) => trader.id !== data.deletedId) : editor.trader ? current.map((trader) => trader.id === data.trader.id ? data.trader : trader).sort((a, b) => b.profitUsdCents - a.profitUsdCents) : [...current, data.trader].sort((a, b) => b.profitUsdCents - a.profitUsdCents));
      setNotice(deleting ? "Trader deleted." : editor.trader ? "Trader updated." : "Trader added.");
      setEditor(null);
    } catch (error) { setFormError(error.message || "Unable to reach the trader service."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section className={styles.page}>
    <header className={styles.header}><button type="button" className={styles.primary} onClick={() => open("add")}><Plus size={19} />Add Trader</button><div><h1>Traders</h1><p>Manage Alpha Lounge rankings and trader profiles.</p></div></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {failure ? <div className={styles.empty} role="alert"><p>{failure}</p><button type="button" className="button" onClick={() => { setLoading(true); setFailure(""); setRetry((value) => value + 1); }}>Retry</button></div> : loading ? <p className={styles.empty} role="status">Loading traders…</p> : traders.length ? <div className={styles.tableWrap}><table><thead><tr><th>Rank</th><th>Trader</th><th>Profit</th><th>Followers</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{traders.map((trader, index) => <tr key={trader.id}><td className={styles.rank}>{index + 1}</td><td><div className={styles.identity}><span className={styles.avatar}>{trader.avatarUrl ? <img src={trader.avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <UserRound size={20} />}</span><span><strong>{trader.username}</strong><small>{trader.userId || "No linked account"}</small></span></div></td><td className={styles.profit}>{money(trader.profitUsdCents)}</td><td>{trader.followersCount.toLocaleString("en-US")}</td><td><span className={`${styles.visibility} ${trader.listed ? styles.visible : styles.hidden}`}>{trader.listed ? "Listed" : "Hidden"}</span></td><td><div className={styles.actions}><button type="button" className="button" onClick={() => open("edit", trader)} aria-label={`Edit ${trader.username}`}><Pencil size={15} />Edit</button><button type="button" className={`button ${styles.danger}`} onClick={() => open("delete", trader)} aria-label={`Delete ${trader.username}`}><Trash2 size={15} />Delete</button></div></td></tr>)}</tbody></table></div> : <div className={styles.empty}><Crown size={40} /><h2>No traders added yet</h2><p>Add trader profiles to populate the Alpha Lounge ranking.</p></div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="trader-editor-title" onClose={() => setEditor(null)} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setEditor(null); }}>
      {editor && <form key={`${editor.mode}-${editor.trader?.id || "new"}`} className={styles.form} onSubmit={submit}>
        <header><h2 id="trader-editor-title">{editor.mode === "delete" ? "Delete trader" : editor.mode === "edit" ? "Edit trader" : "Add trader"}</h2><button type="button" className={styles.close} disabled={busy} aria-label="Close trader form" onClick={() => setEditor(null)}><X size={21} /></button></header>
        {editor.mode === "delete" ? <p className={styles.confirm}>Delete <strong>{editor.trader.username}</strong> from the Alpha Lounge rankings?</p> : <>
          <label>Username<input name="username" defaultValue={editor.trader?.username || ""} required minLength={2} maxLength={30} placeholder="e.g. counter17" disabled={busy} autoFocus /></label>
          <label>Linked user ID <span>(optional)</span><input name="userId" defaultValue={editor.trader?.userId || ""} maxLength={24} pattern="[a-fA-F0-9]{24}" placeholder="MongoDB user ID" disabled={busy} /></label>
          <label>Avatar URL <span>(optional, HTTPS)</span><input name="avatarUrl" type="url" defaultValue={editor.trader?.avatarUrl || ""} maxLength={2048} pattern="https://.*" placeholder="https://example.com/avatar.png" disabled={busy} /></label>
          <div className={styles.paired}><label>Reported profit (USD)<input name="profitUsd" type="number" required min="0" step="0.01" defaultValue={editor.trader ? (editor.trader.profitUsdCents / 100).toFixed(2) : "0.00"} disabled={busy} /></label><label>Followers<input name="followersCount" type="number" required min="0" step="1" defaultValue={editor.trader?.followersCount ?? 0} disabled={busy} /></label></div>
          <label>Leaderboard visibility<select name="listed" defaultValue={String(editor.trader?.listed ?? true)} disabled={busy}><option value="true">Listed</option><option value="false">Hidden</option></select></label>
        </>}
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <footer><button type="button" className="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button type="submit" className={editor.mode === "delete" ? styles.dangerButton : styles.primary} disabled={busy}>{busy ? "Please wait…" : editor.mode === "delete" ? "Delete trader" : "Save trader"}</button></footer>
      </form>}
    </dialog>
  </section>;
}
