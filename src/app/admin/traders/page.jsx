import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { TradersManager } from "@/features/traders/traders-manager";

export const metadata = { title: "Manage Traders" };

export default async function TradersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <TradersManager />;
}
