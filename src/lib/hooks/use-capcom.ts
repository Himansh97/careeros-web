"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listAlerts, listSkillGaps } from "@/lib/api/ops";
import { listApprovals } from "@/lib/api/approvals";
import { listEvidence } from "@/lib/api/evidence";
import { isLiveApi } from "@/lib/api/client";

/**
 * What CAPCOM has to say about the screen you are on.
 *
 * CAPCOM is the one voice that talks to the crew — every other station reports
 * through them. That is the right shape for an assistant here: it does not hold
 * opinions, it relays readings from stations that do.
 *
 * **Every line traces to an endpoint.** No encouragement, no persona, no
 * invented commentary. The product's whole claim is that it tells the truth
 * when the truth is unflattering, and an assistant is the easiest place in an
 * interface to break that — one cheerful line beside "0 interviews" and the
 * thing becomes a toy.
 *
 * Context comes from the route, because what is worth saying on the approvals
 * queue is not what is worth saying on a resume.
 */
export interface CapcomLine {
  /** Which station the reading came from — shown, so it can be checked. */
  station: string;
  text: string;
  tone: "nominal" | "caution" | "flat";
  href?: string;
  action?: string;
}

export function useCapcom(): { lines: CapcomLine[]; loading: boolean } {
  const pathname = usePathname();
  const live = isLiveApi();

  const alerts = useQuery({ queryKey: ["alerts"], queryFn: listAlerts, enabled: live });
  const approvals = useQuery({
    queryKey: ["approvals", "capcom"],
    queryFn: listApprovals,
    enabled: live,
  });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: listEvidence, enabled: live });
  const gaps = useQuery({ queryKey: ["skill-gaps"], queryFn: listSkillGaps, enabled: live });

  const loading = alerts.isLoading || approvals.isLoading;
  const lines: CapcomLine[] = [];

  if (!live) {
    return {
      loading: false,
      lines: [
        {
          station: "FLIGHT",
          tone: "caution",
          text: "No backend on :8000. Nothing on screen is a real reading until it is running.",
        },
      ],
    };
  }

  const funnel = alerts.data?.ok ? alerts.data.data.funnel : null;
  const alertList = alerts.data?.ok ? alerts.data.data.alerts : [];
  const urgent = alerts.data?.ok ? alerts.data.data.high : 0;
  const pending = approvals.data?.ok
    ? approvals.data.data.filter((a) => a.status === "pending")
    : [];
  const held = pending.filter((a) => a.commit?.verdict === "nogo").length;
  const clear = pending.filter((a) => a.commit?.verdict === "go").length;

  // The urgent item leads everywhere. If something is genuinely blocking, it
  // outranks whatever page happens to be open.
  const topUrgent = alertList.find((a) => a.severity === "high");
  if (topUrgent) {
    lines.push({
      station: "CAUTION",
      tone: "caution",
      text: `${topUrgent.title}. ${topUrgent.action}.`,
      href: "/dashboard",
      action: "See all alerts",
    });
  }

  if (pathname.startsWith("/approvals")) {
    if (held > 0) {
      lines.push({
        station: "TRAJECTORY",
        tone: "caution",
        text: `${held} of ${pending.length} cannot proceed as they stand. Clearing them takes one action.`,
      });
    }
    if (clear > 0) {
      lines.push({
        station: "TRAJECTORY",
        tone: "nominal",
        text: `${clear} passed every commit criterion. Nothing blocks those — CareerOS does not submit, so that part is yours.`,
      });
    }
  } else if (pathname.startsWith("/jobs")) {
    lines.push({
      station: "FIDO",
      tone: "flat",
      text: "Sort by Worth doing next to weigh posting age and application effort, not fit alone.",
    });
  } else if (pathname.startsWith("/resume")) {
    lines.push({
      station: "EECOM",
      tone: "flat",
      text: "Approving a resume starts the recruiter research for that employer. It drafts; it never sends.",
    });
  } else if (pathname.startsWith("/outreach") || pathname.startsWith("/contacts")) {
    lines.push({
      station: "CAPCOM",
      tone: "flat",
      text: "Drafts here are never sent automatically. Every one waits for you.",
    });
  } else {
    if (funnel) {
      lines.push({
        station: "CREW",
        tone: funnel.interviews > 0 ? "nominal" : "flat",
        text:
          funnel.responded === 0 && funnel.submitted > 0
            ? `${funnel.submitted} submitted, no responses yet. ${funnel.note}`
            : `${funnel.submitted} submitted, ${funnel.responded} responded, ${funnel.interviews} interviews.`,
        href: "/review",
        action: "Open the review",
      });
    }
    if (clear > 0) {
      lines.push({
        station: "TRAJECTORY",
        tone: "nominal",
        text: `${clear} application${clear === 1 ? "" : "s"} cleared and unsent.`,
        href: "/approvals",
        action: "Open the queue",
      });
    }
  }

  // Worth raising anywhere: closing an evidence gap improves every future
  // resume rather than a single application.
  const gap = gaps.data?.ok ? gaps.data.data.gaps[0] : null;
  const claims = evidence.data?.ok ? evidence.data.data.claims.length : 0;
  if (gap && lines.length < 4) {
    lines.push({
      station: "CONSUMABLES",
      tone: "flat",
      text: `${gap.skill} is missing from ${gap.shareOfTargets}% of your target roles. ${claims} claims on file.`,
      href: "/analytics",
      action: "Close the gap",
    });
  }

  if (!loading && lines.length === 0 && urgent === 0) {
    lines.push({
      station: "FLIGHT",
      tone: "nominal",
      text: "All stations nominal. Nothing outstanding.",
    });
  }

  return { lines, loading };
}
