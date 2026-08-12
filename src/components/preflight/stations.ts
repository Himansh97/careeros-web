import { getHealth } from "@/lib/api/health";
import { getProfile } from "@/lib/api/profile";
import { getAutomation, listAlerts } from "@/lib/api/ops";

/**
 * The pre-flight poll, station by station.
 *
 * A launch status check is a real procedure: before commit, each flight
 * controller reports the readiness of their own system, and any single NO-GO
 * halts the launch regardless of what every other station said. It is not
 * ceremony — a dissenting controller has genuine authority to stop it.
 *
 * That is already how this product behaves. A single eligibility knockout kills
 * a 96-fit role outright; the approvals queue is a controller with a veto.
 *
 * **Every check here is real.** A poll that always reports GO is a loading
 * screen wearing a costume, and it would be the one dishonest surface in an
 * application built entirely around refusing to overstate things. When a source
 * is down, FIDO says so and names it.
 */
export type Verdict = "go" | "caution" | "nogo" | "pending";

export interface Station {
  /** The flight-controller call sign, used as its label. */
  call: string;
  /** What that controller is actually responsible for, in plain words. */
  responsibility: string;
  verdict: Verdict;
  /** One line of real detail — counts, names, what failed. */
  readout: string;
}

const PENDING: Verdict = "pending";

export const STATION_ORDER = ["FLIGHT", "FIDO", "EECOM", "GUIDANCE", "CAPCOM"] as const;

export function initialStations(): Station[] {
  return [
    { call: "FLIGHT", responsibility: "Backend reachable", verdict: PENDING, readout: "" },
    { call: "FIDO", responsibility: "Job sources", verdict: PENDING, readout: "" },
    { call: "EECOM", responsibility: "Evidence file", verdict: PENDING, readout: "" },
    { call: "GUIDANCE", responsibility: "Autopilot", verdict: PENDING, readout: "" },
    { call: "CAPCOM", responsibility: "Outstanding items", verdict: PENDING, readout: "" },
  ];
}

/** FLIGHT — is the backend answering at all? Everything else depends on it. */
async function flight(): Promise<Station> {
  const res = await getHealth();
  if (!res.ok) {
    return {
      call: "FLIGHT",
      responsibility: "Backend reachable",
      verdict: "nogo",
      readout:
        res.reason === "not_connected"
          ? "No response on :8000 — start careeros-api"
          : "API returned an error",
    };
  }
  return {
    call: "FLIGHT",
    responsibility: "Backend reachable",
    verdict: "go",
    readout: `${res.data.sources.length} sources configured`,
  };
}

/**
 * FIDO — the flight dynamics officer owns trajectory. Here: are the job
 * sources actually returning data, and which ones failed?
 *
 * Caution rather than NO-GO when some sources fail: the pool is still usable,
 * and calling a partial outage a full stop would be the same overstatement in
 * the other direction.
 */
async function fido(): Promise<Station> {
  const res = await getHealth();
  if (!res.ok) {
    return {
      call: "FIDO",
      responsibility: "Job sources",
      verdict: "nogo",
      readout: "Cannot reach the source pool",
    };
  }
  const counts = res.data.lastFetchCounts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const failed = res.data.failedSources ?? [];

  if (total === 0) {
    return {
      call: "FIDO",
      responsibility: "Job sources",
      verdict: "nogo",
      readout: "No postings in the pool",
    };
  }
  if (failed.length > 0) {
    // Name them. "Some sources failed" is the kind of vague status this
    // product exists not to produce.
    const names = failed.map((f) => f.split(":")[0]).slice(0, 3).join(", ");
    return {
      call: "FIDO",
      responsibility: "Job sources",
      verdict: "caution",
      readout: `${total.toLocaleString()} postings · ${failed.length} source${
        failed.length === 1 ? "" : "s"
      } down: ${names}${failed.length > 3 ? "…" : ""}`,
    };
  }
  return {
    call: "FIDO",
    responsibility: "Job sources",
    verdict: "go",
    readout: `${total.toLocaleString()} postings, all sources reporting`,
  };
}

/** EECOM — consumables. Here: the evidence file every resume claim traces to. */
async function eecom(): Promise<Station> {
  const res = await getProfile();
  if (!res.ok) {
    return {
      call: "EECOM",
      responsibility: "Evidence file",
      verdict: "nogo",
      readout: "career_evidence.json not readable — nothing can be tailored",
    };
  }
  const claims = res.data.evidence ?? [];
  const approved = claims.filter((c) => c.approvedForResume).length;
  return {
    call: "EECOM",
    responsibility: "Evidence file",
    verdict: claims.length > 0 ? "go" : "nogo",
    readout: `${claims.length} claims · ${approved} cleared for resumes`,
  };
}

/** GUIDANCE — is the automation running, and when did it last complete? */
async function guidance(): Promise<Station> {
  const res = await getAutomation();
  if (!res.ok) {
    return {
      call: "GUIDANCE",
      responsibility: "Autopilot",
      verdict: "caution",
      readout: "Automation state unavailable",
    };
  }
  const last = res.data.lastRun;
  if (res.data.running) {
    return {
      call: "GUIDANCE",
      responsibility: "Autopilot",
      verdict: "go",
      readout: "Run in progress",
    };
  }
  return {
    call: "GUIDANCE",
    responsibility: "Autopilot",
    verdict: "go",
    readout: last?.finishedAt
      ? `Idle · last run ${new Date(last.finishedAt).toLocaleDateString()}`
      : "Idle · no run recorded",
  };
}

/**
 * CAPCOM — the one voice that talks to the crew. Here: what is waiting on the
 * candidate, which is the only station whose answer is an instruction.
 */
async function capcom(): Promise<Station> {
  const res = await listAlerts();
  if (!res.ok) {
    return {
      call: "CAPCOM",
      responsibility: "Outstanding items",
      verdict: "caution",
      readout: "Cannot read outstanding items",
    };
  }
  const { alerts, high } = res.data;
  if (high > 0) {
    return {
      call: "CAPCOM",
      responsibility: "Outstanding items",
      verdict: "caution",
      readout: `${high} urgent, ${alerts.length} total waiting on you`,
    };
  }
  return {
    call: "CAPCOM",
    responsibility: "Outstanding items",
    verdict: "go",
    readout: alerts.length > 0 ? `${alerts.length} items waiting` : "Nothing outstanding",
  };
}

export const CHECKS: (() => Promise<Station>)[] = [
  flight,
  fido,
  eecom,
  guidance,
  capcom,
];

/**
 * The commit decision.
 *
 * Any single NO-GO holds, exactly as a launch status check does. Caution does
 * not hold — a degraded source is a fact worth stating, not a reason to stop
 * someone opening their own job search.
 */
export function commit(stations: Station[]): Verdict {
  if (stations.some((s) => s.verdict === "nogo")) return "nogo";
  if (stations.some((s) => s.verdict === "caution")) return "caution";
  if (stations.every((s) => s.verdict === "go")) return "go";
  return "pending";
}
