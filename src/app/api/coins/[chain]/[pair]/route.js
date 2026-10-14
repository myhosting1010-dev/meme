import { coinPairParamsSchema, fetchCoinPair } from "@/services/dexscreener-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const parsed = coinPairParamsSchema.safeParse(await params);
  if (!parsed.success) return Response.json({ error: "Invalid pair address." }, { status: 400 });
  try {
    const coin = await fetchCoinPair(parsed.data.chain, parsed.data.pair);
    if (!coin) return Response.json({ error: "This pair is no longer available." }, { status: 404 });
    return Response.json({ coin, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, max-age=15, s-maxage=15" } });
  } catch {
    return Response.json({ error: "Pair data is temporarily unavailable. Please retry." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
