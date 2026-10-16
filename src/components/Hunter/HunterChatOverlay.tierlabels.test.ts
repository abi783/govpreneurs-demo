import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Chat's Priority / Strong / Stretch / Low chips are NOT the feed's retired
 * Bid / Review verdict — they are the match tier, a different vocabulary on a
 * different surface, and they stay.
 *
 * This reads the SOURCE rather than importing `MATCHES_TIER_LABEL`: the
 * constant is module-private, and exporting it to satisfy a test would be a
 * change to the very file the test exists to protect. Same shape as
 * `backend/src/hunter-chat/catalog/catalog.service.spec.ts`, which scans
 * source text for price literals.
 *
 * Feature 14 moved the matches card out of the chat thread and onto the stage,
 * and the label map went with it — one owner, not two. Both files are scanned:
 * the labels must live in the card, and the retired feed verdict must be in
 * neither.
 */
const MATCHES_SOURCE = readFileSync(
  fileURLToPath(new URL("./Stage/MatchesArtifact.tsx", import.meta.url)),
  "utf8",
);

const OVERLAY_SOURCE = readFileSync(
  fileURLToPath(new URL("./HunterChatOverlay.tsx", import.meta.url)),
  "utf8",
);

describe("HunterChatOverlay tier labels", () => {
  it("keeps every MATCHES_TIER_LABEL entry", () => {
    for (const entry of [
      'priority: "Priority"',
      'strong: "Strong"',
      'stretch: "Stretch"',
      'low: "Low"',
    ]) {
      expect(MATCHES_SOURCE).toContain(entry);
    }
  });

  it("does not carry the feed's retired verdict labels", () => {
    expect(MATCHES_SOURCE).not.toMatch(/"(No Bid|Review)"/);
    expect(OVERLAY_SOURCE).not.toMatch(/"(No Bid|Review)"/);
  });
});
