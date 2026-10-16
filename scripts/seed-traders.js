import mongoose from "mongoose";
import { Trader } from "../src/models/trader.js";
import { parseDatabaseEnvironment } from "../src/schemas/environment.js";

try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }

const traders = [
  { username: "counter17", profitUsdCents: 20280634, followersCount: 13 },
  { username: "ZypherHQ", profitUsdCents: 19040653, followersCount: 1 },
  { username: "marcell", profitUsdCents: 18983057, followersCount: 33 },
  { username: "SossaDotKek", profitUsdCents: 18418505, followersCount: 30 },
  { username: "Aurelius", profitUsdCents: 17970210, followersCount: 45 },
  { username: "heat", profitUsdCents: 16216306, followersCount: 2 },
  { username: "glasspotter6054", profitUsdCents: 11163813, followersCount: 4 },
  { username: "faposhi__", profitUsdCents: 11111105, followersCount: 9 },
  { username: "ulTRA_folle", profitUsdCents: 10847962, followersCount: 0 },
];

try {
  const { MONGODB_URI } = parseDatabaseEnvironment(process.env);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    const indexes = await Trader.collection.indexes();
    for (const index of indexes) {
      if (index.unique && index.key?.userId === 1 && index.sparse) await Trader.collection.dropIndex(index.name);
    }
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") throw error;
  }
  await Trader.createIndexes();
  for (const trader of traders) {
    await Trader.updateOne({ usernameKey: trader.username.toLowerCase() }, {
      $set: { ...trader, usernameKey: trader.username.toLowerCase(), avatarUrl: "", listed: true },
      $setOnInsert: { userId: null },
    }, { upsert: true, runValidators: true });
  }
  console.log(`Seeded ${traders.length} leaderboard traders.`);
} catch {
  console.error("Trader seeding failed. Check the MongoDB configuration and existing trader usernames.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
