import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, LayoutDashboard, LogIn, LogOut, MessagesSquare, PanelLeft, Star, TrendingUp, UserRound, UsersRound, Wallet, X } from "lucide-react";
import { site } from "@/constants/site";
import { PerformanceModal } from "@/features/coins/performance-modal";
import { useAuth } from "@/features/auth/auth-provider";

function NavItem({ icon: Icon, children, live = false }) {
  return <button type="button" disabled title="This destination has not been verified yet" className="nav-item"><Icon size={19} aria-hidden="true" /><span>{children}</span>{live && <span className="live-badge"><i />Live</span>}</button>;
}

export function Sidebar({ collapsed = false, onToggle, mobile = false, onNavigate }) {
  const { user, openAuth, accessLounge, signout } = useAuth();
  const pathname = usePathname();
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-label="Application sidebar">
      <div className="brand-row">
        <Link href="/" className="brand" aria-label={`${site.name} home`} onClick={onNavigate}><img className="brand-logo" src="/trenchfun-logo.png" alt={site.name} /></Link>
        <button className="icon-button sidebar-toggle" type="button" onClick={onToggle} aria-label={mobile ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>{mobile ? <X size={19} /> : <PanelLeft size={18} />}</button>
      </div>
      <nav className="sidebar-content" aria-label="Main navigation">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="nav-item dashboard-link" onClick={onNavigate}><LayoutDashboard size={18} aria-hidden="true" /><span>Dashboard</span></Link>
        <Link href="/premium" aria-current={pathname === "/premium" ? "page" : undefined} className={`nav-item ${pathname === "/premium" ? "nav-item--premium" : ""}`} onClick={onNavigate}><Star size={19} aria-hidden="true" /><span>Get Premium</span></Link>
        <PerformanceModal onOpen={onNavigate} />
        {user?.role === "admin" && <Link href="/admin/wallets" className="nav-item dashboard-link" aria-current={pathname === "/admin/wallets" ? "page" : undefined} onClick={onNavigate}><Wallet size={19} aria-hidden="true" /><span>Wallets</span></Link>}
        {user?.role === "admin" && <Link href="/admin/traders" className="nav-item dashboard-link" aria-current={pathname === "/admin/traders" ? "page" : undefined} onClick={onNavigate}><UsersRound size={19} aria-hidden="true" /><span>Traders</span></Link>}
        {user?.role === "admin" && <Link href="/admin/users" className="nav-item dashboard-link" aria-current={pathname === "/admin/users" ? "page" : undefined} onClick={onNavigate}><UsersRound size={19} aria-hidden="true" /><span>Users</span></Link>}
        {user?.role === "admin" && <Link href="/admin/transactions" className="nav-item dashboard-link" aria-current={pathname === "/admin/transactions" ? "page" : undefined} onClick={onNavigate}><ClipboardList size={19} aria-hidden="true" /><span>Transactions</span></Link>}
        <div className="nav-group"><h2>Resources</h2><Link href="/how-it-works" className="nav-item" onClick={onNavigate}><BookOpen size={19} aria-hidden="true" /><span>How It Works</span></Link><NavItem icon={X}>Support</NavItem></div>
        <div className="nav-group"><h2>Community</h2><button type="button" className="nav-item" onClick={() => { onNavigate?.(); accessLounge(); }}><MessagesSquare size={19} aria-hidden="true" /><span>Alpha Lounge</span><span className="live-badge"><i />Live</span></button></div>
        <div className="nav-group rewards"><h2>Rewards</h2><div className="reward-grid"><div><span>Â·</span><strong>Slot 26</strong><small>0/5</small></div><div><span>Â·</span><strong>Slot 27</strong><small>0/10</small></div></div></div>
        <div className="nav-group account"><h2>Account</h2>{user && <Link href="/profile" className="sidebar-user" title={user.username} aria-label={`${user.username}, account profile`} aria-current={pathname === "/profile" ? "page" : undefined} onClick={onNavigate}><UserRound size={20} aria-hidden="true" /><div><strong>{user.username}</strong><small><i aria-hidden="true" />Session active</small></div></Link>}<button type="button" className="nav-item" aria-label={user ? "Sign out" : "Sign in"} onClick={() => { onNavigate?.(); if (user) signout(); else openAuth(); }}>{user ? <LogOut size={19} aria-hidden="true" /> : <LogIn size={19} aria-hidden="true" />}<span>{user ? "Sign Out" : "Sign In"}</span></button></div>
      </nav>
    </aside>
  );
}
