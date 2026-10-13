import { z } from "zod";

const databaseEnvironmentSchema = z.object({
  MONGODB_URI: z.string().trim().min(1).refine(
    (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
  ),
});

export function parseDatabaseEnvironment(environment) {
  const result = databaseEnvironmentSchema.safeParse(environment);
  if (!result.success) {
    // Never include raw environment values or credentials in configuration errors.
    throw new Error("Configure MONGODB_URI with a valid MongoDB connection string before using the database.");
  }
  return result.data;
}
