import { Transaction } from "@/models/transaction";
import { User } from "@/models/user";
import { adminFailure, adminJson, authorizeAdmin, readAdminJson } from "@/lib/admin-api";

export const runtime = "nodejs";
const MAX_BALANCE = Number.MAX_SAFE_INTEGER;

export async function PATCH(request, { params }) {
  try {
    const auth = await authorizeAdmin(request, true);
    if (auth.error) return auth.error;
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return adminJson({ error: "Invalid transaction ID." }, 400);
    const body = await readAdminJson(request);
    if (body.error) return body.error;
    const status = body.data.status;
    if (status === "failed") return failPendingTransaction(id);
    if (status !== "completed") return adminJson({ error: "Choose completed or failed." }, 400);
    return await confirmTransaction(id);
  } catch (error) { return adminFailure(error); }
}

async function failPendingTransaction(id) {
  const transaction = await Transaction.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: "failed" } }, { new: true });
  if (!transaction) return transactionConflict(id);
  return adminJson({ transaction: serializeReview(transaction) });
}

async function confirmTransaction(id) {
  // Claim first; this user-side marker makes a retry safe if the process stops after crediting.
  let transaction = await Transaction.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: "processing" } }, { new: true });
  if (!transaction) transaction = await Transaction.findOne({ _id: id, status: "processing" });
  if (!transaction) return transactionConflict(id);

  if (transaction.type === "deposit") {
    let credit;
    try {
      credit = await User.collection.updateOne({
        _id: transaction.userId,
        $or: [{ balance: { $lte: MAX_BALANCE - transaction.amount } }, { balance: { $exists: false } }],
        settledTransactionIds: { $ne: transaction._id },
      }, {
        $inc: { balance: transaction.amount },
        $addToSet: { settledTransactionIds: transaction._id },
        $currentDate: { updatedAt: true },
      });
    } catch (error) {
      console.error("[admin transaction approval] Balance credit failed", { name: error?.name, code: error?.code, message: error?.message });
      await Transaction.updateOne({ _id: transaction._id, status: "processing" }, { $set: { status: "pending" } });
      return adminJson({ error: "Could not credit the user's balance. The transaction remains pending; check the account's balance in Manage Users." }, 503);
    }
    if (credit.modifiedCount !== 1) {
      const alreadyCredited = await User.collection.findOne({ _id: transaction.userId, settledTransactionIds: transaction._id }, { projection: { _id: 1 } });
      if (!alreadyCredited) {
        await Transaction.updateOne({ _id: transaction._id, status: "processing" }, { $set: { status: "pending" } });
        return adminJson({ error: "Could not credit the user's balance. Check that the account exists and has room for this deposit." }, 409);
      }
    }
  }

  if (transaction.type === "subscription") {
    const upgrade = await User.updateOne({ _id: transaction.userId }, { $set: { membershipPlan: "premium" } });
    if (upgrade.matchedCount !== 1) {
      await Transaction.updateOne({ _id: transaction._id, status: "processing" }, { $set: { status: "pending" } });
      return adminJson({ error: "The user's Premium plan could not be activated." }, 409);
    }
  }

  const completed = await Transaction.findOneAndUpdate({ _id: transaction._id, status: "processing" }, { $set: { status: "completed" } }, { new: true });
  if (completed) return adminJson({ transaction: serializeReview(completed) });
  const current = await Transaction.findById(transaction._id);
  if (current?.status === "completed") return adminJson({ transaction: serializeReview(current) });
  return adminJson({ error: "The balance was credited, but the transaction is still processing. Retry confirmation to finish safely." }, 503);
}

async function transactionConflict(id) {
  const existing = await Transaction.findById(id).select("status").lean();
  if (!existing) return adminJson({ error: "Transaction not found." }, 404);
  return adminJson({ error: existing.status === "completed" ? "This transaction is already completed." : "This transaction is already being reviewed." }, 409);
}

function serializeReview(transaction) {
  return { id: transaction._id.toString(), status: transaction.status, type: transaction.type, amount: transaction.amount };
}
