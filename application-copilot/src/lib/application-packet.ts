import profile from "@/data/profile.json";
import answerStyle from "@/data/answer-style.json";
import { generateResumeDocx } from "@/lib/resume-docx";

type ApplicationDraft = {
  company: string;
  role: string;
  location: string;
  source: string;
  jobUrl: string;
  matchScore: number;
  notes: string;
  createdAt: string;
};

type EvidenceMatchLevel = "direct" | "transferable";

type EvidenceDefinition = {
  aliases: string[];
  category: "capability" | "domain" | "tool";
  evidence: string;
  label: string;
  matchLevel?: EvidenceMatchLevel;
  resumeTerm?: string;
  sources: string[];
};

type EvidenceMatch = EvidenceDefinition & {
  jobTerms: string[];
  matchLevel: EvidenceMatchLevel;
};

const explicitEvidenceDefinitions: EvidenceDefinition[] = [
  {
    label: "SQL",
    aliases: ["sql", "structured query language"],
    category: "tool",
    evidence: "Used SQL for exploratory analysis, operational troubleshooting, data validation, and reporting.",
    sources: ["Dallas Data Science Academy", "Thales Group", "University of Nebraska-Lincoln"],
  },
  {
    label: "Python",
    aliases: ["python"],
    category: "tool",
    evidence: "Built analytical workflows and used Python for modeling, data preparation, teaching, and operational analysis.",
    sources: ["Dallas Data Science Academy", "Thales Group", "University of Nebraska-Lincoln", "Benedict College"],
  },
  {
    label: "Excel",
    aliases: ["excel", "microsoft excel", "spreadsheets"],
    category: "tool",
    evidence: "Used Excel in business and research analysis workflows and reporting.",
    sources: ["Dallas Data Science Academy", "University of Nebraska-Lincoln"],
  },
  {
    label: "Power BI",
    aliases: ["power bi", "powerbi"],
    category: "tool",
    evidence: "Developed KPI reporting and dashboard work using Power BI.",
    sources: ["Dallas Data Science Academy"],
  },
  {
    label: "Tableau",
    aliases: ["tableau"],
    category: "tool",
    evidence: "Designed dashboards that communicated trends, forecasts, and KPIs to non-technical stakeholders.",
    sources: ["Dallas Data Science Academy", "Tableau Dashboards portfolio project"],
  },
  {
    label: "Dashboard Development",
    aliases: ["dashboard", "dashboards", "data visualization", "visualization"],
    category: "capability",
    evidence: "Built KPI, trend, and forecast dashboards for business-facing and non-technical audiences.",
    sources: ["Dallas Data Science Academy", "Tableau Dashboards portfolio project"],
  },
  {
    label: "KPI Reporting",
    aliases: ["kpi", "kpis", "performance metrics", "performance reporting", "metrics reporting"],
    category: "capability",
    evidence: "Developed KPI-oriented dashboards and reporting summaries to make performance patterns easier to use.",
    sources: ["Dallas Data Science Academy", "Tableau Dashboards portfolio project"],
  },
  {
    label: "Reporting",
    aliases: ["reporting", "reports", "analytical summaries", "technical reports"],
    category: "capability",
    evidence: "Prepared dashboards, analytical summaries, presentations, and technical reports for business, research, and operational decisions.",
    sources: ["Dallas Data Science Academy", "Thales Group", "University of Nebraska-Lincoln"],
  },
  {
    label: "Trend Analysis",
    aliases: ["trend analysis", "trends", "pattern analysis"],
    category: "capability",
    evidence: "Conducted trend analysis across business, research, financial, and operational datasets.",
    sources: ["Dallas Data Science Academy", "University of Nebraska-Lincoln", "CFPB Consumer Complaint Analytics"],
  },
  {
    label: "Data Validation",
    aliases: ["data validation", "validation", "quality assurance", "qa checks"],
    category: "capability",
    evidence: "Performed structured validation, quality checks, and troubleshooting across operational and research datasets.",
    sources: ["Thales Group", "University of Nebraska-Lincoln"],
  },
  {
    label: "Data Quality",
    aliases: ["data quality", "data integrity", "data accuracy", "quality checks"],
    category: "capability",
    evidence: "Improved processing and reporting reliability through structured cleaning, validation, and quality checks.",
    sources: ["Thales Group", "University of Nebraska-Lincoln"],
  },
  {
    label: "Process Improvement",
    aliases: ["process improvement", "continuous improvement", "streamline", "efficiency improvement"],
    category: "capability",
    evidence: "Improved data processing efficiency by 30% and supported operational issue resolution and reliability improvements.",
    sources: ["University of Nebraska-Lincoln", "Thales Group"],
  },
  {
    label: "Stakeholder Communication",
    aliases: ["stakeholder", "stakeholders", "communication", "communicate", "communicating", "presentations", "business partners"],
    category: "capability",
    evidence: "Prepared findings for faculty, business, technical, and non-technical stakeholders and mentored students on applied projects.",
    sources: ["University of Nebraska-Lincoln", "Dallas Data Science Academy", "Benedict College"],
  },
  {
    label: "Cross-functional Collaboration",
    aliases: ["cross functional", "cross-functional", "collaboration", "collaborate", "partner with"],
    category: "capability",
    evidence: "Collaborated with interdisciplinary and cross-functional teams in transportation, research, analytics, and education settings.",
    sources: ["Thales Group", "University of Nebraska-Lincoln", "Benedict College"],
  },
  {
    label: "Root Cause Analysis",
    aliases: ["root cause", "troubleshoot", "troubleshooting", "issue resolution", "problem solving"],
    category: "capability",
    evidence: "Diagnosed and resolved more than 50 system and data issues using SQL, Python, and Linux.",
    sources: ["Thales Group"],
  },
  {
    label: "Operational Analysis",
    aliases: ["operational analysis", "operations analysis", "operational performance", "system performance"],
    category: "capability",
    evidence: "Analyzed transportation system performance and operational data across more than 100 real-time sensor inputs.",
    sources: ["Thales Group"],
  },
  {
    label: "Data Pipelines",
    aliases: ["data pipeline", "data pipelines", "pipeline", "pipelines"],
    category: "capability",
    evidence: "Maintained real-time transportation data pipelines processing more than 100 sensor inputs and built analytical workflows.",
    sources: ["Thales Group", "Dallas Data Science Academy"],
  },
  {
    label: "ETL",
    aliases: ["etl", "extract transform load"],
    category: "capability",
    evidence: "Data-pipeline and data-preparation experience is transferable to ETL work, but the profile does not claim ownership of a formal ETL platform.",
    matchLevel: "transferable",
    resumeTerm: "Data Pipelines and Data Preparation",
    sources: ["Thales Group", "Dallas Data Science Academy"],
  },
  {
    label: "Forecasting",
    aliases: ["forecast", "forecasting", "time series", "time-series"],
    category: "capability",
    evidence: "Built Prophet time-series and other forecasting workflows on historical business data.",
    sources: ["Predictive Modeling & Forecasting portfolio project"],
  },
  {
    label: "Predictive Analytics",
    aliases: ["predictive", "predictive analytics", "prediction", "predictive modeling"],
    category: "capability",
    evidence: "Built regression and classification models to predict customer spend and subscription likelihood.",
    sources: ["Dallas Data Science Academy", "Customer Prediction Models portfolio project"],
  },
  {
    label: "Statistical Analysis",
    aliases: ["statistical", "statistics", "statistical analysis", "statistical modeling"],
    category: "capability",
    evidence: "Applied statistical methods, regression, classification, and model evaluation in graduate and portfolio work.",
    sources: ["University of Nebraska-Lincoln", "Predictive Modeling & Forecasting portfolio project"],
  },
  {
    label: "Machine Learning",
    aliases: ["machine learning", "ml model", "model development"],
    category: "capability",
    evidence: "Built and evaluated regression, classification, NLP, forecasting, and PyTorch-supported workflows.",
    sources: ["Dallas Data Science Academy", "Graduate and portfolio projects"],
  },
  {
    label: "Sentiment Analysis",
    aliases: ["sentiment", "sentiment analysis", "customer sentiment"],
    category: "capability",
    evidence: "Used NLTK to classify customer-review sentiment and translate outputs into business-friendly metrics.",
    sources: ["NLP Sentiment Analysis portfolio project"],
  },
  {
    label: "Customer Insights",
    aliases: ["customer insights", "consumer insights", "customer behavior", "customer analytics", "voice of customer"],
    category: "domain",
    evidence: "Analyzed customer behavior, subscription likelihood, spend, sentiment, and consumer complaint patterns.",
    sources: ["Customer Prediction Models", "NLP Sentiment Analysis", "CFPB Consumer Complaint Analytics"],
  },
  {
    label: "Demand Forecasting",
    aliases: ["demand forecast", "demand forecasting", "passenger demand", "booking behavior", "booking trends", "future booking behavior"],
    category: "domain",
    evidence: "Built time-series forecasting and customer prediction workflows using historical behavior and business data; airline passenger-demand forecasting remains transferable rather than direct experience.",
    matchLevel: "transferable",
    resumeTerm: "Forecasting and Customer Behavior Analysis",
    sources: ["Predictive Modeling & Forecasting portfolio project", "Customer Prediction Models"],
  },
  {
    label: "Revenue Performance Analysis",
    aliases: ["revenue management", "yield management", "revenue performance", "revenue metrics", "yield", "rasm", "load factor"],
    category: "domain",
    evidence: "Built KPI dashboards and predictive analyses involving customer spend, financial indicators, and operational performance; direct airline revenue-management ownership is not claimed.",
    matchLevel: "transferable",
    resumeTerm: "Performance and Financial Analytics",
    sources: ["Dallas Data Science Academy", "Customer Prediction Models", "Tableau Dashboards portfolio project"],
  },
  {
    label: "Pricing and Market Analysis",
    aliases: ["pricing strategy", "pricing actions", "fare trends", "fare structures", "market performance", "market shifts", "market positioning"],
    category: "domain",
    evidence: "Conducted financial, customer-behavior, performance, and trend analysis that transfers to pricing and market questions without claiming direct fare-pricing experience.",
    matchLevel: "transferable",
    resumeTerm: "Performance, Financial, and Market Trend Analysis",
    sources: ["Dallas Data Science Academy", "Customer Prediction Models", "Tableau Dashboards portfolio project"],
  },
  {
    label: "Customer Segmentation",
    aliases: ["customer segmentation", "segment demand", "customer segments", "willingness to pay", "segment and value customers"],
    category: "domain",
    evidence: "Built regression and classification models to support customer targeting, spend prediction, and subscription-likelihood analysis.",
    matchLevel: "transferable",
    resumeTerm: "Customer Targeting and Predictive Analytics",
    sources: ["Customer Prediction Models"],
  },
  {
    label: "Strategic Recommendations",
    aliases: ["strategic recommendations", "present recommendations", "recommend adjustments", "action plans", "communicate insights"],
    category: "capability",
    evidence: "Translated analytical findings, trends, and model outputs into recommendations and presentations for technical and non-technical stakeholders.",
    sources: ["Dallas Data Science Academy", "University of Nebraska-Lincoln", "Tableau Dashboards portfolio project"],
  },
  {
    label: "Social and Brand Insights",
    aliases: ["social insight", "social insights", "social listening", "brand protection", "brand monitoring", "brand reputation"],
    category: "domain",
    evidence: "Customer sentiment and text-analysis work is transferable to social and brand insight analysis, but does not establish direct social-listening platform experience.",
    matchLevel: "transferable",
    resumeTerm: "Sentiment Analysis and Customer Insights",
    sources: ["NLP Sentiment Analysis portfolio project"],
  },
  {
    label: "Financial Analytics",
    aliases: ["financial analytics", "financial analysis", "financial data", "financial indicators"],
    category: "domain",
    evidence: "Built a CFPB complaint analytics workflow and completed predictive work involving financial indicators.",
    sources: ["CFPB Consumer Complaint Analytics", "Dallas Data Science Academy"],
  },
  {
    label: "Public Data Analysis",
    aliases: ["public data", "public dataset", "government data", "consumer complaints", "cfpb"],
    category: "domain",
    evidence: "Built a documented analytics workflow using the real CFPB Consumer Complaint Database.",
    sources: ["CFPB Consumer Complaint Analytics"],
  },
];

