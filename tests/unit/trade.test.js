import test from "node:test";
import assert from "node:assert/strict";
import { tradeSchema, purchaseQuantity } from "../../src/schemas/trade.js";
import { User } from "../../src/models/user.js";

const request = { chain: "solana", pair: "pair123", amount: "70.25", idempotencyKey: "c2ee059e-2081-4c92-9734-7f7150462160" };

test("trade amounts use integer USD cents and reject invalid or forged purchase data", () => {
  assert.equal(tradeSchema.parse(request).amount, 7025);
  for (const amount of ["0", "-1", "1.001", "NaN", "Infinity", "1e3", "9007199254740991"]) {
    assert.equal(tradeSchema.safeParse({ ...request, amount }).success, false);
  }
  assert.equal(tradeSchema.safeParse({ ...request, priceUsd: 0.0001 }).success, false);
  assert.equal(tradeSchema.safeParse({ ...request, idempotencyKey: "" }).success, false);
  assert.equal(tradeSchema.safeParse({ ...request, pair: "../bad" }).success, false);
});

test("quantity converts cents to dollars before dividing by the coin price", () => {
  assert.equal(purchaseQuantity(7000, 0.000007), 10000000);
  assert.equal(purchaseQuantity(7025, 2), 35.125);
  for (const price of [0, -1, null, NaN, Infinity, Number.MIN_VALUE]) assert.throws(() => purchaseQuantity(7000, price));
  assert.throws(() => purchaseQuantity(0, 1));
});

test("purchase ledger persists execution details and is excluded from ordinary user queries", async () => {
  assert.equal(User.schema.path("purchases").options.select, false);
  const user = new User({
    username: "trader", usernameKey: "trader", email: "trader@example.com",
    passwordHash: `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`,
    purchases: [{ ...request, amount: 7025, coinName: "Coin", symbol: "COIN", tokenAddress: "token", priceUsd: 2, marketCap: 1000000, quantity: 35.125, createdAt: new Date() }],
  });
  await user.validate();
  assert.equal(user.purchases[0].quantity, 35.125);
  assert.equal(user.purchases[0].marketCap, 1000000);
});
