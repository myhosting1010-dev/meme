import mongoose from "mongoose";

const traderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
  usernameKey: { type: String, required: true, lowercase: true, trim: true, select: false },
  avatarUrl: { type: String, trim: true, maxlength: 2048, default: "", validate: { validator(value) { if (!value) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }, message: "Avatar must be an HTTPS image URL." } },
  // Positive USD cents; the leaderboard sorts on this integer field.
  profitUsdCents: { type: Number, required: true, min: 0, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  followersCount: { type: Number, default: 0, required: true, min: 0, max: Number.MAX_SAFE_INTEGER, validate: Number.isSafeInteger },
  listed: { type: Boolean, default: true, required: true },
}, { timestamps: true, strict: "throw" });

traderSchema.pre("validate", function () { this.usernameKey = this.username?.toLowerCase(); });
traderSchema.index({ usernameKey: 1 }, { unique: true });
traderSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } });
traderSchema.index({ listed: 1, profitUsdCents: -1, _id: 1 });

export const Trader = mongoose.models.Trader || mongoose.model("Trader", traderSchema);
