import "server-only";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { authDatabase } from "@/lib/auth/session";
import { listUserTransactions } from "@/services/transactions";

export async function getAccountProfile(userId) {
  await authDatabase();
  await Transaction.createIndexes();
  const [user, history] = await Promise.all([
    User.findById(userId).select("username email twitterUsername balance membershipPlan").lean(),
    listUserTransactions(userId),
  ]);
  if (!user) return null;
  return {
    username: user.username, email: user.email, twitterUsername: user.twitterUsername || "",
    balance: user.balance ?? 0, membershipPlan: user.membershipPlan || "free",
    ...history,
  };
}
