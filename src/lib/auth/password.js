import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt, 64);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(stored ?? "")) return false;
  const [, salt, expected] = stored.split("$");
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
