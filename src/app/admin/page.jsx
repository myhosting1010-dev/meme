import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminDashboard } from "@/features/admin/admin-dashboard";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <AdminDashboard />;
}
