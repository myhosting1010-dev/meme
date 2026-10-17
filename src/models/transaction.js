import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  reference: { type: String, required: true, default: randomUUID, trim: true, maxlength: 128, immutable: true },
  type: { type: String, enum: ["deposit", "withdrawal", "subscription", "buy", "sell"], required: true },
  // Positive USD cents; type determines the direction. Pending records do not credit balance.
  amount: { type: Number, required: true, min: 1, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["USD"], default: "USD", required: true },
  cryptoMethod: { type: String, trim: true, uppercase: true, enum: ["SOL", "ETH", "BTC", "XRP", "USDC", "USDT", "BEP-20", "UNSPECIFIED"], required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", immutable: true },
  walletName: { type: String, trim: true, maxlength: 100, immutable: true },
  walletAddress: { type: String, immutable: true },
  description: { type: String, trim: true, maxlength: 120, default: "" },
  status: { type: String, enum: ["pending", "processing", "completed", "failed", "cancelled"], default: "pending", required: true },
}, { timestamps: true, strict: "throw" });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });
transactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
if (process.env.NODE_ENV !== "production" && mongoose.models.Transaction && (!mongoose.models.Transaction.schema.path("walletId") || !mongoose.models.Transaction.schema.path("cryptoMethod").enumValues.includes("BEP-20"))) mongoose.deleteModel("Transaction");
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
