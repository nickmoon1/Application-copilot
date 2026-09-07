import profile from "@/data/profile.json";

export type JobFamily =
  | "DATA_ANALYTICS"
  | "DATA_SCIENCE"
  | "DATA_ENGINEERING"
  | "BUSINESS_ANALYSIS"
  | "TEACHING"
  | "OTHER";

export type FitRecommendation = "STRONG_FIT" | "REVIEW" | "PASS";
export type RequirementEvidenceLevel = "DEMONSTRATED" | "TRANSFERABLE" | "EXPOSURE" | "UNSUPPORTED";

export type FitDimension = {
  score: number;
  matched: string[];
  gaps: string[];
};

export type HardGate = {
  label: string;
  status: "MET" | "REVIEW" | "NOT_MET";
  detail: string;
};

export type RequirementEvidence = {
  requirement: string;
  category: "TECHNICAL" | "FUNCTIONAL" | "DOMAIN" | "SENIORITY";
  level: RequirementEvidenceLevel;
  evidence: string;
};

export type PostingTiming = {
  postedDate: string;
  closingDate: string;
  ageDays: number | null;
  daysRemaining: number | null;
  urgency: "CLOSING_SOON" | "FRESH" | "STANDARD" | "STALE" | "EXPIRED" | "UNKNOWN";
  label: string;
};

export type JobRequirementAnalysis = {
  primaryJobFamily: JobFamily;
  familyLabel: string;
  familyConfidence: number;
  familySignals: string[];
  employerProblems: string[];
  technicalRequirements: string[];
  functionalRequirements: string[];
  domainRequirements: string[];
  seniorityRequirements: string[];
  requiredYears: number | null;
  hardGates: HardGate[];
  evidenceMap: RequirementEvidence[];
  dimensions: {
    technical: FitDimension;
    functional: FitDimension;
    domain: FitDimension;
    seniority: FitDimension;
  };
  overallScore: number;
  recommendation: FitRecommendation;
  recommendationReason: string;
  suggestedPassReason: "TOO_SENIOR" | "SKILL_GAP" | "LOCATION" | "ROLE_MISMATCH" | null;
  timing: PostingTiming;
};

type DecoderInput = {
  role: string;
  description: string;
  keywords?: string[];
  location?: string;
  postedDate?: string;
  closingDate?: string;
};

type SignalGroup = {
  label: string;
  patterns: string[];
};

const familySignals: Record<JobFamily, string[]> = {
  DATA_ANALYTICS: ["data analysis", "analyze data", "analytics", "dashboard", "reporting", "kpi", "insights", "visualization", "sql"],
  DATA_SCIENCE: ["data scientist", "data science", "machine learning", "predictive model", "statistical model", "classification", "regression", "forecasting", "python"],
  DATA_ENGINEERING: ["data engineer", "data engineering", "data pipeline", "etl", "data warehouse", "data architecture", "spark", "dbt", "databricks", "snowflake"],
  BUSINESS_ANALYSIS: ["business analyst", "business analysis", "business requirements", "requirements gathering", "process improvement", "user stories", "stakeholder", "business process"],
  TEACHING: ["teach", "teaching", "instructor", "adjunct", "curriculum", "students", "faculty", "course"],
  OTHER: [],
};

const technicalSignals: SignalGroup[] = [
  { label: "Python", patterns: ["python"] },
  { label: "SQL", patterns: ["sql"] },
  { label: "Excel", patterns: ["excel"] },
  { label: "Power BI", patterns: ["power bi"] },
  { label: "Tableau", patterns: ["tableau"] },
  { label: "Snowflake", patterns: ["snowflake"] },
  { label: "Databricks", patterns: ["databricks"] },
  { label: "Azure", patterns: ["azure"] },
  { label: "Machine learning", patterns: ["machine learning", "predictive model", "classification", "regression"] },
  { label: "Data pipelines", patterns: ["data pipeline", "etl", "data engineering"] },
  { label: "dbt", patterns: ["dbt"] },
  { label: "Airflow", patterns: ["airflow"] },
  { label: "Spark", patterns: ["spark", "pyspark"] },
  { label: "Statistics", patterns: ["statistical", "statistics"] },
  { label: "SAP", patterns: ["sap"] },
  { label: "AWS", patterns: ["aws", "amazon web services"] },
  { label: "R", patterns: [" r programming", "proficiency in r", "using r "] },
];

