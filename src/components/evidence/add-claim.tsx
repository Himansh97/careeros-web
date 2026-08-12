"use client";

import { EvidenceCapture } from "@/components/resume/evidence-capture";

/**
 * Add a claim from the vault itself.
 *
 * Thin wrapper over the same dialog the resume-gap prompt uses — one form, one
 * set of guarantees. A second implementation would drift, and the rules it
 * enforces (unapproved by default, designed work never resume-eligible) are
 * not rules worth having two copies of.
 */
export function AddClaim() {
  return <EvidenceCapture label="Add claim" />;
}
