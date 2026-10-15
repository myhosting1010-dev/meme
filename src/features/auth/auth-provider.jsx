"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CircleAlert, X } from "lucide-react";
import { site } from "@/constants/site";
import styles from "./auth.module.css";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const router = useRouter();
  const dialog = useRef(null);
  const submitting = useRef(false);
  const [target, setTarget] = useState(null);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loungePending, setLoungePending] = useState(false);
  const signup = mode === "signup";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { signal: controller.signal, cache: "no-store" }).then((response) => response.json()).then((data) => setUser(data.user ?? null)).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => { if (target) dialog.current.showModal(); }, [target]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  function openAuth() {
    setMode("signin"); setError("");
    if (target) dialog.current.showModal();
    else setTarget(document.body);
  }
  async function requireSignin() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data.user);
      if (data.user) return data.user;
      openAuth();
      setToast("You need to signin to access this feature");
    } catch (cause) {
      openAuth();
      setError(cause.message || "Unable to check your session. Please try again.");
    }
    return null;
  }
  async function accessLounge() {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data.user);
      if (data.user) { router.push("/alpha-lounge"); return; }
      setLoungePending(true);
      openAuth();
      setToast("You need to signin to access this feature");
    } catch (cause) { openAuth(); setError(cause.message || "Unable to check your session. Please try again."); }
  }
  async function signout() {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      setUser(null); router.push("/"); router.refresh();
    } catch (cause) { openAuth(); setError(cause.message); }
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = Object.fromEntries(values);
    payload.remember = values.get("remember") === "on";
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in. Please try again.");
      setUser(data.user); setToast(""); form.reset(); dialog.current.close();
      if (loungePending) router.push("/alpha-lounge");
      router.refresh();
    } catch (cause) { setError(cause.message || "Unable to reach the account service."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <AuthContext.Provider value={{ user, openAuth, accessLounge, signout, requireSignin }}>
    {children}
    {target && createPortal(<dialog ref={dialog} className={styles.modal} aria-labelledby="auth-title" onClick={(event) => { if (event.target === event.currentTarget && !busy) dialog.current.close(); }} onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => { setToast(""); setError(""); setLoungePending(false); }}>
      {toast && <div className={styles.toast} role="alert"><CircleAlert size={23} aria-hidden="true" />{toast}</div>}
      <div className={styles.content}>
        <button className={styles.close} type="button" disabled={busy} aria-label="Close sign in" onClick={() => dialog.current.close()}><X size={21} /></button>
        <h2 id="auth-title" className={styles.brand}><span className="brand-gem" aria-hidden="true" />{site.name} Pro</h2>
        <div className={styles.tabs} role="group" aria-label="Account action"><button type="button" disabled={busy} aria-pressed={!signup} onClick={() => { setMode("signin"); setError(""); }}>Sign In</button><button type="button" disabled={busy} aria-pressed={signup} onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button></div>
        <form key={mode} className={`${styles.form} ${signup ? styles.signup : ""}`} onSubmit={submit}>
          {signup && <><label>Username<input name="username" placeholder="Enter username" autoComplete="username" minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" required disabled={busy} /></label><label>X (Twitter) username <span>(Optional)</span><input name="twitterUsername" placeholder="@username" maxLength={16} pattern="@?[a-zA-Z0-9_]+" disabled={busy} /></label></>}
          <label>Email<input name="email" type="email" placeholder="Enter email" autoComplete="email" maxLength={254} required disabled={busy} /></label>
          <label>Password<input name="password" type="password" placeholder={signup ? "At least 12 characters" : "Enter password"} autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : 1} maxLength={128} required disabled={busy} /></label>
          {!signup && <div className={styles.formOptions}><label><input type="checkbox" name="remember" disabled={busy} />Remember me</label><button type="button" onClick={() => setError("Password recovery is not available yet.")}>Forgot Password?</button></div>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.submit} disabled={busy}>{busy ? "Please wait…" : signup ? "Create Account" : "Sign In"}</button>
        </form>
      </div>
    </dialog>, target)}
  </AuthContext.Provider>;
}
