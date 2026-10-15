import test from "node:test";
import assert from "node:assert/strict";
import { signupSchema, signinSchema } from "../../src/schemas/auth.js";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password.js";
import { User } from "../../src/models/user.js";
import { Session } from "../../src/models/session.js";

test("signup normalizes account identifiers without changing passwords", () => {
  const data = signupSchema.parse({ username: " Trader_1 ", email: " TRADER@EXAMPLE.COM ", twitterUsername: "@trader", password: "a long password  " });
  assert.equal(data.username, "Trader_1");
  assert.equal(data.email, "trader@example.com");
  assert.equal(data.twitterUsername, "trader");
  assert.equal(data.password, "a long password  ");
  assert.equal(signupSchema.safeParse({ ...data, password: "short" }).success, false);
  assert.equal(signupSchema.safeParse({ ...data, username: "bad name" }).success, false);
  assert.equal(signupSchema.safeParse({ ...data, twitterUsername: "bad handle!" }).success, false);
  assert.equal(signinSchema.safeParse({ email: { $ne: null }, password: "test" }).success, false);
});

test("passwords use independent salts and reject incorrect passwords", async () => {
  const password = "correct horse battery staple";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("incorrect password", first), false);
  assert.equal(await verifyPassword(password, "malformed"), false);
});

test("user validation derives case-insensitive username key and rejects invalid data", async () => {
  const user = new User({ username: " Trader_1 ", email: " TRADER@EXAMPLE.COM ", passwordHash: await hashPassword("a secure password") });
  await user.validate();
  assert.equal(user.usernameKey, "trader_1");
  assert.equal(user.email, "trader@example.com");
  user.username = "invalid name";
  await assert.rejects(user.validate());
});

test("account and session schemas declare unique indexes, expiry, and timestamps", () => {
  const unique = User.schema.indexes().filter(([, options]) => options.unique).map(([fields]) => Object.keys(fields)[0]);
  assert.deepEqual(unique.sort(), ["email", "usernameKey"]);
  assert.equal(User.schema.path("passwordHash").options.select, false);
  assert.ok(Session.schema.indexes().some(([fields, options]) => fields.tokenHash === 1 && options.unique));
  assert.ok(Session.schema.indexes().some(([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0));
  assert.ok(User.schema.path("createdAt"));
  assert.ok(Session.schema.path("updatedAt"));
});
