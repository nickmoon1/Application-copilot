import { prisma } from "@/lib/db";

const tableSql = `
CREATE TABLE IF NOT EXISTS InvalidDiscoveredJob (
  id TEXT PRIMARY KEY NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export async function getInvalidDiscoveredJobIds() {
  await ensureInvalidDiscoveredJobsTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    "SELECT id FROM InvalidDiscoveredJob ORDER BY createdAt DESC",
  );

  return new Set(rows.map((row) => row.id));
}

export async function markDiscoveredJobInvalid(id: string) {
  await ensureInvalidDiscoveredJobsTable();
  await prisma.$executeRawUnsafe("INSERT OR IGNORE INTO InvalidDiscoveredJob (id) VALUES (?)", id);
}

export async function restoreDiscoveredJob(id: string) {
  await ensureInvalidDiscoveredJobsTable();
  await prisma.$executeRawUnsafe("DELETE FROM InvalidDiscoveredJob WHERE id = ?", id);
}

async function ensureInvalidDiscoveredJobsTable() {
  await prisma.$executeRawUnsafe(tableSql);
}
