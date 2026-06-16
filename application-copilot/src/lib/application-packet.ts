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

export function generateApplicationPacket(application: ApplicationDraft) {
  const strengths = selectStrengths(application);
  const keywordGate = buildKeywordGate(application);
  const resumeTailoring = buildResumeTailoring(application, strengths, keywordGate);
  const questionsToVerify = getQuestionsToVerify(application);
  const answerDrafts = {
    whyThisRole: [
      `I am interested in the ${application.role} role at ${application.company} because it matches my work across data analysis, Python, SQL, predictive modeling, and stakeholder-facing insights.`,
      strengths.primaryEvidence,
    ].join(" "),
    whyThisCompany:
      `This role appears to connect technical data work with practical business outcomes, which fits my background turning cleaned data, models, dashboards, and system findings into decisions teams can use.`,
    location:
      `I am based in ${profile.location} and am focused on Dallas-area opportunities, including ${application.location}.`,
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
    coverLetter: buildCoverLetter(application, strengths),
    checklist: buildChecklist(application, questionsToVerify),
    keywordReport: buildKeywordReport(application, keywordGate),
    reviewNotes: buildReviewNotes(application, strengths, questionsToVerify, keywordGate),
    tailoredResume: resumeTailoring,
    tailoredResumeDocx: generateResumeDocx(resumeTailoring),
    answerStyle: JSON.stringify(answerStyle, null, 2),
  };
}

