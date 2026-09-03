/**
 * Which market job discovery is pointed at.
 *
 * A region is not a filter over one pool: switching it changes which sources
 * are read and invalidates the snapshot on the server. The India region rests
 * entirely on the JobDataLake aggregator, so `configured` can be false, and a
 * region that is not configured must not be selectable — the direct board
 * readers are US employers, and showing them under an India heading would be
 * exactly the plausible-wrong-answer this app refuses everywhere else.
 */
import { apiFetch } from "./client";

export interface Region {
  id: string;
  label: string;
  configured: boolean;
  /** The env var the region needs, when it needs one. */
  requires: string | null;
}

export interface RegionState {
  active: string;
  regions: Region[];
  aggregatorConfigured: boolean;
}

export async function getRegions() {
  return apiFetch<RegionState>("/api/regions");
}

export async function setRegion(region: string) {
  return apiFetch<{ active: string; note: string }>("/api/regions", {
    method: "POST",
    body: JSON.stringify({ region }),
  });
}
