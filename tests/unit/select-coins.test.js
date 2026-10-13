import assert from "node:assert/strict";
import test from "node:test";
import { selectCoins } from "../../src/features/coins/select-coins.js";

const coins = [
  { name: "Alpha", symbol: "AAA", volume24h: 1, marketCap: 3, activity24h: 2, createdAt: 3 },
  { name: "Beta", symbol: "BBB", volume24h: 3, marketCap: 1, activity24h: 3, createdAt: 2 },
  { name: "Gamma", symbol: "CCC", volume24h: 2, marketCap: 2, activity24h: 1, createdAt: 1 },
];

test("coin search matches names and symbols with whitespace and case normalization", () => {
  assert.deepEqual(selectCoins(coins, " aLpHa ", "newest"), [coins[0]]);
  assert.deepEqual(selectCoins(coins, "bbb", "newest"), [coins[1]]);
  assert.deepEqual(selectCoins(coins, "missing", "newest"), []);
});

test("API metric sorting applies the selected ranking without mutating source order", () => {
  assert.deepEqual(selectCoins(coins, "", "volume").map((coin) => coin.symbol), ["BBB", "CCC", "AAA"]);
  assert.deepEqual(selectCoins(coins, "", "market-cap").map((coin) => coin.symbol), ["AAA", "CCC", "BBB"]);
  assert.deepEqual(selectCoins(coins, "", "trending").map((coin) => coin.symbol), ["BBB", "AAA", "CCC"]);
  assert.deepEqual(selectCoins(coins, "", "newest"), coins);
  assert.deepEqual(coins.map((coin) => coin.symbol), ["AAA", "BBB", "CCC"]);
});
