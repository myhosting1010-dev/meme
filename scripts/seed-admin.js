import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/lib/auth/password.js";
import { signupSchema } from "../src/schemas/auth.js";
import { parseDatabaseEnvironment } from "../src/schemas/environment.js";

try { process.loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const credentialsPath = ".admin-credentials.local.json";
try {
  const credentials = signupSchema.parse({ username: process.env.ADMIN_USERNAME || "admin", email: process.env.ADMIN_EMAIL || "admin@mintline.local", password: process.env.ADMIN_PASSWORD || randomBytes(24).toString("base64url") });
  const { MONGODB_URI } = parseDatabaseEnvironment(process.env);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await User.createIndexes();
  const existing = await User.findOne({ $or: [{ email: credentials.email }, { usernameKey: credentials.username.toLowerCase() }] });
  if (existing) {
    if (existing.role !== "admin" || existing.email !== credentials.email) throw new Error("Seed identity conflicts with an existing account. No account was changed.");
    console.log("Admin already exists. Password and account data were left unchanged.");
  } else {
    // Refuse to overwrite a saved credential file, so an existing admin's password is never lost.
    await writeFile(credentialsPath, JSON.stringify({ email: credentials.email, username: credentials.username, password: credentials.password }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    await User.create({ username: credentials.username, email: credentials.email, passwordHash: await hashPassword(credentials.password), role: "admin" });
    console.log(`Admin created. Sign-in credentials are saved in ${credentialsPath} (git-ignored).`);
  }
} catch (error) {
  console.error(error.code === "EEXIST" ? "Credential file already exists. No account was created; inspect it before retrying." : "Admin seeding failed. Check database configuration and seed identity; no existing account was overwritten.");
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
