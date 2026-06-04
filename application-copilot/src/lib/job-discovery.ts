import { get } from "node:https";

type JobSeed = {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  posted: string;
  summary: string;
  keywords: string[];
};

export type DiscoveredJob = JobSeed & {
  matchScore: number;
  validationStatus: string;
  notes: string;
};

export const targetRoles = [
  "data scientist",
  "data analyst",
  "data engineer",
  "business analyst",
  "adjunct professor",
  "analytics",
  "data governance",
  "business intelligence",
  "big data",
];

export const targetLocations = ["dallas", "irving", "plano", "richardson", "arlington"];

const attDataAnalyticsUrl = "https://www.att.jobs/category/data-and-analytics-jobs/117/61758/1";

const fallbackJobs: JobSeed[] = [
  {
    id: "capital-one-principal-data-analyst-plano",
    company: "Capital One",
    role: "Principal Data Analyst (Navigator Platform)",
    location: "Plano, TX",
    source: "Capital One Careers",
    jobUrl: "https://www.capitalonecareers.com/job/plano/principal-data-analyst-navigator-platform/1732/89313044336",
    posted: "2026-03-25",
    summary:
      "Principal data analyst role centered on analytics, business intelligence, data management, well-managed data solutions, and business problem solving.",
    keywords: ["data analyst", "business intelligence", "data management", "analytics", "sql", "dashboarding", "stakeholders"],
  },
  {
    id: "citi-data-analytics-lead-analyst-irving",
    company: "Citi",
    role: "Data Analytics Lead Analyst - Vice President",
    location: "Irving, TX",
    source: "Citi Careers",
    jobUrl: "https://jobs.citi.com/job/irving/data-analytics-lead-analyst-vice-president/287/94454902656",
    posted: "2026-04-27",
    summary:
      "Senior analytics and governance role focused on data quality, data lineage, compliance domains, enterprise reporting, and strategic data controls.",
    keywords: ["data analytics", "data governance", "data quality", "data lineage", "reporting", "risk", "stakeholders"],
  },
  {
    id: "citi-it-business-lead-analyst-irving",
    company: "Citi",
    role: "IT Business Lead Analyst",
    location: "Irving, TX",
    source: "Citi Careers",
    jobUrl: "https://jobs.citi.com/job/irving/it-business-lead-analyst/287/95421950560",
    posted: "2026-05-22",
    summary:
      "Hybrid business analyst role involving SQL, data profiling, requirements analysis, data mapping, data dictionaries, BI systems, and technology delivery.",
    keywords: ["business analyst", "sql", "data profiling", "requirements", "data mapping", "business intelligence", "hive"],
  },
];

const attFallbackJobs: JobSeed[] = [
  {
    id: "att-principal-data-ai-engineering-dallas",
    company: "AT&T",
    role: "Principal Data/AI Engineering",
    location: "Dallas, TX",
    source: "AT&T Careers",
    jobUrl: "https://www.att.jobs/job/dallas/principal-data-ai-engineering/117/95661317312",
    posted: "2026-05-28",
    summary:
      "AI and data engineering role focused on GenAI, ETL, data infrastructure, cloud, SQL, Python, Databricks, technical enablement, and optimization.",
    keywords: ["data engineer", "ai", "genai", "etl", "sql", "python", "databricks", "cloud"],
  },
  {
    id: "att-lead-big-data-software-engineering-dallas",
    company: "AT&T",
    role: "Lead Big Data Software Engineering",
    location: "Dallas, TX",
    source: "AT&T Careers",
    jobUrl: "https://www.att.jobs/job/dallas/lead-big-data-software-engineering/117/95367588496",
    posted: "2026-05-22",
    summary:
      "Live AT&T data and analytics listing focused on big data software engineering in Dallas.",
    keywords: ["big data", "data engineer", "software engineering", "sql", "python", "analytics"],
  },
];

export async function discoverJobs() {
  const liveAttJobs = await discoverAttJobs();
  const seeds = mergeJobs([
    ...(liveAttJobs.length > 0 ? liveAttJobs : attFallbackJobs),
    ...fallbackJobs,
  ]);
  const candidates = seeds
    .filter((job) => isTargetLocation(job.location) && isTargetRole(job.role, job.keywords))
    .map(enrichJob)
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    searchedAt: new Date().toISOString(),
    targetRoles,
    targetLocations,
    candidates,
    connectors: [
      {
        name: "AT&T Data and Analytics",
        url: attDataAnalyticsUrl,
        mode: liveAttJobs.length > 0 ? "live" : "fallback",
        found: liveAttJobs.length,
      },
    ],
  };
}

