import "server-only";
import { Transaction } from "@/models/transaction";
import { User } from "@/models/user";

export const serializeTransaction = (item) => ({ id: item._id.toString(), date: item.createdAt.toISOString(), type: item.type, description: item.description, cryptoMethod: item.cryptoMethod, amount: item.amount, status: item.status, walletName: item.walletName || "" });

export async function listUserTransactions(userId, page = 1) {
  const pageSize = 10;
  const [records, transactionCount, user] = await Promise.all([
    Transaction.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(page * pageSize).lean(),
    Transaction.countDocuments({ userId }),
    User.findById(userId).select("+purchases").lean(),
  ]);
  const purchases = (user?.purchases ?? []).map((trade) => ({
    id: trade._id.toString(), date: trade.createdAt.toISOString(), type: "buy",
    description: `Buy ${trade.coinName}`.slice(0, 120), cryptoMethod: "UNSPECIFIED",
    amount: trade.amount, status: "completed", walletName: "",
    coinName: trade.coinName, priceUsd: trade.priceUsd, marketCap: trade.marketCap, quantity: trade.quantity,
  }));
  const total = transactionCount + purchases.length;
  const transactions = [...records.map(serializeTransaction), ...purchases]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice((page - 1) * pageSize, page * pageSize);
  return { transactions, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}
