"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layouts/sidebar";
import { site } from "@/constants/site";

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const menu = useRef(null);
  const pathname = usePathname();
  const closeMenu = () => menu.current?.close();
  if (pathname === "/how-it-works") return children;
  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="desktop-sidebar"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /></div>
      <header className="mobile-header"><span className="brand"><img className="brand-logo" src="/trenchfun-logo.png" alt={site.name} /></span><button className="icon-button" aria-label="Open navigation" onClick={() => menu.current?.showModal()}><Menu size={22} /></button></header>
      <dialog ref={menu} className="mobile-menu" aria-label="Navigation menu"><Sidebar mobile onToggle={closeMenu} onNavigate={closeMenu} /></dialog>
      <main id="main-content" tabIndex={-1} className="app-main">{children}</main>
    </div>
  );
}
