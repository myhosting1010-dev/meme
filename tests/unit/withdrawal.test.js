import test from "node:test";
import assert from "node:assert/strict";
import { withdrawalSchema, withdrawalSettingsSchema, withdrawalValidationError, DEFAULT_MINIMUM_WITHDRAWAL } from "../../src/schemas/withdrawal.js";
import { PaymentSettings } from "../../src/models/payment-settings.js";
import { Transaction } from "../../src/models/transaction.js";

const input = { amount: "35000.01", network: "SOL", destinationAddress: "11111111111111111111111111111111", idempotencyKey: "c4d3e0d4-73be-4bc1-9e4c-05bd0316092f" };
test("withdrawal amounts and admin minimum use exact USD cents", () => {
  assert.equal(withdrawalSchema.parse(input).amount, 3500001);
  assert.equal(withdrawalSettingsSchema.parse({ minimumWithdrawal: "12.34" }).minimumWithdrawal, 1234);
  assert.equal(new PaymentSettings().minimumWithdrawal, DEFAULT_MINIMUM_WITHDRAWAL);
  for (const amount of ["0", "-1", "1.001", "1e4", "NaN", "90071992547409.92"]) {
    assert.equal(withdrawalSchema.safeParse({ ...input, amount }).success, false);
    assert.equal(withdrawalSettingsSchema.safeParse({ minimumWithdrawal: amount }).success, false);
  }
});
test("withdrawal requests reject forged ownership, status and mismatched networks", () => {
  for (const extra of [{ userId: "a".repeat(24) }, { status: "completed" }, { minimumWithdrawal: 1 }, { network: "FAKE" }, { network: "ETH" }, { destinationAddress: "bad address" }, { idempotencyKey: "bad" }]) {
    assert.equal(withdrawalSchema.safeParse({ ...input, ...extra }).success, false);
  }
  assert.equal(withdrawalSchema.safeParse({ ...input, network: "ETH", destinationAddress: "0x" + "a".repeat(40) }).success, true);
  assert.equal(withdrawalSchema.safeParse({ ...input, network: "BTC", destinationAddress: "1BoatSLRHtKNngkdXEeobR76b53LETtpyT" }).success, true);
});
test("server enforces the latest minimum and available balance including exact boundaries", () => {
  assert.equal(withdrawalValidationError(10000, 10000, 10000), null);
  assert.match(withdrawalValidationError(9999, 10000, 20000), /minimum/);
  assert.match(withdrawalValidationError(20001, 10000, 20000), /balance/);
  assert.match(withdrawalValidationError(10000, 15000, 20000), /minimum/);
});
test("withdrawal records default to pending and persist their destination", async () => {
  const transaction = new Transaction({ userId: "a".repeat(24), type: "withdrawal", amount: 3500000, cryptoMethod: "SOL", walletAddress: input.destinationAddress, description: "Withdrawal" });
  await transaction.validate();
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.walletAddress, input.destinationAddress);
  assert.ok(Transaction.schema.indexes().some(([fields, options]) => fields.reference === 1 && options.unique));
});
