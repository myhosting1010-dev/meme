import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectDatabase } from "@/lib/db/mongoose";
import { Session } from "@/models/session";
import { User } from "@/models/user";
import { AuthAttempt } from "@/models/auth-attempt";

export const sessionCookie = "tom_session";
export const digest = (value) => createHash("sha256").update(value).digest("hex");
const cache = globalThis.__tomAuthIndexes ??= { promise: null };
export async function authDatabase() {
  await connectDatabase();
  // Build declared unique/TTL indexes in production too; uniqueness is enforced by MongoDB.
  if (!cache.promise) cache.promise = Promise.all([User.createIndexes(), Session.createIndexes(), AuthAttempt.createIndexes()]).catch((error) => { cache.promise = null; throw error; });
  await cache.promise;
}
export function publicUser(user) { return { id: user._id.toString(), username: user.username, email: user.email, role: user.role || "user" }; }
export async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await authDatabase();
  const session = await Session.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const user = await User.findById(session.userId).lean();
  return user ? publicUser(user) : null;
}
export async function createSession(userId, remember) {
  const token = randomBytes(32).toString("hex");
  const seconds = remember ? 30 * 86400 : 86400;
  const previous = (await cookies()).get(sessionCookie)?.value;
  if (previous) await Session.deleteOne({ tokenHash: digest(previous) });
  await Session.create({ userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + seconds * 1000) });
  (await cookies()).set(sessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", ...(remember ? { maxAge: seconds } : {}) });
}
