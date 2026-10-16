import { z } from "zod";

const shared = {
  walletId: z.string().regex(/^[a-f0-9]{24}$/i, "Select a valid wallet."),
  idempotencyKey: z.string().uuid(),
};

export const paymentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("deposit"),
    ...shared,
    amount: z.string().trim().max(20).regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a USD amount with at most two decimal places.").transform((value) => {
      const [whole, fraction = ""] = value.split(".");
      return Number(whole + fraction.padEnd(2, "0"));
    }).refine((value) => Number.isSafeInteger(value) && value > 0, "Enter a valid positive amount."),
  }).strict(),
  z.object({
    type: z.literal("subscription"),
    ...shared,
    planId: z.enum(["week", "month", "quarter", "half-year", "year", "two-years"]),
  }).strict(),
]);
