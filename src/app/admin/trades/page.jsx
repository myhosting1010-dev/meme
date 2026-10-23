import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { TradesManager } from "@/features/admin/trades-manager";

export const metadata = { title: "Manage Trades" };

export default async function TradesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <TradesManager />;
}
