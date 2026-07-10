import DashboardClient, { type SavedApplication } from "./dashboard-client";
import { syncApplicationStatuses } from "@/lib/application-status-sync";
import { prisma } from "@/lib/db";
import { getInvalidDiscoveredJobIds } from "@/lib/invalid-discovered-jobs";
import { discoverJobs } from "@/lib/job-discovery";
import { analyzeJobUrl, type JobUrlAnalysis } from "@/lib/job-url-analysis";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    application?: string;
    analyzeJobUrl?: string;
    company?: string;
    createdPr?: string;
    discover?: string;
    duplicate?: string;
    error?: string;
    jobUrl?: string;
    location?: string;
    matchScore?: string;
    notes?: string;
    role?: string;
    source?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  await syncApplicationStatuses();
  const manualJobDraft = {
    company: params?.company ?? "",
    role: params?.role ?? "Data Analyst",
    location: params?.location ?? "Dallas, TX",
    source: params?.source ?? "Manual entry",
    jobUrl: params?.jobUrl ?? "",
    matchScore: params?.matchScore ?? "85",
    notes: params?.notes ?? "",
  };
  let initialJobAnalysis: JobUrlAnalysis | null = null;
  let initialJobAnalysisError: string | null = null;

  if (params?.analyzeJobUrl === "1") {
    try {
      initialJobAnalysis = await analyzeJobUrl(manualJobDraft.jobUrl);
      manualJobDraft.company = shouldReplaceGenericCompany(manualJobDraft.company, initialJobAnalysis.company)
        ? initialJobAnalysis.company
        : manualJobDraft.company;
      manualJobDraft.location = shouldReplaceDefaultLocation(manualJobDraft.location, initialJobAnalysis.location)
        ? initialJobAnalysis.location
        : manualJobDraft.location;
      manualJobDraft.notes = appendAnalysisToNotes(manualJobDraft.notes, initialJobAnalysis.tailoringNotes);
      manualJobDraft.matchScore = String(initialJobAnalysis.recommendedMatchScore || manualJobDraft.matchScore);
      manualJobDraft.role = shouldReplaceGenericRole(manualJobDraft.role, initialJobAnalysis.role)
        ? initialJobAnalysis.role
        : manualJobDraft.role;
      manualJobDraft.source = shouldReplaceGenericSource(manualJobDraft.source, initialJobAnalysis.source)
        ? initialJobAnalysis.source
        : manualJobDraft.source;
    } catch (error) {
      initialJobAnalysisError = error instanceof Error ? error.message : "Unable to analyze job URL";
    }
  }

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

      if (!jobUrl && trackedRoleKeys.has(getRoleKey(candidate.company, candidate.role))) {
        return false;
      }

      return true;
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
      initialJobAnalysis={initialJobAnalysis}
      initialJobAnalysisError={initialJobAnalysisError}
      initialJobDraft={manualJobDraft}
      initialCreatePrError={params?.error ?? (params?.duplicate ? `Application already exists as PR #${params.duplicate}.` : null)}
      initialCreatedPrNumber={params?.createdPr ?? null}
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

function appendAnalysisToNotes(notes: string, analysisNotes: string) {
  if (!analysisNotes.trim()) return notes;

  return [stripGeneratedAnalysis(notes), analysisNotes].filter(Boolean).join("\n\n");
}

function stripGeneratedAnalysis(notes: string) {
  return notes.replace(/\n*Job URL analysis:[\s\S]*$/i, "").trim();
}

function shouldReplaceGenericRole(currentRole: string, analyzedRole: string) {
  const normalized = currentRole.trim().toLowerCase();

  return (
    Boolean(analyzedRole.trim()) &&
    (normalized === "data analyst" ||
      normalized === "senior data analyst" ||
      normalized === "job search" ||
      normalized === "career search" ||
      normalized === "job detail")
  );
}

function shouldReplaceGenericCompany(currentCompany: string, analyzedCompany: string) {
  const normalized = currentCompany.trim().toLowerCase();

  return (
    Boolean(analyzedCompany.trim()) &&
    (!normalized ||
      normalized === "aa224" ||
      normalized === "jobs" ||
      normalized === "careers" ||
      normalized === "career" ||
      normalized.includes("taleo"))
  );
}

function shouldReplaceGenericSource(currentSource: string, analyzedSource: string) {
  const normalized = currentSource.trim().toLowerCase();

  return Boolean(analyzedSource.trim()) && (!normalized || normalized === "manual entry" || normalized.includes("taleo"));
}

function shouldReplaceDefaultLocation(currentLocation: string, analyzedLocation: string) {
  const normalized = currentLocation.trim().toLowerCase();

  return Boolean(analyzedLocation.trim()) && (!normalized || normalized === "dallas, tx");
}