const functionalSignals: SignalGroup[] = [
  { label: "Data analysis", patterns: ["data analysis", "analyze data", "analytical analysis"] },
  { label: "KPI reporting", patterns: ["kpi", "performance reporting", "reporting"] },
  { label: "Dashboard development", patterns: ["dashboard", "visualization"] },
  { label: "Data quality", patterns: ["data quality", "data validation", "quality checks"] },
  { label: "Stakeholder communication", patterns: ["stakeholder", "cross-functional", "communicate findings", "presentation"] },
  { label: "Requirements gathering", patterns: ["requirements gathering", "business requirements", "user stories"] },
  { label: "Process improvement", patterns: ["process improvement", "improve processes", "operational improvement"] },
  { label: "Forecasting", patterns: ["forecast", "time series"] },
  { label: "Project coordination", patterns: ["project coordination", "project management", "manage projects"] },
  { label: "Teaching and mentoring", patterns: ["teach", "instruction", "mentor", "curriculum"] },
];

const domainSignals: SignalGroup[] = [
  { label: "Financial services", patterns: ["financial services", "banking", "credit", "lending", "mortgage"] },
  { label: "Transportation and operations", patterns: ["transportation", "airline", "aviation", "operations"] },
  { label: "Consumer protection", patterns: ["consumer protection", "complaint", "regulatory"] },
  { label: "Education", patterns: ["education", "university", "student", "academic"] },
  { label: "Energy", patterns: ["energy", "utility"] },
  { label: "Healthcare", patterns: ["healthcare", "clinical", "medical"] },
  { label: "Manufacturing", patterns: ["manufacturing", "supply chain", "logistics"] },
];

const candidateDemonstratedSearchable = normalize([
  ...profile.highlights,
  ...profile.projects.flatMap((project) => [project.name, project.summary]),
  ...profile.experience.flatMap((experience) => [experience.role, experience.organization, ...experience.focus]),
].join(" "));

const candidateExposureSearchable = normalize([
  profile.headline,
  ...Object.values(profile.skills).flat(),
  ...profile.education,
  ...profile.certifications,
].join(" "));

const candidateYearsByFamily: Record<JobFamily, number> = {
  DATA_ANALYTICS: 4,
  DATA_SCIENCE: 1,
  DATA_ENGINEERING: 1,
  BUSINESS_ANALYSIS: 2,
  TEACHING: 2,
  OTHER: 0,
};

