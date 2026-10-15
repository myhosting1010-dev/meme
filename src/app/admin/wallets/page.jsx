import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { WalletManager } from "@/features/wallets/wallet-manager";

export const metadata = { title: "Manage Wallets" };

export default async function WalletsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");
  return <WalletManager />;
}
