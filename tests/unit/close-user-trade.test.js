import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { closeUserTrade } from "../../src/services/close-user-trade.js";

const userId = "a".repeat(24), tradeId = "b".repeat(24);
function fixture(overrides = {}) {
  const trade = { _id: new mongoose.Types.ObjectId(tradeId), amount: 10000, realizedPnl: 2000, unrealizedPnl: -500, status: "open", statusVersion: 0, ...overrides };
  const account = { balance: 5000, purchases: [trade] };
  let writes = 0;
  const collection = {
    async findOne(query) { return query._id.toString() === userId && query["purchases._id"].toString() === tradeId ? account : null; },
    async findOneAndUpdate(filter, update, options) {
      assert.equal(filter._id.toString(), userId);
      assert.equal(filter.purchases.$elemMatch._id.toString(), tradeId);
      assert.equal(options.returnDocument, "after");
      assert.equal(options.includeResultMetadata, false);
      if (trade.status === "closed" || account.balance < filter.balance.$gte || account.balance > filter.balance.$lte) return null;
      writes++;
      account.balance += update.$inc.balance;
      trade.status = update.$set["purchases.$.status"];
      trade.statusVersion = update.$set["purchases.$.statusVersion"];
      return { balance: account.balance };
    },
  };
  return { collection, account, writes: () => writes };
}
test("user close settles signed PNL and retries do not credit twice", async () => {
  const state = fixture();
  const request = { userId, tradeId, version: 0 };
  const result = await closeUserTrade(request, state.collection);
  assert.equal(result.status, 200);
  assert.equal(result.body.balance, 16500);
  assert.equal(result.body.balanceChange, 11500);
  assert.equal(state.account.purchases[0].status, "closed");
  const replay = await closeUserTrade(request, state.collection);
  assert.equal(replay.body.alreadyClosed, true);
  assert.equal(replay.body.balance, 16500);
  assert.equal(replay.body.balanceChange, 0);
  assert.equal(state.writes(), 1);
});
test("another user's trade cannot be closed", async () => {
  const state = fixture();
  const result = await closeUserTrade({ userId: "c".repeat(24), tradeId, version: 0 }, state.collection);
  assert.equal(result.status, 404);
  assert.equal(state.writes(), 0);
});
test("invalid stored amounts return a clear error without a balance change", async () => {
  const state = fixture({ unrealizedPnl: 1.5 });
  const result = await closeUserTrade({ userId, tradeId, version: 0 }, state.collection);
  assert.equal(result.status, 422);
  assert.equal(state.writes(), 0);
});
test("losses exceeding available funds leave the trade open", async () => {
  const state = fixture({ realizedPnl: -20000 });
  const result = await closeUserTrade({ userId, tradeId, version: 0 }, state.collection);
  assert.equal(result.status, 409);
  assert.equal(state.account.balance, 5000);
  assert.equal(state.account.purchases[0].status, "open");
});
