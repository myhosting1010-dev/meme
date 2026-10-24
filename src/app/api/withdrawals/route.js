import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/models/user";
import { Transaction } from "@/models/transaction";
import { getMinimumWithdrawal } from "@/services/payment-settings";
import { withdrawalSchema, withdrawalValidationError } from "@/schemas/withdrawal";
import { readAdminJson } from "@/lib/admin-api";
import { serializeTransaction } from "@/services/transactions";
export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  try {
    const user = await getCurrentUser(); if (!user) return json({ error: "Sign in to withdraw funds." }, 401);
    const [account, minimumWithdrawal] = await Promise.all([User.findById(user.id).select("balance").lean(), getMinimumWithdrawal()]);
    if (!account) return json({ error: "Account not found." }, 404);
    return json({ balance: account.balance, minimumWithdrawal });
  } catch { return json({ error: "Unable to load withdrawal details." }, 503); }
}
export async function POST(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return json({ error: "Invalid request origin." }, 403);
  try {
    const user = await getCurrentUser(); if (!user) return json({ error: "Sign in to withdraw funds." }, 401);
    const body = await readAdminJson(request); if (body.error) return body.error;
    const parsed = withdrawalSchema.safeParse(body.data);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { amount, network, destinationAddress, idempotencyKey } = parsed.data;
    const reference = user.id + ":withdrawal:" + idempotencyKey;
    const replay = (item) => item.type === "withdrawal" && item.amount === amount && item.cryptoMethod === network && item.walletAddress === destinationAddress
      ? json({ transaction: serializeTransaction(item) }) : json({ error: "This request was already used with different details." }, 409);
    const existing = await Transaction.findOne({ reference });
    if (existing) return replay(existing);
    const [account, minimumWithdrawal] = await Promise.all([User.findById(user.id).select("balance").lean(), getMinimumWithdrawal()]);
    if (!account) return json({ error: "Account not found." }, 404);
    const error = withdrawalValidationError(amount, minimumWithdrawal, account.balance);
    if (error) return json({ error, minimumWithdrawal, balance: account.balance }, 409);
    await Transaction.createIndexes();
    try {
      const transaction = await Transaction.create({ userId: user.id, reference, type: "withdrawal", amount, cryptoMethod: network, walletAddress: destinationAddress, description: "Withdrawal", status: "pending" });
      return json({ transaction: serializeTransaction(transaction) }, 201);
    } catch (error) {
      if (error.code !== 11000) throw error;
      const saved = await Transaction.findOne({ reference });
      if (saved) return replay(saved);
      throw error;
    }
  } catch { return json({ error: "Unable to record withdrawal. Retry the same request to check its status safely." }, 503); }
}
