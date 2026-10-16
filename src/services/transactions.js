import "server-only";
import { Transaction } from "@/models/transaction";

export const serializeTransaction = (item) => ({ id: item._id.toString(), date: item.createdAt.toISOString(), type: item.type, description: item.description, cryptoMethod: item.cryptoMethod, amount: item.amount, status: item.status, walletName: item.walletName || "" });

export async function listUserTransactions(userId, page = 1) {
  const pageSize = 10;
  const [records, total] = await Promise.all([
    Transaction.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Transaction.countDocuments({ userId }),
  ]);
  return { transactions: records.map(serializeTransaction), pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}
