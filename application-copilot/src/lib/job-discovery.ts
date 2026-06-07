import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";

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
  workArrangement?: string;
};

export type DiscoveredJob = JobSeed & {
  locationFit: string;
  matchScore: number;
  validationStatus: string;
  validationDetails: string;
  validationCheckedAt: string;
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

export const targetLocations = ["dallas", "irving", "plano", "richardson", "arlington", "frisco", "fort worth"];

const attDataAnalyticsUrl = "https://www.att.jobs/category/data-and-analytics-jobs/117/61758/1";
const citiCareersUrl = "https://jobs.citi.com/search-jobs/data/287/1";
const citiSearchUrls = [
  "https://jobs.citi.com/search-jobs/data/287/1",
  "https://jobs.citi.com/search-jobs/data%20analyst/287/1",
  "https://jobs.citi.com/search-jobs/business%20analyst/287/1",
];
const nttDataAnalyticsUrl = "https://careers.services.global.ntt/global/en/c/data-and-analytics-jobs";
const nttSearchUrls = [
  nttDataAnalyticsUrl,
  "https://careers.services.global.ntt/global/en/search-results?keywords=data",
  "https://careers.services.global.ntt/global/en/search-results?keywords=data%20analyst",
  "https://careers.services.global.ntt/global/en/search-results?keywords=data%20engineer",
  "https://careers.services.global.ntt/global/en/search-results?keywords=business%20analyst",
];

const nttPriorityJobs: JobSeed[] = [
  {
    id: "ntt-senior-data-scientist-consultant-374304",
    company: "NTT Data",
    role: "Senior Data Scientist Consultant",
    location: "Plano, TX",
    source: "NTT Data Careers - Priority",
    jobUrl:
      "https://careers.services.global.ntt/global/en/job/374304/Senior-Data-Scientist-Consultant-Python-SQL-TensorFlow-PyTorch-Scikit-Learn-FTE-Onsite",
    posted: "2026-05-28",
    summary:
      "Plano-based NTT Data data science consultant role focused on Python, SQL, TensorFlow, PyTorch, scikit-learn, statistical modeling, and financial services analytics.",
    keywords: [
      "data scientist",
      "python",
      "sql",
      "machine learning",
      "tensorflow",
      "pytorch",
      "scikit-learn",
      "statistical modeling",
      "financial analytics",
    ],
  },
];

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
];

