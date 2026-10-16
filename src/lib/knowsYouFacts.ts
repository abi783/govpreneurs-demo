// What Hunter can honestly say it knows about the member, as labelled rows: the
// Success Center business profile (what Hunter was told at signup) plus the
// learned fact store (`GET /hunter-chat/profile`, everything Hunter has picked
// up since). Kept out of the component so the merge + the "is this a guess"
// rule are testable without rendering anything.
import { useEffect, useMemo, useState } from "react";
import { useBusinessProfile, weightingDimensions, type BusinessProfile } from "./businessProfile";
import { fetchProfileFacts, type FactSource, type StoredProfileFact } from "./hunterChat";
import { EDITABLE_JOURNEY_FIELDS } from "./enrichment";

/** One labelled row in the "Hunter knows you" panel. */
export interface KnowsYouFact {
  /** Stable key — a fact keeps its identity across re-renders and re-fetches. */
  id: string;
  /** The narrow, muted column, e.g. "Category" or "Service location". */
  label: string;
  /** What Hunter holds. Several values for one label are joined into one row. */
  value: string;
  /** True when Hunter inferred the value from conversation rather than being
   *  told it or shown it in a document. Rendered as a quiet marker so a guess is
   *  never presented with the certainty of a confirmed fact. */
  inferred: boolean;
  /** Where the value came from. Read only by the display formatter, which
   *  refuses to re-word anything the member wrote themselves. */
  source?: FactSource;
  /**
   * The journey field this row can be re-opened on, when it can be. Present only
   * for a row backed by a LEARNED fact whose field the enrichment journey actually
   * asks about — a row the Success Center profile alone supplied has no journey
   * question behind it, so it gets no edit affordance rather than one that cannot
   * work.
   */
  editField?: string;
}

/** The one confidence tag that means "Hunter worked this out itself". */
const INFERRED_TAG = "inferred";

/** The business profile IS the Success Center's own record of the member. */
const PROFILE_SOURCE: FactSource = "success_center";

/** Row labels for the three business details the profile can supply. */
const PROFILE_LABELS = {
  category: "Category",
  location: "Location",
  setAsides: "Set-asides",
} as const;

/** The learned fact that stores raw NAICS codes, and what a member sees instead.
 *  "541511" tells nobody anything; the taxonomy title it maps to does. */
const NAICS_FACT_LABEL = "NAICS codes";
const BUSINESS_CATEGORY_LABEL = "Business category";

/**
 * Display names for stored field labels, where the stored one is longer than the
 * key column holds on one line. The key is rendered UPPERCASE in an 80px column
 * that fits ~14 characters, and a key that wraps makes its whole row two lines
 * tall — so "Specializations" (15) cost a row its chance to share a page, for a
 * plural that adds nothing. Singular and unprefixed reads the same and fits.
 *
 * Keep in step with `LIST_VALUED_LABELS` / `CODE_EXPANDERS` in `factDisplay.ts`:
 * those key off the label a row CARRIES, which is the display name, not the
 * stored one.
 */
const DISPLAY_LABELS: Readonly<Record<string, string>> = {
  [NAICS_FACT_LABEL]: BUSINESS_CATEGORY_LABEL,
  "Service location": "Location",
  // Only reached when the profile has NO location to merge into — otherwise the
  // fact is folded into the profile's row and never rendered on its own. Either
  // way the member sees one key for where they are and where they work.
  "Service states": "Location",
  Specializations: "Specialization",
  Differentiators: "Differentiator",
};

/**
 * Resolves stored NAICS codes to their `naics_taxonomy` titles. The backend
 * already attaches that map to the profile (`attachNaicsLabels`, "so the UI can
 * render categories without its own lookup"), so this reuses the SAME source the
 * profile's own Category row renders from rather than adding a second lookup.
 * A code the map does not cover is kept verbatim — a raw code beats a blank.
 */
function toBusinessCategory(value: string, profile: BusinessProfile | null): string {
  const labels = profile?.naicsLabels;
  if (!labels) return value;
  return value
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => labels[code] ?? code)
    .join(", ");
}

/** The learned fact naming the states the member works in. The profile's own
 *  location row covers the same ground at a different granularity — a home city
 *  and state, versus a list of state codes — so the two never dedup against each
 *  other and would render as two rows for one concept. They are merged instead. */
const SERVICE_STATES_LABEL = "Service states";

/**
 * Folds service states into the profile's "City, ST" location, dropping any
 * state the location already names so the member's home state is not listed
 * twice. Both sides stay in STORED form (USPS codes) — `factDisplay` expands
 * them to full names at render, so this compares like with like.
 */