export function generateApplicationPacket(application: ApplicationDraft) {
  const strengths = selectStrengths(application);
  const keywordGate = buildKeywordGate(application);
  const resumeTailoring = buildResumeTailoring(application, strengths, keywordGate);
  const questionsToVerify = getQuestionsToVerify(application);
  const locationReadiness = getLocationReadiness(application);
  const answerDrafts = {
    whyThisRole: [
      `I am interested in the ${application.role} role at ${application.company} because it matches my work across data analysis, Python, SQL, predictive modeling, and stakeholder-facing insights.`,
      strengths.primaryEvidence,
    ].join(" "),
    whyThisCompany:
      `This role appears to connect technical data work with practical business outcomes, which fits my background turning cleaned data, models, dashboards, and system findings into decisions teams can use.`,
    location:
      locationReadiness.answer,
    technicalFit: strengths.technicalFit,
    projectExamples: strengths.projectExamples,
    collaboration:
      "I have worked with technical and non-technical stakeholders through research, dashboarding, teaching, and field engineering environments.",
    standardApplicationResponses: answerStyle.standardApplicationResponses,
    formFillingRules: answerStyle.formFillingRules,
    resumeFormatProfile: answerStyle.resumeFormatProfile,
    notesForReview: application.notes || "No extra notes provided.",
    questionsToVerify,
    profileEvidenceUsed: strengths.evidenceUsed,
    keywordGate,
  };

  return {
    answers: JSON.stringify(answerDrafts, null, 2),
    coverLetter: buildCoverLetter(application, strengths, keywordGate),
    checklist: buildChecklist(application, questionsToVerify, locationReadiness),
    keywordReport: buildKeywordReport(application, keywordGate),
    reviewNotes: buildReviewNotes(application, strengths, questionsToVerify, keywordGate, locationReadiness),
    tailoredResume: resumeTailoring,
    tailoredResumeDocx: generateResumeDocx(resumeTailoring),
    answerStyle: JSON.stringify(answerStyle, null, 2),
  };
}

