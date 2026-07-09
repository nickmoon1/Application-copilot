import { scorePortfolioFit, type PortfolioFit } from "@/lib/portfolio-fit";

export type JobUrlAnalysis = {
  company: string;
  keywords: string[];
  location: string;
  locationReadiness: string;
  portfolioFit: PortfolioFit;
  recommendedMatchScore: number;
  requirements: string[];
  responsibilities: string[];
  role: string;
  source: string;
  summary: string;
  tailoringNotes: string;
  title: string;
  url: string;
  warnings: string[];
};

const keywordPatterns = [
  "python",
  "sql",
  "excel",
  "tableau",
  "power bi",
  "dashboard",
  "dashboards",
  "kpi",
  "reporting",
  "analytics",
  "data analysis",
  "data analyst",
  "business analyst",
  "data scientist",
  "data engineer",
  "machine learning",
  "predictive",
  "forecasting",
  "statistical",
  "data quality",
  "data validation",
  "etl",
  "pipeline",
  "database",
  "sqlite",
  "snowflake",
  "databricks",
  "azure",
  "financial",
  "banking",
  "credit",
  "risk",
  "consumer",
  "stakeholder",
  "communication",
  "requirements",
  "documentation",
  "process improvement",
];

export async function analyzeJobUrl(jobUrl: string): Promise<JobUrlAnalysis> {
  const url = normalizeJobUrl(jobUrl);
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const warnings: string[] = [];
  const html = await fetchJobHtml(url);
  const text = cleanText(stripHtml(html));
  const jsonLd = extractJsonLd(html);
  const title = pickFirst([
    getJsonLdValue(jsonLd, ["title", "name"]),
    getMetaContent(html, "og:title"),
    getTitleTag(html),
  ]);
  const company = pickCompany([
    getJsonLdValue(jsonLd, ["hiringOrganization.name", "organization.name", "company"]),
    inferCompanyFromTitle(title),
    inferCompanyFromText(text),
    getMetaContent(html, "og:site_name"),
    inferCompanyFromHost(hostname),
  ]);
  const role = cleanRole(title, company) || title || "";
  const inferredRole = inferRoleFromText(text);
  const analyzedRole = inferredRole || role;
  const location = pickFirst([
    getJsonLdLocation(jsonLd),
    inferLocationFromTitle(title),
    inferLocationFromUrl(url),
    inferLocation(text),
  ]);
  const keywords = extractKeywords(text);
  const responsibilities = extractSignalLines(text, [
    "responsibilities",
    "what you will do",
    "duties",
    "essential functions",
    "role will",
    "you will",
  ]);
  const requirements = extractSignalLines(text, [
    "requirements",
    "qualifications",
    "what you bring",
    "experience",
    "skills",
    "preferred",
  ]);

  if (text.length < 500) {
    warnings.push("The job page returned limited readable text. Review the posting manually before relying on this analysis.");
  }

  if (keywords.length === 0) {
    warnings.push("No strong keyword matches were detected. Add important role keywords manually to Notes before creating the PR.");
  }

  const locationReadiness = getLocationReadiness(location);
  const summary = buildSummary({ company, keywords, location, role: analyzedRole });
  const portfolioFit = scorePortfolioFit({
    keywords,
    notes: `${responsibilities.join(" ")} ${requirements.join(" ")}`,
    role: analyzedRole,
    summary,
  });
  const recommendedMatchScore = scoreAnalyzedJob({
    keywords,
    location,
    portfolioFit,
    role: analyzedRole,
    summary,
  });
  const tailoringNotes = buildTailoringNotes({
    keywords,
    locationReadiness,
    portfolioFit,
    recommendedMatchScore,
    requirements,
    responsibilities,
    summary,
    warnings,
  });

  return {
    company,
    keywords,
    location,
    locationReadiness,
    portfolioFit,
    recommendedMatchScore,
    requirements,
    responsibilities,
    role: analyzedRole,
    source: hostname,
    summary,
    tailoringNotes,
    title,
    url,
    warnings,
  };
}

function normalizeJobUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter a job URL before analyzing the posting.");
  }

  const url = new URL(trimmed);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Job URL must start with http:// or https://.");
  }

  return url.toString();
}

async function fetchJobHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "ApplicationCopilotJobAnalyzer/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch job page. The site returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("The job URL did not return an HTML page that can be analyzed.");
  }

  return response.text();
}

function extractJsonLd(html: string) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const records: unknown[] = [];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1]));
      records.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Malformed structured data is common on job boards; fall back to HTML text.
    }
  }

  return records;
}

