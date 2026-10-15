import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  count: { type: Number, required: true, min: 0 },
  expiresAt: { type: Date, required: true },
}, { timestamps: true, strict: "throw" });
schema.index({ key: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthAttempt = mongoose.models.AuthAttempt || mongoose.model("AuthAttempt", schema);
