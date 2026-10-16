// DEMO: what each member-run check finds about Haddad Catering.
//
// Production sends the check to SAM.gov, the SBA directory or a document reader.
// The demo answers from the story: every check passes, and the fields come from
// the persona. `storyVerification` is the result she already has. `runVerification`
// is what happens when she runs a check again in the demo.

import { PERSONA, PAST_PERFORMANCE } from "@/demo/story/persona";
import type { DemoVerification } from "./state";
import type { VerifyKey } from "./model";

/** "2027-04-15" → "April 15, 2027". */
function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const MESSAGE: Record<VerifyKey, string> = {
  llc: "Your Articles of Organization match your business name.",
  sam: "SAM.gov shows an active registration for your business.",
  sbs: "Your SBA profile is live and matches your business.",
  capability: "Your capability statement covers what buyers expect.",
  sled: "We found each of your registrations.",
  cmmc: "Your CMMC Level 1 self-assessment is on file.",
};

function dataFor(key: VerifyKey, checkedAt: string, inputs?: Record<string, unknown>): unknown {
  switch (key) {
    case "llc":
      return {
        documentType: "Articles of Organization",
        legalName: PERSONA.businessName,
        state: PERSONA.stateOfIncorporation,
        entityType: PERSONA.entityType,
        filingDate: PERSONA.formedOn,
        registeredAgent: PERSONA.ownerName,
      };
    case "sam":
      return {
        legalName: PERSONA.businessName,
        statusText: "Active",
        expirationDate: longDate(PERSONA.samActiveUntil),
        uei: PERSONA.uei,
        cage: PERSONA.cage,
        physicalAddress: PERSONA.physicalAddress,
        primaryNaics: `${PERSONA.primaryNaics} · ${PERSONA.primaryNaicsLabel}`,
      };
    case "sbs":
      return {
        companyName: PERSONA.businessName,
        uei: PERSONA.uei,
        certifications: ["WOSB"],
        primaryNaics: `${PERSONA.primaryNaics} · ${PERSONA.primaryNaicsLabel}`,
        capabilitiesNarrative: `${PERSONA.differentiators[0]}. ${PERSONA.differentiators[1]}. ${PAST_PERFORMANCE.length} jobs delivered since ${PERSONA.formedOn.slice(-4)}.`,
      };
    case "capability":
      return {
        documentType: "Capability Statement",
        companyName: PERSONA.businessName,
        uei: PERSONA.uei,
        cage: PERSONA.cage,
        primaryNaics: `${PERSONA.primaryNaics} · ${PERSONA.primaryNaicsLabel}`,
        contactName: PERSONA.ownerName,
        contactEmail: PERSONA.email,
        contactPhone: PERSONA.phone,
      };
    case "sled": {
      const rows = Array.isArray(inputs?.sledRegistrations)
        ? (inputs!.sledRegistrations as Record<string, string>[])
        : null;
      return {
        entries:
          rows && rows.length > 0
            ? rows.map((r) => ({
                state: r.state,
                registryType: r.registryType,
                businessName: r.businessName,
              }))
            : [
                { state: "NC", registryType: "State", businessName: PERSONA.businessName },
                { state: "NC", registryType: "County", businessName: PERSONA.businessName },
                { state: "NC", registryType: "Education", businessName: PERSONA.businessName },
              ],
      };
    }
    case "cmmc":
      return {
        level: "Level 1",
        statusType: "Self-assessment",
        statusText: "Affirmed",
        assessmentDate: new Date(checkedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        scope: "Kitchen and office systems",
        affirmingOfficial: PERSONA.ownerName,
      };
  }
}

/** The result she already has at the start: every check passed. */
export function storyVerification(key: VerifyKey, checkedAt: string): DemoVerification {
  return { status: "pass", message: MESSAGE[key], checkedAt, data: dataFor(key, checkedAt) };
}

/**
 * Run a check in the demo. It passes. A SAM.gov check with a UEI that is not 12
 * letters and numbers is refused by the form before it gets here.
 */
export function runVerification(key: VerifyKey, inputs: Record<string, unknown>): DemoVerification {
  const checkedAt = new Date().toISOString();
  return {
    status: "pass",
    message: MESSAGE[key],
    checkedAt,
    data: dataFor(key, checkedAt, inputs),
  };
}
