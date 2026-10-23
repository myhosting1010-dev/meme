import { z } from "zod";

export const tradeSchema = z.object({
  chain: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/),
  pair: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/),
  idempotencyKey: z.string().uuid(),
  amount: z.string().trim().max(20).regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a USD amount with at most two decimal places.").transform((value) => {
    const [whole, fraction = ""] = value.split(".");
    return Number(whole + fraction.padEnd(2, "0"));
  }).refine((value) => Number.isSafeInteger(value) && value > 0, "Enter a valid positive amount."),
}).strict();

export function purchaseQuantity(amountCents, priceUsd) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("A valid amount and coin price are required.");
  const quantity = (amountCents / 100) / priceUsd;
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Unable to calculate the coin quantity.");
  return quantity;
}
