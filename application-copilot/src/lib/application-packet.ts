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
  const resumeTailoring = buildResumeTailoring(application, strengths);
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
  };

  return {
    answers: JSON.stringify(answerDrafts, null, 2),
    coverLetter: buildCoverLetter(application, strengths),
    checklist: buildChecklist(application, questionsToVerify),
    reviewNotes: buildReviewNotes(application, strengths, questionsToVerify),
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
  return `# ${application.company} - ${application.role}

Dear Hiring Team,

I am interested in the ${application.role} role at ${application.company}. I am based in ${profile.location}, and this opportunity aligns with my focus on data science, analytics, data engineering, business analysis, and practical stakeholder-facing problem solving.

My background includes ${strengths.primaryEvidence} I have also built Python pipelines for data cleaning, exploratory analysis, and feature engineering, developed predictive models, and created Tableau dashboards that help non-technical stakeholders understand trends and decisions.

One relevant example is ${strengths.projectExamples[0]} Another is my field engineering work maintaining real-time transportation data pipelines and resolving data/system issues using SQL, Python, and Linux.

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

function buildReviewNotes(
  application: ApplicationDraft,
  strengths: ReturnType<typeof selectStrengths>,
  questionsToVerify: string[],
) {
  return `# Transparent Review Notes

This packet was generated from the local profile and resume-derived evidence. Review these notes before approving the PR.

## Evidence Used

${strengths.evidenceUsed.map((item) => `- ${item}`).join("\n")}

## Drafting Logic

- The role was matched against target roles, location preference, and keywords in the job title/source notes.
- The cover letter emphasizes concrete resume evidence instead of unsupported claims.
- The answer drafts are meant to be reviewed and edited before any employer form submission.

## Verify Before Submit

${questionsToVerify.map((question) => `- ${question}`).join("\n")}

## User Notes

${application.notes || "No extra notes provided."}
`;
}

function buildResumeTailoring(application: ApplicationDraft, strengths: ReturnType<typeof selectStrengths>) {
  const matchedSkills = getMatchedSkills(application);
  const prioritizedExperience = getPrioritizedExperience(application);
  const headline = getResumeHeadline(application);
  const summary = getResumeSummary(application, strengths);
  const skillGroups = getResumeSkillGroups(matchedSkills);

  return `# Tailored Resume Draft - ${application.company} ${application.role}

This is a resume-shaped draft for review. It follows the calibrated Citi resume structure and should only reorder or emphasize truthful experience already present in the profile/resume.

## ${profile.name.toUpperCase()}

${profile.location} | ${profile.phone} | ${profile.email}
${profile.links.linkedin} | ${profile.links.portfolio}

## ${headline}

${summary}

## CORE COMPETENCIES

${matchedSkills.map((skill) => `- ${skill}`).join("\n")}

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

  return `I am a data professional focused on ${focus}. My background includes ${strengths.primaryEvidence} My experience spans Python, SQL, dashboards, data cleaning, data validation, forecasting, teaching, and translating technical work into practical decisions.`;
}

function buildResumeExperienceBlock(
  item: {
    role: string;
    organization: string;
    location: string;
    focus: string[];
  },
  application: ApplicationDraft,
) {
  return [
    `### ${item.organization} - ${item.location}`,
    `**${item.role}**`,
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
    `Analytics & Visualization: ${joinKnownSkills(["Tableau", "Matplotlib", "Dashboard Development"], prioritizedSkills)}`,
    `Programming & Databases: ${joinKnownSkills(["Python", "SQL", "Pandas", "NumPy"], prioritizedSkills)}`,
    `Data Analysis: ${joinKnownSkills(["EDA", "Data Cleaning", "Feature Engineering", "Statistical Modeling", "Predictive Analytics", "Data Validation"], prioritizedSkills)}`,
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

function getMatchedSkills(application: ApplicationDraft) {
  const searchable = `${application.role} ${application.notes} ${application.source}`.toLowerCase();
  const allSkills = Object.values(profile.skills).flat();
  const matched = allSkills.filter((skill) => searchable.includes(skill.toLowerCase()));
  const fallback = [
    "Python",
    "SQL",
    "Data Cleaning",
    "EDA",
    "Feature Engineering",
    "Dashboard Development",
    "Predictive Analytics",
    "Data Validation",
  ];

  return Array.from(new Set([...matched, ...fallback])).slice(0, 12);
}

function getPrioritizedExperience(application: ApplicationDraft) {
  const searchable = `${application.role} ${application.notes}`.toLowerCase();
  const experience = [...profile.experience];

  return experience.sort((left, right) => scoreExperience(right, searchable) - scoreExperience(left, searchable));
}

function scoreExperience(
  item: {
    role: string;
    organization: string;
    focus: string[];
  },
  searchable: string,
) {
  const haystack = `${item.role} ${item.organization} ${item.focus.join(" ")}`.toLowerCase();
  const keywords = searchable.split(/[^a-z0-9+#.]+/).filter((keyword) => keyword.length > 2);

  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}