export function decodeJobRequirements(input: DecoderInput): JobRequirementAnalysis {
  const description = cleanText(input.description);
  const searchable = normalize(`${input.role} ${description} ${(input.keywords ?? []).join(" ")}`);
  const sentences = splitSentences(description);
  const family = classifyJobFamily(normalize(input.role), normalize(description));
  const technicalRequirements = findSignalLabels(searchable, technicalSignals);
  const functionalRequirements = findSignalLabels(searchable, functionalSignals);
  const domainRequirements = findSignalLabels(searchable, domainSignals);
  const years = extractRequiredYears([description, ...sentences]);
  const seniorityRequirements = extractSeniorityRequirements(sentences, years);
  const technical = scoreDimension(technicalRequirements, "TECHNICAL");
  const functional = scoreDimension(functionalRequirements, "FUNCTIONAL");
  const domain = scoreDimension(domainRequirements, "DOMAIN");
  const seniority = scoreSeniority(years, family.family, input.role);
  const timing = analyzePostingTiming(input.postedDate, input.closingDate, [description, ...sentences]);
  const hardGates = buildHardGates(searchable, years, timing, family.family);
  const hasBlockingGate = hardGates.some((gate) => gate.status === "NOT_MET");
  const weightedScore = Math.round(
    technical.score * 0.3 + functional.score * 0.3 + domain.score * 0.15 + seniority.score * 0.25,
  );
  const overallScore = hasBlockingGate
    ? Math.min(weightedScore, 59)
    : family.family === "OTHER"
      ? Math.min(weightedScore, 49)
      : weightedScore;
  const recommendation = getRecommendation(overallScore, hasBlockingGate || family.family === "OTHER");
  const suggestedPassReason = getSuggestedPassReason(hardGates, technical, functional, family.family);
  const evidenceMap = buildEvidenceMap(
    technicalRequirements,
    functionalRequirements,
    domainRequirements,
    seniorityRequirements,
    years,
    family.family,
  );

  return {
    primaryJobFamily: family.family,
    familyLabel: getJobFamilyLabel(family.family),
    familyConfidence: family.confidence,
    familySignals: family.signals,
    employerProblems: extractEmployerProblems(sentences, functionalRequirements),
    technicalRequirements,
    functionalRequirements,
    domainRequirements,
    seniorityRequirements,
    requiredYears: years,
    hardGates,
    evidenceMap,
    dimensions: { technical, functional, domain, seniority },
    overallScore,
    recommendation,
    recommendationReason: buildRecommendationReason(recommendation, hardGates, technical, functional, family.family),
    suggestedPassReason,
    timing,
  };
}

export function getJobFamilyLabel(family: JobFamily) {
  const labels: Record<JobFamily, string> = {
    DATA_ANALYTICS: "Data & Reporting Analytics",
    DATA_SCIENCE: "Data Science",
    DATA_ENGINEERING: "Data Engineering",
    BUSINESS_ANALYSIS: "Business Analysis",
    TEACHING: "Teaching & Academic",
    OTHER: "Adjacent / Unclassified",
  };

  return labels[family];
}

function classifyJobFamily(role: string, description: string) {
  const excludedTitles = ["office assistant", "content reviewer", "content moderator", "devops", "software engineer", "developer", "data annotation", "collection"];
  const explicitTargetTitle = ["data", "analytics", "analyst", "business intelligence", "reporting", "operations research", "adjunct", "instructor"]
    .some((signal) => role.includes(normalize(signal)));

  if (excludedTitles.some((signal) => role.includes(normalize(signal))) && !explicitTargetTitle) {
    return { family: "OTHER" as JobFamily, confidence: 90, signals: ["Title indicates a different primary occupation"] };
  }

  const results = (Object.entries(familySignals) as Array<[JobFamily, string[]]>)
    .filter(([family]) => family !== "OTHER")
    .map(([family, patterns]) => {
      const titleSignals = patterns.filter((pattern) => role.includes(normalize(pattern)));
      const descriptionSignals = patterns.filter((pattern) => description.includes(normalize(pattern)));
      const signals = Array.from(new Set([...titleSignals, ...descriptionSignals]));
      return { family, signals, score: titleSignals.length * 3 + descriptionSignals.length };
    })
    .sort((left, right) => right.score - left.score);
  const winner = results[0];

  if (!winner || winner.score === 0) {
    return { family: "OTHER" as JobFamily, confidence: 25, signals: [] as string[] };
  }

  return {
    family: winner.family,
    confidence: Math.min(95, 45 + winner.score * 10),
    signals: winner.signals.slice(0, 5),
  };
}

function findSignalLabels(searchable: string, groups: SignalGroup[]) {
  return groups
    .filter((group) => group.patterns.some((pattern) => searchable.includes(normalize(pattern))))
    .map((group) => group.label);
}

