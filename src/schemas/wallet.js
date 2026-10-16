import { z } from "zod";

export const walletSchema = z.object({
  walletName: z.string().trim().min(1, "Enter a wallet name.").max(100),
  walletAddress: z.string().trim().min(1, "Enter a wallet address."),
  cryptoMethod: z.enum(["", "SOL", "BTC", "ETH", "XRP", "USDC", "BEP-20", "USDT"]).optional(),
  picture: z.string().trim().max(2048).url().refine((value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } }, "Picture must be an HTTPS image URL."),
}).strict();
export const walletUpdateSchema = walletSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide an address or picture to update.");
