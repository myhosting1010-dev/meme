"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import styles from "./admin-manager.module.css";

export function SocialProfilesManager() {
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/social-profiles", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load social profiles.");
      if (!controller.signal.aborted) { setProfiles(data.profiles); setError(""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => { if (editor) dialog.current?.showModal(); else if (dialog.current?.open) dialog.current.close(); }, [editor]);

  function open(mode, profile = null) { setFormError(""); setEditor({ mode, profile }); }
  async function submit(event) {
    event.preventDefault();
    if (!editor || inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const deleting = editor.mode === "delete";
    const payload = { ...(editor.profile ? { id: editor.profile.id } : {}), ...(!deleting ? { profile: form.get("profile") } : {}) };
    inFlight.current = true; setBusy(true); setFormError("");
    try {
      const response = await fetch("/api/admin/social-profiles", { method: deleting ? "DELETE" : editor.profile ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save the social profile.");
      setProfiles(data.profiles); setEditor(null); setError("");
      setNotice(deleting ? "Social profile deleted. The Support link has been updated." : "Social profile saved and set as the X Support link.");
      window.dispatchEvent(new Event("social-profiles-updated"));
    } catch (cause) { setFormError(cause.message || "Unable to reach the social profile service."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section className={styles.page}>
    <header className={styles.header}><button type="button" className={styles.primary} onClick={() => open("create")}><Plus size={16} aria-hidden="true" /> Create social profile</button><div><h1>Handle Social</h1><p>The most recently saved X profile is used for the sidebar Support link.</p></div></header>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error ? <div className={styles.empty} role="alert"><p>{error}</p><button className="button" onClick={() => setRetry((value) => value + 1)}>Retry</button></div> : !profiles ? <div className={styles.empty} role="status">Loading social profiles…</div> : profiles.length ? <div className={styles.tableWrap}><table><thead><tr><th>Platform</th><th>Handle</th><th>Profile link</th><th>Support link</th><th>Actions</th></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}>
      <td>X (Twitter)</td><td>@{profile.handle}</td><td><a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">{profile.profileUrl}</a></td><td>{profile.current ? <span className={`${styles.status} ${styles.completed}`}>Current</span> : "—"}</td>
      <td><div className={styles.actions}><button className="button" type="button" onClick={() => open("edit", profile)} aria-label={`Edit @${profile.handle}`}><Pencil size={14} />Edit</button><button className={`button ${styles.danger}`} type="button" onClick={() => open("delete", profile)} aria-label={`Delete @${profile.handle}`}><Trash2 size={14} />Delete</button></div></td>
    </tr>)}</tbody></table></div> : <div className={styles.empty}>No social profiles yet. Create an X profile to enable the Support link.</div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="social-profile-title" onClose={() => setEditor(null)} onCancel={(event) => { if (busy) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) setEditor(null); }}>
      {editor && <form key={`${editor.mode}-${editor.profile?.id ?? "new"}`} className={styles.form} onSubmit={submit}>
        <header><h2 id="social-profile-title">{editor.mode === "delete" ? "Delete social profile" : editor.mode === "edit" ? "Edit social profile" : "Create social profile"}</h2><button type="button" className={styles.close} aria-label="Close" disabled={busy} onClick={() => setEditor(null)}><X size={20} /></button></header>
        {editor.mode === "delete" ? <p className={styles.confirm}>Delete @{editor.profile.handle}? If this is the current Support link, the next saved profile will be used.</p> : <label>Twitter (X) profile<input name="profile" type="text" required maxLength={300} disabled={busy} defaultValue={editor.profile?.profileUrl ?? ""} placeholder="https://x.com/username or @username" autoComplete="off" /></label>}
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <footer><button className="button" type="button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button className={editor.mode === "delete" ? styles.dangerButton : styles.primary} type="submit" disabled={busy}>{busy ? "Saving…" : editor.mode === "delete" ? "Delete profile" : "Save profile"}</button></footer>
      </form>}
    </dialog>
  </section>;
}
