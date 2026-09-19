import { prisma } from "@/lib/db";

export async function getInvalidDiscoveredJobIds() {
  const rows = await prisma.invalidDiscoveredJob.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return new Set(rows.map((row) => row.id));
}

export async function markDiscoveredJobInvalid(id: string) {
  await prisma.invalidDiscoveredJob.upsert({
    where: { id },
    create: { id },
    update: {},
  });
}

export async function restoreDiscoveredJob(id: string) {
  await prisma.invalidDiscoveredJob.deleteMany({
    where: { id },
  });
}
