import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/ },
  usernameKey: { type: String, required: true, lowercase: true, trim: true, select: false },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  twitterUsername: { type: String, trim: true, maxlength: 15, match: /^[a-zA-Z0-9_]*$/, default: "" },
  passwordHash: { type: String, required: true, select: false, match: /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/ },
  // USD cents: integer storage avoids floating-point errors for account balances.
  balance: { type: Number, default: 0, required: true, min: 0, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  // Used to make standalone-MongoDB settlement retries idempotent when transactions are unavailable.
  settledTransactionIds: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
  membershipPlan: { type: String, enum: ["free", "premium"], default: "free", required: true },
  role: { type: String, enum: ["user", "admin"], default: "user", required: true },
}, { timestamps: true, strict: "throw" });
userSchema.pre("validate", function () { this.usernameKey = this.username?.toLowerCase(); });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ usernameKey: 1 }, { unique: true });
export const User = mongoose.models.User || mongoose.model("User", userSchema);