function getJsonLdValue(records: unknown[], paths: string[]) {
  for (const record of records) {
    for (const candidate of expandGraph(record)) {
      for (const path of paths) {
        const value = readPath(candidate, path);

        if (typeof value === "string" && value.trim()) {
          return cleanText(value);
        }
      }
    }
  }

  return "";
}

function getJsonLdLocation(records: unknown[]) {
  for (const record of records) {
    for (const candidate of expandGraph(record)) {
      const jobLocation = readPath(candidate, "jobLocation");
      const locations = Array.isArray(jobLocation) ? jobLocation : [jobLocation];

      for (const location of locations) {
        const locality = readPath(location, "address.addressLocality");
        const region = readPath(location, "address.addressRegion");
        const country = readPath(location, "address.addressCountry");
        const cleanLocality = typeof locality === "string" ? cleanText(locality) : "";
        const cleanRegion = typeof region === "string" ? normalizeRegion(region) : "";
        const cleanCountry = typeof country === "string" ? cleanText(country) : "";

        if (cleanLocality && cleanRegion) return `${cleanLocality}, ${cleanRegion}`;
        if (cleanLocality && cleanCountry) return `${cleanLocality}, ${cleanCountry}`;
        if (cleanLocality) return cleanLocality;
      }
    }
  }

  return "";
}

function expandGraph(value: unknown): unknown[] {
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const graph = record["@graph"];

  if (Array.isArray(graph)) {
    return [record, ...graph];
  }

  return [record];
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      return current.map((item) => readPath(item, key)).find((item) => typeof item === "string" && item.trim());
    }

    if (!current || typeof current !== "object") return undefined;

    return (current as Record<string, unknown>)[key];
  }, value);
}

function getMetaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexes = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  ];

  for (const regex of regexes) {
    const match = html.match(regex);

    if (match?.[1]) {
      return cleanText(decodeEntities(match[1]));
    }
  }

  return "";
}

function getTitleTag(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match?.[1] ? cleanText(decodeEntities(match[1])) : "";
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value: string) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function pickFirst(values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? "";
}

function pickCompany(values: Array<string | undefined>) {
  for (const value of values) {
    const company = normalizeCompanyName(value ?? "");

    if (company) return company;
  }

  return "";
}

function cleanRole(title: string, company: string) {
  return title
    .replace(company, "")
    .replace(/\|\s*.*$/, "")
    .replace(/\s+[-|]\s+.*$/, "")
    .replace(/\bcareer\b.*$/i, "")
    .trim();
}

function inferCompanyFromHost(hostname: string) {
  const knownHosts: Record<string, string> = {
    "jobs.dsv.com": "DSV",
    "dsv.com": "DSV",
  };
  const knownHost = knownHosts[hostname];

  if (knownHost) return knownHost;

  const genericSubdomains = new Set(["apply", "career", "careers", "jobs", "recruiting", "www"]);
  const jobBoardDomains = new Set(["greenhouse", "lever", "myworkdayjobs", "paycor", "recruitingbypaycor", "taleo"]);
  const parts = hostname.split(".");
  const firstPart = genericSubdomains.has(parts[0]) && parts[1] ? parts[1] : parts[0];

  if (jobBoardDomains.has(firstPart)) return "";

  return firstPart
    .split("-")
    .map(formatCompanyToken)
    .join(" ");
}

function inferCompanyFromTitle(title: string) {
  const segments = title
    .split("|")
    .map((segment) => normalizeCompanyName(segment))
    .filter(Boolean);

  return segments.length > 1 ? segments[segments.length - 1] : "";
}