function mergeServiceStates(location: string, serviceStates: string): string {
  const alreadyNamed = new Set(
    location
      .split(",")
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean),
  );
  const extra = serviceStates
    .split(",")
    .map((state) => state.trim())
    .filter((state) => state && !alreadyNamed.has(state.toUpperCase()));

  return extra.length > 0 ? `${location}, ${extra.join(", ")}` : location;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Every form of a profile row a learned fact could repeat: the whole value and
 *  each comma-separated part, since a row joins multiple values. */
function dedupKeys(value: string): string[] {
  return [value, ...value.split(",")].map(normalize).filter(Boolean);
}

/** The business profile as labelled rows, empty ones dropped. Reuses
 *  `weightingDimensions` — the same profile details the feed weights matches by
 *  — so the panel and the "Why these?" explainer cannot disagree about what is
 *  on file. */
function profileRows(profile: BusinessProfile): KnowsYouFact[] {
  const { scopeFit, location, certEligibility } = weightingDimensions(profile);
  const rows: Array<[string, string | null]> = [
    [PROFILE_LABELS.category, scopeFit.join(", ")],
    [PROFILE_LABELS.location, location],
    [PROFILE_LABELS.setAsides, certEligibility.join(", ")],
  ];
  return rows.flatMap(([label, value]) =>
    value
      ? [{ id: `profile:${label}`, label, value, inferred: false, source: PROFILE_SOURCE }]
      : [],
  );
}

/** Merges the business profile with the learned fact store into one ordered
 *  list of labelled rows — profile first, since it is the strongest evidence. A
 *  learned fact whose value the profile already states is dropped rather than
 *  repeated. */
export function buildKnowsYouFacts(
  profile: BusinessProfile | null,
  learned: StoredProfileFact[],
): KnowsYouFact[] {
  const rows = profile ? profileRows(profile) : [];

  // Fold service states into the location row rather than rendering the same
  // concept twice. The merged row is marked `inferred` if EITHER half is: it
  // then contains at least one guess, and over-marking invites a correction
  // while under-marking would present a guess with the profile's certainty.
  const serviceStates = learned.find((fact) => fact.label === SERVICE_STATES_LABEL);
  const merged = serviceStates
    ? rows.map((row) =>
        row.label === PROFILE_LABELS.location
          ? {
              ...row,
              value: mergeServiceStates(row.value, serviceStates.value),
              inferred: row.inferred || serviceStates.confidence_tag === INFERRED_TAG,
              // Half of this row IS the learned service-states fact, so the row
              // stays editable — otherwise the field a member most often wants to
              // correct would be the one the merge hid.
              ...(EDITABLE_JOURNEY_FIELDS.has(serviceStates.id)
                ? { editField: serviceStates.id }
                : {}),
            }
          : row,
      )
    : rows;
  const locationMerged = merged.some((row) => row.label === PROFILE_LABELS.location);

  const facts = [...merged];
  const seen = new Set(facts.flatMap((row) => dedupKeys(row.value)));

  for (const fact of learned) {
    // Already folded into the location row above; showing it again is the
    // duplication this merge exists to remove.
    if (locationMerged && fact.label === SERVICE_STATES_LABEL) continue;
    const isNaics = fact.label === NAICS_FACT_LABEL;
    // Resolve BEFORE the dedup check, so a code whose title the profile already
    // states as its Category is recognised as the repeat it is.
    const value = isNaics ? toBusinessCategory(fact.value, profile) : fact.value;
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    facts.push({
      id: `learned:${fact.id}`,
      label: DISPLAY_LABELS[fact.label] ?? fact.label,
      value,
      inferred: fact.confidence_tag === INFERRED_TAG,
      source: fact.provenance?.source,
      // A stored fact's id IS its vocabulary field (`factKey`), so the journey
      // field comes back with the fact — no label map on the client.
      ...(EDITABLE_JOURNEY_FIELDS.has(fact.id) ? { editField: fact.id } : {}),
    });
  }
  return facts;
}

/** Reads both fact sources for the current member. `loading` stays true until
 *  both have settled, so a consumer never renders an empty shell — or a spinner
 *  that outlives the request — while the reads are in flight. */
export function useKnowsYouFacts(): { facts: KnowsYouFact[]; loading: boolean } {
  const { profile, loading: profileLoading } = useBusinessProfile();
  const [learned, setLearned] = useState<StoredProfileFact[] | null>(null);

  useEffect(() => {
    let active = true;
    void fetchProfileFacts().then((stored) => {
      if (active) setLearned(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const facts = useMemo(() => buildKnowsYouFacts(profile, learned ?? []), [profile, learned]);
  return { facts, loading: profileLoading || learned === null };
}
