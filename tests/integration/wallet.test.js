import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { User } from "../../src/models/user.js";
import { Wallet } from "../../src/models/wallet.js";
import { Session } from "../../src/models/session.js";
import { AuthAttempt } from "../../src/models/auth-attempt.js";
import { hashPassword } from "../../src/lib/auth/password.js";
import { createHash } from "node:crypto";

try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const origin = process.env.AUTH_TEST_URL || "http://127.0.0.1:3101";

test("wallet creation is admin-only and listing returns saved wallets", async () => {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  const users = [];
  const walletAddress = `wallet_test_${suffix}`;
  const password = randomUUID();
  const firstWindow = Math.floor(Date.now() / 900000);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const post = (path, body, cookie) => fetch(`${origin}${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const write = (id, method, body, cookie) => fetch(`${origin}/api/wallets/${id}`, { method, headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    const payload = { walletName: "Test Solana wallet", walletAddress, picture: "https://example.com/wallet.png", cryptoMethod: "SOL" };
    assert.equal((await post("/api/wallets", payload)).status, 401);
    const cookies = {};
    for (const role of ["user", "admin"]) {
      const user = await User.create({ username: `${role}_${suffix}`, email: `${role}_${suffix}@example.com`, passwordHash: await hashPassword(password), role });
      users.push(user);
      const login = await post("/api/auth/signin", { email: user.email, password });
      assert.equal(login.status, 200);
      assert.equal((await login.json()).user.role, role);
      cookies[role] = login.headers.get("set-cookie").split(";")[0];
    }
    assert.equal((await post("/api/wallets", payload, cookies.user)).status, 403);
    assert.equal((await post("/api/wallets", { ...payload, picture: "bad-url" }, cookies.admin)).status, 400);
    const created = await post("/api/wallets", payload, cookies.admin);
    assert.equal(created.status, 201, await created.text());
    assert.equal((await post("/api/wallets", payload, cookies.admin)).status, 409);
    const stored = await Wallet.findOne({ walletAddress });
    assert.equal(stored.createdBy.toString(), users[1]._id.toString());
    const response = await fetch(`${origin}/api/wallets`);
    assert.equal(response.status, 200);
    const listed = (await response.json()).wallets.find((wallet) => wallet.walletAddress === walletAddress);
    assert.ok(listed);
    assert.equal(listed.picture, payload.picture);
    assert.equal(listed.cryptoMethod, "SOL");
    assert.equal(listed.walletName, payload.walletName);
    assert.equal(listed.address, undefined);
    assert.equal(listed.createdBy, undefined);
    const id = stored._id.toString();
    assert.equal((await write(id, "PATCH", { picture: "https://example.com/new.png" })).status, 401);
    assert.equal((await write(id, "DELETE")).status, 401);
    assert.equal((await write(id, "PATCH", { walletAddress }, cookies.user)).status, 403);
    assert.equal((await write(id, "DELETE", null, cookies.user)).status, 403);
    assert.equal((await write("invalid", "DELETE", null, cookies.admin)).status, 400);
    assert.equal((await write(id, "PATCH", {}, cookies.admin)).status, 400);
    assert.equal((await write(id, "PATCH", { createdBy: users[0]._id.toString() }, cookies.admin)).status, 400);
    const edited = await write(id, "PATCH", { picture: "https://example.com/updated.png", walletName: "Updated wallet name" }, cookies.admin);
    assert.equal(edited.status, 200);
    assert.equal((await edited.json()).wallet.picture, "https://example.com/updated.png");
    assert.equal((await Wallet.findById(id)).walletAddress, walletAddress);
    assert.equal((await Wallet.findById(id)).walletName, "Updated wallet name");
    const adminPage = await fetch(`${origin}/admin/wallets`, { headers: { Cookie: cookies.admin } });
    assert.equal(adminPage.status, 200);
    assert.match(await adminPage.text(), /Add Wallet/);
    const deleted = await write(id, "DELETE", null, cookies.admin);
    assert.equal(deleted.status, 200);
    assert.equal(await Wallet.findById(id), null);
    assert.equal((await write(id, "DELETE", null, cookies.admin)).status, 404);
    assert.equal((await write(id, "PATCH", { walletAddress }, cookies.admin)).status, 404);
  } finally {
    await Wallet.deleteOne({ walletAddress });
    for (const user of users) {
      await Session.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });
      for (let window = firstWindow; window <= Math.floor(Date.now() / 900000); window++) {
        const key = createHash("sha256").update(`signin:${user.email}:${window}`).digest("hex");
        await AuthAttempt.deleteOne({ key });
      }
    }
    await mongoose.disconnect();
  }
});
