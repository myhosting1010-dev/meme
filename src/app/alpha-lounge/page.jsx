import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { AlphaLounge } from "@/features/lounge/alpha-lounge";

export const metadata = { title: "Alpha Lounge" };

export default async function AlphaLoungePage() {
  let user;
  try { user = await getCurrentUser(); }
  catch { return <section className="coin-content"><h1>Alpha Lounge</h1><p>Account service is temporarily unavailable. Please try again.</p></section>; }
  if (!user) return <section className="coin-content"><h1>Alpha Lounge</h1><p>You need to signin to access this feature</p><p>Use Sign In in the sidebar to continue.</p><Link href="/">Back to dashboard</Link></section>;
  return <AlphaLounge viewer={{ id: user.id, username: user.username }} />;
}