function selectStrengths(application: ApplicationDraft) {
  const searchable = `${application.role} ${application.notes} ${application.source}`.toLowerCase();
  const normalizedSearchable = normalizeKeywordText(searchable);
  const roleFamily = classifyRoleTitle(application.role);
  const evidenceUsed = new Set<string>();
  const technicalFit = new Set<string>();
  const projectExamples: string[] = [];

  addEvidence("Python, SQL, EDA, data cleaning, feature engineering, and statistical modeling.", evidenceUsed, technicalFit);

  if (
    roleFamily === "engineering" ||
    containsNormalizedPhrase(normalizedSearchable, "big data") ||
    containsNormalizedPhrase(normalizedSearchable, "data ai")
  ) {
    addEvidence(
      "Maintained real-time transportation data pipelines processing 100+ sensor inputs and resolved 50+ system/data issues with SQL, Python, and Linux.",
      evidenceUsed,
      technicalFit,
    );
    addEvidence("Data pipeline, data validation, Azure, Databricks, Snowflake, and Linux exposure.", evidenceUsed, technicalFit);
  }

  if (
    roleFamily === "data-science" ||
    containsNormalizedPhrase(normalizedSearchable, "ai") ||
    containsNormalizedPhrase(normalizedSearchable, "machine learning") ||
    containsNormalizedPhrase(normalizedSearchable, "artificial intelligence")
  ) {
    addEvidence("Regression, classification, time series forecasting, NLP, model evaluation, and predictive analytics.", evidenceUsed, technicalFit);
    projectExamples.push("Predictive Modeling & Forecasting: regression, classification, and Prophet time-series modeling in Python.");
    projectExamples.push("NLP Sentiment Analysis: NLTK-based sentiment classification translated into business-friendly metrics.");
  }

  if (searchable.includes("analyst") || searchable.includes("analytics") || searchable.includes("business")) {
    addEvidence("SQL exploratory analysis, data quality checks, dashboards, and business-facing data storytelling.", evidenceUsed, technicalFit);
    projectExamples.push("Tableau Dashboards: KPI, trend, and forecast dashboards for non-technical stakeholders.");
  }

  if (
    searchable.includes("financial") ||
    searchable.includes("bank") ||
    searchable.includes("credit") ||
    searchable.includes("consumer") ||
    searchable.includes("complaint") ||
    searchable.includes("risk")
  ) {
    addEvidence(
      "Built a CFPB consumer complaint analytics workflow using Python, SQL, SQLite, and dashboard metrics to analyze financial product trends, response outcomes, and Texas complaint patterns.",
      evidenceUsed,
      technicalFit,
    );
    projectExamples.push("CFPB Consumer Complaint Analytics: Python, SQL, SQLite, dashboard metrics, and responsible public-data interpretation.");
  }

  if (searchable.includes("adjunct") || searchable.includes("professor") || searchable.includes("teaching")) {
    addEvidence("Taught Python fundamentals and mentored students on applied analytics and chatbot projects.", evidenceUsed, technicalFit);
  }

  if (projectExamples.length === 0) {
    projectExamples.push("Predictive Modeling & Forecasting: Python-based regression, classification, and time-series projects.");
    projectExamples.push("Tableau Dashboards: stakeholder-ready dashboards for trends, forecasts, and KPIs.");
  }

  return {
    primaryEvidence:
      Array.from(evidenceUsed)[0] ??
      "My experience includes Python, SQL, machine learning, dashboards, data cleaning, and stakeholder communication.",
    technicalFit: Array.from(technicalFit).join(" "),
    projectExamples,
    evidenceUsed: Array.from(evidenceUsed),
  };
}

function addEvidence(value: string, evidenceUsed: Set<string>, technicalFit: Set<string>) {
  evidenceUsed.add(value);
  technicalFit.add(value);
}

function buildKeywordGate(application: ApplicationDraft) {
  const searchable = normalizeKeywordText(`${application.role} ${application.notes} ${application.source} ${application.jobUrl}`);
  const evidenceMatches = getEvidenceMatches(application, searchable);
  const matchedAliases = new Set(
    evidenceMatches.flatMap((match) => [match.label, match.resumeTerm, ...match.aliases].filter(Boolean).map((value) => normalizeKeywordText(value!))),
  );
  const detectedCandidates = getCandidateKeywords().filter((keyword) => containsNormalizedPhrase(searchable, keyword.normalized));
  const heldBackKeywords = detectedCandidates
    .filter((keyword) => !matchedAliases.has(keyword.normalized))
    .map((keyword) => keyword.label);
  const directMatches = evidenceMatches.filter((match) => match.matchLevel === "direct");
  const transferableMatches = evidenceMatches.filter((match) => match.matchLevel === "transferable");
  const verifiedKeywords = directMatches.map((match) => match.resumeTerm ?? match.label);
  const relatedKeywords = transferableMatches.map((match) => match.resumeTerm ?? match.label);
  const detectedKeywords = [
    ...evidenceMatches.map((match) => match.label),
    ...detectedCandidates.map((keyword) => keyword.label),
  ];
  const uniqueVerifiedKeywords = Array.from(new Set(verifiedKeywords));
  const uniqueRelatedKeywords = Array.from(new Set(relatedKeywords));
  const uniqueHeldBackKeywords = Array.from(new Set(heldBackKeywords));
  const uniqueDetectedKeywords = Array.from(new Set(detectedKeywords));
  const coveragePercent =
    uniqueDetectedKeywords.length > 0
      ? Math.round(((uniqueVerifiedKeywords.length + uniqueRelatedKeywords.length * 0.5) / uniqueDetectedKeywords.length) * 100)
      : 100;

  return {
    detectedKeywords: uniqueDetectedKeywords,
    evidenceMatches,
    verifiedKeywords: uniqueVerifiedKeywords,
    relatedKeywords: uniqueRelatedKeywords,
    heldBackKeywords: uniqueHeldBackKeywords,
    coveragePercent,
  };
}

function getEvidenceMatches(application: ApplicationDraft, searchable: string): EvidenceMatch[] {
  const definitions = getEvidenceDefinitions();

  return definitions
    .map((definition) => {
      const jobTerms = definition.aliases.filter((alias) =>
        containsNormalizedPhrase(searchable, normalizeKeywordText(alias)),
      );

      return {
        ...definition,
        jobTerms,
        matchLevel: definition.matchLevel ?? "direct",
      };
    })
    .filter((match) => match.jobTerms.length > 0)
    .sort((left, right) => scoreEvidenceMatch(right, application) - scoreEvidenceMatch(left, application));
}

function getEvidenceDefinitions() {
  const explicitTerms = new Set(
    explicitEvidenceDefinitions.flatMap((definition) =>
      [definition.label, ...definition.aliases].map((value) => normalizeKeywordText(value)),
    ),
  );
  const profileSkillDefinitions: EvidenceDefinition[] = Object.values(profile.skills)
    .flat()
    .filter((skill) => !explicitTerms.has(normalizeKeywordText(skill)))
    .map((skill) => ({
      label: skill,
      aliases: [skill],
      category: "tool" as const,
      evidence: `${skill} is listed in the reviewed candidate profile. Confirm the strongest project or work example before discussing depth.`,
      sources: ["Verified candidate profile skills"],
    }));

  return [...explicitEvidenceDefinitions, ...profileSkillDefinitions];
}

function scoreEvidenceMatch(match: EvidenceMatch, application: ApplicationDraft) {
  const role = normalizeKeywordText(application.role);
  const notes = normalizeKeywordText(application.notes);
  const roleScore = match.aliases.some((alias) => containsNormalizedPhrase(role, normalizeKeywordText(alias))) ? 8 : 0;
  const noteScore = match.jobTerms.reduce(
    (score, term) => score + countNormalizedPhrase(notes, normalizeKeywordText(term)) * 2,
    0,
  );
  const directScore = match.matchLevel === "direct" ? 2 : 0;

  return roleScore + noteScore + directScore;
}

function containsNormalizedPhrase(searchable: string, phrase: string) {
  if (!phrase) return false;

  return ` ${searchable} `.includes(` ${phrase} `);
}

function countNormalizedPhrase(searchable: string, phrase: string) {
  if (!phrase) return 0;

  return ` ${searchable} `.split(` ${phrase} `).length - 1;
}

