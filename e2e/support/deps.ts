import { test } from "@playwright/test";
import { backendIsUp } from "./session";

/**
 * Dependency gates for the specs that need something this repo does not own.
 *
 * There are TWO different prerequisites and conflating them produces specs that
 * can never pass:
 *
 *   Tier A — needs the BACKEND only (Mongo/Redis/GovAI + the Nest API). Every
 *            deterministic REST flow: the enrichment journey, the profile
 *            surfaces, workspace, discovery. Some journey paths call an LLM for
 *            follow-up probes / summary derivation, but every one of those is
 *            budget-guarded and degrades to a deterministic fallback, so a Tier A
 *            spec asserts the honest-ask CONTRACT and never LLM-authored prose.
 *
 *   Tier B — needs a reachable LLM as well. Any `POST /hunter-chat/message`
 *            spends a classify call plus a compose call, and the legacy fallback
 *            loop needs a model too. There is no probe for "a model is
 *            reachable" that isn't itself a paid call, so Tier B is opt-IN.
 *
 * A skip reads as green, which is exactly how `feed.spec.ts` carried a wrong
 * assertion from the day it was written. So every gate here has an escape hatch
 * that turns the skip into a hard FAILURE — set it in CI, or on a deliberate
 * local run, to assert the suite actually executed.
 */

/** API origin the specs call. Same default as `playwright.config.ts`. */
export const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:3000";

/**
 * ── ONE MEMBER, or four ────────────────────────────────────────────────────
 *
 * `E2E_LOCATION_ID` is THE member, and every id below falls back to it.
 *
 * Under a real GHL token there is exactly one: `?locationId=` is honoured only
 * in `ENVIRONMENT=local`, and identity otherwise comes from the token's own
 * `activeLocation`. So on the live tier four different ids would be a lie about
 * what is being tested — every request would resolve as the same member whatever
 * the constant said, and a spec named after the OTHER member would read as
 * covering it.
 *
 * Locally, where `?locationId=` does work, the four narrowing overrides still
 * split them apart, and with nothing exported the historical `ENVIRONMENT=local`
 * defaults stand unchanged. Resolution order is therefore, for each id:
 *
 *     its own E2E_*_LOCATION_ID  →  E2E_LOCATION_ID  →  the local default
 *
 * Blank counts as absent. `E2E_LOCATION_ID` is exported in CI from a resolved
 * `activeLocation`; an empty capture must fall back visibly, not pin every spec
 * to the member `""`.
 */
