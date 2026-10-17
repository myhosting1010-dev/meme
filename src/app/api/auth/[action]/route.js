import { cookies } from "next/headers";
import { signupSchema, signinSchema } from "@/schemas/auth";
import { User } from "@/models/user";
import { Session } from "@/models/session";
import { AuthAttempt } from "@/models/auth-attempt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { authDatabase, createSession, digest, getCurrentUser, publicUser, sessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request, { params }) {
  if ((await params).action !== "session") return json({ error: "Not found." }, 404);
  try { return json({ user: await getCurrentUser() }); }
  catch { return json({ error: "Account service is temporarily unavailable." }, 503); }
}

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid request.");
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) { await reader.cancel(); throw new Error("Request too large."); }
    chunks.push(Buffer.from(value));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (!["signup", "signin", "signout"].includes(action)) return json({ error: "Not found." }, 404);
  const requestUrl = new URL(request.url);
  const expectedOrigin = `${requestUrl.protocol}//${request.headers.get("host") ?? requestUrl.host}`;
  if (request.headers.get("origin") !== expectedOrigin) return json({ error: "Invalid request origin." }, 403);
  let signupData = null;
  try {
    if (action === "signout") {
      const cookieStore = await cookies();
      const token = cookieStore.get(sessionCookie)?.value;
      if (token) { await authDatabase(); await Session.deleteOne({ tokenHash: digest(token) }); }
      cookieStore.delete(sessionCookie);
      return json({ user: null });
    }
    let body;
    try { body = await readBody(request); } catch { return json({ error: "Invalid request body." }, 400); }
    const parsed = (action === "signup" ? signupSchema : signinSchema).safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const data = parsed.data;
    if (action === "signup") signupData = data;
    await authDatabase();
    const window = Math.floor(Date.now() / 900000);
    const key = digest(`${action}:${data.email}:${window}`);
    let attempt;
    try {
      attempt = await AuthAttempt.findOneAndUpdate({ key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 900000) } }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      if (error.code === 11000) return json({ error: "Please try again shortly." }, 429);
      throw error;
    }
    if (attempt.count > 10) return json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
    let user;
    if (action === "signup") {
      const [emailExists, usernameExists] = await Promise.all([
        User.exists({ email: data.email }),
        User.exists({ usernameKey: data.username.toLowerCase() }),
      ]);
      if (emailExists || usernameExists) return json({ error: signupConflict(Boolean(emailExists), Boolean(usernameExists)) }, 409);
      user = await User.create({ username: data.username, email: data.email, twitterUsername: data.twitterUsername, passwordHash: await hashPassword(data.password) });
    } else {
      user = await User.findOne({ email: data.email }).select("+passwordHash");
      // Perform the same password derivation even if no matching account exists.
      const fallback = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;
      const valid = await verifyPassword(data.password, user?.passwordHash ?? fallback);
      if (!user || !valid) return json({ error: "Email or password is incorrect." }, 401);
    }
    await createSession(user._id, action === "signin" && data.remember);
    return json({ user: publicUser(user) }, action === "signup" ? 201 : 200);
  } catch (error) {
    if (error.code === 11000 && action === "signup") {
      const [emailExists, usernameExists] = signupData ? await Promise.all([User.exists({ email: signupData.email }), User.exists({ usernameKey: signupData.username.toLowerCase() })]) : [false, false];
      return json({ error: signupConflict(Boolean(emailExists), Boolean(usernameExists)) }, 409);
    }
    if (error.code === 11000) return json({ error: "Please try again shortly." }, 429);
    return json({ error: "Account service is temporarily unavailable. Please try again." }, 503);
  }
}

function signupConflict(emailExists, usernameExists) {
  if (emailExists && usernameExists) return "That email and username are already registered.";
  if (emailExists) return "That email is already registered.";
  if (usernameExists) return "That username is already taken.";
  return "That email or username is already in use.";
}
