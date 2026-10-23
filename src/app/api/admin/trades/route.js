import mongoose from "mongoose";
import { User } from "@/models/user";
import { adminFailure, adminJson, authorizeAdmin, readAdminJson } from "@/lib/admin-api";
import { tradePnlSchema } from "@/schemas/trade-pnl";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.error) return auth.error;
    const raw = new URL(request.url).searchParams.get("page") || "1";
    if (!/^[1-9]\d{0,5}$/.test(raw)) return adminJson({ error: "Invalid page number." }, 400);
    const page = Number(raw), pageSize = 25;
    const [result] = await User.aggregate([
      { $unwind: "$purchases" },
      { $project: { _id: 0, userId: "$_id", username: 1, email: 1, trade: "$purchases" } },
      { $sort: { "trade.createdAt": -1, "trade._id": -1 } },
      { $facet: { records: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }], count: [{ $count: "total" }] } },
    ]);
    const total = result?.count[0]?.total ?? 0;
    return adminJson({ trades: (result?.records ?? []).map(serializeTrade), pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) { return adminFailure(error); }
}

export async function PATCH(request) {
  try {
    const auth = await authorizeAdmin(request, true);
    if (auth.error) return auth.error;
    const body = await readAdminJson(request);
    if (body.error) return body.error;
    const parsed = tradePnlSchema.safeParse(body.data);
    if (!parsed.success) return adminJson({ error: parsed.error.issues[0].message }, 400);
    const { userId, tradeId, version, realizedPnl, unrealizedPnl } = parsed.data;
    const versionFilter = version === 0 ? { $or: [{ pnlVersion: 0 }, { pnlVersion: { $exists: false } }] } : { pnlVersion: version };
    const result = await User.updateOne({
      _id: userId, purchases: { $elemMatch: { _id: new mongoose.Types.ObjectId(tradeId), ...versionFilter } },
    }, { $set: {
      "purchases.$.realizedPnl": realizedPnl,
      "purchases.$.unrealizedPnl": unrealizedPnl,
      "purchases.$.pnlVersion": version + 1,
      "purchases.$.pnlUpdatedAt": new Date(),
      "purchases.$.pnlUpdatedBy": auth.user.id,
    } }, { runValidators: true });
    if (result.modifiedCount !== 1) {
      const exists = await User.exists({ _id: userId, "purchases._id": tradeId });
      return adminJson({ error: exists ? "This trade has changed. Reload the list before editing it again." : "Trade not found." }, exists ? 409 : 404);
    }
    return adminJson({ tradeId, realizedPnl, unrealizedPnl, pnlVersion: version + 1 });
  } catch (error) { return adminFailure(error); }
}

function serializeTrade({ userId, username, email, trade }) {
  return {
    id: trade._id.toString(), userId: userId.toString(), username, email,
    coinName: trade.coinName, symbol: trade.symbol, chain: trade.chain,
    amount: trade.amount, priceUsd: trade.priceUsd, marketCap: trade.marketCap, quantity: trade.quantity,
    createdAt: trade.createdAt, realizedPnl: trade.realizedPnl ?? 0, unrealizedPnl: trade.unrealizedPnl ?? 0,
    pnlVersion: trade.pnlVersion ?? 0, pnlUpdatedAt: trade.pnlUpdatedAt ?? null,
  };
}
