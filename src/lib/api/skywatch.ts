import { apiFetch } from "@/lib/api/client";

/**
 * Live sky data, proxied by the backend from public sources.
 *
 * `failures` names any feed that could not be read this cycle. The UI must
 * omit those readings rather than showing the last known value — a stale
 * number carrying a fresh timestamp is the specific failure mode that makes
 * live data worse than none.
 */
export interface CloseApproach {
  designation: string;
  date: string;
  distanceKm: number;
  distanceAu: number;
  lunarDistances: number;
  velocityKmS: number;
  magnitudeH: number | null;
}

export interface Geomagnetic {
  kp: number;
  level: string;
  observedAt: string;
}

export interface IssPosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmH: number;
  daylight: boolean;
}

export interface Skywatch {
  approaches?: CloseApproach[];
  geomagnetic?: Geomagnetic;
  iss?: IssPosition;
  failures: string[];
  readAt: string;
  sources: Record<string, string>;
}

export const getSkywatch = () => apiFetch<Skywatch>("/api/skywatch");
