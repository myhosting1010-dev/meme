import "server-only";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { Trader } from "@/models/trader";

export async function getAdminSummary() {
  const [accounts, transactions, traders] = await Promise.all([
    User.aggregate([{ $group: {
      _id: null,
      users: { $sum: 1 },
      purchases: { $sum: { $size: { $ifNull: ["$purchases", []] } } },
    } }]),
    Transaction.aggregate([{ $group: {
      _id: null,
      total: { $sum: 1 },
      approved: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
      pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
      trades: { $sum: { $cond: [{ $in: ["$type", ["buy", "sell"]] }, 1, 0] } },
    } }]),
    Trader.countDocuments({}),
  ]);
  const purchases = accounts[0]?.purchases ?? 0;
  return {
    users: accounts[0]?.users ?? 0,
    transactions: (transactions[0]?.total ?? 0) + purchases,
    approved: (transactions[0]?.approved ?? 0) + purchases,
    pending: transactions[0]?.pending ?? 0,
    trades: (transactions[0]?.trades ?? 0) + purchases,
    traders,
  };
}
