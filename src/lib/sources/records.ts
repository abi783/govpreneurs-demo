// Record descriptors — the "show me my own record" half of source references.
//
// THE DESIGN DECISION THAT MAKES THIS REUSABLE: a record source is NOT a
// bespoke viewer per record type. It is one field-list renderer (RecordBody)
// driven by a small descriptor: a title, a status, an ordered list of fields,
// and which field keys the claim actually rests on. Adding SLED after SAM is
// a descriptor, not a component.
//
// Fields are read live from the member's business profile so the sheet shows
// their real data — the whole point is that this is THEIR record, not a
// summary of it. Where the profile has a value we render it; where it doesn't,
// the row says so rather than disappearing (a missing field is itself the
// answer to "why can't Grant confirm this?").

import { businessProfile } from "../mock/businessProfile";

export interface RecordField {
  key: string;
  label: string;
  value: string | null;
}

export interface RecordDescriptor {
  /** Heading inside the sheet body, e.g. "SAM registration — Williams Construction LLC". */
  title: string;
  /** Where this record lives, for the locator line. */
  locator: string;
  status: { text: string; tone: "ok" | "stale" | "missing" };
  fields: RecordField[];
  /** Field keys the claim rests on — these get the highlight. */
  pinned: string[];
  /** Deep link for the escape hatch, or null if the record has no page. */
  href: string | null;
}

/** Profile cells are `{ value, state, source, verifiedAt }`; read defensively —
 *  fixtures carry `null` values on purpose for fields the member hasn't given us. */
type Cell = { value?: unknown; state?: string; verifiedAt?: string; source?: string } | undefined;

