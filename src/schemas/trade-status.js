import { z } from "zod";

export const tradeStatusSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
  tradeId: z.string().regex(/^[a-f0-9]{24}$/i),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  status: z.enum(["open", "closed"]),
}).strict();

export const userTradeStatusSchema = tradeStatusSchema.omit({ userId: true }).extend({ status: z.literal("closed") }).strict();

export function tradeStatusUpdate({ userId, tradeId, version, status, amount, realizedPnl = 0, unrealizedPnl = 0, pnlVersion = 0, settledAmount, adminId }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Invalid trade amount.");
  const closing = status === "closed";
  if (![realizedPnl, unrealizedPnl].every(Number.isSafeInteger)) throw new Error("Invalid trade PNL.");
  // BigInt avoids rounding intermediate sums when signed PNL values cancel out.
  const settlement = closing ? Number(BigInt(amount) + BigInt(realizedPnl) + BigInt(unrealizedPnl)) : (settledAmount ?? amount);
  if (!Number.isSafeInteger(settlement)) throw new Error("Trade settlement is too large.");
  const balanceChange = closing ? settlement : -settlement;
  return {
    settlement, balanceChange,
    filter: {
      _id: userId,
      balance: { $gte: Math.max(0, -balanceChange), $lte: Number.MAX_SAFE_INTEGER - Math.max(0, balanceChange) },
      purchases: { $elemMatch: {
        _id: tradeId, amount,
        ...(closing ? { $and: [pnlVersion === 0 ? { $or: [{ pnlVersion: 0 }, { pnlVersion: { $exists: false } }] } : { pnlVersion }] } : {}),
        status: closing ? { $ne: "closed" } : "closed",
        ...(version === 0 ? { $or: [{ statusVersion: 0 }, { statusVersion: { $exists: false } }] } : { statusVersion: version }),
      } },
    },
    update: {
      $inc: { balance: balanceChange },
      $set: {
        "purchases.$.settledAmount": settlement,
        "purchases.$.status": status,
        "purchases.$.statusVersion": version + 1,
        "purchases.$.statusUpdatedAt": new Date(),
        "purchases.$.statusUpdatedBy": adminId,
      },
    },
  };
}