function getCandidateKeywords() {
  const profileSkills = Object.values(profile.skills).flat().map((skill) => ({
    label: skill,
    normalized: normalizeKeywordText(skill),
  }));
  const watchlist = [
    "AWS",
    "GCP",
    "TensorFlow",
    "PyTorch",
    "Spark",
    "Hadoop",
    "Kafka",
    "Airflow",
    "dbt",
    "SAS",
    "Looker",
    "Alteryx",
    "Power Automate",
    "LangChain",
    "LLM",
    "MLOps",
    "Docker",
    "Kubernetes",
    "NoSQL",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Oracle",
    "Salesforce",
    "Workday",
    "Financial regulations",
    "CCAR",
    "CECL",
    "SR 11-7",
    "CFPB",
    "Consumer complaints",
    "Public data",
    "Financial analytics",
    "ATPCO",
    "Diio",
    "Sabre",
    "Fare filing",
    "Inventory controls",
    "Bid price",
    "Post-implementation analysis",
    "Competitive pricing",
    "Competitive landscape",
    "Economic game theory",
  ].map((keyword) => ({
    label: keyword,
    normalized: normalizeKeywordText(keyword),
  }));

  return Array.from(
    new Map([...profileSkills, ...watchlist].map((keyword) => [keyword.normalized, keyword])).values(),
  ).filter((keyword) => keyword.normalized.length > 2);
}

function normalizeKeywordText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type RoleFamily = "analyst" | "business-analysis" | "data-science" | "education" | "engineering" | "revenue-analysis";

function classifyRoleTitle(role: string): RoleFamily {
  const normalizedRole = normalizeKeywordText(role);

  if (
    ["revenue management", "yield management", "pricing analyst", "revenue analyst", "pricing and yield"].some((term) =>
      containsNormalizedPhrase(normalizedRole, normalizeKeywordText(term)),
    )
  ) {
    return "revenue-analysis";
  }

  if (
    containsNormalizedPhrase(normalizedRole, "data scientist") ||
    containsNormalizedPhrase(normalizedRole, "machine learning scientist") ||
    containsNormalizedPhrase(normalizedRole, "applied scientist")
  ) {
    return "data-science";
  }

  if (
    containsNormalizedPhrase(normalizedRole, "business analyst") ||
    containsNormalizedPhrase(normalizedRole, "business analytics")
  ) {
    return "business-analysis";
  }

  if (
    (containsNormalizedPhrase(normalizedRole, "engineer") ||
      containsNormalizedPhrase(normalizedRole, "engineering") ||
      containsNormalizedPhrase(normalizedRole, "data solutions")) &&
    !containsNormalizedPhrase(normalizedRole, "analyst")
  ) {
    return "engineering";
  }

  if (
    containsNormalizedPhrase(normalizedRole, "professor") ||
    containsNormalizedPhrase(normalizedRole, "adjunct") ||
    containsNormalizedPhrase(normalizedRole, "instructor") ||
    containsNormalizedPhrase(normalizedRole, "lecturer")
  ) {
    return "education";
  }

  return "analyst";
}

function getLocationReadiness(application: ApplicationDraft) {
  const location = application.location || "";
  const searchable = `${application.location} ${application.notes}`.toLowerCase();

  if (searchable.includes("remote")) {
    return {
      answer:
        `I am based in ${profile.location} and am comfortable supporting remote work with clear communication, availability, and collaboration expectations.`,
      coverLetter:
        `I am based in ${profile.location} and am comfortable supporting a remote role with clear communication and availability expectations.`,
      resumeLine: "",
      reviewQuestion: "Confirm remote schedule, time zone expectations, and communication requirements.",
      reviewRequired: true,
      summary: "Remote role: candidate is Dallas-based and open to remote work with clear availability expectations.",
    };
  }

  if (isDfwLocation(searchable)) {
    return {
      answer:
        `I am based in ${profile.location} and am focused on Dallas-Fort Worth opportunities, including ${location || "this location"}.`,
      coverLetter: "",
      resumeLine: "",
      reviewQuestion: "Confirm commute, hybrid/on-site days, and office location.",
      reviewRequired: false,
      summary: "Dallas-Fort Worth role: location aligns with current Dallas-area search.",
    };
  }

  if (isTexasLocation(searchable)) {
    return {
      answer:
        `I am currently based in ${profile.location} and understand this role is based in ${location}. I am open to discussing relocation, regular commute, or travel arrangements for the right opportunity.`,
      coverLetter:
        `I am currently based in ${profile.location} and understand this role is based in ${location}. I am open to discussing relocation, regular commute, or travel arrangements if selected.`,
      resumeLine: `Dallas, TX | Open to relocation/commute within Texas for the right role`,
      reviewQuestion: `Confirm commute, relocation, or travel expectations for ${location}.`,
      reviewRequired: true,
      summary: `Texas outside DFW: candidate is Dallas-based and open to discussing relocation, regular commute, or travel arrangements for ${location}.`,
    };
  }

  return {
    answer:
      `I am currently based in ${profile.location}. I would want to confirm relocation, travel, or remote-work expectations before final submission for ${location || "this role"}.`,
    coverLetter:
      `I am currently based in ${profile.location} and would be glad to discuss relocation, travel, or remote-work expectations for this opportunity.`,
    resumeLine: "",
    reviewQuestion: `Confirm whether ${location || "this location"} is realistic for relocation, travel, or remote work before submitting.`,
    reviewRequired: true,
    summary: `Outside preferred search area: review relocation, travel, or remote-work fit before submission.`,
  };
}

function isDfwLocation(value: string) {
  return ["dallas", "irving", "plano", "richardson", "arlington", "frisco", "fort worth", "farmers branch"].some((city) =>
    value.includes(city),
  );
}

function isTexasLocation(value: string) {
  return ["tx", "texas", "waco", "austin", "houston", "san antonio", "mckinney", "denton", "garland"].some((location) =>
    value.includes(location),
  );
}

function getQuestionsToVerify(application: ApplicationDraft) {
  const questions = [
    "Confirm the role is still live before final submission.",
    "Confirm required years of experience and seniority expectations.",
    "Confirm work location, hybrid/on-site expectations, and commute fit.",
  ];
  const searchable = `${application.role} ${application.notes}`.toLowerCase();
  const normalizedSearchable = normalizeKeywordText(searchable);
  const roleFamily = classifyRoleTitle(application.role);
  const locationReadiness = getLocationReadiness(application);

  if (locationReadiness.reviewRequired) {
    questions.push(locationReadiness.reviewQuestion);
  }

  if (roleFamily === "engineering" || containsNormalizedPhrase(normalizedSearchable, "big data")) {
    questions.push("Confirm depth required for production big-data tooling, cloud services, and distributed systems.");
  }

  if (
    roleFamily === "data-science" ||
    containsNormalizedPhrase(normalizedSearchable, "ai") ||
    containsNormalizedPhrase(normalizedSearchable, "machine learning")
  ) {
    questions.push("Confirm whether the role expects production ML/AI ownership or analytics/modeling support.");
  }

  if (searchable.includes("adjunct") || searchable.includes("professor")) {
    questions.push("Confirm teaching schedule, course format, and required teaching documentation.");
  }

  return questions;
}

function isAnalystReportingRole(application: ApplicationDraft) {
  const searchable = `${application.company} ${application.role} ${application.notes} ${application.source}`.toLowerCase();

  return [
    "analyst",
    "analytics",
    "reporting",
    "performance",
    "benefits",
    "contact center",
    "operations",
    "business intelligence",
    "dashboard",
    "kpi",
  ].some((signal) => searchable.includes(signal));
}

function isAmericanAirlinesStyleRole(application: ApplicationDraft) {
  const searchable = `${application.company} ${application.role} ${application.notes} ${application.source}`.toLowerCase();

  return (
    searchable.includes("american airlines") ||
    searchable.includes("jobs.aa.com") ||
    searchable.includes("airline") ||
    searchable.includes("transportation")
  );
}

