import { CoinBrowser } from "@/features/coins/coin-browser";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminDashboard } from "@/features/admin/admin-dashboard";

export default async function Home() {
  const user = await getCurrentUser();
  if (user?.role === "admin") return <AdminDashboard />;
  return <CoinBrowser />;
}
