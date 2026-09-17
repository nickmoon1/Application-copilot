import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const source = fileURLToPath(new URL("../prisma/dev.db", import.meta.url));
const backupDirectory = fileURLToPath(new URL("../prisma/backups/", import.meta.url));
if (!existsSync(source)) throw new Error("SQLite database does not exist.");
if (execFileSync("sqlite3", ["-readonly", source, "PRAGMA integrity_check;"], { encoding: "utf8" }).trim() !== "ok") {
  throw new Error("SQLite integrity check failed. Backup aborted.");
}
mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
chmodSync(backupDirectory, 0o700);
const name = `sqlite-${new Date().toISOString().replaceAll(":", "-")}.db`;
execFileSync("sqlite3", ["-readonly", source, `.backup ${name}`], { cwd: backupDirectory });
const destination = join(backupDirectory, name);
chmodSync(destination, 0o600);
if (execFileSync("sqlite3", ["-readonly", destination, "PRAGMA integrity_check;"], { encoding: "utf8" }).trim() !== "ok") {
  throw new Error("Backup integrity check failed. Do not use this snapshot.");
}
console.log("Verified private SQLite backup:");
console.log(destination);
