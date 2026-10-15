import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Transaction } from "../../src/models/transaction.js";
import { User } from "../../src/models/user.js";

test("balances default to zero and reject negative, fractional, and unsafe cents", async () => {
  assert.equal(new User().balance, 0);
  for (const balance of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
    await assert.rejects(new User({ balance }).validate(), (error) => Boolean(error.errors.balance));
  }
});

test("transactions validate money, ownership, payment method, and lifecycle status", async () => {
  const values = { userId: new mongoose.Types.ObjectId(), type: "deposit", amount: 900, cryptoMethod: "sol" };
  const transaction = new Transaction(values);
  await transaction.validate();
  assert.equal(transaction.cryptoMethod, "SOL");
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.currency, "USD");
  assert.notEqual(transaction.reference, new Transaction(values).reference);
  for (const invalid of [{ amount: -1 }, { amount: 1.5 }, { amount: 0 }, { amount: Number.MAX_SAFE_INTEGER + 1 }, { userId: null }, { type: "credit-anything" }, { status: "approved" }, { cryptoMethod: "unknown" }]) {
    await assert.rejects(new Transaction({ ...values, ...invalid }).validate());
  }
});

test("transactions declare unique references, user history indexes, and timestamps", () => {
  assert.ok(Transaction.schema.indexes().some(([fields, options]) => fields.reference === 1 && options.unique));
  assert.ok(Transaction.schema.indexes().some(([fields]) => fields.userId === 1 && fields.createdAt === -1));
  assert.ok(Transaction.schema.path("createdAt"));
  assert.ok(Transaction.schema.path("updatedAt"));
});
