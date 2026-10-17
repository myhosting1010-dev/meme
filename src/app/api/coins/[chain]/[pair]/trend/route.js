import { coinPairParamsSchema } from "@/services/dexscreener-data";
import { fetchCoinTrend } from "@/services/coin-trend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const parsed = coinPairParamsSchema.safeParse(await params);
  if (!parsed.success) return Response.json({ error: "Invalid pair address." }, { status: 400 });
  try {
    const points = await fetchCoinTrend(parsed.data.chain, parsed.data.pair);
    return Response.json({ points }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
  } catch {
    return Response.json({ error: "Coin trend is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  }
}
