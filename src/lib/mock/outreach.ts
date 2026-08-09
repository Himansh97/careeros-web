import type { RecruiterContact } from "@/types/outreach";

/** Illustrative mock data — see src/lib/mock/jobs.ts. Names are fictional. */
export const mockContacts: RecruiterContact[] = [
  {
    id: "contact_datadog",
    name: "Priya Nair",
    title: "Senior Technical Recruiter, Data",
    companyName: "Datadog",
    jobId: "job_datadog_de",
    jobTitle: "Data Engineer",
    linkedinUrl: "https://www.linkedin.com/in/example-priya-nair/",
    email: "p.nair@example.com",
    emailVerified: true,
    confidence: 91,
    whySelected: [
      "Listed as the recruiter on this requisition",
      "Recruits specifically for data engineering roles",
      "Based in the New York office, matching this posting",
    ],
    channel: "email",
    status: "drafted",
    emailDraft:
      "Hi Priya — I just applied for the Data Engineer role at Datadog.\n\nThe pipeline ownership focus stood out: at Supreme Lending I built and deployed a production Python/SQL/PySpark pipeline processing thousands of transaction records, and at Freyr Solutions I consolidated fragmented reporting across 20+ markets and cut cycle time 40%.\n\nHappy to share more detail if useful.\n\nBest,\nHimanshu Srivastava",
    linkedinDraft:
      "Hi Priya — I just applied for the Data Engineer role at Datadog. My background is production data pipelines (Python/SQL/PySpark) plus data-quality controls at scale — would love to connect.",
  },
  {
    id: "contact_notion",
    name: "Marcus Webb",
    title: "Talent Partner, Operations",
    companyName: "Notion",
    jobId: "job_notion_ba",
    jobTitle: "Business Analyst, Operations",
    linkedinUrl: "https://www.linkedin.com/in/example-marcus-webb/",
    emailVerified: false,
    confidence: 74,
    whySelected: [
      "Talent partner for the Operations org",
      "No individual recruiter named on the requisition itself",
    ],
    channel: "linkedin",
    status: "queued_manual",
    linkedinDraft:
      "Hi Marcus — I just applied for the Business Analyst, Operations role at Notion. Requirements gathering and process design across cross-functional teams is the core of my last three roles — would love to connect.",
  },
  {
    id: "contact_airtable",
    name: "Jordan Lee",
    title: "Technical Recruiter",
    companyName: "Airtable",
    jobId: "job_airtable_ba",
    jobTitle: "Business Analyst",
    linkedinUrl: "https://www.linkedin.com/in/example-jordan-lee/",
    email: "jordan.lee@example.com",
    emailVerified: true,
    confidence: 88,
    whySelected: ["Named on the posting", "Recruits for analytics and operations roles"],
    channel: "email",
    status: "sent",
    lastContactAt: "2026-07-30T08:30:00Z",
    followUpDueAt: "2026-08-11T09:00:00Z",
    sentMessage: {
      channel: "email",
      at: "2026-07-30T08:30:00Z",
      body:
        "Hi Jordan — I applied for the Business Analyst role at Airtable last week.\n\nThe operations focus lined up closely with my last few years: at Freyr Solutions I gathered requirements across 20+ regional markets and consolidated fragmented reporting into a single SQL-to-Power BI pipeline, cutting cycle time 40%.\n\nHappy to share more if it's useful.\n\nBest,\nHimanshu Srivastava",
    },
  },
  {
    id: "contact_brex",
    name: "Sam Oduya",
    title: "Recruiting Lead, Data & Platform",
    companyName: "Brex",
    jobId: "job_brex_de",
    jobTitle: "Data Engineer",
    linkedinUrl: "https://www.linkedin.com/in/example-sam-oduya/",
    email: "s.oduya@example.com",
    emailVerified: true,
    confidence: 93,
    whySelected: ["Named on the posting", "Leads recruiting for the data org"],
    channel: "email",
    status: "replied",
    lastContactAt: "2026-07-19T09:30:00Z",
    sentMessage: {
      channel: "email",
      at: "2026-07-19T09:30:00Z",
      body:
        "Hi Sam — I applied for the Data Engineer role at Brex yesterday.\n\nThe pipeline ownership scope stood out. At Supreme Lending I built and deployed a production Python/SQL/PySpark pipeline processing thousands of transaction records, and ran ETL over 1M+ records with multi-layer data-quality controls at Syracuse.\n\nWould welcome the chance to talk.\n\nBest,\nHimanshu Srivastava",
    },
    reply: {
      channel: "email",
      at: "2026-07-22T14:00:00Z",
      body:
        "Hi Himanshu — thanks for reaching out, and good timing. Your pipeline background looks like a fit for what this team needs.\n\nI'd like to set up a 30-minute intro call this week. Are you free Thursday or Friday afternoon CT?\n\nBest,\nSam",
    },
  },
  {
    id: "contact_vercel",
    name: "Alicia Chen",
    title: "Technical Recruiter",
    companyName: "Vercel",
    jobId: "job_vercel_da",
    jobTitle: "Data Analyst",
    linkedinUrl: "https://www.linkedin.com/in/example-alicia-chen/",
    email: "a.chen@example.com",
    emailVerified: true,
    confidence: 90,
    whySelected: ["Named on the posting", "Handled the recruiter screen directly"],
    channel: "email",
    status: "replied",
    lastContactAt: "2026-07-12T10:00:00Z",
    sentMessage: {
      channel: "email",
      at: "2026-07-12T10:00:00Z",
      body:
        "Hi Alicia — I applied for the Data Analyst role at Vercel earlier this month.\n\nThe go-to-market analytics scope matched my background well: I've owned reporting infrastructure end-to-end (SQL, Power BI, Tableau) and built regression-based forecasting models that improved planning accuracy 25%.\n\nHappy to send anything else that would help.\n\nBest,\nHimanshu Srivastava",
    },
    reply: {
      channel: "email",
      at: "2026-07-14T09:20:00Z",
      body:
        "Hi Himanshu — thanks for following up. I've shared your resume with the hiring manager and we'd like to move ahead with a recruiter screen.\n\nI'll send over scheduling options shortly.\n\nAlicia",
    },
  },
];
