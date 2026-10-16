import { z } from "zod";

const usdCents = z.string().trim().max(20).regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a valid USD profit amount.").transform((value) => {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole + fraction.padEnd(2, "0"));
}).refine((value) => Number.isSafeInteger(value), "Profit amount is too large.");

export const traderInputSchema = z.object({
  username: z.string().trim().min(2).max(30),
  userId: z.union([z.string().regex(/^[a-f0-9]{24}$/i), z.literal("")]).transform((value) => value || null),
  avatarUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Avatar must be an HTTPS URL."),
  profitUsd: usdCents,
  followersCount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  listed: z.boolean(),
}).strict();
