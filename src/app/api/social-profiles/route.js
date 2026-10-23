import { connectDatabase } from "@/lib/db/mongoose";
import { SocialProfile } from "@/models/social-profile";
import { socialProfileSchema } from "@/schemas/social-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await connectDatabase();
    const current = await SocialProfile.findOne().sort({ updatedAt: -1, _id: -1 }).select("profileUrl").lean();
    const parsed = current && socialProfileSchema.safeParse({ profile: current.profileUrl });
    return Response.json({ supportUrl: parsed?.success ? parsed.data.profileUrl : null }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Support profile is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
