import { Trader } from "@/models/trader";
import { User } from "@/models/user";
import { traderInputSchema } from "@/schemas/trader";
import { authorizeTraderAdmin, readTraderJson, serializeTrader, traderFailure, traderJson } from "@/lib/admin-trader-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await authorizeTraderAdmin();
    if (auth.error) return auth.error;
    const traders = await Trader.find().sort({ profitUsdCents: -1, _id: 1 }).lean();
    return traderJson({ traders: traders.map(serializeTrader) });
  } catch (error) { return traderFailure(error); }
}

export async function POST(request) {
  try {
    const auth = await authorizeTraderAdmin(request, true);
    if (auth.error) return auth.error;
    const body = await readTraderJson(request);
    if (body.error) return body.error;
    const parsed = traderInputSchema.safeParse(body.data);
    if (!parsed.success) return traderJson({ error: parsed.error.issues[0].message }, 400);
    if (parsed.data.userId && !await User.exists({ _id: parsed.data.userId })) return traderJson({ error: "The linked user account was not found." }, 400);
    const trader = await Trader.create({
      username: parsed.data.username,
      usernameKey: parsed.data.username.toLowerCase(),
      userId: parsed.data.userId,
      avatarUrl: parsed.data.avatarUrl,
      profitUsdCents: parsed.data.profitUsd,
      followersCount: parsed.data.followersCount,
      listed: parsed.data.listed,
    });
    return traderJson({ trader: serializeTrader(trader) }, 201);
  } catch (error) { return traderFailure(error); }
}
