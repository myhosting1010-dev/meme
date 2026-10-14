import { getCoinFeed } from "@/services/coin-feed";
import { coinSearchSchema, searchCoins } from "@/services/dexscreener-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = coinSearchSchema.safeParse(new URL(request.url).searchParams.get("q") ?? "");
  if (!query.success) return Response.json({ error: "Search must be 200 characters or fewer." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const feed = query.data ? await searchCoins(query.data) : await getCoinFeed();
    return Response.json(feed, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json({ error: "Coin data is temporarily unavailable. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
