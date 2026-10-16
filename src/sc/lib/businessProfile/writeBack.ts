/**
 * Business-profile answers that sync 1:1 onto SuccessCenter columns (the
 * write goes through updateSuccessCenterWithProfileWebhook so Hunter
 * re-match fires). Shared by the member PUT route, the Hunter
 * preview-answers webhook, and the intake→profile migration — one map, so
 * the three writers can never drift.
 *
 * `primary_industry` ("Your trade") is NOT in the map. Its codes go to the
 * `my_business` slot of `naicsBySource` through `writeNaicsBySource`
 * (`src/lib/naics/slotWrite.ts`), which computes `naicsCodes`. The pure half of
 * that write is `tradeNaicsCodes` + `tradeNaicsUpdate` below (SC-3, SPEC §A.4).
 */

import {
  composeUpdates,
  excludeCodes,
  setSlot,
  unexcludeCodes,
  type NaicsBySourceUpdate,
} from "@sc/lib/naics/slotUpdates";
import { computeNaics } from "@sc/lib/naics/computeNaics";
import { isRecord, naicsCodeList } from "@sc/lib/naics/naicsBySource";
import { hasOwnKey } from "./untrustedInput";
import { oneLineAddress, type Address } from "./mbValue";

/** The "Your trade" field. Its save writes `naicsBySource`, not a WRITE_BACK patch. */
export const TRADE_FIELD_KEY = "primary_industry";

/**
 * socioeconomic_certifications UI slug -> canonical cert label. deriveCerts
 * (src/lib/validators/certs.ts, CERT_TO_SET_ASIDES) keys off the canonical
 * labels, not the ProfileField/registry.ts UI slugs — writing raw slugs into
 * SuccessCenter.socioEconomicCerts made every member-picked cert derive to
 * []. "none"/"not_sure" are not real certs and are filtered out before this
 * map runs (see socioeconomic_certifications below).
 */
export const CERT_SLUG_TO_CANONICAL: Record<string, string> = {
  eight_a: "8(a)",
  vosb: "VOSB",
  sdvosb: "SDVOSB",
  wosb: "WOSB",
  edwosb: "EDWOSB",
  hubzone: "HUBZone",
  minority: "MOB",
  sdb: "SDB",
  dobe: "DOBE",
  /* ADDED WITH THE OPTIONS THEMSELVES, WHICH IS THE POINT. `small_biz` and
     `native_tribal` reached `CERT_OPTIONS` on 2026-09-06 named after Hunter's
     CANONICAL values — but this map takes cert LABELS, and it ends `?? slug`,
     so both were written raw into `socioEconomicCerts` and derived to nothing.
     Picked, stored, shown back to her, and matched against no opportunity, with
     no error at any step. A new option needs a line here or it does not work. */
  small_biz: "Small Business",
  native_tribal: "Native American or Tribally Owned",
};

// Two-letter US state codes + DC — same set the capability-statement
// extractor validates AI output against (src/lib/validators/capabilityStatement.ts).
const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC",
]);

/** Field key → the SuccessCenter columns its value mirrors onto, or null when
 *  the mapper refuses the value. */
export const WRITE_BACK: Record<string, (v: unknown) => Record<string, unknown> | null> = {
  legal_company_name: (v) => (typeof v === "string" && v.trim() ? { legalName: v.trim() } : null),
  phone: (v) => (typeof v === "string" && v.trim() ? { phone: v.trim() } : null),
  // Both shapes, deliberately: `/intake`'s registry text box still writes the
  // string, and the record's editor writes the parts (see `addressAdapter`).
  // `SuccessCenter.address` is one column either way, so the parts are joined
  // through the ONE definition rather than a second comma-joining written here.
  company_address: (v) => {
    if (typeof v === "string") return v.trim() ? { address: v.trim() } : null;
    if (!v || typeof v !== "object") return null;
    const line1 = (v as { line1?: unknown }).line1;
    if (typeof line1 !== "string" || !line1.trim()) return null;
    const one = oneLineAddress(v as Address);
    return one ? { address: one } : null;
  },
  website: (v) => {
    const o = v as { has?: string; url?: string } | null;
    return o?.has === "yes" && o.url ? { website: o.url } : null;
  },
  /**
   * THE ONE PATH from her certifications row to set-aside eligibility.
   *
   * `deriveCerts` reads `SuccessCenter.socioEconomicCerts`, not this row, so
   * this mapper is what decides whether a change of storage can move a member's
   * eligibility. It reads BOTH shapes — the bare slugs a row has always held,
   * and the papers it holds once she has edited it — and emits the same
   * canonical labels from either. A paper carries its slug in `id` (see
   * `certSlugOf`), falling back to matching on the wording she read.
   */
  socioeconomic_certifications: (v) => {
    if (!Array.isArray(v)) return null;
    const slugs: string[] = [];
    for (const entry of v) {
      if (typeof entry === "string") {
        slugs.push(entry);
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      const paper = entry as { id?: unknown; name?: unknown };
      if (typeof paper.id === "string" && paper.id) slugs.push(paper.id);
      else if (typeof paper.name === "string" && paper.name) slugs.push(paper.name);
    }
    return {
      socioEconomicCerts: slugs
        .filter((slug) => slug !== "none" && slug !== "not_sure")
        .map((slug) => CERT_SLUG_TO_CANONICAL[slug] ?? slug),
    };
  },
  // Service-area picker (`{ states, cities, rung }`, src/components/business/controls.tsx
  // ServiceArea) → the same SuccessCenter columns the capability-statement
  // extractor and DSBS validator write. Never wipe geography with an empty
  // answer: only "national" (worksAnywhereInUS=true) is allowed with no states.
  geographic_coverage: (v) => {
    const o = v as { states?: unknown; cities?: unknown; rung?: unknown } | null;
    if (!o || typeof o !== "object") return null;
    const states = Array.isArray(o.states)
      ? [...new Set(o.states.filter((s): s is string => typeof s === "string").map((s) => s.trim().toUpperCase()).filter((s) => US_STATE_CODES.has(s)))]
      : [];
    const cities = Array.isArray(o.cities)
      ? o.cities.filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim())
      : [];
    const nationwide = o.rung === "national";
    if (states.length === 0 && !nationwide) return null;
    return { stateCodes: states, cities, worksAnywhereInUS: nationwide };
  },
};

