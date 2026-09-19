import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import nextEnv from "@next/env";
import { canonicalRows, readSqliteSnapshot } from "./lib/sqlite-snapshot.mjs";

nextEnv.loadEnvConfig(process.cwd(), true);

function latestBackup() {
  const directory = resolve("prisma/backups");
  if (!existsSync(directory)) return undefined;
  return readdirSync(directory)
    .filter((name) => /^sqlite-.*\.db$/.test(name))
    .map((name) => resolve(directory, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)[0];
}

const backup = process.argv[2] ?? latestBackup();
if (!backup) {
  throw new Error("No SQLite backup found. Pass a backup path to db:verify-cutover.");
}
const filename = resolve(backup);
if (!existsSync(filename)) throw new Error("The requested SQLite backup does not exist.");
if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  throw new Error("DATABASE_URL must point to PostgreSQL before cutover verification.");
}

const snapshot = readSqliteSnapshot(filename);
const { PrismaClient } = await import("../src/generated/prisma/index.js");
const client = new PrismaClient();

try {
  for (const entry of snapshot) {
    const current = await client[entry.model].findMany();
    if (!isDeepStrictEqual(canonicalRows(entry.rows, entry.key), canonicalRows(current, entry.key))) {
      throw new Error(`${entry.table} does not match the preserved SQLite snapshot.`);
    }
    console.log(`${entry.table}: ${current.length} records verified`);
  }

  const testId = `cutover-check-${randomUUID()}`;
  const rollbackSignal = new Error("ROLLBACK_VERIFICATION_WRITE");
  try {
    await client.$transaction(async (transaction) => {
      await transaction.invalidDiscoveredJob.create({ data: { id: testId } });
      if (!await transaction.invalidDiscoveredJob.findUnique({ where: { id: testId } })) {
        throw new Error("Temporary PostgreSQL write could not be read back.");
      }
      throw rollbackSignal;
    });
  } catch (error) {
    if (error !== rollbackSignal) throw error;
  }
  if (await client.invalidDiscoveredJob.findUnique({ where: { id: testId } })) {
    throw new Error("Temporary verification record was not rolled back.");
  }

  console.log("PostgreSQL read, write, and rollback verification passed. No test record remains.");
} finally {
  await client.$disconnect();
}
