// How one stage artifact names itself — once, for both surfaces that name it.
//
// The stage card header and the compact chat reference must say the same thing
// about the same artifact. Two label maps would be two things to keep true, so
// this is the only one (ARCHITECTURE.md §3(d), and the repo CLAUDE.md rule that
// there is never a second label map).
//
// Pure: no React, no DOM, no fetch. It reads the payloads verbatim and invents
// nothing — where a payload carries no subject, the subject is null and the
// caller renders the kicker alone.

import type { StageArtifact, StageArtifactInput } from "./stageArtifact";

/** An artifact's name, split so the stage can style the two parts apart. */
export interface ArtifactTitle {
  /** What kind of answer this is — "Readiness check", "Compare", … */
  kicker: string;
  /** What it is about, or null when the payload names no subject. */
  subject: string | null;
}

/** The kicker for each kind. Fixed copy, never a payload value. */
const KICKER = {
  scorecard: "Readiness check",
  compare: "Compare",
  checklist: "Action checklist",
  matches: "Best matches",
  research: "Research",
  profile: "Your business profile",
  profileUpdate: "Update your profile",
} as const;

/** The compared opportunities as one subject, or null when there are none. */
function compareSubject(titles: readonly string[]): string | null {
  const named = titles.filter((t) => t.trim().length > 0);
  return named.length > 0 ? named.join(" vs ") : null;
}

/** Trims a payload subject to a real value, or null. */
function subjectOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Names an artifact: its kicker, and what it is about. */
export function artifactTitle(artifact: StageArtifact | StageArtifactInput): ArtifactTitle {
  switch (artifact.kind) {
    case "scorecard":
      return { kicker: KICKER.scorecard, subject: subjectOrNull(artifact.payload.title) };
    case "compare":
      return {
        kicker: KICKER.compare,
        subject: compareSubject((artifact.payload.opps ?? []).map((o) => o.title ?? "")),
      };
    case "checklist":
      return { kicker: KICKER.checklist, subject: subjectOrNull(artifact.payload.gap?.title) };
    case "matches":
      return { kicker: KICKER.matches, subject: null };
    case "research":
      return { kicker: KICKER.research, subject: subjectOrNull(artifact.payload.query) };
    case "profile":
      return { kicker: KICKER.profile, subject: null };
    case "profileUpdate":
      return { kicker: KICKER.profileUpdate, subject: null };
  }
}

/** The artifact's name as one line — what the compact chat reference shows. */
export function artifactLabel(artifact: StageArtifact | StageArtifactInput): string {
  const { kicker, subject } = artifactTitle(artifact);
  return subject ? `${kicker} · ${subject}` : kicker;
}

/**
 * The stage region's accessible name — a sentence, so a screen-reader user
 * hears what arrived rather than a fragment.
 */
export function artifactOnScreenSentence(artifact: StageArtifact | StageArtifactInput): string {
  const { kicker, subject } = artifactTitle(artifact);
  if (artifact.kind === "matches") return `${kicker} are on screen`;
  if (artifact.kind === "compare")
    return subject ? `Comparison of ${subject} is on screen` : `${kicker} is on screen`;
  return subject ? `${kicker} for ${subject} is on screen` : `${kicker} is on screen`;
}
