import { z } from "zod";

const reserved = new Set(["home", "explore", "search", "settings", "messages", "notifications", "intent", "share", "i", "compose", "login", "signup"]);
export function normalizeXProfile(value) {
  let handle = value.trim();
  if (/^https?:\/\//i.test(handle)) {
    const url = new URL(handle);
    if (url.protocol !== "https:" || !["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash) throw new Error("Enter an X or Twitter profile URL.");
    handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
  } else handle = handle.replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{1,15}$/.test(handle) || reserved.has(handle.toLowerCase())) throw new Error("Enter a valid X username or profile URL.");
  return { handle, profileUrl: `https://x.com/${handle}` };
}

export const socialProfileSchema = z.object({ profile: z.string().trim().min(1).max(300) }).strict().transform((input, context) => {
  try { return normalizeXProfile(input.profile); }
  catch (error) { context.addIssue({ code: "custom", message: error.message }); return z.NEVER; }
});
