import DashboardClient, { type SavedApplication } from "./dashboard-client";
import { syncApplicationStatuses } from "@/lib/application-status-sync";
import { prisma } from "@/lib/db";
import { getInvalidDiscoveredJobIds } from "@/lib/invalid-discovered-jobs";
import { discoverJobs } from "@/lib/job-discovery";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    application?: string;
    discover?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  await syncApplicationStatuses();
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  const discovery = params?.discover === "1" ? await discoverJobs() : null;
  const invalidDiscoveredJobIds = discovery ? await getInvalidDiscoveredJobIds() : new Set<string>();
  const trackedJobUrls = new Set(
    applications
      .map((application) => normalizeUrl(application.jobUrl))
      .filter(Boolean),
  );
  const trackedRoleKeys = new Set(
    applications.map((application) => getRoleKey(application.company, application.role)),
  );
  const untrackedCandidates =
    discovery?.candidates.filter((candidate) => {
      const jobUrl = normalizeUrl(candidate.jobUrl);

      if (jobUrl && trackedJobUrls.has(jobUrl)) {
        return false;
      }

      return !trackedRoleKeys.has(getRoleKey(candidate.company, candidate.role));
    }) ?? [];
  const activeDiscoveredCandidates = untrackedCandidates.filter(
    (candidate) => !isInvalidDiscoveredJob(candidate) && !invalidDiscoveredJobIds.has(candidate.id),
  );
  const archivedDiscoveredCandidates = untrackedCandidates.filter(
    (candidate) => isInvalidDiscoveredJob(candidate) || invalidDiscoveredJobIds.has(candidate.id),
  );

  const initialApplications: SavedApplication[] = applications.map((application) => ({
    ...application,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      initialApplications={initialApplications}
      initialArchivedDiscoveredJobs={archivedDiscoveredCandidates}
      initialDiscoveredJobs={activeDiscoveredCandidates}
      initialDiscoveryAt={discovery?.searchedAt ?? null}
      initialSelectedApplicationId={params?.application ?? null}
    />
  );
}

function normalizeUrl(value: string) {
  return value.trim().replace(/\/$/, "").toLowerCase();
}

function getRoleKey(company: string, role: string) {
  return `${company.trim().toLowerCase()}::${role.trim().toLowerCase()}`;
}

function isInvalidDiscoveredJob(candidate: { validationStatus: string }) {
  return candidate.validationStatus === "INVALID_URL";
}
