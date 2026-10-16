// The disabled mentor control on a forecast page. A forecast has no deadline:
// its date is the buyer's expected posting date. So the reason on the control
// states that date's distance, and never the opportunity page's deadline words.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DETAIL } from "../lib/forecasts/copy";
import { MENTOR_REVIEW_MIN_LEAD_MS } from "../lib/entitlements";

const DAY_MS = 24 * 60 * 60 * 1000;
const reason = DETAIL.mentorTooLate(MENTOR_REVIEW_MIN_LEAD_MS);

const FORBIDDEN = /deadline|\bdue\b|closes|higher\s*gov/i;

describe("the forecast page's mentor too-late reason", () => {
  it("states the fact: the expected posting date is less than 5 days away", () => {
    expect(reason).toBe(
      "The expected posting date is less than 5 days away. A mentor cannot review it in time.",
    );
  });

  it("takes the number of days from the review's lead time, not a literal", () => {
    expect(DETAIL.mentorTooLate(5 * DAY_MS)).toMatch(/less than 5 days away/);
  });

  it("holds no deadline, due or closes wording", () => {
    expect(reason).not.toMatch(FORBIDDEN);
  });

  it("is the reason the route shows, in place of the opportunity page's message", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/routes/forecasts.$forecastId.tsx"),
      "utf8",
    );
    expect(source).toContain("mentorTooLate ? DETAIL.mentorTooLate(MENTOR_REVIEW_MIN_LEAD_MS)");
    expect(source).not.toContain("MENTOR_DEADLINE_TOO_CLOSE_MESSAGE");
  });
});