function inferLocation(text: string) {
  const explicitLocation = text.match(/\bLocation:\s*(.{2,80}?)(?=\s+Job Id:|\s+#|\s+\||\.|$)/i);

  if (explicitLocation?.[1]) {
    return cleanLocation(explicitLocation[1]);
  }

  const cityStateMatch = text.match(
    /\b(Dallas|Irving|Plano|Richardson|Arlington|Fort Worth|Frisco|Farmers Branch|Waco|Midlothian|Lancaster|Remote)\s*,?\s*(TX|Texas)?\b/i,
  );

  if (cityStateMatch?.[1]) {
    return cleanLocation([cityStateMatch[1], cityStateMatch[2] ?? ""].filter(Boolean).join(", "));
  }

  const locationMatch = text.match(/\b(United States|TX|Texas)\b[^.]{0,80}/i);

  return locationMatch ? cleanLocation(locationMatch[0]) : "";
}

function inferLocationFromTitle(title: string) {
  const match = title.match(
    /\b(Dallas|Irving|Plano|Richardson|Arlington|Fort Worth|Frisco|Farmers Branch|Waco|Midlothian|Lancaster)\s*,?\s*(TX|Texas)\b/i,
  );

  return match?.[1] ? cleanLocation(`${match[1]}, ${match[2]}`) : "";
}

function inferLocationFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  const match = pathname.match(
    /\/job\/(Dallas|Irving|Plano|Richardson|Arlington|Fort-Worth|Frisco|Farmers-Branch|Waco|Midlothian|Lancaster)-[^/]*-(TX|Texas)(?:-|\/|$)/i,
  );

  if (!match?.[1]) return "";

  return cleanLocation(`${match[1].replace(/-/g, " ")}, ${match[2]}`);
}

function inferRoleFromText(text: string) {
  const patterns = [
    /\bPosition:\s*(.{3,90}?)(?=\s+Location:|\s+Job Id:|\s+#|\s+\||\.|$)/i,
    /\bJob Title:\s*(.{3,90}?)(?=\s+Location:|\s+Job Id:|\s+#|\s+\||\.|$)/i,
    /\bRole:\s*(.{3,90}?)(?=\s+Location:|\s+Job Id:|\s+#|\s+\||\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function inferCompanyFromText(text: string) {
  const patterns = [
    /\bAbout the Role\s+([A-Z][A-Za-z0-9&.,' -]{2,80}?)\s+is seeking\b/,
    /\b([A-Z][A-Za-z0-9&.,' -]{2,80}?)\s+is seeking\b/,
    /\b([A-Z][A-Za-z0-9&.,' -]{2,80}?)\s+is an Equal Opportunity Employer\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function normalizeCompanyName(value: string) {
  const cleaned = cleanText(value)
    .replace(/\b(job|jobs|career|careers|search|opportunities|opening|openings)\b/gi, " ")
    .replace(/\s+[-|]\s+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = cleaned.toLowerCase();

  if (!cleaned || ["job", "jobs", "career", "careers", "search", "job search"].includes(normalized)) {
    return "";
  }

  if (normalized === "dsv" || normalized.includes("dsv global")) return "DSV";

  return cleaned
    .split(" ")
    .map(formatCompanyToken)
    .join(" ");
}

function formatCompanyToken(part: string) {
  const uppercaseTokens = new Set(["dsv", "ntt", "at&t", "hhs", "cgi"]);
  const normalized = part.toLowerCase();

  if (uppercaseTokens.has(normalized)) return normalized.toUpperCase();

  return part.charAt(0).toUpperCase() + part.slice(1);
}

function cleanLocation(value: string) {
  const cleaned = cleanText(value)
    .replace(/\b(skip to content|mailing list|post a job|support)\b.*$/i, "")
    .replace(/\b(job id|job requisition|apply now)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = cleaned.match(
    /\b(Dallas|Irving|Plano|Richardson|Arlington|Fort Worth|Frisco|Farmers Branch|Waco|Midlothian|Lancaster|Remote)\s*,?\s*(TX|Texas)?\b/i,
  );

  if (match?.[1]) {
    const city = titleCaseLocation(match[1]);
    const region = match[2] ? normalizeRegion(match[2]) : "";

    return region ? `${city}, ${region}` : city;
  }

  return cleaned;
}

function normalizeRegion(value: string) {
  return value.trim().toLowerCase() === "texas" ? "TX" : value.trim().toUpperCase();
}

function titleCaseLocation(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLocationReadiness(location: string) {
  const normalized = location.toLowerCase();

  if (!normalized.trim()) {
    return "Location readiness: Confirm work location and travel expectations before final submission.";
  }

  if (normalized.includes("remote")) {
    return "Location readiness: Candidate is Dallas-based and can support remote work with clear communication and availability expectations.";
  }

  if (isDfwLocation(normalized)) {
    return "Location readiness: Candidate is based in Dallas, TX and the role appears aligned with the Dallas-Fort Worth search area.";
  }

  if (normalized.includes("tx") || normalized.includes("texas") || isKnownTexasCity(normalized)) {
    return `Location readiness: Candidate is based in Dallas, TX and is open to discussing relocation, regular commute, or travel arrangements for this ${location} opportunity.`;
  }

  return `Location readiness: Candidate is based in Dallas, TX. This ${location} opportunity should be reviewed manually for relocation, travel, or remote-work fit before submission.`;
}

function isDfwLocation(normalizedLocation: string) {
  return ["dallas", "irving", "plano", "richardson", "arlington", "frisco", "fort worth", "farmers branch"].some((city) =>
    normalizedLocation.includes(city),
  );
}

function isKnownTexasCity(normalizedLocation: string) {
  return ["waco", "austin", "houston", "san antonio", "mckinney", "denton", "garland", "lancaster", "midlothian"].some((city) =>
    normalizedLocation.includes(city),
  );
}

function extractKeywords(text: string) {
  const normalized = text.toLowerCase();

  return keywordPatterns
    .filter((keyword) => normalized.includes(keyword))
    .map((keyword) => titleCaseKeyword(keyword));
}

function titleCaseKeyword(keyword: string) {
  const uppercase = new Set(["sql", "kpi", "etl"]);

  return keyword
    .split(" ")
    .map((part) => (uppercase.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function scoreAnalyzedJob({
  keywords,
  location,
  portfolioFit,
  role,
  summary,
}: {
  keywords: string[];
  location: string;
  portfolioFit: PortfolioFit;
  role: string;
  summary: string;
}) {
  let score = 72;
  const searchable = `${role} ${summary} ${keywords.join(" ")}`.toLowerCase();
  const normalizedLocation = location.toLowerCase();

  if (normalizedLocation.includes("dallas")) score += 8;
  if (normalizedLocation.includes("plano") || normalizedLocation.includes("irving")) score += 6;
  if (normalizedLocation.includes("remote")) score += 5;
  if (normalizedLocation.includes("midlothian") || normalizedLocation.includes("fort worth") || normalizedLocation.includes("waco")) score += 3;
  if (searchable.includes("sql")) score += 4;
  if (searchable.includes("python")) score += 4;
  if (searchable.includes("power bi") || searchable.includes("business intelligence") || searchable.includes("dashboard")) score += 4;
  if (searchable.includes("data analyst") || searchable.includes("analytics")) score += 4;
  if (searchable.includes("data engineer") || searchable.includes("data engineering")) score += 4;
  if (searchable.includes("stakeholder")) score += 2;
  if (portfolioFit.tier === "STRONG") score += 6;
  if (portfolioFit.tier === "REVIEW") score += 2;
  if (portfolioFit.tier === "LOW") score -= 8;

  return Math.min(score, 97);
}

function extractSignalLines(text: string, anchors: string[]) {
  const sentences = text
    .split(/(?<=[.!?])\s+|\s+[•·]\s+|\n+/)
    .map(cleanText)
    .filter((item) => item.length >= 40 && item.length <= 280)
    .filter((item) => !isBoilerplateJobSentence(item));
  const lowerAnchors = anchors.map((anchor) => anchor.toLowerCase());
  const selected = sentences.filter((sentence) => {
    const normalized = sentence.toLowerCase();

    return lowerAnchors.some((anchor) => normalized.includes(anchor)) || keywordPatterns.some((keyword) => normalized.includes(keyword));
  });

  return Array.from(new Set(selected)).slice(0, 6);
}

function isBoilerplateJobSentence(value: string) {
  const normalized = value.toLowerCase();
  const boilerplateSignals = [
    "actual compensation will be determined",
    "all applicants will be considered",
    "current dsv employee",
    "equal opportunity employer",
    "founded dsv in denmark",
    "human resource representative",
    "if you are interested in learning the status",
    "please contact your human resource",
    "selected for further consideration",
    "we work every day from our many offices",
  ];

  return boilerplateSignals.some((signal) => normalized.includes(signal));
}

function buildSummary({
  company,
  keywords,
  location,
  role,
}: {
  company: string;
  keywords: string[];
  location: string;
  role: string;
}) {
  return [
    role ? `${role}${company ? ` at ${company}` : ""}` : "Job posting",
    location ? `Location signal: ${location}` : "",
    keywords.length > 0 ? `Detected keywords: ${keywords.slice(0, 12).join(", ")}` : "",
  ].filter(Boolean).join(". ");
}

function buildTailoringNotes({
  keywords,
  locationReadiness,
  portfolioFit,
  recommendedMatchScore,
  requirements,
  responsibilities,
  summary,
  warnings,
}: {
  keywords: string[];
  locationReadiness: string;
  portfolioFit: PortfolioFit;
  recommendedMatchScore: number;
  requirements: string[];
  responsibilities: string[];
  summary: string;
  warnings: string[];
}) {
  return `Job URL analysis:
- Summary: ${summary || "No summary extracted."}
- Keywords to consider: ${keywords.length > 0 ? keywords.join(", ") : "No strong keywords detected."}
- Portfolio fit: ${portfolioFit.tier} (${portfolioFit.score}%). Matched evidence: ${portfolioFit.matchedAnchors.join("; ") || "No strong portfolio anchors matched"}. Gaps to review: ${portfolioFit.missingAnchors.join("; ") || "None"}.
- Recommended match score: ${recommendedMatchScore}%
- ${locationReadiness}
- Responsibilities: ${responsibilities.length > 0 ? responsibilities.join(" | ") : "Review job page manually."}
- Requirements: ${requirements.length > 0 ? requirements.join(" | ") : "Review job page manually."}
- Analyzer warnings: ${warnings.length > 0 ? warnings.join(" ") : "None."}`;
}