async function discoverAttJobs() {
  try {
    const html = await fetchText(attDataAnalyticsUrl);
    const jobs = parseAttSearchResults(html);

    return jobs.length > 0 ? jobs : [];
  } catch {
    return [];
  }
}

function parseAttSearchResults(html: string): JobSeed[] {
  const results: JobSeed[] = [];
  const resultPattern =
    /<h2 class="headline__small"><a href="([^"]+)" data-job-id="([^"]+)">([^<]+)<\/a><\/h2>\s*<span class="job-location">([^<]+)<\/span>/g;

  for (const match of html.matchAll(resultPattern)) {
    const href = match[1];
    const jobId = match[2];
    const role = decodeHtml(match[3] ?? "").trim();
    const location = decodeHtml(match[4] ?? "").trim();

    if (!href || !jobId || !role || !location) continue;

    results.push({
      id: `att-${slugify(role)}-${jobId}`,
      company: "AT&T",
      role,
      location,
      source: "AT&T Careers - Live",
      jobUrl: new URL(href, "https://www.att.jobs").toString(),
      posted: new Date().toISOString().slice(0, 10),
      summary: `Live AT&T Data and Analytics posting for ${role} in ${location}.`,
      keywords: inferKeywords(role),
    });
  }

  return results;
}

function enrichJob(job: JobSeed): DiscoveredJob {
  const matchScore = scoreJob(job);

  return {
    ...job,
    matchScore,
    validationStatus: job.source.includes("Live") ? "LIVE_SOURCE" : "URL_FOUND",
    notes: [
      `Discovered from ${job.source}.`,
      `Matches Dallas-area preference: ${job.location}.`,
      `Role keywords: ${job.keywords.slice(0, 6).join(", ")}.`,
      matchScore >= 90
        ? "Strong candidate for PR review."
        : "Review seniority and requirements before creating a PR.",
    ].join(" "),
  };
}

function fetchText(url: string) {
  return new Promise<string>((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          "User-Agent": "ApplicationCopilot/0.1 (+local job discovery)",
        },
        maxHeaderSize: 128 * 1024,
      },
      (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`Request failed with status ${response.statusCode}`));
          response.resume();
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      },
    );

    request.setTimeout(8000, () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
  });
}

function mergeJobs(jobs: JobSeed[]) {
  const seen = new Set<string>();
  const merged: JobSeed[] = [];

  for (const job of jobs) {
    const key = job.jobUrl.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(job);
  }

  return merged;
}

function isTargetLocation(location: string) {
  const normalized = location.toLowerCase();

  return targetLocations.some((targetLocation) => normalized.includes(targetLocation));
}

function isTargetRole(role: string, keywords: string[]) {
  const searchable = `${role} ${keywords.join(" ")}`.toLowerCase();

  return targetRoles.some((targetRole) => searchable.includes(targetRole));
}

function inferKeywords(role: string) {
  const normalized = role.toLowerCase();
  const keywords = new Set(["analytics"]);

  if (normalized.includes("data")) keywords.add("data engineer");
  if (normalized.includes("ai")) keywords.add("ai");
  if (normalized.includes("big data")) keywords.add("big data");
  if (normalized.includes("software")) keywords.add("software engineering");
  if (normalized.includes("scientist")) keywords.add("data scientist");
  if (normalized.includes("analyst")) keywords.add("data analyst");

  keywords.add("sql");
  keywords.add("python");

  return Array.from(keywords);
}

function scoreJob(job: JobSeed) {
  let score = 72;
  const searchable = `${job.role} ${job.summary} ${job.keywords.join(" ")}`.toLowerCase();

  if (job.location.toLowerCase().includes("dallas")) score += 8;
  if (job.location.toLowerCase().includes("plano") || job.location.toLowerCase().includes("irving")) score += 6;
  if (searchable.includes("sql")) score += 4;
  if (searchable.includes("python")) score += 4;
  if (searchable.includes("business intelligence") || searchable.includes("dashboard")) score += 4;
  if (searchable.includes("data engineer") || searchable.includes("data engineering")) score += 4;
  if (searchable.includes("data analyst") || searchable.includes("analytics")) score += 4;
  if (searchable.includes("big data")) score += 3;
  if (searchable.includes("stakeholder")) score += 2;

  return Math.min(score, 97);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
