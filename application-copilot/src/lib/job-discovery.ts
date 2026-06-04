export type DiscoveredJob = {
  id: string;
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  posted: string;
  summary: string;
  keywords: string[];
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
];

export const targetLocations = ["dallas", "irving", "plano", "richardson", "arlington"];

const discoveredJobs = [
  {
    id: "att-lead-advanced-analytics-dallas",
    company: "AT&T",
    role: "Lead Advanced Analytics",
    location: "Dallas, TX",
    source: "AT&T Careers",
    jobUrl: "https://www.att.jobs/job/dallas/lead-advanced-analytics/117/91598827120",
    posted: "2026-05-11",
    summary:
      "Data engineering and analytics role focused on pipelines, curated datasets, dashboards, observability, SQL, Python/Java/Scala, cloud data ecosystems, and stakeholder reporting.",
    keywords: ["data engineer", "analytics", "sql", "python", "tableau", "powerbi", "cloud", "databricks", "snowflake", "airflow"],
  },
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

export function discoverJobs() {
  const candidates = discoveredJobs
    .filter((job) => isTargetLocation(job.location) && isTargetRole(job.role, job.keywords))
    .map((job) => {
      const matchScore = scoreJob(job);

      return {
        ...job,
        matchScore,
        validationStatus: "URL_FOUND",
        notes: [
          `Discovered from ${job.source}.`,
          `Matches Dallas-area preference: ${job.location}.`,
          `Role keywords: ${job.keywords.slice(0, 6).join(", ")}.`,
          matchScore >= 90
            ? "Strong candidate for PR review."
            : "Review seniority and requirements before creating a PR.",
        ].join(" "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    searchedAt: new Date().toISOString(),
    targetRoles,
    targetLocations,
    candidates,
  };
}

function isTargetLocation(location: string) {
  const normalized = location.toLowerCase();

  return targetLocations.some((targetLocation) => normalized.includes(targetLocation));
}

function isTargetRole(role: string, keywords: string[]) {
  const searchable = `${role} ${keywords.join(" ")}`.toLowerCase();

  return targetRoles.some((targetRole) => searchable.includes(targetRole));
}

function scoreJob(job: (typeof discoveredJobs)[number]) {
  let score = 72;
  const searchable = `${job.role} ${job.summary} ${job.keywords.join(" ")}`.toLowerCase();

  if (job.location.toLowerCase().includes("dallas")) score += 8;
  if (job.location.toLowerCase().includes("plano") || job.location.toLowerCase().includes("irving")) score += 6;
  if (searchable.includes("sql")) score += 4;
  if (searchable.includes("python")) score += 4;
  if (searchable.includes("business intelligence") || searchable.includes("dashboard")) score += 4;
  if (searchable.includes("data engineer") || searchable.includes("data engineering")) score += 4;
  if (searchable.includes("data analyst") || searchable.includes("analytics")) score += 4;
  if (searchable.includes("stakeholder")) score += 2;

  return Math.min(score, 97);
}
