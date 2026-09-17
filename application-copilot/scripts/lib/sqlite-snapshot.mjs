import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

export function normalizeSqliteDate(value) {
  let parsed;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    parsed = new Date(value);
  } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) {
    const iso = value.replace(" ", "T");
    parsed = new Date(/(Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`);
  } else {
    throw new Error("Unsupported SQLite date format.");
  }
  if (!Number.isFinite(parsed.getTime())) throw new Error("Invalid SQLite date.");
  return parsed;
}

export function readSqliteSnapshot(filename) {
  if (!existsSync(filename)) throw new Error("Source snapshot does not exist.");
  if (execFileSync("sqlite3", ["-readonly", filename, "PRAGMA integrity_check;"], { encoding: "utf8" }).trim() !== "ok") {
    throw new Error("Source snapshot failed its integrity check.");
  }
  const tables = [
    { table: "Application", model: "application", key: "id" },
    { table: "PassedDiscoveredJob", model: "passedDiscoveredJob", key: "jobId" },
    { table: "InvalidDiscoveredJob", model: "invalidDiscoveredJob", key: "id" },
  ];
  return tables.map((entry) => {
    const json = execFileSync("sqlite3", ["-readonly", "-json", filename, `SELECT * FROM "${entry.table}";`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const rows = JSON.parse(json || "[]").map((row) => ({
      ...row,
      createdAt: normalizeSqliteDate(row.createdAt),
      ...(row.updatedAt !== undefined ? { updatedAt: normalizeSqliteDate(row.updatedAt) } : {}),
    }));
    if (new Set(rows.map((row) => row[entry.key])).size !== rows.length) {
      throw new Error("Duplicate primary keys in source snapshot.");
    }
    return { ...entry, rows };
  });
}

export function canonicalRows(rows, key) {
  return rows.map((row) => Object.fromEntries(
    Object.entries(row).sort(([left], [right]) => left.localeCompare(right)).map(([field, value]) => [
      field, value instanceof Date ? value.toISOString() : value,
    ]),
  )).sort((left, right) => String(left[key]).localeCompare(String(right[key])));
}
