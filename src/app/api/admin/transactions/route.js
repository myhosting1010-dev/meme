import { transactionTabs, transactionTypeFilter } from "@/lib/transaction-filters";
import { Transaction } from "@/models/transaction";
import { adminFailure, adminJson, authorizeAdmin } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
    const type = url.searchParams.get("type") || "all";
    if (!transactionTabs.some((tab) => tab.value === type)) return adminJson({ error: "Invalid transaction type." }, 400);
    const filter = transactionTypeFilter(type);
    const pageSize = 25;
    const [records, total] = await Promise.all([
      Transaction.find(filter).populate({ path: "userId", select: "username email" }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Transaction.countDocuments(filter),
    ]);
    const transactions = records.map((item) => ({ id: item._id.toString(), userId: item.userId?._id?.toString() || item.userId?.toString() || "", username: item.userId?.username || "Deleted user", email: item.userId?.email || "", reference: item.reference, type: item.type, description: item.description, cryptoMethod: item.cryptoMethod, walletName: item.walletName || "", walletAddress: item.walletAddress || "", amount: item.amount, status: item.status, createdAt: item.createdAt }));
    return adminJson({ transactions, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) { return adminFailure(error); }
}
