import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SocialProfilesManager } from "@/features/admin/social-profiles-manager";

export const metadata = { title: "Handle Social" };
export default async function SocialPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <SocialProfilesManager />;
}
