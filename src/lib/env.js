import "server-only";
import { parseDatabaseEnvironment } from "@/schemas/environment";

export function getDatabaseEnvironment() {
  return parseDatabaseEnvironment(process.env);
}