const citiSeedJobs: JobSeed[] = [
  {
    id: "citi-data-solutions-engineer-91594717280",
    company: "Citi",
    role: "Data Solutions Engineer",
    location: "Irving, TX",
    source: "Citi Careers - Seed",
    jobUrl: "https://jobs.citi.com/job/irving/data-solutions-engineer/287/91594717280",
    posted: "2026-05-20",
    summary:
      "Citi data engineering role in Irving focused on data solutions, analytics platforms, engineering delivery, and technical data problem solving.",
    keywords: ["data engineer", "data solutions", "analytics", "sql", "data platforms", "stakeholders"],
  },
  {
    id: "citi-data-analytics-lead-analyst-94492539808",
    company: "Citi",
    role: "Data Analytics Lead Analyst",
    location: "Irving, TX",
    source: "Citi Careers - Seed",
    jobUrl: "https://jobs.citi.com/job/irving/data-analytics-lead-analyst/287/94492539808",
    posted: "2026-05-19",
    summary:
      "Citi data analytics role in Irving focused on analytics delivery, data quality, reporting, governance, and stakeholder-facing data controls.",
    keywords: ["data analytics", "data analyst", "data governance", "data quality", "reporting", "risk", "stakeholders"],
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
  const citiDiscovery = await discoverCitiJobs();
  const citiJobs = citiDiscovery.jobs.length > 0 ? citiDiscovery.jobs : citiSeedJobs;
  const nttDiscovery = await discoverNttJobs();
  const seeds = mergeJobs([
    ...(liveAttJobs.length > 0 ? liveAttJobs : attFallbackJobs),
    ...citiJobs,
    ...nttDiscovery.jobs,
    ...fallbackJobs,
  ]);
  const matchedSeeds = seeds
    .filter((job) => isTargetLocationCandidate(job) && isTargetRole(job.role, job.keywords))
    .sort((a, b) => scoreJob(b) - scoreJob(a));
  const candidates = await Promise.all(matchedSeeds.map(enrichJob));

  candidates
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
      {
        name: "Citi Careers",
        url: citiCareersUrl,
        mode: citiDiscovery.mode,
        found: citiJobs.length,
      },
      {
        name: "NTT Data Careers",
        url: nttDataAnalyticsUrl,
        mode: nttDiscovery.mode,
        found: nttDiscovery.jobs.length,
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

async function discoverCitiJobs() {
  const pages = await Promise.all(
    citiSearchUrls.map(async (url) => {
      try {
        return await fetchText(url);
      } catch {
        return "";
      }
    }),
  );
  const parsedJobs = mergeJobs(pages.flatMap(parseCitiSearchResults));
  const jobs = parsedJobs
    .filter((job) => isTargetLocationCandidate(job) && isTargetRole(job.role, job.keywords))
    .filter((job) => !isOverSeniorForCurrentProfile(job.role))
    .slice(0, 12);

  return {
    jobs,
    mode: getCitiConnectorMode(parsedJobs.length, jobs.length),
  };
}

function parseCitiSearchResults(html: string): JobSeed[] {
  const results: JobSeed[] = [];
  const itemPattern = /<li class="sr-job-item">([\s\S]*?)<\/li>/g;

  for (const itemMatch of html.matchAll(itemPattern)) {
    const item = itemMatch[1] ?? "";
    const linkMatch = item.match(
      /<a class="sr-job-item__link" href="([^"]+)" data-job-id="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/,
    );
    const locationMatch = item.match(/<span class="sr-job-item__facet sr-job-item__facet-icon sr-job-location">([\s\S]*?)<\/span>/);

    if (!linkMatch || !locationMatch) continue;

    const href = linkMatch[1];
    const jobId = linkMatch[2];
    const role = cleanHtmlText(linkMatch[3] ?? "");
    const location = normalizeCitiLocation(cleanHtmlText(locationMatch[1] ?? ""));
    const workArrangement = cleanHtmlText(item.match(/<span class="sr-job-item__facet sr-job-item__facet-icon sr-job-type">([\s\S]*?)<\/span>/)?.[1] ?? "");

    if (!href || !jobId || !role || !location) continue;

    results.push({
      id: `citi-${slugify(role)}-${jobId}`,
      company: "Citi",
      role,
      location,
      source: "Citi Careers - Live",
      jobUrl: new URL(href, "https://jobs.citi.com").toString(),
      posted: new Date().toISOString().slice(0, 10),
      summary: [
        `Live Citi Careers search result for ${role} in ${location}.`,
        workArrangement ? `Work arrangement listed as ${workArrangement}.` : "",
      ].filter(Boolean).join(" "),
      keywords: inferKeywords(role),
      workArrangement,
    });
  }

  return results;
}

function getCitiConnectorMode(parsedCount: number, acceptedCount: number) {
  if (acceptedCount > 0) {
    return "live";
  }

  if (parsedCount > 0) {
    return "live_search_fallback_seeded";
  }

  return "seeded";
}

async function discoverNttJobs() {
  const pages = await Promise.all(
    nttSearchUrls.flatMap((url) =>
      [0, 10, 20].map(async (from) => {
        try {
          return await fetchText(withPagination(url, from));
        } catch {
          return "";
        }
      }),
    ),
  );
  const parsedJobs = mergeJobs([...nttPriorityJobs, ...pages.flatMap(parseNttSearchResults)]);
  const jobs = parsedJobs
    .filter((job) => isTargetLocationCandidate(job) && isTargetRole(job.role, job.keywords))
    .filter((job) => !isOverSeniorForCurrentProfile(job.role))
    .slice(0, 12);

  return {
    jobs,
    mode: getLiveConnectorMode(parsedJobs.length, jobs.length),
  };
}

function parseNttSearchResults(html: string): JobSeed[] {
  const payload = extractJsonObjectAfterKey(html, "\"eagerLoadRefineSearch\":");
  if (!payload) return [];

  try {
    const parsed = JSON.parse(payload) as {
      data?: {
        jobs?: NttRawJob[];
      };
    };
    const jobs = parsed.data?.jobs ?? [];

    return jobs.map(mapNttJob).filter((job): job is JobSeed => Boolean(job));
  } catch {
    return [];
  }
}

type NttRawJob = Record<string, unknown>;

function mapNttJob(job: NttRawJob): JobSeed | null {
  const role = getString(job.title);
  const reqId = getString(job.reqId) || getString(job.jobId);
  const location = normalizeNttLocation(
    getString(job.location) ||
      getString(job.cityStateCountry) ||
      getStringArray(job.multi_location)[0] ||
      [getString(job.city), getString(job.country)].filter(Boolean).join(", "),
  );

  if (!role || !reqId || !location) return null;

  const description = getString(job.descriptionTeaser) || getNestedString(job, ["ml_job_parser", "descriptionTeaser"]);
  const workArrangement = getString(job.remoteType) || getString(job.workLocation);
  const skills = getStringArray(job.ml_skills);
  const category = getString(job.category);
  const jobUrl = `https://careers.services.global.ntt/global/en/job/${encodeURIComponent(reqId)}/${slugifyTitle(role)}`;

  return {
    id: `ntt-${slugify(role)}-${slugify(reqId)}`,
    company: "NTT Data",
    role,
    location,
    source: "NTT Data Careers - Live",
    jobUrl,
    posted: normalizeDate(getString(job.postedDate) || getString(job.dateCreated)),
    summary: [
      `Live NTT Data posting for ${role} in ${location}.`,
      category ? `Category: ${category}.` : "",
      workArrangement ? `Work arrangement listed as ${workArrangement}.` : "",
      description,
    ].filter(Boolean).join(" "),
    keywords: Array.from(new Set([...inferKeywords(role), ...skills.slice(0, 8).map((skill) => skill.toLowerCase())])),
    workArrangement,
  };
}

function getLiveConnectorMode(parsedCount: number, acceptedCount: number) {
  if (acceptedCount > 0) {
    return "live";
  }

  if (parsedCount > 0) {
    return "live_no_matches";
  }

  return "unavailable";
}

async function enrichJob(job: JobSeed): Promise<DiscoveredJob> {
  const locationFit = getLocationFit(job);
  const matchScore = scoreJob(job);
  const validation = await validateJob(job);
  const jobEvidence = validation.evidence;

  return {
    ...job,
    locationFit,
    matchScore,
    validationStatus: validation.status,
    validationDetails: validation.details,
    validationCheckedAt: validation.checkedAt,
    notes: [
      `Discovered from ${job.source}.`,
      `Location fit: ${locationFit} (${job.location}).`,
      `Role keywords: ${job.keywords.slice(0, 6).join(", ")}.`,
      jobEvidence.length > 0 ? `Job evidence keywords: ${jobEvidence.join(", ")}.` : "",
      `Validation: ${validation.details}.`,
      matchScore >= 90
        ? "Strong candidate for PR review."
        : "Review seniority and requirements before creating a PR.",
    ].filter(Boolean).join(" "),
  };
}

async function validateJob(job: JobSeed) {
  const checkedAt = new Date().toISOString();

  try {
    const page = await fetchPage(job.jobUrl);
    const normalizedBody = normalizeForValidation(page.body);
    const evidence = extractJobEvidence(normalizedBody);
    const roleTokens = getImportantTokens(job.role);
    const companyTokens = getImportantTokens(job.company);
    const matchedRoleTokens = roleTokens.filter((token) => normalizedBody.includes(token));
    const matchedCompanyTokens = companyTokens.filter((token) => normalizedBody.includes(token));

    if (page.statusCode === 404 || page.statusCode === 410 || hasInactiveJobLanguage(normalizedBody)) {
      return {
        checkedAt,
        details: `URL returned inactive signal (${page.statusCode}) or closed-job language`,
        evidence,
        status: "INVALID_URL",
      };
    }

    if (page.statusCode >= 400) {
      return {
        checkedAt,
        details: `URL returned HTTP ${page.statusCode}`,
        evidence,
        status: "INVALID_URL",
      };
    }

    if (matchedRoleTokens.length >= Math.min(2, roleTokens.length) || matchedCompanyTokens.length > 0) {
      return {
        checkedAt,
        details: `Verified page content with HTTP ${page.statusCode}`,
        evidence,
        status: job.source.includes("Live") ? "LIVE_VERIFIED" : "URL_VERIFIED",
      };
    }

    return {
      checkedAt,
      details: `URL loaded with HTTP ${page.statusCode}, but the title was not found on the page`,
      evidence,
      status: "POSSIBLY_STALE",
    };
  } catch (error) {
    return {
      checkedAt,
      details: error instanceof Error ? `Validation failed: ${error.message}` : "Validation failed",
      evidence: [],
      status: "VALIDATION_FAILED",
    };
  }
}

function extractJobEvidence(normalizedBody: string) {
  const evidenceTerms = [
    "sql",
    "python",
    "tableau",
    "power bi",
    "excel",
    "data quality",
    "data governance",
    "data analysis",
    "business intelligence",
    "dashboard",
    "reporting",
    "forecasting",
    "predictive analytics",
    "machine learning",
    "stakeholder",
    "data validation",
    "etl",
    "snowflake",
    "databricks",
    "risk",
    "controls",
    "regulatory",
    "kpi",
  ];

  return evidenceTerms.filter((term) => normalizedBody.includes(term)).slice(0, 12);
}

async function fetchText(url: string) {
  const page = await fetchPage(url);

  if (page.statusCode >= 400) {
    throw new Error(`Request failed with status ${page.statusCode}`);
  }

  return page.body;
}

function fetchPage(url: string, redirectsRemaining = 3): Promise<{ body: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const get = parsedUrl.protocol === "http:" ? httpGet : httpsGet;
    const request = get(
      parsedUrl,
      {
        headers: {
          "User-Agent": "ApplicationCopilot/0.1 (+local job discovery)",
        },
        maxHeaderSize: 128 * 1024,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (statusCode >= 300 && statusCode < 400 && location && redirectsRemaining > 0) {
          response.resume();
          resolve(fetchPage(new URL(location, parsedUrl).toString(), redirectsRemaining - 1));
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve({ body, statusCode }));
      },
    );

    request.setTimeout(8000, () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
  });
}

