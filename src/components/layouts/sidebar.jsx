import Link from "next/link";
import { BookOpen, ChartNoAxesColumnIncreasing, LayoutDashboard, LogIn, MessagesSquare, PanelLeft, Plus, Star, TrendingUp, X } from "lucide-react";
import { site } from "@/constants/site";

function NavItem({ icon: Icon, children, premium = false, live = false }) {
  return <button type="button" disabled title="This destination has not been verified yet" className={`nav-item ${premium ? "nav-item--premium" : ""}`}><Icon size={19} aria-hidden="true" /><span>{children}</span>{live && <span className="live-badge"><i />Live</span>}</button>;
}

export function Sidebar({ collapsed = false, onToggle, mobile = false, onNavigate }) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-label="Application sidebar">
      <div className="brand-row">
        <Link href="/" className="brand" aria-label={`${site.name} home`} onClick={onNavigate}><span className="brand-gem" aria-hidden="true" /><span className="brand-name">{site.name}</span></Link>
        <button className="icon-button sidebar-toggle" type="button" onClick={onToggle} aria-label={mobile ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>{mobile ? <X size={19} /> : <PanelLeft size={18} />}</button>
      </div>
      <nav className="sidebar-content" aria-label="Main navigation">
        <Link href="/" aria-current="page" className="nav-item dashboard-link" onClick={onNavigate}><LayoutDashboard size={18} aria-hidden="true" /><span>Dashboard</span></Link>
        <NavItem icon={Star} premium>Get Premium</NavItem>
        <NavItem icon={ChartNoAxesColumnIncreasing}>Performance</NavItem>
        <div className="nav-group"><h2>Resources</h2><Link href="/how-it-works" className="nav-item" onClick={onNavigate}><BookOpen size={19} aria-hidden="true" /><span>How It Works</span></Link><NavItem icon={X}>Support</NavItem></div>
        <div className="nav-group"><h2>Community</h2><NavItem icon={MessagesSquare} live>Alpha Lounge</NavItem><NavItem icon={TrendingUp}>Leaderboard</NavItem></div>
        <div className="nav-group rewards"><h2>Rewards</h2><div className="reward-grid"><div><span>·</span><strong>Slot 26</strong><small>0/5</small></div><div><span>·</span><strong>Slot 27</strong><small>0/10</small></div></div><button disabled type="button" className="button invite-button" title="Invite workflow is not verified"><Plus size={17} />Invite Friends</button></div>
        <div className="nav-group account"><h2>Account</h2><NavItem icon={LogIn}>Sign In</NavItem></div>
      </nav>
    </aside>
  );
}
