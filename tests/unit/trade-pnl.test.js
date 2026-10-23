import test from "node:test";
import assert from "node:assert/strict";
import { tradePnlSchema } from "../../src/schemas/trade-pnl.js";
import { User } from "../../src/models/user.js";

const input = { userId: "a".repeat(24), tradeId: "b".repeat(24), version: 0, realizedPnl: "+25.01", unrealizedPnl: "-10.50" };

test("signed PNL converts profits and losses to exact integer USD cents", () => {
  const parsed = tradePnlSchema.parse(input);
  assert.equal(parsed.realizedPnl, 2501);
  assert.equal(parsed.unrealizedPnl, -1050);
  assert.equal(tradePnlSchema.parse({ ...input, realizedPnl: "0.01" }).realizedPnl, 1);
  assert.equal(tradePnlSchema.parse({ ...input, realizedPnl: " -0.01 " }).realizedPnl, -1);
});

test("PNL rejects invalid signs, precision, overflow, IDs, versions and protected fields", () => {
  for (const value of ["", "+-1", "--1", "1.001", "1e2", "NaN", "Infinity", "90071992547409.92"]) {
    assert.equal(tradePnlSchema.safeParse({ ...input, realizedPnl: value }).success, false);
  }
  for (const changes of [{ userId: "invalid" }, { tradeId: "" }, { version: -1 }, { version: 0.5 }, { balance: "100" }]) {
    assert.equal(tradePnlSchema.safeParse({ ...input, ...changes }).success, false);
  }
});

test("new trades start with zero PNL and accept signed integer cents", () => {
  const purchase = new User({ purchases: [{}] }).purchases[0];
  assert.equal(purchase.realizedPnl, 0);
  assert.equal(purchase.unrealizedPnl, 0);
  assert.equal(purchase.pnlVersion, 0);
  const path = User.schema.path("purchases").schema.path("realizedPnl");
  assert.equal(path.validators[0].validator(-1050), true);
  assert.equal(path.validators[0].validator(1.5), false);
});
