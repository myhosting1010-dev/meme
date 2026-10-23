import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true },
  chain: { type: String, required: true },
  pair: { type: String, required: true },
  coinName: { type: String, required: true },
  symbol: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  amount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  priceUsd: { type: Number, required: true, min: Number.MIN_VALUE },
  marketCap: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: Number.MIN_VALUE },
  realizedPnl: { type: Number, default: 0, validate: Number.isSafeInteger },
  unrealizedPnl: { type: Number, default: 0, validate: Number.isSafeInteger },
  pnlVersion: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
  pnlUpdatedAt: { type: Date },
  pnlUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, required: true },
}, { strict: "throw" });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/ },
  usernameKey: { type: String, required: true, lowercase: true, trim: true, select: false },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  twitterUsername: { type: String, trim: true, maxlength: 15, match: /^[a-zA-Z0-9_]*$/, default: "" },
  passwordHash: { type: String, required: true, select: false, match: /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/ },
  // USD cents: integer storage avoids floating-point errors for account balances.
  balance: { type: Number, default: 0, required: true, min: 0, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  // Purchase and balance debit are committed together in one atomic document update.
  purchases: { type: [purchaseSchema], default: [], select: false },
  // Used to make standalone-MongoDB settlement retries idempotent when transactions are unavailable.
  settledTransactionIds: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
  membershipPlan: { type: String, enum: ["free", "premium"], default: "free", required: true },
  role: { type: String, enum: ["user", "admin"], default: "user", required: true },
}, { timestamps: true, strict: "throw" });
userSchema.pre("validate", function () { this.usernameKey = this.username?.toLowerCase(); });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ usernameKey: 1 }, { unique: true });
if (process.env.NODE_ENV !== "production" && mongoose.models.User && !mongoose.models.User.schema.path("purchases")?.schema.path("realizedPnl")) mongoose.deleteModel("User");
export const User = mongoose.models.User || mongoose.model("User", userSchema);