function scoreDimension(
  requirements: string[],
  dimension: RequirementEvidence["category"],
): FitDimension {
  if (requirements.length === 0) {
    return { score: dimension === "DOMAIN" ? 70 : 60, matched: [], gaps: ["Insufficient posting detail"] };
  }

  const evidence = requirements.map((requirement) => ({ requirement, level: getEvidenceLevel(requirement, dimension) }));
  const matched = evidence.filter((item) => item.level === "DEMONSTRATED").map((item) => item.requirement);
  const gaps = evidence.filter((item) => item.level === "UNSUPPORTED").map((item) => item.requirement);
  const points = evidence.reduce((total, item) => total + getEvidenceWeight(item.level), 0);
  const score = Math.round((points / requirements.length) * 100);

  return { score, matched, gaps };
}

function scoreSeniority(requiredYears: number | null, family: JobFamily, role: string): FitDimension {
  const candidateYears = candidateYearsByFamily[family];
  const yearLabel = `${candidateYears} year${candidateYears === 1 ? "" : "s"}`;

  if (requiredYears === null) {
    if (/\b(senior|sr\.?|principal|lead|manager|director)\b/i.test(role)) {
      return { score: 55, matched: [], gaps: ["Senior title detected; minimum experience was not readable"] };
    }

    return { score: 75, matched: ["No explicit minimum years detected"], gaps: [] };
  }

  if (requiredYears <= candidateYears) {
    return {
      score: 100,
      matched: [`Profile supports approximately ${yearLabel} in this work family`],
      gaps: [],
    };
  }

  const ratio = candidateYears / requiredYears;
  return {
    score: Math.max(20, Math.round(ratio * 100)),
    matched: candidateYears > 0 ? [`Approximately ${yearLabel} in this work family documented`] : [],
    gaps: [`Posting requires ${requiredYears}+ years`],
  };
}

function getRequirementPatterns(requirement: string) {
  const aliases: Record<string, string[]> = {
    "Data analysis": ["data analyst", "data analysis", "analytical workflows"],
    "KPI reporting": ["kpi reporting", "tableau dashboards", "reporting"],
    "Dashboard development": ["dashboard development", "tableau dashboards"],
    "Stakeholder communication": ["stakeholder", "non technical stakeholders", "presentations"],
    "Requirements gathering": ["business analytics", "project coordination"],
    "Process improvement": ["improved data processing", "process improvement"],
    "Project coordination": ["project coordination", "multiple deliverables"],
    "Financial services": ["financial analytics", "cfpb", "ameritas", "banking"],
    "Transportation and operations": ["transportation", "operational", "thales"],
    "Consumer protection": ["consumer complaint", "cfpb", "consumer protection"],
    "Education": ["taught", "teaching", "university", "mentor"],
  };

  return aliases[requirement] ?? [requirement];
}

function getEvidenceLevel(
  requirement: string,
  category: RequirementEvidence["category"],
): RequirementEvidenceLevel {
  const patterns = getRequirementPatterns(requirement);

  if (patterns.some((pattern) => candidateDemonstratedSearchable.includes(normalize(pattern)))) {
    return "DEMONSTRATED";
  }

  if (patterns.some((pattern) => candidateExposureSearchable.includes(normalize(pattern)))) {
    return "EXPOSURE";
  }

  if (category === "DOMAIN") return "TRANSFERABLE";
  return "UNSUPPORTED";
}

function getEvidenceWeight(level: RequirementEvidenceLevel) {
  if (level === "DEMONSTRATED") return 1;
  if (level === "TRANSFERABLE") return 0.65;
  if (level === "EXPOSURE") return 0.4;
  return 0;
}

function extractRequiredYears(sentences: string[]) {
  const candidates: number[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase();
    if (!normalized.includes("year") || !normalized.includes("experience")) continue;

    for (const match of normalized.matchAll(/(?:minimum(?: of)?|at least|requires?|required|must have|with)?\s*(\d{1,2})\+?\s*(?:-|to\s+\d{1,2}\s*)?years?(?:\s+of)?\s+(?:[a-z-]+\s+){0,4}experience/g)) {
      const years = Number.parseInt(match[1], 10);
      if (years > 0 && years <= 20) candidates.push(years);
    }
  }

  return candidates.length > 0 ? Math.max(...candidates) : null;
}

