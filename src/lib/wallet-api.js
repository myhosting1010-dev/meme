import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { walletSchema, walletUpdateSchema } from "@/schemas/wallet";

export const walletJson = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export const serializeWallet = (wallet) => ({ id: wallet._id.toString(), walletName: wallet.walletName, walletAddress: wallet.walletAddress, picture: wallet.picture, cryptoMethod: wallet.cryptoMethod || "", createdAt: wallet.createdAt, updatedAt: wallet.updatedAt });

export async function authorizeWalletWrite(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return { error: walletJson({ error: "Invalid request origin." }, 403) };
  const user = await getCurrentUser();
  if (!user) return { error: walletJson({ error: "Sign in to continue." }, 401) };
  if (user.role !== "admin") return { error: walletJson({ error: "Admin access required." }, 403) };
  return { user };
}

export async function parseWalletBody(request, partial = false) {
  const reader = request.body?.getReader();
  if (!reader) return { error: walletJson({ error: "JSON body required." }, 400) };
  const chunks = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); return { error: walletJson({ error: "Request too large." }, 413) }; }
    chunks.push(Buffer.from(value));
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return { error: walletJson({ error: "Invalid JSON." }, 400) }; }
  const parsed = (partial ? walletUpdateSchema : walletSchema).safeParse(body);
  if (!parsed.success) return { error: walletJson({ error: parsed.error.issues[0].message }, 400) };
  return { data: parsed.data };
}

export function walletFailure(error) {
  if (error.code === 11000) return walletJson({ error: "This wallet address already exists." }, 409);
  return walletJson({ error: "Wallet service is temporarily unavailable." }, 503);
}
