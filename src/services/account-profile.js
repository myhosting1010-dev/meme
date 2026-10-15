import "server-only";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { authDatabase } from "@/lib/auth/session";

export async function getAccountProfile(userId) {
  await authDatabase();
  await Transaction.createIndexes();
  const [user, transactions] = await Promise.all([
    User.findById(userId).select("username email twitterUsername balance membershipPlan").lean(),
    Transaction.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(100).lean(),
  ]);
  if (!user) return null;
  return {
    username: user.username, email: user.email, twitterUsername: user.twitterUsername || "",
    balance: user.balance ?? 0, membershipPlan: user.membershipPlan || "free",
    transactions: transactions.map((item) => ({ id: item._id.toString(), date: item.createdAt.toISOString(), type: item.type, description: item.description, cryptoMethod: item.cryptoMethod, amount: item.amount, status: item.status })),
  };
}