function extractSeniorityRequirements(sentences: string[], requiredYears: number | null) {
  const selected = sentences.filter((sentence) => {
    const normalized = sentence.toLowerCase();
    return normalized.includes("years of experience") || normalized.includes("years experience") || normalized.includes("senior level");
  });

  if (selected.length > 0) return selected.slice(0, 3);
  return requiredYears ? [`${requiredYears}+ years of relevant experience`] : [];
}

function buildHardGates(searchable: string, requiredYears: number | null, timing: PostingTiming, family: JobFamily): HardGate[] {
  const gates: HardGate[] = [];
  const candidateYears = candidateYearsByFamily[family];
  const yearLabel = `${candidateYears} year${candidateYears === 1 ? "" : "s"}`;

  if (requiredYears !== null) {
    gates.push({
      label: "Required experience",
      status: requiredYears > candidateYears + 2 ? "NOT_MET" : requiredYears > candidateYears ? "REVIEW" : "MET",
      detail: `Posting requires ${requiredYears}+ years; verified profile supports approximately ${yearLabel} in the ${getJobFamilyLabel(family).toLowerCase()} family.`,
    });
  }

  if (searchable.includes("security clearance") || searchable.includes("active clearance")) {
    gates.push({ label: "Security clearance", status: "REVIEW", detail: "A clearance requirement was detected and must be confirmed manually." });
  }

  if (searchable.includes("certification required") || searchable.includes("required certification")) {
    gates.push({ label: "Required certification", status: "REVIEW", detail: "A mandatory certification signal was detected; confirm the exact credential." });
  }

  if (timing.urgency === "EXPIRED") {
    gates.push({ label: "Application deadline", status: "NOT_MET", detail: `The listed closing date was ${timing.closingDate}.` });
  }

  return gates;
}

function buildEvidenceMap(
  technical: string[],
  functional: string[],
  domain: string[],
  seniority: string[],
  requiredYears: number | null,
  family: JobFamily,
): RequirementEvidence[] {
  const rows: RequirementEvidence[] = [];

  for (const [category, requirements] of [
    ["TECHNICAL", technical],
    ["FUNCTIONAL", functional],
    ["DOMAIN", domain],
  ] as const) {
    for (const requirement of requirements.slice(0, 5)) {
      const level = getEvidenceLevel(requirement, category);
      rows.push({
        requirement,
        category,
        level,
        evidence: level === "DEMONSTRATED"
          ? "Verified in experience highlights or portfolio projects."
          : level === "EXPOSURE"
            ? "Listed in the verified skill set, but professional or project evidence is limited."
            : level === "TRANSFERABLE"
              ? "Analytical methods may transfer, but direct domain evidence is limited."
              : "No verified evidence found.",
      });
    }
  }

  if (seniority.length > 0) {
    const candidateYears = candidateYearsByFamily[family];
    rows.push({
      requirement: seniority[0],
      category: "SENIORITY",
      level: requiredYears !== null && requiredYears <= candidateYears ? "DEMONSTRATED" : "UNSUPPORTED",
      evidence: "Compare the required years with the work-family estimate shown in the seniority dimension.",
    });
  }

  return rows;
}

function extractEmployerProblems(sentences: string[], functionalRequirements: string[]) {
  const actionSignals = ["analy", "build", "develop", "improve", "report", "manage", "support", "identify", "create", "maintain", "collaborate"];
  const selected = sentences
    .filter((sentence) => actionSignals.some((signal) => sentence.toLowerCase().includes(signal)))
    .filter((sentence) => sentence.length >= 45 && sentence.length <= 240)
    .slice(0, 5);

  if (selected.length > 0) return selected;
  return functionalRequirements.slice(0, 5).map((requirement) => `Deliver ${requirement.toLowerCase()} outcomes.`);
}

