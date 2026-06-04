import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dbPath = fileURLToPath(new URL("../prisma/dev.db", import.meta.url));

const schema = `
CREATE TABLE IF NOT EXISTS Application (
  id TEXT PRIMARY KEY NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  source TEXT NOT NULL,
  jobUrl TEXT NOT NULL,
  matchScore INTEGER NOT NULL,
  notes TEXT NOT NULL,
  prNumber INTEGER NOT NULL UNIQUE,
  prUrl TEXT NOT NULL,
  branch TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

execFileSync("sqlite3", [dbPath, schema], {
  stdio: "inherit",
});

try {
  execFileSync("sqlite3", [dbPath, "ALTER TABLE Application ADD COLUMN folder TEXT NOT NULL DEFAULT '';"], {
    stdio: "ignore",
  });
} catch {
  // Column already exists.
}

console.log(`Local database ready at ${dbPath}`);
