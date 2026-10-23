import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountProfile } from "@/services/account-profile";
import { AccountProfile } from "@/features/account/account-profile";

export const metadata = { title: "Account Profile" };

export default async function ProfilePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const profile = await getAccountProfile(user.id);
  if (!profile) redirect("/");
  const query = await searchParams;
  return <AccountProfile profile={profile} openDeposit={query?.deposit === "1"} />;
}
