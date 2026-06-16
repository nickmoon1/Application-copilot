export type PortfolioFit = {
  matchedAnchors: string[];
  missingAnchors: string[];
  score: number;
  tier: "STRONG" | "REVIEW" | "LOW";
};

type PortfolioAnchor = {
  label: string;
  patterns: string[];
  weight: number;
};

const portfolioAnchors: PortfolioAnchor[] = [
  {
    label: "Python analysis workflows",
    patterns: ["python", "pandas", "numpy", "pycaret"],
    weight: 12,
  },
  {
    label: "SQL data analysis",
    patterns: ["sql", "query", "database"],
    weight: 12,
  },
  {
    label: "Predictive modeling",
    patterns: ["predictive", "regression", "classification", "model", "scikit", "machine learning"],
    weight: 12,
  },
  {
    label: "Forecasting",
    patterns: ["forecast", "forecasting", "time series", "prophet"],
    weight: 9,
  },
  {
    label: "Dashboards and KPI storytelling",
    patterns: ["dashboard", "tableau", "power bi", "kpi", "visualization", "business intelligence", "reporting"],
    weight: 12,
  },
  {
    label: "Data cleaning and validation",
    patterns: ["data cleaning", "data quality", "validation", "eda", "exploratory", "quality checks"],
    weight: 10,
  },
  {
    label: "Stakeholder-facing business analytics",
    patterns: ["stakeholder", "business", "decision", "insight", "presentation", "client"],
    weight: 9,
  },
  {
    label: "Financial services complaint analytics",
    patterns: ["financial", "banking", "consumer", "complaint", "cfpb", "credit", "debt", "mortgage", "risk"],
    weight: 10,
  },
  {
    label: "Public data and responsible interpretation",
    patterns: ["public data", "public dataset", "regulatory", "consumer protection", "representative", "limitations"],
    weight: 7,
  },
  {
    label: "Operational data and reliability",
    patterns: ["pipeline", "linux", "operational", "sensor", "reliability", "troubleshooting"],
    weight: 8,
  },
  {
    label: "NLP and speech research",
    patterns: ["nlp", "speech", "voice", "audio", "pytorch", "transcription", "language"],
    weight: 7,
  },
];

export function scorePortfolioFit(input: { keywords: string[]; notes?: string; role: string; summary: string }) {
  const searchable = normalize(`${input.role} ${input.summary} ${input.keywords.join(" ")} ${input.notes ?? ""}`);
  const matchedAnchors: string[] = [];
  const missingAnchors: string[] = [];
  let score = 0;

  for (const anchor of portfolioAnchors) {
    if (anchor.patterns.some((pattern) => searchable.includes(normalize(pattern)))) {
      matchedAnchors.push(anchor.label);
      score += anchor.weight;
    } else {
      missingAnchors.push(anchor.label);
    }
  }

  const cappedScore = Math.min(score, 100);

  return {
    matchedAnchors,
    missingAnchors: missingAnchors.slice(0, 4),
    score: cappedScore,
    tier: getPortfolioFitTier(cappedScore, matchedAnchors.length),
  };
}

function getPortfolioFitTier(score: number, matchedCount: number): PortfolioFit["tier"] {
  if (score >= 45 && matchedCount >= 4) {
    return "STRONG";
  }

  if (score >= 28 && matchedCount >= 3) {
    return "REVIEW";
  }

  return "LOW";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
