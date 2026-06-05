import profile from "@/data/profile.json";

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
    notesForReview: application.notes || "No extra notes provided.",
    questionsToVerify,
    profileEvidenceUsed: strengths.evidenceUsed,
  };

  return {
    answers: JSON.stringify(answerDrafts, null, 2),
    coverLetter: buildCoverLetter(application, strengths),
    checklist: buildChecklist(application, questionsToVerify),
    reviewNotes: buildReviewNotes(application, strengths, questionsToVerify),
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
