import test from "node:test";
import assert from "node:assert/strict";
import { walletSchema, walletUpdateSchema } from "../../src/schemas/wallet.js";
import { Wallet } from "../../src/models/wallet.js";
import { User } from "../../src/models/user.js";
import { signupSchema } from "../../src/schemas/auth.js";

test("wallet input requires a name, walletAddress and HTTPS picture, rejecting unknown fields", () => {
  const valid = { walletName: "Main wallet", walletAddress: "0x1234567890abcdef", picture: "https://example.com/wallet.png" };
  assert.equal(walletSchema.safeParse(valid).success, true);
  assert.equal(walletSchema.safeParse({ ...valid, walletName: "" }).success, false);
  assert.equal(walletSchema.safeParse({ ...valid, address: "legacy-field" }).success, false);
  assert.equal(walletSchema.safeParse({ ...valid, walletAddress: "abc" }).success, true);
  for (const input of [{ ...valid, walletAddress: "" }, { ...valid, picture: "bad-url" }, { ...valid, picture: "javascript:alert(1)" }, { ...valid, picture: "http://example.com/a.png" }, { ...valid, createdBy: "forged" }]) assert.equal(walletSchema.safeParse(input).success, false);
  assert.ok(Wallet.schema.indexes().some(([fields, options]) => fields.walletAddress === 1 && options.unique));
  assert.ok(Wallet.schema.path("createdAt"));
});

test("public signup cannot set an admin role", () => {
  const data = signupSchema.parse({ username: "regular", email: "regular@example.com", password: "a long secure password", role: "admin" });
  assert.equal(data.role, undefined);
  assert.equal(new User({ username: data.username, email: data.email }).role, "user");
});

test("wallet edits allow individual fields and reject empty or protected updates", () => {
  assert.equal(walletUpdateSchema.safeParse({ picture: "https://example.com/new.png" }).success, true);
  assert.equal(walletUpdateSchema.safeParse({}).success, false);
  assert.equal(walletUpdateSchema.safeParse({ createdBy: "forged" }).success, false);
});
