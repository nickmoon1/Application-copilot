import { execFileSync } from "node:child_process";

const dbPath = "/private/tmp/application-copilot-dev.db";

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
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

execFileSync("sqlite3", [dbPath, schema], {
  stdio: "inherit",
});

console.log(`Local database ready at ${dbPath}`);
