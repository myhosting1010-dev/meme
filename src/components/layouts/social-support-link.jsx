"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

export function SocialSupportLink({ onNavigate }) {
  const pathname = usePathname();
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/social-profiles", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!controller.signal.aborted) setUrl(response.ok ? data.supportUrl : null);
      } catch { if (!controller.signal.aborted) setUrl(null); }
    }
    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener("focus", load);
    window.addEventListener("social-profiles-updated", load);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", load); window.removeEventListener("social-profiles-updated", load); };
  }, [pathname]);
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="nav-item" onClick={onNavigate}><X size={19} aria-hidden="true" /><span>Support</span></a> : <button type="button" disabled title="No X support profile is currently available" className="nav-item"><X size={19} aria-hidden="true" /><span>Support</span></button>;
}
