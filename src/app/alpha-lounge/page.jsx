import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Alpha Lounge" };

export default async function AlphaLounge() {
  let user;
  try { user = await getCurrentUser(); }
  catch { return <section className="coin-content"><h1>Alpha Lounge</h1><p>Account service is temporarily unavailable. Please try again.</p></section>; }
  if (!user) return <section className="coin-content"><h1>Alpha Lounge</h1><p>You need to signin to access this feature</p><p>Use Sign In in the sidebar to continue.</p><Link href="/">Back to dashboard</Link></section>;
  return <section className="coin-content"><h1>Alpha Lounge</h1><p>Welcome, {user.username}.</p><p>No lounge posts yet.</p></section>;
}