function extractJsonObjectAfterKey(value: string, key: string) {
  const keyIndex = value.indexOf(key);
  if (keyIndex < 0) return null;

  const start = value.indexOf("{", keyIndex + key.length);
  if (start < 0) return null;

  let depth = 0;
  let escaped = false;
  let inString = false;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return value.slice(start, index + 1);
      }
    }
  }

  return null;
}

function withPagination(url: string, from: number) {
  const paginatedUrl = new URL(url);

  if (from > 0) {
    paginatedUrl.searchParams.set("from", String(from));
    paginatedUrl.searchParams.set("s", "1");
  }

  return paginatedUrl.toString();
}

function normalizeForValidation(value: string) {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getImportantTokens(value: string) {
  return normalizeForValidation(value)
    .split(" ")
    .filter((token) => token.length >= 4)
    .filter((token) => !["lead", "vice", "president", "principal"].includes(token));
}

function hasInactiveJobLanguage(normalizedBody: string) {
  const inactivePhrases = [
    "job is no longer available",
    "position is no longer available",
    "posting is no longer available",
    "job posting has expired",
    "this job has expired",
    "no longer accepting applications",
    "page not found",
    "not found",
  ];

  return inactivePhrases.some((phrase) => normalizedBody.includes(phrase));
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

function isTargetLocationCandidate(job: JobSeed) {
  return getLocationFit(job) !== "FILTERED_LOCATION";
}

function getLocationFit(job: JobSeed) {
  if (isTargetLocation(job.location)) {
    return "LOCAL_MATCH";
  }

  if (hasRemoteOrMultiLocationSignal(job)) {
    return "REMOTE_OR_MULTI_LOCATION";
  }

  return "FILTERED_LOCATION";
}

function hasRemoteOrMultiLocationSignal(job: JobSeed) {
  const searchable = `${job.location} ${job.summary} ${job.workArrangement ?? ""}`.toLowerCase();

  if (hasNonUsCitiUrlSignal(job.jobUrl)) {
    return false;
  }

  if (searchable.includes("remote") || searchable.includes("virtual")) {
    return hasUsUrlSignal(job.jobUrl) || hasUsRemoteSignal(searchable);
  }

  if (searchable.includes("multiple locations") || searchable.includes("multiple location")) {
    return hasUsUrlSignal(job.jobUrl) || searchable.includes("united states") || searchable.includes("usa");
  }

  return false;
}

function hasUsRemoteSignal(searchable: string) {
  const usSignals = [
    "united states",
    "usa",
    "u.s.",
    "us remote",
    "remote - us",
    "remote - united states",
    "remote, united states",
    "remote within the united states",
  ];

  return usSignals.some((signal) => searchable.includes(signal));
}

function hasNonUsCitiUrlSignal(jobUrl: string) {
  const normalized = jobUrl.toLowerCase();
  const nonUsPathSignals = [
    "/job/bengaluru/",
    "/job/chennai/",
    "/job/haryana/",
    "/job/mumbai/",
    "/job/pune/",
    "/job/city-of-taguig/",
    "/job/warsaw/",
    "/job/olsztyn/",
    "/job/dublin/",
  ];

  return nonUsPathSignals.some((signal) => normalized.includes(signal));
}

function hasUsUrlSignal(jobUrl: string) {
  const normalized = jobUrl.toLowerCase();
  const usPathSignals = [
    "/job/dallas/",
    "/job/irving/",
    "/job/plano/",
    "/job/richardson/",
    "/job/arlington/",
    "/job/frisco/",
    "/job/fort-worth/",
    "/job/tampa/",
    "/job/jacksonville/",
    "/job/new-york/",
    "/job/jersey-city/",
  ];

  return usPathSignals.some((signal) => normalized.includes(signal));
}

function isTargetRole(role: string, keywords: string[]) {
  const searchable = `${role} ${keywords.join(" ")}`.toLowerCase();

  return targetRoles.some((targetRole) => searchable.includes(targetRole));
}

function isOverSeniorForCurrentProfile(role: string) {
  const normalized = role.toLowerCase();
  const seniorSignals = [
    "vice president",
    "senior vice president",
    "assistant vice president",
    "lead ",
    "manager",
    "director",
  ];

  return seniorSignals.some((signal) => normalized.includes(signal));
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
  if (getLocationFit(job) === "REMOTE_OR_MULTI_LOCATION") score += 5;
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

function cleanHtmlText(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCitiLocation(value: string) {
  return value
    .replace(/,\s*Texas,\s*United States/i, ", TX")
    .replace(/,\s*United States/i, "")
    .trim();
}

function normalizeNttLocation(value: string) {
  return value
    .replace(/,\s*Texas,\s*United States(?: of America)?/i, ", TX")
    .replace(/,\s*United States of America/i, ", United States")
    .replace(/,\s*United States/i, ", United States")
    .trim();
}

function normalizeDate(value: string) {
  if (!value) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()) : [];
}

function getNestedString(value: Record<string, unknown>, path: string[]) {
  let current: unknown = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return "";
    current = (current as Record<string, unknown>)[key];
  }

  return getString(current);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyTitle(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
