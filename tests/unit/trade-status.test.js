import test from "node:test";
import assert from "node:assert/strict";
import { tradeStatusSchema, tradeStatusUpdate } from "../../src/schemas/trade-status.js";
import { User } from "../../src/models/user.js";

const input = { userId: "a".repeat(24), tradeId: "b".repeat(24), version: 0, status: "closed" };
const change = (overrides = {}) => tradeStatusUpdate({ ...input, amount: 52700, adminId: "c".repeat(24), ...overrides });

test("status requests reject forged amounts, invalid states and stale-version shapes", () => {
  assert.equal(tradeStatusSchema.safeParse(input).success, true);
  for (const extra of [{ amount: 1 }, { balance: 1 }, { status: "pending" }, { version: -1 }, { version: 0.5 }, { userId: "bad" }]) {
    assert.equal(tradeStatusSchema.safeParse({ ...input, ...extra }).success, false);
  }
  assert.throws(() => change({ amount: 0 }));
  assert.throws(() => change({ amount: 1.5 }));
});

test("new purchases are open and legacy purchases match the initial version", () => {
  const trade = new User({ purchases: [{}] }).purchases[0];
  assert.equal(trade.status, "open");
  assert.equal(trade.statusVersion, 0);
  assert.deepEqual(change().filter.purchases.$elemMatch.$or, [{ statusVersion: 0 }, { statusVersion: { $exists: false } }]);
});

// Exercise the generated conditional update against account state, including
// duplicate requests, reopening, stale retries, insufficient funds and overflow.
function apply(account, operation) {
  const { filter, update } = operation;
  const match = filter.purchases.$elemMatch;
  const trade = account.trade;
  if (match.status === "closed" ? trade.status !== "closed" : trade.status === "closed") return false;
  if (match.$or ? (trade.statusVersion ?? 0) !== 0 : trade.statusVersion !== match.statusVersion) return false;
  if (match.$and) {
    const expected = match.$and[0];
    if ((trade.pnlVersion ?? 0) !== (expected.pnlVersion ?? 0)) return false;
  }
  if (trade.amount !== match.amount) return false;
  if (filter.balance.$gte !== undefined && account.balance < filter.balance.$gte) return false;
  if (filter.balance.$lte !== undefined && account.balance > filter.balance.$lte) return false;
  account.balance += update.$inc.balance;
  trade.settledAmount = update.$set["purchases.$.settledAmount"];
  trade.status = update.$set["purchases.$.status"];
  trade.statusVersion = update.$set["purchases.$.statusVersion"];
  return true;
}

test("close credits once; reopen reverses credit; stale close cannot settle again", () => {
  const account = { balance: 10000, trade: { amount: 52700 } };
  const close = change();
  assert.equal(apply(account, close), true);
  assert.equal(account.balance, 62700);
  assert.equal(apply(account, close), false);
  assert.equal(account.balance, 62700);
  assert.equal(apply(account, change({ status: "open", version: 1 })), true);
  assert.equal(account.balance, 10000);
  assert.equal(apply(account, close), false);
  assert.equal(apply(account, change({ version: 2 })), true);
  assert.equal(account.balance, 62700);
});

test("reopen cannot overdraw and close cannot overflow the balance", () => {
  const account = { balance: 52699, trade: { amount: 52700, status: "closed", statusVersion: 1 } };
  assert.equal(apply(account, change({ status: "open", version: 1 })), false);
  assert.equal(account.balance, 52699);
  account.balance = Number.MAX_SAFE_INTEGER;
  account.trade.status = "open";
  assert.equal(apply(account, change({ version: 1 })), false);
  assert.equal(account.trade.status, "open");
});


test("closing includes both signed PNL values in the available balance", () => {
  for (const [realizedPnl, unrealizedPnl, expected] of [[1000, 2000, 65700], [-1000, -2000, 59700], [1000, -2000, 61700], [-1000, 2000, 63700], [-52700, 0, 10000], [-55000, 0, 7700]]) {
    const account = { balance: 10000, trade: { amount: 52700 } };
    assert.equal(apply(account, change({ realizedPnl, unrealizedPnl })), true);
    assert.equal(account.balance, expected);
    assert.equal(account.trade.settledAmount, expected - 10000);
  }
});

test("reopening reverses the saved settlement even when PNL was edited afterward", () => {
  const account = { balance: 10000, trade: { amount: 52700 } };
  assert.equal(apply(account, change({ realizedPnl: 1000, unrealizedPnl: -2000 })), true);
  assert.equal(apply(account, change({ status: "open", version: 1, settledAmount: account.trade.settledAmount, realizedPnl: 99999 })), true);
  assert.equal(account.balance, 10000);
});

test("closing refuses an outdated PNL snapshot and a loss exceeding available funds", () => {
  const account = { balance: 100, trade: { amount: 52700, pnlVersion: 1 } };
  assert.equal(apply(account, change()), false);
  assert.equal(apply(account, change({ pnlVersion: 1, realizedPnl: -53000 })), false);
  assert.equal(account.balance, 100);
});

test("settlements reject unsafe sums and preserve exact signed cancellation", () => {
  assert.throws(() => change({ realizedPnl: Number.MAX_SAFE_INTEGER }));
  assert.throws(() => change({ unrealizedPnl: 0.5 }));
  assert.equal(change({ realizedPnl: Number.MAX_SAFE_INTEGER, unrealizedPnl: -Number.MAX_SAFE_INTEGER }).settlement, 52700);
  assert.equal(Math.abs(change({ status: "open", settledAmount: 0 }).balanceChange), 0);
  assert.equal(change({ status: "open", settledAmount: -200 }).balanceChange, 200);
});