function buildCoverLetter(
  application: ApplicationDraft,
  strengths: ReturnType<typeof selectStrengths>,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const portfolioCaseStudy = getPortfolioCaseStudy(application);
  const locationReadiness = getLocationReadiness(application);
  const useAnalystTone = isAnalystReportingRole(application);
  const roleSignals = getRoleSignalLabels(keywordGate, 4);
  const evidenceExamples = [...keywordGate.evidenceMatches]
    .filter((match) => match.matchLevel === "direct")
    .sort((left, right) => scoreCoverLetterEvidence(right) - scoreCoverLetterEvidence(left))
    .slice(0, 2);
  const transportationBridge = isAmericanAirlinesStyleRole(application)
    ? " Working within a highly regulated transportation environment taught me the importance of accuracy, accountability, timely reporting, and cross-functional communication."
    : "";

  if (useAnalystTone) {
    return `# ${application.company} - ${application.role}

Dear Hiring Manager,

I am excited to apply for the ${application.role} position with ${application.company}. As a Business Analytics professional with graduate-level education in Computer Science and Information Systems & Business Analytics, I have built a strong foundation in transforming operational and business data into meaningful insights. My experience includes using SQL, Python, Excel, Tableau, and Power BI to improve reporting, analyze performance, validate data, and support data-driven decision making.

${roleSignals.length > 0 ? `The position's emphasis on ${formatNaturalList(roleSignals)} is especially relevant to my background. ${evidenceExamples.map((match) => match.evidence).join(" ")}` : ""}

Most recently, I have completed business analytics and data science projects where I designed reporting workflows, developed KPI-focused dashboards, conducted trend analysis, and presented recommendations to technical and non-technical stakeholders. These experiences strengthened my ability to communicate analytical findings in ways that support business strategy and operational improvement.

Previously, as a Field Engineer with Thales Group, I analyzed operational transportation data, investigated system performance issues, validated critical datasets, and collaborated with cross-functional teams to support reliable operations.${transportationBridge}

In addition to my industry experience, my work in higher education has allowed me to mentor students, coordinate research initiatives, and collaborate with faculty on AI and analytics projects. These experiences strengthened my communication skills while reinforcing my interest in using data to solve organizational challenges.

What excites me most about ${application.company} is the opportunity to apply my analytical background to support meaningful reporting, performance analysis, and process improvement. I enjoy identifying trends, improving reporting processes, and helping business leaders make informed decisions using reliable data. I am confident my combination of technical skills, business analytics training, and collaborative approach would allow me to contribute effectively to this role.

${locationReadiness.coverLetter}

Thank you for your time and consideration. I would welcome the opportunity to discuss how my background aligns with the needs of ${application.company}.

Sincerely,
${profile.name}
`;
  }

  return `# ${application.company} - ${application.role}

Dear Hiring Team,

I am interested in the ${application.role} role at ${application.company}. I am based in ${profile.location}, and this opportunity aligns with my focus on data science, analytics, data engineering, business analysis, and practical stakeholder-facing problem solving.

My background includes ${strengths.primaryEvidence} I approach data work the way I present projects in my portfolio: start with the business question, build a clean analytical workflow, then translate findings into decisions a technical or non-technical audience can use.

One relevant example is ${portfolioCaseStudy.coverLetterExample} Another is my field engineering work maintaining real-time transportation data pipelines and resolving data/system issues using SQL, Python, and Linux.

I would bring a practical mix of technical execution, business communication, and teaching/mentoring experience to this role.

${locationReadiness.coverLetter}

Thank you for your consideration.

${profile.name}
${profile.links.linkedin}
${profile.links.github}
${profile.links.portfolio}
`;
}

function getRoleSignalLabels(keywordGate: ReturnType<typeof buildKeywordGate>, limit: number) {
  return dedupeResumeTerms(keywordGate.evidenceMatches.map((match) => match.resumeTerm ?? match.label)).slice(0, limit);
}

function scoreCoverLetterEvidence(match: EvidenceMatch) {
  const projectScore = match.sources.some((source) => source.toLowerCase().includes("project")) ? 6 : 0;
  const specificityScore = /\d/.test(match.evidence) ? 3 : 0;
  const categoryScore = match.category === "domain" ? 4 : match.category === "capability" ? 2 : 0;

  return projectScore + specificityScore + categoryScore;
}

function formatNaturalList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function dedupeResumeTerms(values: string[]) {
  return values.reduce<string[]>((terms, value) => {
    const normalizedValue = normalizeKeywordText(value);
    const broaderTermIndex = terms.findIndex((term) =>
      containsNormalizedPhrase(normalizeKeywordText(term), normalizedValue),
    );

    if (broaderTermIndex >= 0) return terms;

    return [
      ...terms.filter(
        (term) => !containsNormalizedPhrase(normalizedValue, normalizeKeywordText(term)),
      ),
      value,
    ];
  }, []);
}

function buildChecklist(
  application: ApplicationDraft,
  questionsToVerify: string[],
  locationReadiness: ReturnType<typeof getLocationReadiness>,
) {
  return `# Review Checklist

- [ ] Confirm role, company, and location.
- [ ] Confirm job URL and source.
- [ ] Review seniority, salary, and work-location expectations.
- [ ] Review tailored resume draft for truthful emphasis.
- [ ] Review generated answers for accuracy.
- [ ] Review cover letter tone and examples.
- [ ] Confirm no claims go beyond the resume/profile evidence.
- [ ] Review location readiness statement for accuracy.
- [ ] Approve this pull request before final submission.

## Questions To Verify

${questionsToVerify.map((question) => `- [ ] ${question}`).join("\n")}

## Job

- Company: ${application.company}
- Role: ${application.role}
- Location: ${application.location}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}
- Match score: ${application.matchScore}%
- Location readiness: ${locationReadiness.summary}
`;
}

function buildKeywordReport(application: ApplicationDraft, keywordGate: ReturnType<typeof buildKeywordGate>) {
  const evidenceRows = keywordGate.evidenceMatches.map((match) => {
    const status = match.matchLevel === "direct" ? "Supported" : "Transferable";
    const resumeTerm = match.resumeTerm ?? match.label;

    return `| ${match.jobTerms.join(", ")} | ${status} | ${resumeTerm} | ${match.evidence} | ${match.sources.join("; ")} |`;
  });

  return `# Keyword Match Report

This report explains which role keywords were allowed into the application packet and which were held back for human review.

## Job

- Company: ${application.company}
- Role: ${application.role}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}

## Verified Keywords Included

