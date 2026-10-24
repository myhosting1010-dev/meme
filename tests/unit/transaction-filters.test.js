import test from "node:test";
import assert from "node:assert/strict";
import { transactionTypeFilter } from "../../src/lib/transaction-filters.js";

test("transaction filters separate deposits and withdrawals and preserve other records", () => {
  assert.deepEqual(transactionTypeFilter(), {});
  assert.deepEqual(transactionTypeFilter("deposit"), { type: "deposit" });
  assert.deepEqual(transactionTypeFilter("withdrawal"), { type: "withdrawal" });
  assert.deepEqual(transactionTypeFilter("other"), { type: { $nin: ["deposit", "withdrawal"] } });
  for (const invalid of ["pending", "DEPOSIT", "", { $ne: "deposit" }]) assert.throws(() => transactionTypeFilter(invalid));
});
