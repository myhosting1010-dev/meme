import "server-only";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { authDatabase } from "@/lib/auth/session";
import { listUserTransactions } from "@/services/transactions";

export async function getAccountProfile(userId) {
  await authDatabase();
  await Transaction.createIndexes();
  const [user, history] = await Promise.all([
    User.findById(userId).select("username email twitterUsername balance membershipPlan purchases").lean(),
    listUserTransactions(userId),
  ]);
  if (!user) return null;
  return {
    username: user.username, email: user.email, twitterUsername: user.twitterUsername || "",
    balance: user.balance ?? 0, membershipPlan: user.membershipPlan || "free",
    purchases: (user.purchases ?? []).map((trade) => ({
      id: trade._id.toString(), coinName: trade.coinName, symbol: trade.symbol,
      amount: trade.amount, priceUsd: trade.priceUsd, marketCap: trade.marketCap, quantity: trade.quantity,
      status: trade.status ?? "open", statusVersion: trade.statusVersion ?? 0,
      realizedPnl: trade.realizedPnl ?? 0, unrealizedPnl: trade.unrealizedPnl ?? 0,
    })),
    ...history,
  };
}
