import { getCoinFeed } from "@/services/coin-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getCoinFeed(), { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return Response.json({ error: "Coin data is temporarily unavailable. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