${keywordGate.verifiedKeywords.length > 0 ? keywordGate.verifiedKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- None detected"}

## Related Experience Used Carefully

${keywordGate.relatedKeywords.length > 0 ? keywordGate.relatedKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- None detected"}

## Detected But Held Back

${keywordGate.heldBackKeywords.length > 0 ? keywordGate.heldBackKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- None"}

## Evidence Map

| Job wording | Status | Resume wording | Supporting evidence | Source |
| --- | --- | --- | --- | --- |
${evidenceRows.length > 0 ? evidenceRows.join("\n") : "| None detected | Review needed | None | The posting did not provide enough readable detail. | Job URL analysis |"}

## Coverage

- Detected job keywords: ${keywordGate.detectedKeywords.length}
- Verified keyword matches: ${keywordGate.verifiedKeywords.length}
- Transferable keyword matches: ${keywordGate.relatedKeywords.length}
- Coverage: ${keywordGate.coveragePercent}%

## Notes

- Supported terms may be used directly because the profile contains concrete evidence.
- Transferable terms use narrower resume wording and must not imply direct platform or domain experience.
- Held-back keywords should not be added to the resume unless you can truthfully defend them in an interview.
- If a held-back keyword is a tool you have used, add it to the approved profile evidence before generating the next packet.
- If a held-back keyword is only adjacent to your experience, keep it in review notes or learning gaps instead of the resume.
`;
}

function buildReviewNotes(
  application: ApplicationDraft,
  strengths: ReturnType<typeof selectStrengths>,
  questionsToVerify: string[],
  keywordGate: ReturnType<typeof buildKeywordGate>,
  locationReadiness: ReturnType<typeof getLocationReadiness>,
) {
  return `# Transparent Review Notes

This packet was generated from the local profile and resume-derived evidence. Review these notes before approving the PR.

## Evidence Used

${strengths.evidenceUsed.map((item) => `- ${item}`).join("\n")}

## Truthful Keyword Gate

- Verified keywords included: ${keywordGate.verifiedKeywords.join(", ") || "None detected"}
- Related keywords phrased as transferable experience: ${keywordGate.relatedKeywords.join(", ") || "None"}
- Detected but not included without review: ${keywordGate.heldBackKeywords.join(", ") || "None"}
- Resume match coverage: ${keywordGate.coveragePercent}%

## Drafting Logic

- The role was matched against target roles, location preference, and keywords in the job title/source notes.
- The cover letter emphasizes concrete resume evidence instead of unsupported claims.
- Unverified tools are held back from resume claims unless they appear in the approved local profile.
- The answer drafts are meant to be reviewed and edited before any employer form submission.
- Location readiness is generated from the role location and must be confirmed before submission.

## Verify Before Submit

${questionsToVerify.map((question) => `- ${question}`).join("\n")}

## User Notes

${application.notes || "No extra notes provided."}

## Location Readiness

${locationReadiness.summary}
`;
}

function buildResumeTailoring(
  application: ApplicationDraft,
  strengths: ReturnType<typeof selectStrengths>,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const matchedSkills = getMatchedSkills(application, keywordGate);
  const prioritizedExperience = getPrioritizedExperience();
  const headline = getResumeHeadline(application);
  const summary = getResumeSummary(application, strengths, keywordGate);
  const skillGroups = getResumeSkillGroups(matchedSkills);
  const targetAlignment = getTargetRoleAlignment(matchedSkills, keywordGate);
  const selectedProjects = getSelectedResumeProjects(application, keywordGate);
  const locationReadiness = getLocationReadiness(application);
  const competenciesHeading = isAnalystReportingRole(application) ? "CORE COMPETENCIES" : "ROLE ALIGNMENT and CORE COMPETENCIES";

  return `# Tailored Resume Draft - ${application.company} ${application.role}

## ${profile.name.toUpperCase()}

${profile.location} | ${profile.phone} | ${profile.email}
LinkedIn: ${profile.links.linkedin} | Portfolio: ${profile.links.portfolio} | GitHub: ${profile.links.github}

## ${headline}

${summary}

## ${competenciesHeading}

${formatCompetencyLines(targetAlignment)}

## PROFESSIONAL EXPERIENCE

${prioritizedExperience.map((item) => buildResumeExperienceBlock(item, application, keywordGate)).join("\n\n")}

## SELECTED PROJECTS

${selectedProjects.map((project) => `### ${project.name}\n- ${project.summary}`).join("\n\n")}

## EDUCATION

${profile.education.map((item) => `- ${item}`).join("\n")}

## TECHNICAL SKILLS

${skillGroups.map((item) => `- ${item}`).join("\n")}

## CERTIFICATIONS

${profile.certifications.map((item) => `- ${item}`).join("\n")}

## ADDITIONAL INFORMATION

- Portfolio: ${profile.links.portfolio}
- GitHub: ${profile.links.github}
${locationReadiness.resumeLine ? `- ${locationReadiness.resumeLine}` : ""}

## REVIEW NOTES

This resume draft follows the user's July resume structure, updated from the American Airlines analyst packet: compact headline, concise summary, truthful core competencies, reverse-chronological professional experience, education, technical skills, certifications, and additional information.

- Target company: ${application.company}
- Target role: ${application.role}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}
- Match score: ${application.matchScore}%
- Evidence emphasized: ${strengths.evidenceUsed.join(" ")}
- Verified keywords emphasized: ${keywordGate.verifiedKeywords.join(", ") || "None detected"}
- Transferable wording used carefully: ${keywordGate.relatedKeywords.join(", ") || "None"}
- Keywords held for review: ${keywordGate.heldBackKeywords.join(", ") || "None"}
- Keyword coverage: ${keywordGate.coveragePercent}%
- Location readiness: ${locationReadiness.summary}

## Guardrails

- Do not add tools, certifications, employers, degrees, or years of experience unless they already appear in the profile.
- Do not imply production ownership when the evidence is project, trainee, teaching, or support experience.
- Prefer stronger ordering and clearer phrasing over new claims.
- Convert this Markdown into a final DOCX/PDF only after human review.

## Resume Format Calibration

${answerStyle.resumeFormatProfile.layout.map((item) => `- ${item}`).join("\n")}

### Preferred Section Order

${answerStyle.resumeFormatProfile.sectionOrder.map((item) => `- ${item}`).join("\n")}

### Experience Formatting

${answerStyle.resumeFormatProfile.experiencePattern.map((item) => `- ${item}`).join("\n")}
`;
}

function getResumeHeadline(application: ApplicationDraft) {
  const roleFamily = classifyRoleTitle(application.role);

  switch (roleFamily) {
    case "revenue-analysis":
      return "DATA ANALYTICS | FORECASTING | BUSINESS INTELLIGENCE";
    case "engineering":
      return "DATA ENGINEERING | ANALYTICS";
    case "data-science":
      return "DATA SCIENCE | ANALYTICS";
    case "business-analysis":
      return "BUSINESS ANALYTICS | DATA ANALYSIS";
    case "education":
      return "DATA SCIENCE | ANALYTICS EDUCATION";
    case "analyst":
    default:
      return "ANALYST | BUSINESS ANALYTICS | DATA REPORTING";
  }
}

function getResumeSummary(
  application: ApplicationDraft,
  strengths: ReturnType<typeof selectStrengths>,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const roleFamily = classifyRoleTitle(application.role);
  const analystTools = getToolListForSummary(application);
  const matchedCapabilities = dedupeResumeTerms(
    keywordGate.evidenceMatches
      .filter((match) => match.category !== "tool")
      .map((match) => match.resumeTerm ?? match.label),
  ).slice(0, 5);
  const capabilityPhrase =
    matchedCapabilities.length > 0
      ? formatNaturalList(matchedCapabilities)
      : "performance reporting, dashboard development, data validation, and stakeholder communication";

  if (isAnalystReportingRole(application)) {
    return `Business Analytics professional with experience transforming operational and business data into actionable insights through ${analystTools}. Brings demonstrated experience in ${capabilityPhrase}, with a practical focus on reliable analysis and decision-ready reporting. Communicates analytical findings to technical and non-technical stakeholders and collaborates across teams to support operational improvement.`;
  }

  const focus = roleFamily === "engineering"
    ? "data engineering, analytics workflows, data validation, and operational reporting"
    : roleFamily === "data-science"
      ? "data science, predictive analytics, dashboarding, and stakeholder-facing insights"
      : "business analytics, SQL analysis, reporting, dashboards, and stakeholder-facing problem solving";

  return `Data professional focused on ${focus}, with background that includes ${strengths.primaryEvidence} Uses analytical workflows to answer business questions and turn model output, dashboard findings, and data quality patterns into practical decisions.`;
}

function getToolListForSummary(application: ApplicationDraft) {
  const matchedSkills = getMatchedSkills(application, buildKeywordGate(application));
  const preferred = ["SQL", "Python", "Excel", "Power BI", "Tableau"].filter((skill) => matchedSkills.includes(skill) || skill === "Excel");

  return Array.from(new Set(preferred)).join(", ");
}

function getPortfolioCaseStudy(application: ApplicationDraft) {
  const searchable = `${application.role} ${application.notes} ${application.source}`.toLowerCase();

  if (
    searchable.includes("financial") ||
    searchable.includes("bank") ||
    searchable.includes("credit") ||
    searchable.includes("consumer") ||
    searchable.includes("complaint") ||
    searchable.includes("risk")
  ) {
    return {
      businessQuestion:
        "Which financial products, issues, and response patterns should a financial services team monitor first?",
      method:
        "Processed real CFPB complaint data with Python, SQL, and SQLite, filtered financial product categories, and generated dashboard metrics for product, issue, state, and response patterns.",
      impact:
        "Created a responsible monitoring workflow that separates useful complaint signals from overclaiming by documenting dataset limits and regional context.",
      coverLetterExample:
        "my CFPB consumer complaint analytics project, where I used Python, SQL, SQLite, and dashboard metrics to analyze financial product trends, response outcomes, and Texas complaint patterns while clearly documenting data limitations.",
    };
  }

  if (searchable.includes("nlp") || searchable.includes("speech") || searchable.includes("voice") || searchable.includes("genai")) {
    return {
      businessQuestion:
        "How can speech and language workflows become more accurate and inclusive for users with different accents and interaction patterns?",
      method:
        "Processed audio data, generated spectrogram-based features, and trained a PyTorch-supported speech workflow while evaluating transcription quality.",
      impact:
        "Framed model performance around usability and fairness, not only accuracy, so the work could support more inclusive voice user experiences.",
      coverLetterExample:
        "my graduate NLP and voice user interface research, where I processed speech audio, trained a PyTorch-supported workflow, and evaluated transcription quality with a focus on accent-aware user experience.",
    };
  }

  if (searchable.includes("scientist") || searchable.includes("machine learning") || searchable.includes("predictive")) {
    return {
      businessQuestion:
        "Which customers are most likely to subscribe or spend more, and how can model output support better targeting decisions?",
      method:
        "Prepared customer features, compared regression and classification models with Python and PyCaret, and balanced predictive performance with stakeholder interpretability.",
      impact:
        "Turned model results into a practical prioritization lens for marketing and sales teams, rather than reporting accuracy scores in isolation.",
      coverLetterExample:
        "my customer prediction case study, where I built regression and classification models on 16,519 customer records to predict monthly spend and subscription likelihood.",
    };
  }

  if (searchable.includes("dashboard") || searchable.includes("business intelligence") || searchable.includes("reporting")) {
    return {
      businessQuestion:
        "How can non-technical stakeholders understand trends, predictions, comparisons, and KPI movement quickly enough to act?",
      method:
        "Built story-first Tableau dashboards and KPI summaries that paired dataset context with clear trends, forecasts, and takeaways.",
      impact:
        "Helped viewers move from chart reading to decision insight without needing a live technical walkthrough.",
      coverLetterExample:
        "my Tableau dashboard work, where I designed KPI, trend, and forecast views so non-technical stakeholders could quickly interpret model outputs and business patterns.",
    };
  }

  return {
    businessQuestion:
      "What patterns, data quality issues, and operational signals should be understood before a dataset supports reporting or modeling?",
    method:
      "Used Python, SQL, EDA, cleaning, validation, and feature review to profile real-world education, healthcare, and operational datasets.",
    impact:
      "Improved the reliability of downstream analysis by making data issues, trends, and next modeling steps easier to explain and act on.",
    coverLetterExample:
      "my education and healthcare analytics work, where I used Python, SQL, exploratory analysis, and data cleaning to make real-world datasets more useful for reporting and modeling.",
  };
}

function getTargetRoleAlignment(
  matchedSkills: string[],
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const jobMatchedCompetencies = keywordGate.evidenceMatches.map((match) => match.resumeTerm ?? match.label);
  const competencyFallback = [
    "Business Analytics",
    "Data Analysis",
    "Stakeholder Communication",
    "Cross-functional Collaboration",
  ];

  return dedupeResumeTerms([...jobMatchedCompetencies, ...matchedSkills, ...competencyFallback]).slice(0, 12);
}

function formatCompetencyLines(competencies: string[]) {
  const maxLineLength = 88;
  const lines: string[] = [];
  let currentLine: string[] = [];

  for (const competency of competencies) {
    const nextLine = [...currentLine, competency].join(" | ");

    if (currentLine.length > 0 && nextLine.length > maxLineLength) {
      lines.push(currentLine.join(" | "));
      currentLine = [competency];
    } else {
      currentLine.push(competency);
    }
  }

  if (currentLine.length > 0) lines.push(currentLine.join(" | "));

  return lines.join("\n");
}

function buildResumeExperienceBlock(
  item: {
    dates?: string;
    role: string;
    organization: string;
    location: string;
    focus: string[];
  },
  application: ApplicationDraft,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  return [
    `### ${item.organization} - ${item.location}`,
    `**${[item.role, item.dates].filter(Boolean).join(" | ")}**`,
    ...getExperienceBullets(item, application, keywordGate).map((bullet) => `- ${bullet}`),
  ].join("\n");
}

