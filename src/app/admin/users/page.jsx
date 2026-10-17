import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UsersManager } from "@/features/admin/users-manager";

export const metadata = { title: "Manage Users" };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <UsersManager />;
}