function envMember(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

/** THE member: set in CI from the token's `activeLocation`, unset locally. */
const SINGLE_MEMBER = envMember("E2E_LOCATION_ID");

/**
 * Whether this is the LIVE tier, where one harvested token means one member.
 *
 * Exported at module scope by `playwright.live.config.ts`, which every worker
 * loads before it loads a spec — so it is set exactly when the live config is
 * the config in use, and by nothing else. Deliberately NOT inferred from
 * `E2E_GHL_TOKEN` being present: that variable can be exported by accident in
 * any shell, and inferring from it would restore the very collapse below on a
 * local run. "On" is the string `1`, as everywhere else in this suite.
 */
const LIVE_TIER = process.env.E2E_LIVE === "1";

/**
 * Narrowing override → THE member → the historical local default.
 *
 * `collapsesOntoTheMember` is what the write id turns off: locally
 * `?locationId=` IS honoured, so falling back to `E2E_LOCATION_ID` there is a
 * choice rather than a fact about the tier — and for the one id that WRITES it
 * is the wrong choice. See `WRITE_LOCATION_ID`.
 */
function member(overrideName: string, localDefault: string, collapsesOntoTheMember = true): string {
  const theMember = collapsesOntoTheMember ? SINGLE_MEMBER : undefined;
  return envMember(overrideName) ?? theMember ?? localDefault;
}

/**
 * The capability statement is what splits Hunter's two big code paths, and these
 * two ids are how the local tier covers both:
 *
 *  - WITH a document, the extraction is projected into the fact store as
 *    `document`-backed facts, those fields read as COVERED but are still OFFERED
 *    (confirm-and-extend), and readiness never blocks the embed.
 *  - WITHOUT one, there are no `document` facts, the journey asks everything, and
 *    the embed is gated on the five scored field-texts being producible.
 *
 * On the live tier they collapse onto the one member, which makes exactly one
 * test unsatisfiable — it asserts the two are different. That test is excluded
 * BY NAME (`EXCLUDED_LIVE_TESTS` in `e2e/spec-tiers.ts`), never by a skip, and
 * carries the condition that restores it: a second harvested token.
 *
 * NOT `TEST_LOCATION_ID`: that id is right for the STUBBED specs but 404s live,
 * because a live backend resolves the profile through the Success Center portal.
 */
export const NO_DOC_LOCATION_ID = member("E2E_NO_DOC_LOCATION_ID", "atIWgnnw89YS6Yp3LuhI");
export const DOC_LOCATION_ID = member("E2E_DOC_LOCATION_ID", "y0ETmSjoJY03RxQ3RZeO");

/** Default member for read-only specs that do not care either way. */
export const LOCATION_ID = SINGLE_MEMBER ?? DOC_LOCATION_ID;

/**
 * A member who actually has learned facts on file, for the profile-surface
 * specs. Defaults to `DEFAULT_MOCK_LOCATION_ID` (Texas Eagle AC and Heating) —
 * staging's populated test member. Read-only: nothing here writes to it.
 */
export const FACTS_LOCATION_ID = member("E2E_FACTS_LOCATION_ID", DOC_LOCATION_ID);

/**
 * The member the enrichment-journey spec WRITES to. A throwaway id by default:
 * walking the journey stores learned facts and a journey-state document, and
 * doing that to a shared staging member corrupts their matching.
 *
 * On the LIVE tier there is nowhere else to write — a real token resolves as its
 * own member and `?locationId=` is inert — so this becomes the harvested member
 * and the drift is cleaned up after the run instead of avoided. `LIVE_TIER` is
 * what limits that collapse to the tier it is true of: locally `?locationId=`
 * works, nothing cleans up afterwards, and the file's own advice to point
 * `E2E_LOCATION_ID` at a real member (see `needsMatches`) would otherwise aim
 * the two writing specs at that member's profile. Only an explicit
 * `E2E_WRITE_LOCATION_ID` moves this id off the throwaway locally.
 *
 * The backend resolves `req.user` from `?locationId=` in `ENVIRONMENT=local`,
 * but the journey itself reads the member's Success Center profile — so a
 * locationId the portal does not know may 404. When it does, the write spec
 * skips with the remediation in its message (and hard-fails under
 * `E2E_REQUIRE_BACKEND=1`), rather than silently writing somewhere real.
 */
export const WRITE_LOCATION_ID = member("E2E_WRITE_LOCATION_ID", "e2e-hunter-journey", LIVE_TIER);

const REQUIRE_LLM = process.env.E2E_REQUIRE_LLM === "1";
/** `E2E_REQUIRE_LLM=1` implies it: demanding the chat specs RAN is meaningless
 *  if a missing backend is allowed to skip them out from under the demand. */
const REQUIRE_BACKEND = process.env.E2E_REQUIRE_BACKEND === "1" || REQUIRE_LLM;
const LLM_OPTED_IN = process.env.E2E_LLM === "1";

/**
 * Skip when a dependency is absent — unless the caller demanded it, in which
 * case fail loudly. `required` is the whole point: a skipped run must never be
 * mistakable for a passing one.
 */
function gate(present: boolean, required: boolean, reason: string): void {
  if (present) return;
  if (required) {
    throw new Error(`REQUIRED DEPENDENCY MISSING — ${reason}`);
  }
  test.skip(true, reason);
}

/** Tier A gate: the API must answer. Hard-fails under `E2E_REQUIRE_BACKEND=1`. */
export async function needsBackend(): Promise<void> {
  gate(
    await backendIsUp(API_BASE_URL),
    REQUIRE_BACKEND,
    `API not reachable at ${API_BASE_URL}. Start it with ` +
      `\`docker compose -f docker-compose.dev.yml up\` (or \`npm run start:dev\` in backend/) ` +
      `and re-run. Set E2E_REQUIRE_BACKEND=1 to make this a failure instead of a skip.`,
  );
}

/**
 * Tier B gate: the backend must answer AND the caller must have opted in to
 * spending model calls. There is no probe — asking whether a model is reachable
 * costs a model call, so this is explicit. Hard-fails under `E2E_REQUIRE_LLM=1`.
 */
export async function needsLlm(): Promise<void> {
  await needsBackend();
  gate(
    LLM_OPTED_IN,
    REQUIRE_LLM,
    `LLM-backed specs are opt-in: set E2E_LLM=1 (and make sure the API host can ` +
      `reach the model provider). Set E2E_REQUIRE_LLM=1 to make this a failure instead of a skip.`,
  );
}

/**
 * Write-path gate: the journey's target member must resolve server-side. Called
 * with the result of a real probe, so the message can carry the status the
 * backend actually returned. Hard-fails under `E2E_REQUIRE_BACKEND=1` — "the
 * write spec never ran" is a fact about the suite, not a pass.
 *
 * It passed a literal `false` until feature 5, so `E2E_REQUIRE_BACKEND=1` bound
 * every other gate and silently not this one — the doc comment above was a wish.
 * A red here is the honest signal that the test member's staging profile needs
 * seeding; the alternative is two write specs that never run and never say so.
 */
export function needsWriteLocation(reachable: boolean, detail: string): void {
  gate(
    reachable,
    REQUIRE_BACKEND,
    `The enrichment write-path member "${WRITE_LOCATION_ID}" does not resolve (${detail}). ` +
      `Locally: set E2E_WRITE_LOCATION_ID to a DISPOSABLE locationId whose Success Center ` +
      `profile exists — this spec stores learned facts and a journey-state document for it, ` +
      `so it must never point at a member whose matching you care about. On the live tier ` +
      `that override is inert (identity comes from the token), so this means the harvested ` +
      `member's staging profile needs seeding.`,
  );
}

/**
 * The member must actually have matches to ask about.
 *
 * An eligibility turn is scored against a specific `oppKey`, so a spec that asks
 * about a made-up one asserts nothing — the feed has to be non-empty first. That
 * made it the last bare `test.skip(` left in a live spec, and a bare skip is the
 * one thing `E2E_REQUIRE_BACKEND=1` cannot reach: it reads as green, which is the
 * failure mode this whole file exists to prevent (see the header).
 *
 * Routed through the shared `gate()` so it obeys the same escape hatch as every
 * other dependency. Under the live tier a red here is a DATA finding, not a code
 * one — the harvested member has no matches yet — which is precisely the signal
 * that should surface rather than be swallowed.
 */
export function needsMatches(count: number): void {
  gate(
    count > 0,
    REQUIRE_BACKEND,
    `Member "${LOCATION_ID}" has no matches, so there is no real opportunity to ask ` +
      `about. Locally: point E2E_LOCATION_ID at a member whose feed is non-empty. On the ` +
      `live tier: the harvested member's matches have not been generated yet — seed them ` +
      `rather than relaxing this gate.`,
  );
}
