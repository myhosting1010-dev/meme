"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, UserRound, X } from "lucide-react";
import styles from "./admin-manager.module.css";

const money = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function UsersManager() {
  const [users, setUsers] = useState([]); const [pagination, setPagination] = useState(null); const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState(""); const [error, setError] = useState(""); const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null); const [formError, setFormError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const dialog = useRef(null); const inFlight = useRef(false);
  const requestKey = `${page}:${retry}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/users?page=${page}`, { cache: "no-store", signal: controller.signal }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load users."); if (!controller.signal.aborted) { setUsers(data.users); setPagination(data.pagination); setError(""); setLoadedKey(requestKey); } }).catch((cause) => { if (!controller.signal.aborted) { setError(cause.message); setLoadedKey(requestKey); } });
    return () => controller.abort();
  }, [page, requestKey]);
  useEffect(() => { if (editor) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close(); }, [editor]);
  async function submit(event) {
    event.preventDefault(); if (!editor || inFlight.current) return; inFlight.current = true; setBusy(true); setFormError("");
    const deleting = editor.mode === "delete"; const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/users", { method: deleting ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deleting ? { id: editor.user.id } : { id: editor.user.id, username: form.get("username"), email: form.get("email"), role: form.get("role"), membershipPlan: form.get("membershipPlan"), balance: form.get("balance") }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to save user.");
      setUsers((current) => deleting ? current.filter((user) => user.id !== data.deletedId) : current.map((user) => user.id === data.user.id ? data.user : user)); setNotice(deleting ? "User deleted. Existing transaction history was retained." : "User updated."); setEditor(null);
    } catch (cause) { setFormError(cause.message || "Unable to reach the user service."); } finally { inFlight.current = false; setBusy(false); }
  }
  return <section className={styles.page}>
    <header className={styles.header}><div><h1>Users</h1><p>Manage user accounts, roles, plans, and balances.</p></div><strong>{pagination?.total ?? "—"} accounts</strong></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error ? <div className={styles.empty} role="alert"><p>{error}</p><button className="button" onClick={() => setRetry((n) => n + 1)}>Retry</button></div> : loadedKey !== requestKey ? <div className={styles.empty} role="status">Loading users…</div> : users.length ? <div className={styles.tableWrap}><table><thead><tr><th>User</th><th>Role</th><th>Plan</th><th>Balance</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className={styles.identity}><span className={styles.avatar}><UserRound size={18} /></span><span><strong>{user.username}</strong><small>{user.email}</small></span></div></td><td>{user.role}</td><td>{user.membershipPlan}</td><td className={styles.amount}>{money(user.balance)}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><div className={styles.actions}><button type="button" className="button" onClick={() => { setFormError(""); setEditor({ mode: "edit", user }); }}><Pencil size={15} />Edit</button><button type="button" className={`button ${styles.danger}`} onClick={() => { setFormError(""); setEditor({ mode: "delete", user }); }}><Trash2 size={15} />Delete</button></div></td></tr>)}</tbody></table></div> : <div className={styles.empty}>No user accounts found.</div>}
    {pagination?.totalPages > 1 && <nav className={styles.pagination} aria-label="User pages"><button className="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Previous</button><span>Page {page} of {pagination.totalPages}</span><button className="button" disabled={page >= pagination.totalPages} onClick={() => setPage((n) => n + 1)}>Next</button></nav>}
    <dialog ref={dialog} className={styles.dialog} onClose={() => setEditor(null)} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setEditor(null); }}>
      {editor && <form className={styles.form} onSubmit={submit}><header><h2>{editor.mode === "delete" ? "Delete user" : `Manage ${editor.user.username}`}</h2><button type="button" className={styles.close} onClick={() => setEditor(null)} disabled={busy} aria-label="Close"><X size={20} /></button></header>
        {editor.mode === "delete" ? <p className={styles.confirm}>Delete <strong>{editor.user.username}</strong>? Their existing transaction history will be retained.</p> : <><label>Username<input name="username" required minLength={3} maxLength={30} defaultValue={editor.user.username} /></label><label>Email<input name="email" required type="email" maxLength={254} defaultValue={editor.user.email} /></label><div className={styles.paired}><label>Role<select name="role" defaultValue={editor.user.role}><option value="user">User</option><option value="admin">Admin</option></select></label><label>Membership<select name="membershipPlan" defaultValue={editor.user.membershipPlan}><option value="free">Free</option><option value="premium">Premium</option></select></label></div><label>Balance (USD)<input name="balance" type="number" min="0" step="0.01" required defaultValue={(editor.user.balance / 100).toFixed(2)} /></label></>}
        {formError && <p className={styles.error} role="alert">{formError}</p>}<footer><button type="button" className="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button type="submit" className={editor.mode === "delete" ? styles.dangerButton : styles.primary} disabled={busy}>{busy ? "Please wait…" : editor.mode === "delete" ? "Delete user" : "Save changes"}</button></footer>
      </form>}
    </dialog>
  </section>;
}
