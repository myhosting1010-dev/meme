import { getCurrentUser } from "@/lib/auth/session";
import { Transaction } from "@/models/transaction";
import { Wallet } from "@/models/wallet";
import { paymentSchema } from "@/schemas/deposit";
import { listUserTransactions, serializeTransaction } from "@/services/transactions";

export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const subscriptionPlans = {
  week: { amount: 30000, description: "1 Week Premium" },
  month: { amount: 70000, description: "1 Month Premium" },
  quarter: { amount: 120000, description: "3 Months Premium" },
  "half-year": { amount: 160000, description: "6 Months Premium" },
  year: { amount: 200000, description: "12 Months Premium" },
  "two-years": { amount: 240000, description: "24 Months Premium" },
};

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Sign in to view your transactions." }, 401);
    const raw = new URL(request.url).searchParams.get("page") || "1";
    if (!/^[1-9]\d{0,5}$/.test(raw)) return json({ error: "Invalid page number." }, 400);
    return json(await listUserTransactions(user.id, Number(raw)));
  } catch { return json({ error: "Transaction service is temporarily unavailable." }, 503); }
}

export async function POST(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return json({ error: "Invalid request origin." }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Sign in to submit a payment." }, 401);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "JSON body required." }, 400);
    const chunks = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) { await reader.cancel(); return json({ error: "Request too large." }, 413); }
      chunks.push(Buffer.from(value));
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json({ error: "Invalid JSON." }, 400); }
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { type, walletId, idempotencyKey } = parsed.data;
    const plan = type === "subscription" ? subscriptionPlans[parsed.data.planId] : null;
    const amount = plan?.amount ?? parsed.data.amount;
    const description = plan?.description ?? "Deposit";
    const reference = `${user.id}:${idempotencyKey}`;
    const existing = await Transaction.findOne({ reference });
    const replay = (item) => item.amount === amount && item.walletId?.toString() === walletId && item.type === type && item.description === description ? json({ transaction: serializeTransaction(item) }) : json({ error: "This payment request was already used with different details." }, 409);
    if (existing) return replay(existing);
    const wallet = await Wallet.findById(walletId).lean();
    if (!wallet) return json({ error: "This wallet is no longer available. Reopen Deposit to refresh wallets." }, 404);
    if (type === "subscription" && !["SOL", "BTC", "ETH", "XRP"].includes(wallet.cryptoMethod)) return json({ error: "Select a supported cryptocurrency wallet for this plan." }, 400);
    await Transaction.createIndexes();
    try {
      const transaction = await Transaction.create({ userId: user.id, reference, type, amount, status: "pending", cryptoMethod: wallet.cryptoMethod || "UNSPECIFIED", walletId: wallet._id, walletName: wallet.walletName, walletAddress: wallet.walletAddress, description });
      return json({ transaction: serializeTransaction(transaction) }, 201);
    } catch (error) {
      if (error.code !== 11000) throw error;
      const saved = await Transaction.findOne({ reference });
      if (saved) return replay(saved);
      throw error;
    }
  } catch { return json({ error: "Unable to record your payment. Please try again." }, 503); }
}