function selectStrengths(application: ApplicationDraft) {
  const searchable = `${application.role} ${application.notes} ${application.source}`.toLowerCase();
  const evidenceUsed = new Set<string>();
  const technicalFit = new Set<string>();
  const projectExamples: string[] = [];

  addEvidence("Python, SQL, EDA, data cleaning, feature engineering, and statistical modeling.", evidenceUsed, technicalFit);

  if (searchable.includes("engineer") || searchable.includes("big data") || searchable.includes("data/ai")) {
    addEvidence(
      "Maintained real-time transportation data pipelines processing 100+ sensor inputs and resolved 50+ system/data issues with SQL, Python, and Linux.",
      evidenceUsed,
      technicalFit,
    );
    addEvidence("Data pipeline, data validation, Azure, Databricks, Snowflake, and Linux exposure.", evidenceUsed, technicalFit);
  }

  if (searchable.includes("scientist") || searchable.includes("ai") || searchable.includes("machine learning")) {
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
  const approvedKeywords = getApprovedKeywordMap();
  const detectedKeywords = getCandidateKeywords().filter((keyword) => searchable.includes(keyword.normalized));
  const verifiedKeywords = detectedKeywords
    .filter((keyword) => approvedKeywords.has(keyword.normalized))
    .map((keyword) => approvedKeywords.get(keyword.normalized) ?? keyword.label);
  const heldBackKeywords = detectedKeywords
    .filter((keyword) => !approvedKeywords.has(keyword.normalized))
    .map((keyword) => keyword.label);
  const uniqueVerifiedKeywords = Array.from(new Set(verifiedKeywords));
  const uniqueHeldBackKeywords = Array.from(new Set(heldBackKeywords));
  const coveragePercent =
    detectedKeywords.length > 0 ? Math.round((uniqueVerifiedKeywords.length / detectedKeywords.length) * 100) : 100;

  return {
    detectedKeywords: Array.from(new Set(detectedKeywords.map((keyword) => keyword.label))),
    verifiedKeywords: uniqueVerifiedKeywords,
    heldBackKeywords: uniqueHeldBackKeywords,
    coveragePercent,
  };
}

function getApprovedKeywordMap() {
  const approved = new Map<string, string>();
  const skills = Object.values(profile.skills).flat();

  for (const skill of skills) {
    approved.set(normalizeKeywordText(skill), skill);
  }

  const aliases: Record<string, string> = {
    "scikit learn": "Scikit-learn",
    sklearn: "Scikit-learn",
    "time series": "Time Series Forecasting",
    forecast: "Forecasting",
    forecasting: "Forecasting",
    dashboard: "Dashboard Development",
    dashboards: "Dashboard Development",
    "data quality": "Data Quality Checks",
    "data validation": "Data Validation",
    "statistical modelling": "Statistical Modeling",
    "statistical modeling": "Statistical Modeling",
    "machine learning": "Model Evaluation",
    "ml": "Model Evaluation",
    "business intelligence": "Dashboard Development",
    "kpi": "KPI Reporting",
    "kpis": "KPI Reporting",
    "powerbi": "Power BI",
    "sqlite": "SQLite",
    "financial analytics": "Financial Analytics",
    "public data": "Public Data Analysis",
    "public dataset": "Public Data Analysis",
  };

  for (const [alias, skill] of Object.entries(aliases)) {
    if (skills.includes(skill)) {
      approved.set(normalizeKeywordText(alias), skill);
    }
  }

  return approved;
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
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQuestionsToVerify(application: ApplicationDraft) {
  const questions = [
    "Confirm the role is still live before final submission.",
    "Confirm required years of experience and seniority expectations.",
    "Confirm work location, hybrid/on-site expectations, and commute fit.",
  ];
  const searchable = `${application.role} ${application.notes}`.toLowerCase();

  if (searchable.includes("engineer") || searchable.includes("big data")) {
    questions.push("Confirm depth required for production big-data tooling, cloud services, and distributed systems.");
  }

  if (searchable.includes("ai") || searchable.includes("machine learning")) {
    questions.push("Confirm whether the role expects production ML/AI ownership or analytics/modeling support.");
  }

  if (searchable.includes("adjunct") || searchable.includes("professor")) {
    questions.push("Confirm teaching schedule, course format, and required teaching documentation.");
  }

  return questions;
}

function buildCoverLetter(application: ApplicationDraft, strengths: ReturnType<typeof selectStrengths>) {
  const portfolioCaseStudy = getPortfolioCaseStudy(application);

  return `# ${application.company} - ${application.role}

Dear Hiring Team,

I am interested in the ${application.role} role at ${application.company}. I am based in ${profile.location}, and this opportunity aligns with my focus on data science, analytics, data engineering, business analysis, and practical stakeholder-facing problem solving.

My background includes ${strengths.primaryEvidence} I approach data work the way I present projects in my portfolio: start with the business question, build a clean analytical workflow, then translate findings into decisions a technical or non-technical audience can use.

One relevant example is ${portfolioCaseStudy.coverLetterExample} Another is my field engineering work maintaining real-time transportation data pipelines and resolving data/system issues using SQL, Python, and Linux.

I would bring a practical mix of technical execution, business communication, and teaching/mentoring experience to this role.

Thank you for your consideration.

${profile.name}
${profile.links.linkedin}
${profile.links.github}
${profile.links.portfolio}
`;
}

function buildChecklist(application: ApplicationDraft, questionsToVerify: string[]) {
  return `# Review Checklist

- [ ] Confirm role, company, and location.
- [ ] Confirm job URL and source.
- [ ] Review seniority, salary, and work-location expectations.
- [ ] Review tailored resume draft for truthful emphasis.
- [ ] Review generated answers for accuracy.
- [ ] Review cover letter tone and examples.
- [ ] Confirm no claims go beyond the resume/profile evidence.
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
`;
}

function buildKeywordReport(application: ApplicationDraft, keywordGate: ReturnType<typeof buildKeywordGate>) {
  return `# Keyword Match Report

This report explains which role keywords were allowed into the application packet and which were held back for human review.

## Job

- Company: ${application.company}
- Role: ${application.role}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}

## Verified Keywords Included

${keywordGate.verifiedKeywords.length > 0 ? keywordGate.verifiedKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- None detected"}

## Detected But Held Back

${keywordGate.heldBackKeywords.length > 0 ? keywordGate.heldBackKeywords.map((keyword) => `- ${keyword}`).join("\n") : "- None"}

## Coverage

- Detected job keywords: ${keywordGate.detectedKeywords.length}
- Verified keyword matches: ${keywordGate.verifiedKeywords.length}
- Coverage: ${keywordGate.coveragePercent}%

## Notes

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
) {
  return `# Transparent Review Notes

This packet was generated from the local profile and resume-derived evidence. Review these notes before approving the PR.

## Evidence Used

${strengths.evidenceUsed.map((item) => `- ${item}`).join("\n")}

## Truthful Keyword Gate

- Verified keywords included: ${keywordGate.verifiedKeywords.join(", ") || "None detected"}
- Detected but not included without review: ${keywordGate.heldBackKeywords.join(", ") || "None"}
- Resume match coverage: ${keywordGate.coveragePercent}%

## Drafting Logic

- The role was matched against target roles, location preference, and keywords in the job title/source notes.
- The cover letter emphasizes concrete resume evidence instead of unsupported claims.
- Unverified tools are held back from resume claims unless they appear in the approved local profile.
- The answer drafts are meant to be reviewed and edited before any employer form submission.

## Verify Before Submit

${questionsToVerify.map((question) => `- ${question}`).join("\n")}

## User Notes

${application.notes || "No extra notes provided."}
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
  const summary = getResumeSummary(application, strengths);
  const skillGroups = getResumeSkillGroups(matchedSkills);
  const targetAlignment = getTargetRoleAlignment(matchedSkills, strengths);
  const portfolioCaseStudy = getPortfolioCaseStudy(application);

  return `# Tailored Resume Draft - ${application.company} ${application.role}

This is a resume-shaped draft for review. It follows the portfolio direction: business question, method, finding, and practical impact. Experience is kept in reverse-chronological order while bullets are tailored to the role.

## ${profile.name.toUpperCase()}

${profile.location} | ${profile.phone} | ${profile.email}
${profile.links.linkedin} | ${profile.links.portfolio}

## ${headline}

${summary}

${targetAlignment.length > 0 ? `## TARGET ROLE ALIGNMENT\n\n${targetAlignment.map((item) => `- ${item}`).join("\n")}\n` : ""}
## SELECTED PORTFOLIO EVIDENCE

- Business question: ${portfolioCaseStudy.businessQuestion}
- Method: ${portfolioCaseStudy.method}
- Finding / impact: ${portfolioCaseStudy.impact}
- Portfolio: ${profile.links.portfolio}

## CORE COMPETENCIES

${matchedSkills.map((skill) => `- ${skill}`).join("\n")}

## KEYWORD MATCH

- Verified keywords emphasized: ${keywordGate.verifiedKeywords.join(", ") || "None detected"}
- Keywords held for review: ${keywordGate.heldBackKeywords.join(", ") || "None"}
- Keyword coverage: ${keywordGate.coveragePercent}%

## PROFESSIONAL EXPERIENCE

${prioritizedExperience.map((item) => buildResumeExperienceBlock(item, application)).join("\n\n")}

## EDUCATION

${profile.education.map((item) => `- ${item}`).join("\n")}

## TECHNICAL SKILLS

${skillGroups.map((item) => `- ${item}`).join("\n")}

## CERTIFICATIONS

${profile.certifications.map((item) => `- ${item}`).join("\n")}

## ADDITIONAL INFORMATION

- Portfolio: ${profile.links.portfolio}
- GitHub: ${profile.links.github}

## REVIEW NOTES

- Target company: ${application.company}
- Target role: ${application.role}
- Source: ${application.source}
- Job URL: ${application.jobUrl || "Not provided"}
- Match score: ${application.matchScore}%
- Evidence emphasized: ${strengths.evidenceUsed.join(" ")}
- Verified role keywords: ${keywordGate.verifiedKeywords.join(", ") || "None detected"}
- Held-back role keywords: ${keywordGate.heldBackKeywords.join(", ") || "None"}

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
  const searchable = `${application.role} ${application.notes}`.toLowerCase();

  if (searchable.includes("engineer") || searchable.includes("data solutions")) {
    return "DATA ENGINEERING | BUSINESS ANALYTICS";
  }

  if (searchable.includes("scientist") || searchable.includes("machine learning") || searchable.includes("ai")) {
    return "DATA SCIENCE | BUSINESS ANALYTICS";
  }

  if (searchable.includes("business")) {
    return "BUSINESS ANALYTICS | DATA ANALYSIS";
  }

  return "BUSINESS ANALYTICS | DATA ENGINEERING";
}

function getResumeSummary(application: ApplicationDraft, strengths: ReturnType<typeof selectStrengths>) {
  const searchable = `${application.role} ${application.notes}`.toLowerCase();
  const focus = searchable.includes("engineer")
    ? "data engineering, analytics workflows, data validation, and operational reporting"
    : searchable.includes("scientist") || searchable.includes("ai")
      ? "data science, predictive analytics, dashboarding, and stakeholder-facing insights"
      : "business analytics, SQL analysis, reporting, dashboards, and stakeholder-facing problem solving";

  return `I am a data professional focused on ${focus}. My background includes ${strengths.primaryEvidence} My work is strongest when it connects a clear business question to a clean analytical workflow, then turns model output, dashboard findings, or data quality patterns into practical decisions.`;
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

function getTargetRoleAlignment(matchedSkills: string[], strengths: ReturnType<typeof selectStrengths>) {
  const skillEvidence: Record<string, string> = {
    "Power BI": "Built dashboard and KPI reporting work that can be positioned for Power BI or Tableau-driven reporting needs.",
    Tableau: "Created stakeholder-facing dashboards and translated analytical outputs into business-friendly views.",
    Excel: "Used Excel alongside Python and SQL for analysis, reporting, and research dataset workflows.",
    SQL: "Used SQL for exploratory analysis, troubleshooting, validation, and operational data problem solving.",
    Python: "Built Python workflows for cleaning, EDA, feature engineering, forecasting, and predictive modeling.",
    Forecasting: "Completed forecasting and predictive analytics projects tied to customer behavior, operations, and financial indicators.",
    "KPI Reporting": "Developed KPI-oriented dashboards and reporting summaries for non-technical stakeholders.",
    "Data Validation": "Performed data validation, quality checks, and troubleshooting across research and operational datasets.",
    "Data Quality Checks": "Improved processing and reporting reliability through structured cleaning, validation, and QA checks.",
    "Dashboard Development": "Built dashboards and reporting tools to make technical analysis easier for stakeholders to use.",
    "Predictive Analytics": "Developed predictive models and communicated results through practical business recommendations.",
  };

  const alignedSkills = matchedSkills
    .map((skill) => skillEvidence[skill])
    .filter((evidence): evidence is string => Boolean(evidence));

  return Array.from(new Set([strengths.primaryEvidence, ...alignedSkills])).slice(0, 5);
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
) {
  return [
    `### ${item.organization} - ${item.location}`,
    `**${[item.role, item.dates].filter(Boolean).join(" | ")}**`,
    ...getExperienceBullets(item, application).map((bullet) => `- ${bullet}`),
  ].join("\n");
}

function getExperienceBullets(
  item: {
    role: string;
    organization: string;
    focus: string[];
  },
  application: ApplicationDraft,
) {
  const organization = item.organization.toLowerCase();
  const searchable = `${application.role} ${application.notes}`.toLowerCase();

  if (organization.includes("data science academy")) {
    return prioritizeBullets(
      [
        "Built end-to-end analytical workflows using Python, SQL, Excel, and visualization tools to analyze operational and business datasets.",
        "Conducted exploratory data analysis and trend identification to support data-driven recommendations and strategic insights.",
        "Developed dashboards and KPI reporting tools in Tableau and Power BI for non-technical stakeholders.",
        "Performed forecasting and predictive analytics projects involving customer behavior, operational performance, and financial indicators.",
        "Collaborated on business-focused AI and analytics initiatives while managing multiple deliverables and deadlines.",
      ],
      searchable,
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
      ],
      searchable,
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
      searchable,
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
      searchable,
    );
  }

  return item.focus.map((focus) => `Supported ${focus.toLowerCase()} initiatives in a data-focused environment.`);
}

function prioritizeBullets(bullets: string[], searchable: string) {
  return [...bullets]
    .sort((left, right) => scoreTextForSearch(right, searchable) - scoreTextForSearch(left, searchable))
    .slice(0, 5);
}

function scoreTextForSearch(value: string, searchable: string) {
  const normalized = value.toLowerCase();
  const keywords = searchable.split(/[^a-z0-9+#.]+/).filter((keyword) => keyword.length > 2);

  return keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0);
}

function getResumeSkillGroups(matchedSkills: string[]) {
  const prioritizedSkills = new Set(matchedSkills);

  return [
    `Analytics & Visualization: ${joinKnownSkills(["Power BI", "Tableau", "Excel", "Matplotlib", "Dashboard Development"], prioritizedSkills)}`,
    `Programming & Databases: ${joinKnownSkills(["Python", "SQL", "Pandas", "NumPy"], prioritizedSkills)}`,
    `Machine Learning: ${joinKnownSkills(["Scikit-learn", "PyCaret", "NLTK", "Regression", "Classification", "Time Series Forecasting", "Model Evaluation"], prioritizedSkills)}`,
    `Data Analysis: ${joinKnownSkills(["EDA", "Data Cleaning", "Feature Engineering", "Statistical Modeling", "Predictive Analytics", "Forecasting", "KPI Reporting", "Data Validation"], prioritizedSkills)}`,
    "Business Tools: Microsoft Office Suite, Excel, Reporting & Presentation Development",
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
  const fallback = [
    "Python",
    "SQL",
    "Data Cleaning",
    "EDA",
    "Feature Engineering",
    "Dashboard Development",
    "Predictive Analytics",
    "Forecasting",
    "KPI Reporting",
    "Data Validation",
  ];

  return Array.from(new Set([...verified, ...matched, ...fallback])).slice(0, 14);
}

function getPrioritizedExperience() {
  const experience = [...profile.experience];

  return experience.sort((left, right) => getExperienceResumeOrder(left) - getExperienceResumeOrder(right));
}

function getExperienceResumeOrder(item: { endYear?: number; resumeOrder?: number; startYear?: number }) {
  return item.resumeOrder ?? -(item.endYear ?? item.startYear ?? 0);
}
