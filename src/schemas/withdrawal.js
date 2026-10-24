import { z } from "zod";

export const DEFAULT_MINIMUM_WITHDRAWAL = 3500000;
export const withdrawalNetworks = { SOL: "Solana (SOL)", ETH: "Ethereum (ETH)", BTC: "Bitcoin (BTC)" };
export const usdAmount = z.string().trim().max(20).regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/, "Enter a USD amount with at most two decimal places.").transform((value) => {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole + fraction.padEnd(2, "0"));
}).refine((value) => Number.isSafeInteger(value) && value > 0, "Enter a valid positive amount.");
export const withdrawalSettingsSchema = z.object({ minimumWithdrawal: usdAmount }).strict();
export const withdrawalSchema = z.object({
  amount: usdAmount,
  network: z.enum(["SOL", "ETH", "BTC"]),
  destinationAddress: z.string().trim().min(26).max(90).regex(/^[a-zA-Z0-9]+$/, "Enter a valid destination address."),
  idempotencyKey: z.string().uuid(),
}).strict().superRefine((data, ctx) => {
  const patterns = { SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, ETH: /^0x[a-fA-F0-9]{40}$/, BTC: /^(?:[13][1-9A-HJ-NP-Za-km-z]{25,34}|bc1[a-z0-9]{11,87})$/ };
  if (!patterns[data.network].test(data.destinationAddress)) ctx.addIssue({ code: "custom", path: ["destinationAddress"], message: "The address format does not match the selected network." });
});
export function withdrawalValidationError(amount, minimum, balance) {
  if (amount < minimum) return "Withdrawal amount is below the current minimum.";
  if (amount > balance) return "Withdrawal amount exceeds your available balance.";
  return null;
}
