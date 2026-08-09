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

  ...buildPipelineResumes(),
};

/**
 * Resume versions for applications already moving through the pipeline
 * (see src/lib/mock/applications.ts). These exist so "View resume" resolves
 * instead of dead-ending. Each draws on the same real evidence pool, framed
 * for its specific role — which is how tailoring actually works: the
 * accomplishments don't change, the emphasis does.
 */
function buildPipelineResumes(): Record<string, ResumeVersion> {
  const specs: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    version: number;
    status: ResumeVersion["status"];
    rawFitScore: number;
    resumeScore: number;
    scoreHistory: number[];
    updatedAt: string;
    lead: { heading: string; subheading: string; bullet: string; original?: string; why?: string };
    support: { heading: string; subheading: string; bullet: string };
    works: string[];
    concerns: string[];
  }[] = [
    {
      jobId: "job_figma_da",
      jobTitle: "Data Analyst",
      companyName: "Figma",
      version: 2,
      status: "ready",
      rawFitScore: 82,
      resumeScore: 90,
      scoreHistory: [84, 90],
      updatedAt: "2026-07-31T08:00:00Z",
      lead: {
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        original:
          "Coordinated cross-functional analytics engagements across 20+ regional markets, gathering requirements and consolidating fragmented data into a unified SQL-to-Power BI reporting infrastructure, reducing cycle time by 40%.",
        bullet:
          "Built self-serve reporting for 20+ regional markets — defining the metrics, consolidating fragmented sources into one SQL-to-Power BI layer, and cutting cycle time 40%.",
        why: "Reframed around self-serve reporting and metric definition, which are this JD's two named responsibilities.",
      },
      support: {
        heading: "Business Analyst and Data Analytics Associate — Omnicals Pharma",
        subheading: "Jun 2021 – Oct 2022",
        bullet:
          "Created a regression-based demand-forecasting model (Python, SQL), improving planning accuracy by 25%.",
      },
      works: [
        "Leads with self-serve reporting, matching the JD's primary responsibility.",
        "Metric-definition framing is accurate — that work genuinely included defining what was measured.",
      ],
      concerns: ["No product-analytics tooling (Amplitude) evidence — disclosed as a gap."],
    },
    {
      jobId: "job_linear_ae",
      jobTitle: "Analytics Engineer",
      companyName: "Linear",
      version: 2,
      status: "approved",
      rawFitScore: 80,
      resumeScore: 91,
      scoreHistory: [83, 91],
      updatedAt: "2026-07-27T10:00:00Z",
      lead: {
        heading: "Data Analyst and Machine Learning Intern — Syracuse University",
        subheading: "Jul 2025 – May 2026",
        original:
          "Ran ETL pipelines using PySpark and Airflow, processing 1M+ records with multi-layer data-quality controls, and automated SQL/Python workflows for 50,000+ records.",
        bullet:
          "Modeled and transformed 1M+ records through PySpark and Airflow pipelines with multi-layer data-quality controls at each stage.",
        why: "Emphasized modeling and transformation over raw throughput — this role is about the analytics layer, not ingestion volume.",
      },
      support: {
        heading: "Business Analyst and Data Analytics Associate — Omnicals Pharma",
        subheading: "Jun 2021 – Oct 2022",
        bullet:
          "Built a standardized data-cleansing pipeline across three inconsistent source systems, improving data quality by 70%.",
      },
      works: [
        "Data-quality controls are evidenced twice across different employers — reads as a consistent practice.",
        "Transformation framing matches how the role actually describes the work.",
      ],
      concerns: ["No dbt evidence — the one tool this role names that isn't backed."],
    },
    {
      jobId: "job_airtable_ba",
      jobTitle: "Business Analyst",
      companyName: "Airtable",
      version: 2,
      status: "approved",
      rawFitScore: 86,
      resumeScore: 92,
      scoreHistory: [87, 92],
      updatedAt: "2026-07-22T11:00:00Z",
      lead: {
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        original:
          "Gathered requirements from accounting stakeholders and delivered a data analytics solution automating financial-record matching across thousands of accounts.",
        bullet:
          "Turned an ambiguous manual reconciliation problem into a scoped, measurable solution — gathering requirements from accounting stakeholders and automating matching across thousands of accounts.",
        why: "Reframed to lead with 'ambiguous problem → scoped and measurable,' which is the JD's own description of the job.",
      },
      support: {
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        bullet:
          "Coordinated analytics engagements across 20+ regional markets, reducing reporting cycle time by 40%.",
      },
      works: [
        "Opens by mirroring the JD's framing of the role without overstating scope.",
        "Both bullets carry a quantified outcome.",
      ],
      concerns: ["Operations-specific domain experience is adjacent rather than direct."],
    },
    {
      jobId: "job_brex_de",
      jobTitle: "Data Engineer",
      companyName: "Brex",
      version: 3,
      status: "approved",
      rawFitScore: 89,
      resumeScore: 93,
      scoreHistory: [82, 88, 93],
      updatedAt: "2026-07-17T10:00:00Z",
      lead: {
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        original:
          "Built and deployed a production data pipeline using Python, SQL, and PySpark, extracting and processing thousands of transaction records and applying statistical matching logic.",
        bullet:
          "Built and deployed a production financial-data pipeline (Python, SQL, PySpark) processing thousands of transaction records, with statistical matching logic and correctness checks before records reached downstream systems.",
        why: "Added the financial-data and correctness framing — this JD explicitly weights reliability and correctness over novelty, and the work genuinely involved both.",
      },
      support: {
        heading: "Data Analyst and Machine Learning Intern — Syracuse University",
        subheading: "Jul 2025 – May 2026",
        bullet:
          "Ran ETL pipelines (PySpark, Airflow) over 1M+ records with multi-layer data-quality controls.",
      },
      works: [
        "Financial-data domain match is real, not stretched — the Supreme Lending work is exactly that.",
        "Correctness/reliability emphasis directly answers the JD's stated priority.",
        "Three tailoring iterations, each closing a specific gap rather than padding.",
      ],
      concerns: ["No Kafka evidence — preferred, not required, so disclosed rather than implied."],
    },
    {
      jobId: "job_vercel_da",
      jobTitle: "Data Analyst",
      companyName: "Vercel",
      version: 3,
      status: "approved",
      rawFitScore: 90,
      resumeScore: 95,
      scoreHistory: [86, 91, 95],
      updatedAt: "2026-07-06T09:00:00Z",
      lead: {
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        original:
          "Coordinated cross-functional analytics engagements across 20+ regional markets, gathering requirements and consolidating fragmented data into a unified SQL-to-Power BI reporting infrastructure, reducing cycle time by 40%.",
        bullet:
          "Owned go-to-market reporting end to end across 20+ regional markets — from the questions worth asking through the dashboards leadership actually used — cutting cycle time 40%.",
        why: "Matched the JD's 'end to end, from instrumentation questions through dashboards leadership uses' phrasing, which describes this work accurately.",
      },
      support: {
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        bullet:
          "Presented technical findings to client-facing stakeholders including executive leadership, translating complex workflows into clear decisions.",
      },
      works: [
        "End-to-end ownership framing matches the JD almost exactly, and truthfully.",
        "Executive-communication evidence directly supports the 'dashboards leadership uses' requirement.",
        "No gaps — every named requirement is backed.",
      ],
      concerns: ["Developer-infrastructure domain is new, though the analytical work transfers cleanly."],
    },
    {
      jobId: "job_retool_ba",
      jobTitle: "Business Analyst, Operations",
      companyName: "Retool",
      version: 2,
      status: "approved",
      rawFitScore: 93,
      resumeScore: 96,
      scoreHistory: [90, 96],
      updatedAt: "2026-06-19T10:00:00Z",
      lead: {
        heading: "Business Analytics and Reporting Lead — Freyr Solutions",
        subheading: "Nov 2022 – Jul 2023",
        original:
          "Conducted statistical root-cause analysis on recurring delivery delays, redesigning the workflow to cut timelines by 15%.",
        bullet:
          "Scoped and drove an operational analysis independently — running statistical root-cause analysis on recurring delivery delays and redesigning the workflow to cut timelines 15%.",
        why: "Led with autonomy and ownership, which this JD calls out explicitly ('high autonomy, direct access to decision-makers').",
      },
      support: {
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        bullet:
          "Gathered requirements from accounting stakeholders and delivered a solution replacing a fully manual reconciliation process.",
      },
      works: [
        "Autonomy framing is backed by a real end-to-end owned project, not asserted.",
        "Both operational-analysis and requirements evidence are present, matching the role's two halves.",
        "Highest resume score in the pipeline, with no unbacked claims.",
      ],
      concerns: ["Team size and scope of prior ownership aren't specified in the underlying evidence."],
    },
    {
      jobId: "job_scaleai_ai_eng",
      jobTitle: "AI Engineer",
      companyName: "Scale AI",
      version: 1,
      status: "draft",
      rawFitScore: 61,
      resumeScore: 75,
      scoreHistory: [75],
      updatedAt: "2026-07-04T09:00:00Z",
      lead: {
        heading: "AI Engineer Intern — Supreme Lending",
        subheading: "Jun 2026 – Present",
        bullet:
          "Developed an AI-driven data-extraction model using the Claude API, validating output against a MISMO schema and supporting deployment through CI/CD practices.",
      },
      support: {
        heading: "Data Analyst and Machine Learning Intern — Syracuse University",
        subheading: "Jul 2025 – May 2026",
        bullet:
          "Applied statistical and machine-learning techniques including regression modeling and hypothesis testing.",
      },
      works: ["Real, shipped LLM work exists and is stated plainly."],
      concerns: [
        "Score capped at 75 — this role requires PyTorch and model training at scale, neither of which is evidenced. Closing that gap would require fabrication, so iteration stopped here.",
        "LLM experience here is API integration, not model training — the resume says so rather than blurring the distinction.",
      ],
    },
  ];

  return Object.fromEntries(
    specs.map((s) => [
      s.jobId,
      {
        jobId: s.jobId,
        jobTitle: s.jobTitle,
        companyName: s.companyName,
        version: s.version,
        status: s.status,
        rawFitScore: s.rawFitScore,
        resumeScore: s.resumeScore,
        scoreHistory: s.scoreHistory,
        updatedAt: s.updatedAt,
        sections: [
          {
            id: "lead",
            heading: s.lead.heading,
            subheading: s.lead.subheading,
            bullets: [
              {
                id: `${s.jobId}-lead-1`,
                changeType: s.lead.original ? ("reworded" as const) : ("unchanged" as const),
                text: s.lead.bullet,
                originalText: s.lead.original,
                whyChanged: s.lead.why,
                evidence: s.lead.original
                  ? {
                      source: "career_evidence.json",
                      verifiedStatement: s.lead.original,
                      usedToSupport: `${s.jobTitle} core requirements`,
                    }
                  : undefined,
              },
            ],
          },
          {
            id: "support",
            heading: s.support.heading,
            subheading: s.support.subheading,
            bullets: [
              {
                id: `${s.jobId}-support-1`,
                changeType: "unchanged" as const,
                text: s.support.bullet,
              },
            ],
          },
        ],
        audit: {
          overall: s.resumeScore,
          decision:
            s.resumeScore >= 90
              ? ("SHORTLIST" as const)
              : s.resumeScore >= 80
                ? ("REVIEW" as const)
                : ("REJECT" as const),
          categories: buildCategories(s.resumeScore),
          whatWorks: s.works,
          concerns: s.concerns,
        },
      },
    ])
  );
}

/**
 * Distributes an overall score across the 8 audit categories so the parts
 * always sum to the whole — the inconsistency that a verification pass
 * caught in an earlier hand-written entry.
 */
function buildCategories(overall: number) {
  const maxes: { key: string; label: string; max: number }[] = [
    { key: "requirement_coverage", label: "Requirement coverage", max: 25 },
    { key: "relevant_experience", label: "Relevant experience", max: 20 },
    { key: "technical_skills", label: "Technical skills", max: 15 },
    { key: "achievements", label: "Achievements", max: 10 },
    { key: "readability", label: "Readability", max: 10 },
    { key: "ats_structure", label: "ATS structure", max: 10 },
    { key: "keyword_alignment", label: "Keyword alignment", max: 5 },
    { key: "education", label: "Education", max: 5 },
  ];
  const totalMax = maxes.reduce((n, m) => n + m.max, 0);

  let allocated = 0;
  const categories = maxes.map((m, i) => {
    const isLast = i === maxes.length - 1;
    const score = isLast
      ? overall - allocated
      : Math.min(m.max, Math.round((overall / totalMax) * m.max));
    allocated += score;
    return { ...m, score: Math.max(0, Math.min(m.max, score)) };
  });
  return categories;
}
