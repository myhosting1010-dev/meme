import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { TransactionsManager } from "@/features/admin/transactions-manager";

export const metadata = { title: "Manage Transactions" };

export default async function AdminTransactionsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <TransactionsManager />;
}