function analyzePostingTiming(postedValue?: string, closingValue?: string, sentences: string[] = []): PostingTiming {
  const postedDate = normalizeDate(postedValue);
  const closingDate = normalizeDate(closingValue) || extractClosingDate(sentences);
  const today = startOfDay(new Date());
  const posted = parseDate(postedDate);
  const closing = parseDate(closingDate);
  const ageDays = posted ? dayDifference(today, posted) : null;
  const daysRemaining = closing ? dayDifference(closing, today) : null;
  let urgency: PostingTiming["urgency"] = "UNKNOWN";

  if (daysRemaining !== null && daysRemaining < 0) urgency = "EXPIRED";
  else if (daysRemaining !== null && daysRemaining <= 5) urgency = "CLOSING_SOON";
  else if (ageDays !== null && ageDays <= 7) urgency = "FRESH";
  else if (ageDays !== null && ageDays > 45) urgency = "STALE";
  else if (ageDays !== null || daysRemaining !== null) urgency = "STANDARD";

  const label = urgency === "CLOSING_SOON"
    ? `Closes in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
    : urgency === "FRESH"
      ? `Posted ${ageDays} day${ageDays === 1 ? "" : "s"} ago`
      : urgency === "STALE"
        ? `Posted ${ageDays} days ago; verify freshness`
        : urgency === "EXPIRED"
          ? "Listed closing date has passed"
          : closingDate
            ? `Closes ${closingDate}`
            : postedDate
              ? `Posted ${postedDate}`
              : "Posting date unavailable";

  return { postedDate, closingDate, ageDays, daysRemaining, urgency, label };
}

function extractClosingDate(sentences: string[]) {
  for (const sentence of sentences) {
    const match = sentence.match(/(?:closing date|application deadline|apply by)\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (match?.[1]) return normalizeDate(match[1]);
  }
  return "";
}

function getRecommendation(score: number, hasBlockingGate: boolean): FitRecommendation {
  if (hasBlockingGate || score < 55) return "PASS";
  if (score >= 78) return "STRONG_FIT";
  return "REVIEW";
}

function getSuggestedPassReason(
  hardGates: HardGate[],
  technical: FitDimension,
  functional: FitDimension,
  family: JobFamily,
): JobRequirementAnalysis["suggestedPassReason"] {
  if (hardGates.some((gate) => gate.label === "Required experience" && gate.status === "NOT_MET")) return "TOO_SENIOR";
  if (technical.score < 45) return "SKILL_GAP";
  if (family === "OTHER" || functional.score < 40) return "ROLE_MISMATCH";
  return null;
}

function buildRecommendationReason(
  recommendation: FitRecommendation,
  hardGates: HardGate[],
  technical: FitDimension,
  functional: FitDimension,
  family: JobFamily,
) {
  const blockingGate = hardGates.find((gate) => gate.status === "NOT_MET");
  if (blockingGate) return `${blockingGate.label}: ${blockingGate.detail}`;
  if (family === "OTHER") return "The posting's primary work does not align with the current analytics, data, business analysis, or teaching search families.";
  if (recommendation === "STRONG_FIT") return `Strong ${getJobFamilyLabel(family).toLowerCase()} alignment with demonstrated technical and functional evidence.`;
  if (technical.score < 55) return `Review core technical gaps: ${technical.gaps.slice(0, 3).join(", ")}.`;
  if (functional.score < 55) return `Review responsibility alignment: ${functional.gaps.slice(0, 3).join(", ")}.`;
  return "Promising transferable fit; review domain and preferred qualifications before creating the PR.";
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+|\s+[•·]\s+|\n+/)
    .map(cleanText)
    .filter((sentence) => sentence.length >= 25 && sentence.length <= 500);
}

function cleanText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return ` ${value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

function normalizeDate(value?: string) {
  if (!value?.trim()) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDifference(later: Date, earlier: Date) {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}
