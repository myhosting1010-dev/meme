import Link from "next/link";
import { ArrowUpRight, CheckCheck, ClipboardList, Clock3, TrendingUp, UserRound, UsersRound } from "lucide-react";
import { getAdminSummary } from "@/services/admin-summary";
import styles from "./admin-dashboard.module.css";

export async function AdminDashboard() {
  const summary = await getAdminSummary();
  const cards = [
    { label: "Total users", value: summary.users, icon: UserRound, href: "/admin/users", detail: "Registered accounts" },
    { label: "Total transactions", value: summary.transactions, icon: ClipboardList, href: "/admin/transactions", detail: "All payments and trades" },
    { label: "Approved transactions", value: summary.approved, icon: CheckCheck, detail: "Completed payments and trades" },
    { label: "Pending transactions", value: summary.pending, icon: Clock3, href: "/admin/transactions", detail: "Awaiting review" },
    { label: "Total trades", value: summary.trades, icon: TrendingUp, href: "/admin/trades", detail: "Coin purchase and sale records" },
    { label: "Total traders", value: summary.traders, icon: UsersRound, href: "/admin/traders", detail: "Trader profiles" },
  ];
  return <section className={styles.page}>
    <header className={styles.header}><span className={styles.eyebrow}>Administration</span><h1>Dashboard overview</h1><p>A summary of your users, payments, and trading activity.</p></header>
    <div className={styles.grid}>{cards.map(({ label, value, icon: Icon, href, detail }) => <article className={styles.card} key={label}>
      <div className={styles.cardTop}><span className={styles.icon}><Icon size={23} aria-hidden="true" /></span>{href && <Link href={href} className={styles.link} aria-label={`Manage ${label.toLowerCase()}`}><ArrowUpRight size={20} aria-hidden="true" /></Link>}</div>
      <h2>{label}</h2><strong>{new Intl.NumberFormat("en-US").format(value)}</strong><p>{detail}</p>
    </article>)}</div>
  </section>;
}
