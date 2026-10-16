import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/models/user";

export const traderJson = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function authorizeTraderAdmin(request, checkOrigin = false) {
  if (checkOrigin) {
    const url = new URL(request.url);
    if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return { error: traderJson({ error: "Invalid request origin." }, 403) };
  }
  const user = await getCurrentUser();
  if (!user) return { error: traderJson({ error: "Sign in to continue." }, 401) };
  const admin = await User.findById(user.id).select("role").lean();
  if (admin?.role !== "admin") return { error: traderJson({ error: "Admin access required." }, 403) };
  return { user };
}

export async function readTraderJson(request) {
  const reader = request.body?.getReader();
  if (!reader) return { error: traderJson({ error: "JSON body required." }, 400) };
  const chunks = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); return { error: traderJson({ error: "Request too large." }, 413) }; }
    chunks.push(Buffer.from(value));
  }
  try { return { data: JSON.parse(Buffer.concat(chunks).toString("utf8")) }; }
  catch { return { error: traderJson({ error: "Invalid JSON." }, 400) }; }
}

export function serializeTrader(trader) {
  return {
    id: trader._id.toString(), userId: trader.userId?.toString() || "", username: trader.username,
    avatarUrl: trader.avatarUrl || "", profitUsdCents: trader.profitUsdCents,
    followersCount: trader.followersCount, listed: trader.listed,
    createdAt: trader.createdAt, updatedAt: trader.updatedAt,
  };
}

export function traderFailure(error) {
  console.error("[admin traders API] Request failed", {
    name: error?.name,
    code: error?.code,
    message: error?.message,
  });
  if (error.code === 11000) return traderJson({ error: "That trader username or linked account is already in use." }, 409);
  if (error.name === "ValidationError" || error.name === "CastError") return traderJson({ error: "Trader details are invalid." }, 400);
  return traderJson({ error: "Trader service is temporarily unavailable." }, 503);
}
