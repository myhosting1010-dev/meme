import { getCurrentUser } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/user";
import { Wallet } from "@/models/wallet";
import { walletSchema } from "@/schemas/wallet";

export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const serialize = (wallet) => ({ id: wallet._id.toString(), walletName: wallet.walletName, walletAddress: wallet.walletAddress, picture: wallet.picture, cryptoMethod: wallet.cryptoMethod || "", createdAt: wallet.createdAt, updatedAt: wallet.updatedAt });

// Public receiving addresses and pictures; internal creator information is never returned.
export async function GET() {
  try {
    await connectDatabase();
    const wallets = await Wallet.find().sort({ createdAt: -1, _id: -1 }).lean();
    return json({ wallets: wallets.map(serialize) });
  } catch { return json({ error: "Wallet service is temporarily unavailable." }, 503); }
}

export async function POST(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return json({ error: "Invalid request origin." }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Sign in to continue." }, 401);
    const admin = await User.findById(user.id).select("role").lean();
    if (admin?.role !== "admin") return json({ error: "Admin access required." }, 403);
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
    const parsed = walletSchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    await Wallet.createIndexes();
    const wallet = await Wallet.create({ ...parsed.data, createdBy: user.id });
    return json({ wallet: serialize(wallet) }, 201);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) return json({ error: "This wallet address already exists." }, 409);
    return json({ error: "Wallet service is temporarily unavailable." }, 503);
  }
}
