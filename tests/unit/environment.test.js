import assert from "node:assert/strict";
import test from "node:test";
import { parseDatabaseEnvironment } from "../../src/schemas/environment.js";

test("database configuration rejects missing or invalid values without exposing them", () => {
  for (const environment of [{}, { MONGODB_URI: "" }, { MONGODB_URI: "https://private-secret.example" }]) {
    assert.throws(() => parseDatabaseEnvironment(environment), (error) => {
      assert.match(error.message, /Configure MONGODB_URI/);
      assert.ok(!error.message.includes("private-secret"));
      return true;
    });
  }
});

test("database configuration accepts MongoDB schemes and excludes unrelated secrets", () => {
  for (const uri of ["mongodb://127.0.0.1:27017/test", "mongodb+srv://example.invalid/test"]) {
    assert.deepEqual(parseDatabaseEnvironment({ MONGODB_URI: uri, OTHER_SECRET: "hidden" }), { MONGODB_URI: uri });
  }
});
