import { z } from "zod";

const balanceCents = z.string().trim().max(20).regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a valid USD balance.").transform((value) => {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole + fraction.padEnd(2, "0"));
}).refine(Number.isSafeInteger, "Balance is too large.");

export const adminUserInputSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["user", "admin"]),
  membershipPlan: z.enum(["free", "premium"]),
  balance: balanceCents,
}).strict();
