import mongoose from "mongoose";

const socialProfileSchema = new mongoose.Schema({
  handle: { type: String, required: true, match: /^[a-zA-Z0-9_]{1,15}$/ },
  profileUrl: { type: String, required: true, match: /^https:\/\/x\.com\/[a-zA-Z0-9_]{1,15}$/ },
  profileKey: { type: String, required: true, lowercase: true },
}, { timestamps: true, strict: "throw" });
socialProfileSchema.index({ profileKey: 1 }, { unique: true });
socialProfileSchema.index({ updatedAt: -1, _id: -1 });
export const SocialProfile = mongoose.models.SocialProfile || mongoose.model("SocialProfile", socialProfileSchema);
