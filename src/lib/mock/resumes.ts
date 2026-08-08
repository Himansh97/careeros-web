import type { ResumeVersion } from "@/types/resume";

/**
 * Illustrative mock data — see src/lib/mock/jobs.ts. Bullet content mirrors
 * the real evidence-backed tailoring approach (career_evidence.json) rather
 * than inventing generic filler: every changed bullet traces to a real
 * accomplishment, reworded/reordered for relevance, never fabricated.
 */
export const mockResumes: Record<string, ResumeVersion> = {
  job_datadog_de: {
    jobId: "job_datadog_de",
    jobTitle: "Data Engineer",
    companyName: "Datadog",
    version: 3,
    status: "ready",
    rawFitScore: 88,
    resumeScore: 92,
    scoreHistory: [81, 87, 92],
    updatedAt: "2026-08-08T18:10:00Z",
    sections: [
      {
        id: "supreme-lending",
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        bullets: [
          {
            id: "sl-1",
            changeType: "reworded",
            originalText:
              "Gathered requirements from accounting stakeholders and delivered a data analytics solution automating the matching of financial records across thousands of accounts, replacing a fully manual process.",
            text:
              "Owned a production data-matching pipeline end-to-end — from stakeholder requirements through deployment — automating reconciliation across thousands of accounts and replacing a fully manual process.",
            whyChanged:
              "Reworded to foreground pipeline ownership language, since 'data pipeline design' and 'end-to-end delivery' both appear as required terms in this JD.",
            evidence: {
              source: "career_evidence.json — supreme-lending-01",
              verifiedStatement:
                "Gathered requirements from accounting stakeholders and built a data analytics solution that automates the matching of financial accounting records across thousands of accounts, replacing a fully manual process.",
              usedToSupport: "Data pipeline design, end-to-end solutioning",
            },
          },
          {
            id: "sl-2",
            changeType: "unchanged",
            text:
              "Built and deployed a production data pipeline (Python, SQL, PySpark), extracting and processing thousands of transaction records with statistical matching logic.",
          },
          {
            id: "sl-3",
            changeType: "reordered",
            text:
              "Developed an AI-driven data-extraction model using the Claude API, validating output against a MISMO schema and supporting deployment through CI/CD practices.",
            whyChanged: "Moved up — CI/CD appears explicitly in the JD's responsibilities list.",
            evidence: {
              source: "career_evidence.json — supreme-lending-03",
              verifiedStatement:
                "Developed an AI-driven data-extraction model using the Claude API, validating output against a MISMO schema before it reached downstream systems, and supported code deployment through CI/CD practices.",
              usedToSupport: "CI/CD",
            },
          },
          {
            id: "sl-4",
            changeType: "unchanged",
            text:
              "Diagnosed and resolved a multi-day production issue spanning six failed deployments and four distinct root causes through rigorous, data-driven troubleshooting.",
          },
        ],
      },
      {
        id: "syracuse",
        heading: "Data Analyst and Machine Learning Intern — Syracuse University",
        subheading: "Jul 2025 – May 2026",
        bullets: [
          {
            id: "syr-1",
            changeType: "unchanged",
            text:
              "Ran ETL pipelines (PySpark, Airflow) processing 1M+ records with multi-layer data-quality controls; automated SQL/Python workflows for 50,000+ records.",
          },
          {
            id: "syr-2",
            changeType: "reordered",
            text:
              "Applied statistical and machine-learning techniques, including regression-based demand forecasting and hypothesis testing, to validate business assumptions against historical data.",
            whyChanged: "Moved below the ETL bullet — pipeline work is more directly relevant to this JD than modeling coursework.",
          },
        ],
      },
      {
        id: "freyr",
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        bullets: [
          {
            id: "fr-1",
            changeType: "unchanged",
            text:
              "Coordinated cross-functional analytics engagements across 20+ regional markets, building a unified SQL-to-Power BI reporting infrastructure — reducing cycle time by 40%.",
          },
        ],
      },
    ],
    audit: {
      overall: 92,
      decision: "SHORTLIST",
      categories: [
        { key: "requirement_coverage", label: "Requirement coverage", score: 23, max: 25 },
        { key: "relevant_experience", label: "Relevant experience", score: 19, max: 20 },
        { key: "technical_skills", label: "Technical skills", score: 14, max: 15 },
        { key: "achievements", label: "Achievements", score: 9, max: 10 },
        { key: "readability", label: "Readability", score: 9, max: 10 },
        { key: "ats_structure", label: "ATS structure", score: 10, max: 10 },
        { key: "keyword_alignment", label: "Keyword alignment", score: 4, max: 5 },
        { key: "education", label: "Education", score: 4, max: 5 },
      ],
      whatWorks: [
        "Pipeline ownership language now mirrors the JD's own phrasing without overstating scope.",
        "CI/CD and data-quality-control evidence is now visible in the first third of the resume.",
        "Every changed bullet still traces to a specific, verifiable accomplishment.",
      ],
      concerns: [
        "No direct dbt evidence — flagged as a gap rather than implied through adjacent PySpark experience.",
      ],
    },
  },

  job_notion_ba: {
    jobId: "job_notion_ba",
    jobTitle: "Business Analyst, Operations",
    companyName: "Notion",
    version: 2,
    status: "approved",
    rawFitScore: 91,
    resumeScore: 94,
    scoreHistory: [86, 94],
    updatedAt: "2026-08-07T14:30:00Z",
    sections: [
      {
        id: "freyr",
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        bullets: [
          {
            id: "fr-1",
            changeType: "reworded",
            originalText:
              "Coordinated cross-functional analytics engagements across 20+ regional markets, gathering requirements and consolidating fragmented data into a unified SQL-to-Power BI reporting infrastructure, reducing cycle time by 40%.",
            text:
              "Led requirements gathering and process design across 20+ regional markets — consolidating fragmented workflows into a unified reporting infrastructure and cutting cycle time 40%.",
            whyChanged: "Tightened to lead with 'requirements gathering' and 'process design,' both named directly in the JD.",
            evidence: {
              source: "career_evidence.json — freyr-01",
              verifiedStatement:
                "Coordinated cross-functional analytics engagements across 20+ regional markets, gathering requirements and consolidating fragmented data into a unified SQL-to-Power BI reporting infrastructure, reducing cycle time by 40%.",
              usedToSupport: "Requirements gathering, process design",
            },
          },
          {
            id: "fr-2",
            changeType: "unchanged",
            text: "Mentored junior analysts on data-quality best practices, reducing inconsistency in weekly client deliverables.",
          },
        ],
      },
      {
        id: "supreme-lending",
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        bullets: [
          {
            id: "sl-1",
            changeType: "unchanged",
            text:
              "Gathered requirements from accounting stakeholders and delivered a data analytics solution automating financial-record matching across thousands of accounts.",
          },
        ],
      },
    ],
    audit: {
      overall: 94,
      decision: "SHORTLIST",
      categories: [
        { key: "requirement_coverage", label: "Requirement coverage", score: 25, max: 25 },
        { key: "relevant_experience", label: "Relevant experience", score: 19, max: 20 },
        { key: "technical_skills", label: "Technical skills", score: 13, max: 15 },
        { key: "achievements", label: "Achievements", score: 9, max: 10 },
        { key: "readability", label: "Readability", score: 10, max: 10 },
        { key: "ats_structure", label: "ATS structure", score: 10, max: 10 },
        { key: "keyword_alignment", label: "Keyword alignment", score: 5, max: 5 },
        { key: "education", label: "Education", score: 3, max: 5 },
      ],
      whatWorks: [
        "Requirements-gathering and process-design language matches the JD almost verbatim, honestly.",
        "Two independent employers both evidence the same core skill — reads as a consistent pattern, not a one-off.",
        "Concise — every bullet earns its place.",
      ],
      concerns: ["No formal 'Business Analyst' title in the work history — closest is 'Reporting Lead.'"],
    },
  },

  job_attio_data_analyst: {
    jobId: "job_attio_data_analyst",
    jobTitle: "Data Analyst",
    companyName: "Attio",
    version: 1,
    status: "draft",
    rawFitScore: 84,
    resumeScore: 89,
    scoreHistory: [89],
    updatedAt: "2026-08-06T09:00:00Z",
    sections: [
      {
        id: "omnicals",
        heading: "Business Analyst and Data Analytics Associate — Omnicals Pharma",
        subheading: "Jun 2021 – Oct 2022",
        bullets: [
          {
            id: "om-1",
            changeType: "unchanged",
            text:
              "Built a standardized data-cleansing pipeline across three inconsistent source systems using statistical modeling and feature engineering, improving data quality by 70%.",
          },
          {
            id: "om-2",
            changeType: "unchanged",
            text:
              "Created a regression-based demand-forecasting model (Python, SQL), tuning hyperparameters and validating business hypotheses against historical sales data to improve planning accuracy by 25%.",
          },
        ],
      },
    ],
    audit: {
      overall: 89,
      decision: "REVIEW",
      categories: [
        { key: "requirement_coverage", label: "Requirement coverage", score: 22, max: 25 },
        { key: "relevant_experience", label: "Relevant experience", score: 17, max: 20 },
        { key: "technical_skills", label: "Technical skills", score: 15, max: 15 },
        { key: "achievements", label: "Achievements", score: 8, max: 10 },
        { key: "readability", label: "Readability", score: 9, max: 10 },
        { key: "ats_structure", label: "ATS structure", score: 10, max: 10 },
        { key: "keyword_alignment", label: "Keyword alignment", score: 4, max: 5 },
        { key: "education", label: "Education", score: 4, max: 5 },
      ],
      whatWorks: [
        "Quantified accomplishments (70%, 25%) are specific enough to read as credible, not generic.",
      ],
      concerns: [
        "No Looker evidence — a preferred, not required, skill, so left as a disclosed gap.",
        "Draft — hasn't been through a second recruiter-audit iteration yet.",
      ],
    },
  },
};
