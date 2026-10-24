"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./admin-manager.module.css";

export function WithdrawalSettings() {
  const [amount, setAmount] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/payment-settings", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load withdrawal settings.");
      if (!controller.signal.aborted) { setAmount((data.minimumWithdrawal / 100).toFixed(2)); setLoaded(true); setError(""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [retry]);
  async function save(event) {
    event.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/payment-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ minimumWithdrawal: amount }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to save minimum.");
      setAmount((data.minimumWithdrawal / 100).toFixed(2)); setNotice("Minimum withdrawal updated. It applies to new withdrawal requests.");
    } catch (cause) { setError(cause.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <section className={styles.withdrawalSettings} aria-labelledby="withdrawal-settings-title">
    <h2 id="withdrawal-settings-title">Withdrawal settings</h2>
    <p>Set the minimum USD amount displayed and enforced when users request a withdrawal.</p>
    {loaded ? <form onSubmit={save} className={styles.settingsForm}><label htmlFor="minimum-withdrawal">Minimum withdrawal (USD)<input id="minimum-withdrawal" type="number" min="0.01" step="0.01" required disabled={busy} value={amount} onChange={(event) => setAmount(event.target.value)} /></label><button type="submit" className={styles.primary} disabled={busy}>{busy ? "Saving..." : "Save minimum"}</button></form> : <p role="status">Loading settings...</p>}
    {error && <p className={styles.error} role="alert">{error} {!loaded && <button type="button" className="button" onClick={() => setRetry((value) => value + 1)}>Retry</button>}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
  </section>;
}
