import mongoose from "mongoose";
import { DEFAULT_MINIMUM_WITHDRAWAL } from "../schemas/withdrawal.js";
const schema = new mongoose.Schema({
  _id: { type: String, default: "payments" },
  minimumWithdrawal: { type: Number, required: true, default: DEFAULT_MINIMUM_WITHDRAWAL, min: 1, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, strict: "throw" });
export const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model("PaymentSettings", schema);