/**
 * The NAICS codes a "Your trade" value (`{ categories, naics }`, TradePicker in
 * `src/components/business/controls.tsx`) submits, read by `naicsCodeList`
 * (`src/lib/naics/naicsBySource.ts`, the one list parser, D132). A value with
 * no `naics` list submits none.
 */
export function tradeNaicsCodes(v: unknown): string[] {
  return naicsCodeList((v as { naics?: unknown } | null)?.naics);
}

/**
 * What the member's own picker save sends beside her picks. The picker shows
 * codes from every source, so the codes she keeps ticked are not all her picks
 * (Decisions log D130), and a code can reach the server after she opened the
 * page (D131).
 */
export interface TradeSaveScope {
  /** Every code still ticked: her picks and the codes from other sources she kept. */
  kept: string[];
  /** Every code the picker showed her when she opened it. */
  shown: string[];
}

/**
 * The most entries `kept` or `shown` may hold (D135). The 2022 NAICS tree holds
 * about 2,125 codes at every level from 2 to 6 digits, and `toNaicsCode` accepts
 * each level, so no honest picker list can be longer. A real profile holds
 * dozens. The cap bounds the work a no-token caller can ask for; the profile
 * intersection in `tradeNaicsUpdate` is what bounds `excluded`.
 */
export const MAX_TRADE_SCOPE_CODES = 2_200;

/** The scope read from an untrusted request body; null unless both lists are
 *  there and neither is over `MAX_TRADE_SCOPE_CODES`. Codes go through the one
 *  list parser (D132). */
export function parseTradeSaveScope(raw: unknown): TradeSaveScope | null {
  if (!isRecord(raw) || !hasOwnKey(raw, "kept") || !hasOwnKey(raw, "shown")) return null;
  if (!Array.isArray(raw.kept) || !Array.isArray(raw.shown)) return null;
  if (raw.kept.length > MAX_TRADE_SCOPE_CODES || raw.shown.length > MAX_TRADE_SCOPE_CODES) return null;
  return { kept: naicsCodeList(raw.kept), shown: naicsCodeList(raw.shown) };
}

/**
 * The change a "Your trade" save makes to `naicsBySource` (SPEC §A.4).
 * `codes` are her picks, and ONLY they go to `my_business` (D130). Every code
 * she submits or keeps leaves `excluded`. With a `scope` (the member's own
 * picker save ONLY, Decisions log D1): each code the picker showed her that she
 * did not keep joins `excluded` with `at`, and no other code does (D131). A code
 * that is not on her profile now is never excluded, whatever `shown` holds
 * (D135). A proposal, a conflict resolve and the intake send no scope, so they
 * never exclude.
 */
export function tradeNaicsUpdate(
  codes: readonly string[],
  at: string,
  scope: TradeSaveScope | null = null,
): NaicsBySourceUpdate {
  const kept = [...new Set([...codes, ...(scope?.kept ?? [])])];
  const keep = composeUpdates(setPicks(codes, at), unexcludeCodes(kept));
  if (!scope) return keep;
  const keptSet = new Set(kept);
  const excludeUnticked: NaicsBySourceUpdate = (current) => {
    const onProfile = new Set(computeNaics(current, { primaryNaics: null }).naicsCodes);
    const unticked = scope.shown.filter((code) => onProfile.has(code) && !keptSet.has(code));
    return excludeCodes(unticked, at)(current);
  };
  return composeUpdates(excludeUnticked, keep);
}

/** `my_business` := her picks. With no pick and no slot yet, the slot stays absent. */
function setPicks(codes: readonly string[], at: string): NaicsBySourceUpdate {
  return (current) =>
    codes.length === 0 && !current.my_business
      ? current
      : setSlot("my_business", { codes: [...codes], updatedAt: at })(current);
}
