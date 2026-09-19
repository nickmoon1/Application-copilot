import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { canonicalRows, readSqliteSnapshot } from "./lib/sqlite-snapshot.mjs";

nextEnv.loadEnvConfig(process.cwd(), true);
const [mode, filename] = process.argv.slice(2);
if (!["--dry-run", "--apply"].includes(mode) || !filename) {
  throw new Error("Usage: node scripts/import-sqlite-to-postgres.mjs --dry-run|--apply <backup-file>");
}
const snapshot = readSqliteSnapshot(resolve(filename));
for (const entry of snapshot) console.log(`${entry.table}: ${entry.rows.length} source records`);
if (mode === "--dry-run") {
  console.log("Dry run complete. Source is valid; no PostgreSQL connection or changes made.");
} else {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl?.startsWith("postgres")) {
    throw new Error("Set DIRECT_URL before applying the import.");
  }
  const { PrismaClient } = await import("../src/generated/prisma/index.js");
  const client = new PrismaClient({ datasourceUrl: directUrl });
  try {
    await client.$transaction(async (transaction) => {
      for (const model of ["application", "passedDiscoveredJob", "invalidDiscoveredJob", "discoveryRun"]) {
        if (await transaction[model].count() !== 0) {
          throw new Error("Target database is not empty.");
        }
      }
      for (const entry of snapshot) {
        if (entry.rows.length) await transaction[entry.model].createMany({ data: entry.rows });
        const imported = await transaction[entry.model].findMany();
        if (!isDeepStrictEqual(canonicalRows(entry.rows, entry.key), canonicalRows(imported, entry.key))) {
          throw new Error("Imported fields do not match the source.");
        }
      }
    }, { maxWait: 10000, timeout: 60000 });
    console.log("Import committed. Every preserved field matches the SQLite snapshot.");
    console.log("Import verification complete. Use db:verify-cutover after switching the application configuration.");
  } catch {
    console.error("Import failed or the target was not empty. Transaction rolled back. No credentials or records are printed.");
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}
