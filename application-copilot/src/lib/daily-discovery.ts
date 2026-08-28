import { prisma } from "@/lib/db";
import { discoverJobs, type DiscoveryResult } from "@/lib/job-discovery";

export async function getDailyDiscovery(forceRefresh = false): Promise<DiscoveryResult> {
  const runDate = getDallasDateKey();

  if (!forceRefresh) {
    const cachedRun = await prisma.discoveryRun.findUnique({
      where: { runDate },
    });

    if (cachedRun) {
      try {
        return JSON.parse(cachedRun.payload) as DiscoveryResult;
      } catch {
        // Rebuild malformed cache entries instead of breaking the dashboard.
      }
    }
  }

  const discovery = await discoverJobs();

  await prisma.discoveryRun.upsert({
    where: { runDate },
    create: {
      id: `daily-${runDate}`,
      runDate,
      payload: JSON.stringify(discovery),
    },
    update: {
      payload: JSON.stringify(discovery),
      updatedAt: new Date(),
    },
  });

  return discovery;
}

function getDallasDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
