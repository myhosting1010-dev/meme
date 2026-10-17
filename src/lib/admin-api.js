import { getCurrentUser } from "@/lib/auth/session";
import { User } from "@/models/user";

export const adminJson = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function authorizeAdmin(request, checkOrigin = false) {
  if (checkOrigin) {
    const url = new URL(request.url);
    if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return { error: adminJson({ error: "Invalid request origin." }, 403) };
  }
  const user = await getCurrentUser();
  if (!user) return { error: adminJson({ error: "Sign in to continue." }, 401) };
  const admin = await User.findById(user.id).select("role").lean();
  if (admin?.role !== "admin") return { error: adminJson({ error: "Admin access required." }, 403) };
  return { user };
}

export async function readAdminJson(request) {
  const reader = request.body?.getReader();
  if (!reader) return { error: adminJson({ error: "JSON body required." }, 400) };
  const chunks = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); return { error: adminJson({ error: "Request too large." }, 413) }; }
    chunks.push(Buffer.from(value));
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return { error: adminJson({ error: "A JSON object is required." }, 400) };
    return { data };
  }
  catch { return { error: adminJson({ error: "Invalid JSON." }, 400) }; }
}

export function adminFailure(error) {
  console.error("[admin API] Request failed", { name: error?.name, code: error?.code, message: error?.message });
  if (error?.code === 11000) return adminJson({ error: "A record with these details already exists." }, 409);
  if (error?.name === "ValidationError" || error?.name === "CastError") return adminJson({ error: "The submitted details are invalid." }, 400);
  return adminJson({ error: "The admin service is temporarily unavailable." }, 503);
}
