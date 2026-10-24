import mongoose from "mongoose";
import { User } from "../models/user.js";
import { tradeStatusUpdate } from "../schemas/trade-status.js";

// The native collection uses the explicit settlement fields even if an older
// Mongoose model is still cached by a long-running development server.
export async function closeUserTrade({ userId, tradeId, version }, collection = User.collection) {
  const ownerId = new mongoose.Types.ObjectId(userId);
  const purchaseId = new mongoose.Types.ObjectId(tradeId);
  const account = await collection.findOne({ _id: ownerId, "purchases._id": purchaseId }, { projection: { balance: 1, purchases: 1 } });
  const trade = account?.purchases?.find((item) => item._id.equals(purchaseId));
  if (!trade) return { status: 404, body: { error: "Trade not found." } };
  const response = (balance, balanceChange, alreadyClosed = false) => ({ status: 200, body: {
    tradeId: purchaseId.toString(), status: "closed", statusVersion: alreadyClosed ? (trade.statusVersion ?? 0) : version + 1,
    balance, balanceChange, alreadyClosed, realizedPnl: trade.realizedPnl ?? 0, unrealizedPnl: trade.unrealizedPnl ?? 0,
  } });
  if (trade.status === "closed") return response(account.balance, 0, true);
  let operation;
  try {
    operation = tradeStatusUpdate({ userId: ownerId, tradeId: purchaseId, adminId: ownerId, version, status: "closed", amount: trade.amount, realizedPnl: trade.realizedPnl ?? 0, unrealizedPnl: trade.unrealizedPnl ?? 0, pnlVersion: trade.pnlVersion ?? 0 });
  } catch {
    return { status: 422, body: { error: "This trade has invalid amount or PNL values. Please contact support." } };
  }
  operation.update.$currentDate = { updatedAt: true };
  const updated = await collection.findOneAndUpdate(operation.filter, operation.update, { returnDocument: "after", includeResultMetadata: false, projection: { balance: 1 } });
  if (!updated) return { status: 409, body: { error: "The trade changed or closing would exceed your balance limits. Refresh and try again." } };
  return response(updated.balance, operation.balanceChange);
}
