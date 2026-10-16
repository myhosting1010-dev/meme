import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  walletName: { type: String, required: true, trim: true, maxlength: 100 },
  walletAddress: { type: String, required: true, trim: true },
  cryptoMethod: { type: String, enum: ["", "SOL", "BTC", "ETH", "XRP", "USDC", "BEP-20", "USDT"], default: "" },
  picture: { type: String, required: true, trim: true, maxlength: 2048, validate: { validator(value) { try { return new URL(value).protocol === "https:"; } catch { return false; } }, message: "Picture must be an HTTPS image URL." } },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
}, { timestamps: true, strict: "throw" });
walletSchema.index({ walletAddress: 1 }, { unique: true });
walletSchema.index({ createdAt: -1, _id: -1 });
// Reload the renamed schema when an existing development server refreshes this module.
if (process.env.NODE_ENV !== "production" && mongoose.models.Wallet && (!mongoose.models.Wallet.schema.path("walletAddress") || !mongoose.models.Wallet.schema.path("cryptoMethod").enumValues.includes("XRP"))) mongoose.deleteModel("Wallet");
export const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