function getExperienceBullets(
  item: {
    role: string;
    organization: string;
    focus: string[];
  },
  application: ApplicationDraft,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const organization = item.organization.toLowerCase();

  if (organization.includes("data science academy")) {
    return prioritizeBullets(
      [
        "Built end-to-end analytical workflows using Python, SQL, Excel, and visualization tools to analyze operational and business datasets.",
        "Conducted exploratory data analysis and trend identification to support data-driven recommendations and strategic insights.",
        "Developed dashboards and KPI reporting tools in Tableau and Power BI for non-technical stakeholders.",
        "Built executive dashboards tracking KPIs and operational performance metrics for business stakeholders.",
        "Performed forecasting and predictive analytics projects involving customer behavior, operational performance, and financial indicators.",
        "Collaborated on business-focused AI and analytics initiatives while managing multiple deliverables and deadlines.",
      ],
      application,
      keywordGate,
    );
  }

  if (organization.includes("thales")) {
    return prioritizeBullets(
      [
        "Supported transportation systems operations by maintaining data pipelines and monitoring real-time system performance across 100+ sensor inputs.",
        "Analyzed operational data and resolved system issues using SQL, Python, and Linux-based tools.",
        "Assisted cross-functional technical teams in identifying process improvements and increasing system reliability.",
        "Conducted data validation, troubleshooting, and reporting to support operational continuity and decision-making.",
        "Coordinated issue resolution activities while ensuring timely completion of assigned operational projects.",
        "Produced technical reports supporting decision making, maintenance planning, and continuous improvement initiatives.",
      ],
      application,
      keywordGate,
    );
  }

  if (organization.includes("nebraska")) {
    return prioritizeBullets(
      [
        "Analyzed educational and research datasets using Python, SQL, Excel, and statistical methods to support university research initiatives.",
        "Improved data processing and reporting efficiency by 30% through structured data cleaning and validation procedures.",
        "Conducted trend analysis, quality assurance checks, and reporting to support strategic research objectives.",
        "Prepared presentations and analytical summaries for faculty and research stakeholders.",
        "Collaborated with interdisciplinary teams to support data-driven project initiatives and organizational goals.",
      ],
      application,
      keywordGate,
    );
  }

  if (organization.includes("benedict")) {
    return prioritizeBullets(
      [
        "Supported analytics, chatbot development, and technical education initiatives for students and faculty.",
        "Mentored students on applied analytics, reporting, and business technology projects.",
        "Delivered instruction in Python programming, web development, and practical problem-solving methodologies.",
        "Assisted with project coordination, stakeholder communication, and educational technology implementation.",
      ],
      application,
      keywordGate,
    );
  }

  return item.focus.map((focus) => `Supported ${focus.toLowerCase()} initiatives in a data-focused environment.`);
}

