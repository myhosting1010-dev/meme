import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.js";
import { signupSchema } from "../src/schemas/auth.js";
import { parseDatabaseEnvironment } from "../src/schemas/environment.js";

try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
let stage = "reading configuration and saved credentials";
try {
  let saved;
  try { saved = await readFile(".admin.credentials.local.json", "utf8"); }
  catch (error) { if (error.code !== "ENOENT") throw error; saved = await readFile(".admin-credentials.local.json", "utf8"); }
  const credentials = signupSchema.parse(JSON.parse(saved));
  const { MONGODB_URI } = parseDatabaseEnvironment(process.env);
  const host = new URL(MONGODB_URI).hostname;
  if (["localhost", "127.0.0.1", "[::1]"].includes(host)) throw new Error("Live seed requires a remote database.");
  stage = "connecting to the remote database";
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  stage = "ensuring account indexes";
  await User.createIndexes();
  stage = "checking for conflicting accounts";
  let admin = await User.findOne({ $or: [{ email: credentials.email }, { usernameKey: credentials.username.toLowerCase() }] }).select("+passwordHash");
  let result;
  if (admin) {
    if (admin.email !== credentials.email || admin.username !== credentials.username || admin.role !== "admin") throw new Error("Account identity conflict.");
    if (!await verifyPassword(credentials.password, admin.passwordHash)) {
      stage = "updating the existing admin password";
      admin.passwordHash = await hashPassword(credentials.password);
      await admin.save();
      result = "Existing live admin updated to match saved credentials.";
    } else result = "Live admin already exists and matches saved credentials.";
  } else {
    stage = "creating the admin account";
    admin = await User.create({ username: credentials.username, email: credentials.email, passwordHash: await hashPassword(credentials.password), role: "admin" });
    result = "Admin successfully created in the live database.";
  }
  stage = "verifying the stored admin";
  const stored = await User.findById(admin._id).select("+passwordHash");
  if (!stored || stored.role !== "admin" || stored.email !== credentials.email || !await verifyPassword(credentials.password, stored.passwordHash)) throw new Error("Verification failed.");
  console.log(`SUCCESS: ${result} Stored admin role and password verified.`);
} catch (error) {
  // Never print database URIs, raw driver errors, or saved passwords.
  console.error(`FAILED while ${stage}. ${error.code === 11000 ? "Account uniqueness conflict." : error.name === "MongooseServerSelectionError" ? "Cannot reach MongoDB; check connectivity and database network access." : "Check configuration, database permissions, and account identity."}`);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
