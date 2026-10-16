import { getCurrentUser } from "@/lib/auth/session";
import { Trader } from "@/models/trader";

export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    const viewer = await getCurrentUser();
    if (!viewer) return json({ error: "Sign in to access the Alpha Lounge." }, 401);
    const records = await Trader.find({ listed: true })
      .sort({ profitUsdCents: -1, _id: 1 })
      .limit(100)
      .select("userId username avatarUrl profitUsdCents followersCount")
      .lean();
    const traders = records.map((trader, index) => ({
      id: trader._id.toString(),
      userId: trader.userId?.toString() || null,
      username: trader.username,
      avatarUrl: trader.avatarUrl || "",
      profitUsdCents: trader.profitUsdCents,
      followersCount: trader.followersCount,
      rank: index + 1,
    }));
    const ownTrader = traders.find((trader) => trader.userId === viewer.id);
    return json({ traders, viewerRank: ownTrader?.rank ?? null, limit: 100 });
  } catch {
    return json({ error: "Unable to load traders right now." }, 503);
  }
}
