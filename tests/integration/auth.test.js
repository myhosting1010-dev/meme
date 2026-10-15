import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { User } from "../../src/models/user.js";
import { Session } from "../../src/models/session.js";
import { AuthAttempt } from "../../src/models/auth-attempt.js";
import { Transaction } from "../../src/models/transaction.js";

// Run explicitly against a running local app; this suite writes a temporary account.
try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const origin = process.env.AUTH_TEST_URL || "http://127.0.0.1:3000";
const digest = (value) => createHash("sha256").update(value).digest("hex");

test("signup persists a user; signin verifies credentials and creates revocable sessions", async () => {
  assert.ok(process.env.MONGODB_URI, "Set MONGODB_URI before running database integration tests.");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
  const email = `auth-test-${suffix}@example.com`;
  const username = `test_${suffix}`;
  const password = `Test password ${randomUUID()}`;
  const startWindow = Math.floor(Date.now() / 900000);
  let userId;
  let unrelatedTransaction;
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  async function post(action, body, cookie) {
    return fetch(`${origin}/api/auth/${action}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  }
  async function session(cookie) {
    const response = await fetch(`${origin}/api/auth/session`, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    return response.json();
  }
  function cookieFrom(response) {
    const header = response.headers.get("set-cookie");
    assert.ok(header?.includes("HttpOnly"));
    assert.match(header, /SameSite=lax/i);
    return header.split(";")[0];
  }

  try {
    const signup = await post("signup", { username, email: email.toUpperCase(), twitterUsername: "@test_handle", password });
    const registered = await signup.json();
    assert.equal(signup.status, 201, JSON.stringify(registered));
    userId = registered.user.id;
    assert.deepEqual(Object.keys(registered.user).sort(), ["email", "id", "role", "username"]);
    const signupCookie = cookieFrom(signup);
    const stored = await User.findById(userId).select("+passwordHash +usernameKey").lean();
    assert.equal(stored.email, email);
    assert.equal(stored.usernameKey, username);
    assert.equal(stored.twitterUsername, "test_handle");
    assert.equal(stored.balance, 0);
    assert.notEqual(stored.passwordHash, password);
    assert.match(stored.passwordHash, /^scrypt\$/);
    assert.ok(stored.createdAt instanceof Date && stored.updatedAt instanceof Date);
    assert.equal((await session(signupCookie)).user.id, userId);

    await Transaction.create({ userId, type: "deposit", amount: 900, cryptoMethod: "SOL", description: `Own deposit ${suffix}` });
    unrelatedTransaction = await Transaction.create({ userId: new mongoose.Types.ObjectId(), type: "deposit", amount: 99900, cryptoMethod: "SOL", description: `Private deposit ${suffix}` });
    const profileResponse = await fetch(`${origin}/profile`, { headers: { Cookie: signupCookie } });
    assert.equal(profileResponse.status, 200);
    const profileHtml = await profileResponse.text();
    assert.ok(profileHtml.includes(username));
    assert.ok(profileHtml.includes("$0.00"));
    assert.ok(profileHtml.includes(`Own deposit ${suffix}`));
    assert.ok(profileHtml.includes("$9.00"));
    assert.equal(profileHtml.includes(`Private deposit ${suffix}`), false);
    const guestProfile = await fetch(`${origin}/profile`, { redirect: "manual" });
    const guestHtml = await guestProfile.text();
    if (guestProfile.status === 307) assert.equal(guestProfile.headers.get("location"), "/");
    else {
      // Next.js uses a meta redirect when a loading boundary has started streaming.
      assert.equal(guestProfile.status, 200);
      assert.match(guestHtml, /http-equiv="refresh"[^>]*url=\//);
    }
    assert.equal(guestHtml.includes(`Own deposit ${suffix}`), false);

    const duplicateEmail = await post("signup", { username: `${username}_2`, email, password });
    assert.equal(duplicateEmail.status, 409);
    const duplicateUsername = await post("signup", { username: username.toUpperCase(), email: `other-${email}`, password });
    assert.equal(duplicateUsername.status, 409);
    assert.equal((await post("signin", { email, password: "wrong password" })).status, 401);

    const signin = await post("signin", { email: email.toUpperCase(), password, remember: true }, signupCookie);
    const signedIn = await signin.json();
    assert.equal(signin.status, 200, JSON.stringify(signedIn));
    const signinCookie = cookieFrom(signin);
    assert.match(signin.headers.get("set-cookie"), /Max-Age=2592000/i);
    assert.equal((await session(signinCookie)).user.id, userId);
    assert.equal((await session(signupCookie)).user, null, "Signing in rotates the previous session.");
    const activeSession = await Session.findOne({ userId }).lean();
    assert.ok(activeSession);
    assert.notEqual(activeSession.tokenHash, signinCookie.split("=")[1]);
    assert.equal(activeSession.tokenHash, digest(signinCookie.split("=")[1]));

    assert.equal((await post("signout", {}, signinCookie)).status, 200);
    assert.equal((await session(signinCookie)).user, null);
    assert.equal(await Session.countDocuments({ userId }), 0);
  } finally {
    // Delete only the uniquely named temporary records created by this test.
    const created = await User.findOne({ email });
    if (created) { await Transaction.deleteMany({ userId: created._id }); await Session.deleteMany({ userId: created._id }); await User.deleteOne({ _id: created._id }); }
    if (unrelatedTransaction) await Transaction.deleteOne({ _id: unrelatedTransaction._id });
    const keys = [];
    const endWindow = Math.floor(Date.now() / 900000);
    for (let window = startWindow; window <= endWindow; window++) {
      for (const address of [email, `other-${email}`]) {
        for (const action of ["signup", "signin"]) keys.push(digest(`${action}:${address}:${window}`));
      }
    }
    await AuthAttempt.deleteMany({ key: { $in: keys } });
    await mongoose.disconnect();
  }
});
