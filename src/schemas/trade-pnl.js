import { z } from "zod";

const signedUsd = z.string().trim().max(22)
  .regex(/^[+-]?(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a USD value such as +25.00 or -10.50.")
  .transform((value) => {
    const sign = value.startsWith("-") ? -1 : 1;
    const [whole, fraction = ""] = value.replace(/^[+-]/, "").split(".");
    return sign * Number(whole + fraction.padEnd(2, "0"));
  }).refine(Number.isSafeInteger, "PNL amount is too large.");

export const tradePnlSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
  tradeId: z.string().regex(/^[a-f0-9]{24}$/i),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  realizedPnl: signedUsd,
  unrealizedPnl: signedUsd,
}).strict();
