import mongoose from "mongoose";
import { parseDatabaseEnvironment } from "../src/schemas/environment.js";

try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
try {
  const { MONGODB_URI } = parseDatabaseEnvironment(process.env);
  await mongoose.connect(MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
  const wallets = mongoose.connection.db.collection("wallets");
  const invalid = await wallets.aggregate([
    { $project: { target: { $ifNull: ["$walletAddress", "$address"] } } },
    { $match: { $or: [{ target: { $exists: false } }, { target: null }, { target: "" }, { target: { $not: { $type: "string" } } }] } },
    { $limit: 1 },
  ]).toArray();
  if (invalid.length) throw new Error("A wallet has no usable address. No migration performed.");
  const duplicates = await wallets.aggregate([
    { $group: { _id: { $ifNull: ["$walletAddress", "$address"] }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $limit: 1 },
  ]).toArray();
  if (duplicates.length) throw new Error("Duplicate wallet addresses found. No migration performed.");
  // Populate the new fields first, preserving legacy addresses until the new unique index exists.
  const result = await wallets.updateMany({}, [{ $set: {
    walletAddress: { $ifNull: ["$walletAddress", "$address"] },
    walletName: { $cond: [{ $and: [{ $ne: [{ $ifNull: ["$walletName", ""] }, ""] }] }, "$walletName", { $concat: ["Wallet ", { $substrBytes: [{ $toString: "$_id" }, 18, 6] }] }] },
  } }]);
  await wallets.createIndex({ walletAddress: 1 }, { unique: true });
  for (const index of await wallets.listIndexes().toArray()) {
    if (Object.keys(index.key).length === 1 && index.key.address === 1) await wallets.dropIndex(index.name);
  }
  await wallets.updateMany({ address: { $exists: true } }, { $unset: { address: "" } });
  console.log(`Wallet fields migrated. ${result.modifiedCount} records updated. Existing addresses and pictures preserved.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