function prioritizeBullets(
  bullets: string[],
  application: ApplicationDraft,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const searchable = `${application.role} ${application.notes}`;
  const weightedTerms = keywordGate.evidenceMatches.flatMap((match) => [
    match.label,
    match.resumeTerm ?? "",
    ...match.jobTerms,
  ]);

  return [...bullets]
    .sort(
      (left, right) =>
        scoreTextForSearch(right, searchable, weightedTerms) - scoreTextForSearch(left, searchable, weightedTerms),
    )
    .slice(0, 5);
}

function scoreTextForSearch(value: string, searchable: string, weightedTerms: string[] = []) {
  const normalized = normalizeKeywordText(value);
  const keywords = normalizeKeywordText(searchable)
    .split(" ")
    .filter((keyword) => keyword.length > 2 && !resumeStopWords.has(keyword));
  const weightedScore = weightedTerms.reduce((score, term) => {
    const normalizedTerm = normalizeKeywordText(term);

    if (containsNormalizedPhrase(normalized, normalizedTerm)) return score + 8;

    const termTokens = normalizedTerm.split(" ").filter((token) => token.length > 2 && !resumeStopWords.has(token));
    return score + termTokens.filter((token) => containsNormalizedPhrase(normalized, token)).length * 3;
  }, 0);

  return weightedScore + keywords.reduce((score, keyword) => score + (containsNormalizedPhrase(normalized, keyword) ? 1 : 0), 0);
}

const resumeStopWords = new Set([
  "and",
  "are",
  "for",
  "from",
  "have",
  "job",
  "our",
  "role",
  "that",
  "the",
  "this",
  "with",
  "will",
  "you",
  "your",
]);

function getSelectedResumeProjects(
  application: ApplicationDraft,
  keywordGate: ReturnType<typeof buildKeywordGate>,
) {
  const weightedTerms = keywordGate.evidenceMatches.flatMap((match) => [
    match.label,
    match.resumeTerm ?? "",
    match.evidence,
    ...match.jobTerms,
  ]);

  return [...profile.projects]
    .map((project) => {
      const businessFitScore = getProjectBusinessFitScore(project, application);
      const sourceScore = keywordGate.evidenceMatches.reduce((score, match) => {
        const projectIsSource = match.sources.some(
          (source) =>
            normalizeKeywordText(source).includes(normalizeKeywordText(project.name)) ||
            normalizeKeywordText(project.name).includes(normalizeKeywordText(source)),
        );

        return score + (projectIsSource ? 20 : 0);
      }, 0);
      const contentScore = scoreTextForSearch(
        `${project.name} ${project.summary}`,
        `${application.role} ${application.notes}`,
        weightedTerms,
      );

      return {
        ...project,
        businessFitScore,
        relevanceScore: sourceScore + contentScore,
      };
    })
    .sort(
      (left, right) =>
        right.businessFitScore - left.businessFitScore ||
        right.relevanceScore - left.relevanceScore,
    )
    .slice(0, 2)
    .map(({ name, summary }) => ({ name, summary }));
}

function getProjectBusinessFitScore(
  project: { name: string; summary: string },
  application: ApplicationDraft,
) {
  const job = normalizeKeywordText(`${application.role} ${application.notes}`);
  const projectText = normalizeKeywordText(`${project.name} ${project.summary}`);
  const isRevenueRole = [
    "revenue management",
    "yield management",
    "pricing",
    "passenger demand",
    "booking behavior",
  ].some((signal) => containsNormalizedPhrase(job, normalizeKeywordText(signal)));

  if (isRevenueRole) {
    if (containsNormalizedPhrase(projectText, "customer prediction")) return 70;
    if (containsNormalizedPhrase(projectText, "tableau dashboards")) return 55;
    if (containsNormalizedPhrase(projectText, "predictive modeling and forecasting")) return 50;
    if (containsNormalizedPhrase(projectText, "cfpb")) return 0;
  }

  const isSocialInsightsRole = ["social insight", "brand protection", "social listening", "customer sentiment"].some(
    (signal) => containsNormalizedPhrase(job, normalizeKeywordText(signal)),
  );

  if (isSocialInsightsRole) {
    if (containsNormalizedPhrase(projectText, "nlp sentiment analysis")) return 70;
    if (containsNormalizedPhrase(projectText, "customer prediction")) return 55;
    if (containsNormalizedPhrase(projectText, "tableau dashboards")) return 40;
  }

  const isFinancialRiskRole = ["credit", "banking", "consumer complaint", "financial risk"].some((signal) =>
    containsNormalizedPhrase(job, normalizeKeywordText(signal)),
  );

  if (isFinancialRiskRole && containsNormalizedPhrase(projectText, "cfpb")) return 70;

  return 0;
}

function getResumeSkillGroups(matchedSkills: string[]) {
  const prioritizedSkills = new Set(matchedSkills);

  return [
    `Programming: ${joinKnownSkills(["Python", "SQL"], prioritizedSkills)}`,
    `Visualization: ${joinKnownSkills(["Power BI", "Tableau", "Excel"], prioritizedSkills)}`,
    `Analytics: ${joinKnownSkills([
      "EDA",
      "Statistical Modeling",
      "Forecasting",
      "Data Cleaning",
      "Feature Engineering",
      "KPI Reporting",
      "Dashboard Development",
    ], prioritizedSkills)}`,
    `Platforms: ${joinKnownSkills(["Snowflake", "Databricks", "Linux", "Azure"], prioritizedSkills)}`,
    "Business: Reporting, Process Improvement, Stakeholder Communication, Business Intelligence",
  ];
}

function joinKnownSkills(skills: string[], prioritizedSkills: Set<string>) {
  const knownSkills = new Set(Object.values(profile.skills).flat());
  const orderedSkills = [
    ...skills.filter((skill) => prioritizedSkills.has(skill)),
    ...skills.filter((skill) => !prioritizedSkills.has(skill)),
  ].filter((skill) => knownSkills.has(skill) || skill === "Excel");

  return Array.from(new Set(orderedSkills)).join(", ");
}

function getMatchedSkills(application: ApplicationDraft, keywordGate: ReturnType<typeof buildKeywordGate>) {
  const searchable = `${application.role} ${application.notes} ${application.source}`.toLowerCase();
  const allSkills = Object.values(profile.skills).flat();
  const matched = allSkills.filter((skill) => searchable.includes(skill.toLowerCase()));
  const verified = keywordGate.verifiedKeywords.filter((keyword) => allSkills.includes(keyword));
  const transferable = keywordGate.relatedKeywords.filter((keyword) => allSkills.includes(keyword));
  const baseline = ["Python", "SQL", "Excel"].filter((skill) => allSkills.includes(skill) || skill === "Excel");

  return Array.from(new Set([...verified, ...transferable, ...matched, ...baseline])).slice(0, 14);
}

function getPrioritizedExperience() {
  const experience = profile.experience.filter((item) => !item.organization.toLowerCase().includes("ameritas"));

  return experience.sort((left, right) => getExperienceResumeOrder(left) - getExperienceResumeOrder(right));
}

function getExperienceResumeOrder(item: { endYear?: number; resumeOrder?: number; startYear?: number }) {
  return item.resumeOrder ?? -(item.endYear ?? item.startYear ?? 0);
}
