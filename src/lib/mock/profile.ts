export type EvidenceStatus = "verified" | "needs_review" | "do_not_use";

export interface EvidenceClaim {
  id: string;
  skillLabel: string;
  statement: string;
  source: string;
  skills: string[];
  status: EvidenceStatus;
  approvedForResume: boolean;
}

export interface ProfileSection {
  label: string;
  items: { label: string; value: string; status?: EvidenceStatus }[];
}

/**
 * Illustrative mock data — in the real product this reads from
 * candidate_master_profile.json / career_evidence.json rather than being
 * defined here.
 */
export const mockProfileSections: ProfileSection[] = [
  {
    label: "Personal",
    items: [
      { label: "Legal name", value: "Himanshu Srivastava", status: "verified" },
      { label: "Location", value: "Dallas, TX", status: "verified" },
      { label: "Work authorization", value: "OPT (F-1)", status: "verified" },
      {
        label: "Sponsorship required",
        value: "No (per candidate)",
        status: "needs_review",
      },
    ],
  },
  {
    label: "Education",
    items: [
      { label: "MS Business Analytics", value: "Syracuse University · May 2025", status: "verified" },
      { label: "MBA", value: "Narsee Monjee Institute · Aug 2022", status: "verified" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { label: "Relocation", value: "Willing to relocate", status: "verified" },
      { label: "Work mode", value: "Remote or onsite", status: "verified" },
      { label: "Start date", value: "One week from application date", status: "verified" },
    ],
  },
];

export const mockEvidence: EvidenceClaim[] = [
  {
    id: "ev_pipeline",
    skillLabel: "Production data pipelines",
    statement:
      "Built and deployed a production data pipeline using Python, SQL, and PySpark, extracting and processing thousands of transaction records and applying statistical matching logic.",
    source: "Supreme Lending (Everett Financial, Inc.)",
    skills: ["Python", "SQL", "PySpark", "Data pipelines"],
    status: "verified",
    approvedForResume: true,
  },
  {
    id: "ev_llm",
    skillLabel: "LLM application development",
    statement:
      "Developed an AI-driven data-extraction model using the Claude API, validating output against a MISMO schema before it reached downstream systems.",
    source: "Supreme Lending (Everett Financial, Inc.)",
    skills: ["Claude API", "LLM", "Schema validation", "CI/CD"],
    status: "verified",
    approvedForResume: true,
  },
  {
    id: "ev_etl",
    skillLabel: "ETL at scale",
    statement:
      "Ran ETL pipelines using PySpark and Airflow, processing 1M+ records with multi-layer data-quality controls.",
    source: "Syracuse University",
    skills: ["PySpark", "Airflow", "ETL", "Data quality"],
    status: "verified",
    approvedForResume: true,
  },
  {
    id: "ev_reporting",
    skillLabel: "Requirements gathering & reporting",
    statement:
      "Coordinated cross-functional analytics engagements across 20+ regional markets, consolidating fragmented data into a unified SQL-to-Power BI reporting infrastructure, reducing cycle time by 40%.",
    source: "Freyr Solutions",
    skills: ["Requirements gathering", "SQL", "Power BI", "Cross-functional coordination"],
    status: "verified",
    approvedForResume: true,
  },
  {
    id: "ev_forecasting",
    skillLabel: "Demand forecasting",
    statement:
      "Created a regression-based demand-forecasting model using Python and SQL, tuning hyperparameters and validating business hypotheses against historical sales data to improve planning accuracy by 25%.",
    source: "Omnicals Pharma",
    skills: ["Regression", "Python", "SQL", "Hyperparameter tuning"],
    status: "verified",
    approvedForResume: true,
  },
  {
    id: "ev_coursework",
    skillLabel: "ML techniques (coursework)",
    statement:
      "Applied statistical and machine-learning techniques in coursework, including regression-based demand forecasting and hypothesis testing.",
    source: "Syracuse University",
    skills: ["Statistics", "Machine learning"],
    status: "needs_review",
    approvedForResume: true,
  },
];
