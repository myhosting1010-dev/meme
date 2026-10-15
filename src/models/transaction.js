import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  reference: { type: String, required: true, default: randomUUID, trim: true, maxlength: 128, immutable: true },
  type: { type: String, enum: ["deposit", "withdrawal", "subscription", "buy", "sell"], required: true },
  // Positive USD cents; type determines the direction. Pending records do not credit balance.
  amount: { type: Number, required: true, min: 1, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["USD"], default: "USD", required: true },
  cryptoMethod: { type: String, trim: true, uppercase: true, enum: ["SOL", "ETH", "BTC", "USDC", "USDT"], required: true },
  description: { type: String, trim: true, maxlength: 120, default: "" },
  status: { type: String, enum: ["pending", "completed", "failed", "cancelled"], default: "pending", required: true },
}, { timestamps: true, strict: "throw" });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1, _id: -1 });
transactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
