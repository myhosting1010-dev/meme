import "server-only";
import mongoose from "mongoose";
import { getDatabaseEnvironment } from "@/lib/env";

const cache = globalThis.__tomWebsiteMongo ??= { connection: null, promise: null };

export async function connectDatabase() {
  if (cache.connection && mongoose.connection.readyState === 1) return cache.connection;

  if (!cache.promise) {
    const { MONGODB_URI } = getDatabaseEnvironment();
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch {
    // A failed initial connection must not poison subsequent retry attempts.
    cache.connection = null;
    throw new Error("Database connection failed.");
  } finally {
    cache.promise = null;
  }
}
