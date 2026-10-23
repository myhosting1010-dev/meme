import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/models/user";
import { tradeSchema, purchaseQuantity } from "@/schemas/trade";
import { fetchCoinPair } from "@/services/dexscreener-data";

export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const insufficient = () => json({ error: "Insufficient balance. Deposit to make a purchase." }, 409);

export async function POST(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return json({ error: "Invalid request origin." }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Sign in to buy a coin." }, 401);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "JSON body required." }, 400);
    const chunks = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) { await reader.cancel(); return json({ error: "Request too large." }, 413); }
      chunks.push(Buffer.from(value));
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return json({ error: "Invalid JSON." }, 400); }
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { chain, pair, amount, idempotencyKey } = parsed.data;
    const replay = (trade) => trade.amount === amount && trade.chain === chain && trade.pair === pair
      ? json({ trade, redirectTo: "/profile" })
      : json({ error: "This purchase request was already used with different details." }, 409);
    const previous = await User.findOne({ _id: user.id, "purchases.idempotencyKey": idempotencyKey }).select("+purchases").lean();
    if (previous) return replay(previous.purchases.find((item) => item.idempotencyKey === idempotencyKey));
    const account = await User.findById(user.id).select("balance").lean();
    if (!account || (account.balance ?? 0) <= amount) return insufficient();
    // The server chooses the market snapshot; client-supplied prices are never trusted.
    const coin = await fetchCoinPair(chain, pair, (input, options) => {
      const fresh = { ...options, cache: "no-store" };
      delete fresh.next;
      return fetch(input, fresh);
    });
    if (!coin || !Number.isFinite(coin.marketCap) || coin.marketCap < 0 || !Number.isFinite(coin.priceUsd) || coin.priceUsd <= 0) return json({ error: "Current price and market cap are unavailable. Please try again." }, 503);
    const trade = {
      _id: new mongoose.Types.ObjectId(), idempotencyKey, chain, pair,
      coinName: coin.name, symbol: coin.symbol, tokenAddress: coin.id.split(":")[1],
      amount, priceUsd: coin.priceUsd, marketCap: coin.marketCap,
      quantity: purchaseQuantity(amount, coin.priceUsd), createdAt: new Date(),
    };
    const result = await User.updateOne({
      _id: user.id, balance: { $gt: amount }, "purchases.idempotencyKey": { $ne: idempotencyKey },
    }, { $inc: { balance: -amount }, $push: { purchases: trade } }, { runValidators: true });
    if (result.modifiedCount !== 1) {
      const current = await User.findOne({ _id: user.id, "purchases.idempotencyKey": idempotencyKey }).select("+purchases").lean();
      if (current) return replay(current.purchases.find((item) => item.idempotencyKey === idempotencyKey));
      return insufficient();
    }
    return json({ trade, redirectTo: "/profile" }, 201);
  } catch { return json({ error: "Unable to complete your purchase. Retry with the same amount to check its status safely." }, 503); }
}