function cell(path: string): Cell {
  const parts = path.split(".");
  let node: unknown = businessProfile as unknown;
  for (const p of parts) {
    if (node && typeof node === "object" && p in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return node as Cell;
}

/** Read a displayable string from either a FieldRecord path ("identity.UEI")
 *  or a path that already ends at the primitive ("identity.UEI.value").
 *  Tolerating both matters: getting it wrong fails silently as "Not on file",
 *  which looks like missing member data rather than a bug. */
function text(path: string): string | null {
  const node = cell(path) as unknown;
  if (node === null || node === undefined) return null;
  if (typeof node !== "object") return String(node); // path ended at the primitive
  const v = (node as { value?: unknown }).value;
  if (v === null || v === undefined) return null;
  return String(v);
}

/** Freshest verifiedAt across the cells a record is built from. */
function verifiedOn(paths: string[]): string | null {
  const dates = paths
    .map((p) => cell(p)?.verifiedAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function statusFor(paths: string[]): RecordDescriptor["status"] {
  const states = paths.map((p) => cell(p)?.state);
  if (states.some((s) => s === "verified")) {
    const on = verifiedOn(paths);
    return { text: on ? `Verified ${on}` : "Verified", tone: "ok" };
  }
  if (states.some((s) => s === "stale")) return { text: "Needs re-checking", tone: "stale" };
  if (states.some((s) => s === "attested")) return { text: "You told us this", tone: "stale" };
  return { text: "Not on file", tone: "missing" };
}

const company = text("identity.legalName.value") ?? "your company";

// ── The registry ──────────────────────────────────────────────────────────
// Keyed by the `ref` a Grant pin carries. `resolveRecord()` matches longest
// prefix first, so "profile.bidderProfile.insuranceBonding" can have its own
// entry while "profile." falls through to the generic profile view.

function samRegistration(pinned: string[]): RecordDescriptor {
  const paths = ["identity.UEI", "identity.CAGE", "identity.samStatus"];
  return {
    title: `SAM registration — ${company}`,
    locator: "Your roadmap · Get registered · SAM registration",
    status: statusFor(paths),
    fields: [
      { key: "uei", label: "UEI", value: text("identity.UEI.value") },
      { key: "cage", label: "CAGE code", value: text("identity.CAGE.value") },
      { key: "samStatus", label: "Registration", value: text("identity.samStatus.value") },
      { key: "legalName", label: "Legal name", value: text("identity.legalName.value") },
      { key: "entityType", label: "Entity type", value: text("identity.entityType.value") },
      { key: "formationDate", label: "Formed", value: text("identity.formationDate.value") },
    ],
    pinned,
    href: "/roadmap",
  };
}

/** Insurance and bonding. Reads the coverage array when the profile carries one,
 *  and otherwise falls back to the individual bidder-profile cells this app
 *  actually stores — either way the bonding row is rendered even when empty,
 *  because "Not on file" IS the answer to why Grant can't confirm a bond. */
function insuranceBonding(): RecordDescriptor {
  const c = cell("bidderProfile.insuranceBonding");
  const v = (c?.value ?? null) as { coverages?: Array<Record<string, unknown>> } | null;
  const coverages = v?.coverages ?? [];
  const LABEL: Record<string, string> = {
    gl: "General liability",
    "workers-comp": "Workers' comp",
    auto: "Commercial auto",
    umbrella: "Umbrella",
    professional: "Professional / E&O",
    cyber: "Cyber",
  };
  const money = (n: unknown) =>
    typeof n === "number" ? `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : null;

  const fields: RecordField[] = coverages.map((cov) => {
    const type = String(cov.type);
    const per = money(cov.perOccurrence);
    const agg = money(cov.aggregate);
    const carrier = cov.carrier ? String(cov.carrier) : null;
    return {
      key: type,
      label: LABEL[type] ?? type,
      value: [per && `${per} per occurrence`, agg && `${agg} aggregate`, carrier]
        .filter(Boolean)
        .join(" · "),
    };
  });
  if (!coverages.length) {
    fields.push(
      {
        key: "basicInsurance",
        label: "Basic insurance",
        value: text("bidderProfile.basicInsurance"),
      },
      {
        key: "insurancePerType",
        label: "Coverage by type",
        value: text("bidderProfile.insurancePerType"),
      },
    );
  }
  // Bonding is the one Grant most often asks about, and it is the field most
  // often empty — showing the empty row IS the answer.
  fields.push({
    key: "bonding",
    label: "Federal bonding line",
    value: text("bidderProfile.bondingCapability"),
  });

  const onFile = fields.filter((f) => f.value !== null).length;
  return {
    title: `Insurance and bonding — ${company}`,
    locator: "Your profile · Bidder profile · Insurance and bonding",
    status: onFile
      ? { text: `${onFile} of ${fields.length} on file`, tone: "stale" }
      : { text: "Nothing on file", tone: "missing" },
    fields,
    pinned: ["bonding"],
    href: "/profile",
  };
}

function pastPerformance(): RecordDescriptor {
  // Not a FieldRecord — pastPerformance is a plain { entries, totalValue } object.
  const pp = businessProfile.pastPerformance;
  const list = pp?.entries ?? [];
  const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
  return {
    title: `Past performance — ${company}`,
    locator: "Your profile · Past performance",
    status: list.length
      ? { text: `${list.length} projects · ${usd(pp.totalValue)} total`, tone: "ok" }
      : { text: "Nothing on file", tone: "missing" },
    fields: list.slice(0, 6).map((p, i) => ({
      key: p.id ?? `pp-${i}`,
      label: p.naicsCode ? `NAICS ${p.naicsCode}` : `Project ${i + 1}`,
      value:
        [
          p.projectTitle,
          p.customerName,
          typeof p.totalValue === "number" ? usd(p.totalValue) : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
    })),
    pinned: [],
    href: "/profile",
  };
}

function roadmapRecord(): RecordDescriptor {
  const paths = ["identity.samStatus", "identity.UEI"];
  return {
    title: `Your roadmap — ${company}`,
    locator: "Your roadmap",
    status: statusFor(paths),
    fields: [
      { key: "sam", label: "SAM registration", value: text("identity.samStatus.value") },
      { key: "uei", label: "UEI", value: text("identity.UEI.value") },
      { key: "cage", label: "CAGE code", value: text("identity.CAGE.value") },
      { key: "sos", label: "State registration", value: text("identity.sosStatus.value") },
    ],
    pinned: [],
    href: "/roadmap",
  };
}

/** Map a pin's `ref` to a record descriptor. Returns null when the ref isn't a
 *  record — the caller then falls back to a document or unavailable body. */
export function resolveRecord(ref: string): RecordDescriptor | null {
  // The ref is wire data; a non-string here would throw on the first prefix
  // test and take the render with it. No string, no record.
  if (typeof ref !== "string") return null;
  if (ref === "roadmap") return roadmapRecord();
  if (ref.startsWith("profile.bidderProfile.insuranceBonding")) return insuranceBonding();
  if (ref.startsWith("profile.pastPerformance")) return pastPerformance();
  if (ref.startsWith("profile.identity.UEI") || ref.startsWith("profile.identity.CAGE")) {
    return samRegistration(["uei", "cage"]);
  }
  if (ref.startsWith("profile.identity.samStatus") || ref === "sam") {
    return samRegistration(["samStatus"]);
  }
  // Any other profile path: show the SAM/identity record, highlighting nothing
  // rather than guessing. Better an honest overview than a wrong highlight.
  if (ref.startsWith("profile.")) return samRegistration([]);
  return null;
}
