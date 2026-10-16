import { Trader } from "@/models/trader";
import { User } from "@/models/user";
import { traderInputSchema } from "@/schemas/trader";
import { authorizeTraderAdmin, readTraderJson, serializeTrader, traderFailure, traderJson } from "@/lib/admin-trader-api";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const auth = await authorizeTraderAdmin(request, true);
    if (auth.error) return auth.error;
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return traderJson({ error: "Invalid trader ID." }, 400);
    const body = await readTraderJson(request);
    if (body.error) return body.error;
    const parsed = traderInputSchema.safeParse(body.data);
    if (!parsed.success) return traderJson({ error: parsed.error.issues[0].message }, 400);
    if (parsed.data.userId && !await User.exists({ _id: parsed.data.userId })) return traderJson({ error: "The linked user account was not found." }, 400);
    const trader = await Trader.findByIdAndUpdate(id, { $set: {
      username: parsed.data.username,
      usernameKey: parsed.data.username.toLowerCase(),
      userId: parsed.data.userId,
      avatarUrl: parsed.data.avatarUrl,
      profitUsdCents: parsed.data.profitUsd,
      followersCount: parsed.data.followersCount,
      listed: parsed.data.listed,
    } }, { returnDocument: "after", runValidators: true });
    if (!trader) return traderJson({ error: "Trader not found." }, 404);
    return traderJson({ trader: serializeTrader(trader) });
  } catch (error) { return traderFailure(error); }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorizeTraderAdmin(request, true);
    if (auth.error) return auth.error;
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return traderJson({ error: "Invalid trader ID." }, 400);
    const trader = await Trader.findByIdAndDelete(id);
    if (!trader) return traderJson({ error: "Trader not found." }, 404);
    return traderJson({ deletedId: id });
  } catch (error) { return traderFailure(error); }
}
