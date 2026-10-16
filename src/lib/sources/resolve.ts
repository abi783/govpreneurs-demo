// resolveSource — turns a Grant `Pin` into exactly one renderable sheet state.
//
// THE INVARIANT: every pin resolves. There is no path that returns null, and
// no path that leaves the sheet with an empty body. A source we can't show
// becomes an explicit "unavailable" state that says what failed and whether
// the analysis depended on it — never a dead chip. This is the same rule the
// rail's suggested questions already enforce: if it's tappable, it answers.
//
// THE INVARIANT HOLDS FOR MALFORMED PINS TOO, and that is not a nicety. A pin
// is entirely server- and model-supplied — type, ref, quote, excerpt, and the
// whole conversation sub-tree — and `chipVariant` calls this function during
// RENDER, inside the canvas. So a pin whose `ref` is a number, or whose
// `turns` is a string, is not a broken chip: it is an uncaught throw in the
// middle of the take, which unmounts the whole opportunity page. Every value
// this module reads off a pin is therefore narrowed before use, and the entry
// point has a catch-all that degrades to the unavailable body. TypeScript's
// view of `Pin` describes the contract, not the wire.

import type { Conversation, Pin, ProvenanceType, Turn } from "../grant/types";
import { sectionForRef } from "../grant/clauseMap";
import { getSolicitation } from "../mock/grantAnalysis";
import { OPPORTUNITIES } from "../mock/opportunities";
import { agencySource, externalSourceUrl } from "../sourceLink";
import { resolveRecord, type RecordDescriptor } from "./records";
import { resolvePublic, type PublicEntry, type PublicTally } from "./publicRecords";

export type SourceKind =
  | "doc"
  | "record"
  | "conversation"
  | "computed"
  | "public"
  | "tally"
  | "unavailable";

/** What the page knows about the opportunity being read, which a pin alone
 *  can't carry. Both are optional: the resolver degrades, it never requires. */
export interface SourceContext {
  /** Lets a bare §-clause ref resolve to that section's real text. */
  noticeId?: string;
  /** The ISSUING AGENCY's posting URL for this opportunity (HigherGov's
   *  `source_path`). This is what "the source" means to a member — HigherGov is
   *  where we got the record, never what we cite. See `agencySource`. */
  sourcePath?: string | null;
}

interface Base {
  kind: SourceKind;
  /** Short label for the sheet header, e.g. "Solicitation", "Your record". */
  sourceLabel: string;
  /** Human coordinate for the locator line. */
  locator: string;
  /** Footer provenance line. */
  provLine: string;
  /** Escape hatch, or null when the sheet is a closed room. */
  href: string | null;
  hrefLabel: string | null;
}

export interface DocSource extends Base {
  kind: "doc";
  before: string | null;
  span: string;
  after: string | null;
  /** True when we only had the bare quote, with no surrounding context. */
  contextMissing: boolean;
  /** Solicitation ref that the page can reveal in place (the EvidenceBlock
   *  catches the reveal event and scrolls its source region into view). This is
   *  the sheet's escape hatch for readers who want the whole document: it stays
   *  inside the app rather than opening a tab. Null when the ref maps to no
   *  section. */
  revealRef: string | null;
  /** True when we resolved only to the section, not the exact sentence. */
  sectionOnly?: boolean;
}

export interface RecordSource extends Base {
  kind: "record";
  record: RecordDescriptor;
}

export interface ConversationSource extends Base {
  kind: "conversation";
  conversation: Conversation;
  /** Whose words are highlighted — drives the header and the chip label. */
  citedSpeaker: string;
  /** True when the member is being quoted back to themselves, which is a
   *  different (and more sensitive) trust relationship than quoting a mentor. */
  isSelf: boolean;
}

export interface ComputedSource extends Base {
  kind: "computed";
  /** Show the working — the honest equivalent of quoting a passage. */
  note: string;
}

/** One row of a public government register — the fourth geometry. Structurally
 *  a field list like RecordSource, but the trust question is different: not
 *  "is my data complete?" but "which record is this, and how current?" */
export interface PublicSource extends Base {
  kind: "public";
  entry: PublicEntry;
}

/** A figure counted over many public records. Never one row — a population. */
export interface TallySource extends Base {
  kind: "tally";
  tally: PublicTally;
}

export interface UnavailableSource extends Base {
  kind: "unavailable";
  headline: string;
  reason: string;
  usedInAnalysis: boolean;
}

export type SourceView =
  | DocSource
  | RecordSource
  | ConversationSource
  | ComputedSource
  | PublicSource
  | TallySource
  | UnavailableSource;

const LABEL: Record<ProvenanceType, string> = {
  solicitation: "Solicitation",
  fpds: "Federal award record",
  sam: "SAM.gov",
  web: "Web",
  profile: "Your record",
  computed: "Computed",
  chat: "Your own words",
  transcript: "Call transcript",
  // Overwritten per-object by the descriptor's `origin`, which names the
  // government system of record rather than a generic label.
  public: "Government record",
};

/** A type outside the union means contract drift, not a source with no name —
 *  "Source · " with a blank after it reads as a rendering bug to a member. */
const labelFor = (type: ProvenanceType): string => LABEL[type] ?? "Source";

/* ── Narrowing the wire ──────────────────────────────────────────────────
   Everything below takes `unknown` because that is what a pin actually
   carries. Each one answers with something renderable or with null; none of
   them throws, and none of them lets a non-string reach React (an object
   child is a render-time crash, not a bad-looking string). */

/** A string, or null. Deliberately NOT `String(v)`: coercing an object gives
 *  "[object Object]", which we would then render as if it were the source. */
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** The pin's ref, always a string so `.startsWith` / `new URL` / the clause map
 *  are safe. A missing ref becomes "", which every consumer treats as no match. */
const refOf = (p: { ref?: unknown }): string => str(p.ref) ?? "";

/** Turns, always an array of renderable turns. A `turns` that is a string has
 *  a truthy `.length` but no `.find` — the shape that took the page down. */
function turnsOf(c: Conversation | undefined): Turn[] {
  if (!c || !Array.isArray(c.turns)) return [];
  return c.turns.filter(
    (t): t is Turn => Boolean(t) && typeof t === "object" && typeof (t as Turn).text === "string",
  );
}

/** Format a date, or null when it will not parse — never "Invalid Date". */
function formatDay(iso: unknown): string | null {
  const s = str(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A ref rendered as VISIBLE TEXT in a locator — or "" when it must not be.
 *
 * A locator is a coordinate ("§L.4", "FPDS W912PM-19-C-0043"), not a link. A ref
 * that parses as an absolute URL is therefore never printed: at best it is an
 * unreadable coordinate, and at worst it is our data vendor's address, which is
 * exactly what happened — 100% of live `fpds` refs were HigherGov deep links, so
 * every award citation displayed the vendor's URL as its coordinate.
 *
 * Suppressing the LINK was not enough, because this path renders text, not an
 * anchor. The rule is applied to the shape (is it a URL?) rather than to the
 * host, so a future vendor swap cannot reopen it.
 */
function coordinate(ref: string): string {
  try {
    // A HOSTNAME is the test, not merely a scheme. The register grammar is
    // deliberately scheme-shaped ("award:W912…", "tally:field-size") and
    // new URL() parses those happily — rejecting on scheme alone would suppress
    // every legitimate register coordinate. What must never be printed is
    // something that addresses a HOST, which is what a vendor deep link is.
    if (new URL(ref).hostname) return "";
  } catch {
    // Not a URL at all — "§L.4", "FPDS W912…". A coordinate.
  }
  return ref;
}

/** `"Award history · FPDS W912…"`, or just `"Award history"` when the ref is not
 *  something we may print. The separator lives here so a suppressed ref can
 *  never leave a dangling "· " behind it. */
function qualify(base: string, ref: string): string {
  const coord = coordinate(ref);
  return coord ? `${base} · ${coord}` : base;
}

/** Coordinate line. Prefers an authored `locator`; otherwise derives something
 *  honest from the ref rather than inventing page numbers we don't have. */
function locatorFor(pin: Pin): string {
  const p = pin.provenance;
  const ref = refOf(p);
  const authored = str(p.locator);
  if (authored) return authored;
  switch (p.type) {
    case "solicitation":
      return qualify("Solicitation", ref);
    case "fpds":
    case "public":
      // Both resolve through the public-record registry, which supplies a real
      // locator; this is only the fallback when the ref matches no descriptor.
      // `qualify` refuses to print a URL as text at all (every live award ref
      // used to BE a vendor deep link), and drops the separator with it.
      return qualify("Federal award records", refLabel(ref));
    case "sam":
      return "SAM.gov";
    case "web":
      // The ref IS the coordinate for a web source — but only once vetted.
      // `externalSourceUrl` rejects HigherGov (our data vendor is never shown
      // to a member, as a link OR as text) and anything that isn't an absolute
      // http(s) URL, so a `javascript:` ref can't be printed here either.
      return externalSourceUrl(ref) ?? "Web source";
    case "profile":
      return "Your saved record";
    case "computed":
      return "Computed · derived, not quoted";
    case "chat":
    case "transcript":
      return conversationLocator(p.conversation);
    default:
      return "Source";
  }
}

/** A conversation citation answers the four questions deposition practice asks:
 *  who spoke, where in the exchange, when it happened, and from what source. */
function conversationLocator(c?: Conversation): string {
  if (!c) return "Conversation";
  const CHANNEL: Record<Conversation["channel"], string> = {
    hunter: "Chat with Hunter",
    grant: "Chat with Grant",
    "mentor-call": "Mentor call",
  };
  const when = formatDay(c.occurredAt);
  const where = str(c.playAt) ? ` · ${str(c.playAt)}` : "";
  const what = str(c.title) ?? CHANNEL[c.channel] ?? "Conversation";
  // A citation with no usable date still answers who and where — it just can't
  // claim a when. Better a shorter locator than a confident "Invalid Date".
  return when ? [what, when + where].join(" · ") : what + where;
}

/** Fall back to the solicitation SECTION a ref lives in. Most Grant pins carry a
 *  section reference without a hand-authored quote — and the section body is a
 *  real, readable source. Showing it beats declaring the pin unreadable, which
 *  would make ~40% of pins look broken when the text was there all along. We
 *  just don't claim to know the exact sentence: no highlight, and the note says
 *  so. */
function sectionExcerpt(ref: string, noticeId?: string): { title: string; body: string } | null {
  if (!noticeId) return null;
  const sectionId = sectionForRef(ref);
  if (!sectionId) return null;
  const opp = OPPORTUNITIES.find((o) => o.noticeId === noticeId);
  if (!opp) return null;
  const section = getSolicitation(opp).sections.find((sec) => sec.id === sectionId);
  return section ? { title: section.title, body: section.body } : null;
}

/**
 * The ref as a MEMBER should see it.
 *
 * A `ref` is an ADDRESSING STRING, and several geometries encode machine detail
 * in it — a profile path, a register kind, a highlight list. Rendering one raw
 * is the bug this exists to prevent: "award:W912PM-19-C-0043#winner" is not a
 * citation, it is a key. One helper rather than a special case per call site,
 * so a new geometry cannot reintroduce the leak somewhere nobody looks.
 */
export function refLabel(ref: string): string {
  if (typeof ref !== "string") return "";
  // A URL is checked FIRST and rejected whole. Stripping the register prefix
  // from "https://vendor/x" yields "//vendor/x" — still the vendor, now past
  // the URL guard. Order is the whole defence here.
  const safe = coordinate(ref);
  if (!safe) return "";
  // Drop the register prefix and the highlight list: what remains is the thing
  // a member could actually look up.
  return safe.split("#")[0].replace(/^[a-z]+:/, "");
}

/** A solicitation ref can be revealed in the page itself; anything else can't. */
function revealFor(type: ProvenanceType, ref: string): string | null {
  return type === "solicitation" && sectionForRef(ref) ? ref : null;
}

/** The one link we may hand a member for an external source. `externalSourceUrl`
 *  rejects anything that isn't an absolute http(s) URL, and always rejects
 *  HigherGov — our data vendor is never shown to members as a source.
 *
 *  When the pin carries no linkable ref of its own, a SOLICITATION pin falls
 *  back to the issuing agency's posting for this opportunity. That fallback is
 *  deliberately narrow: a solicitation pin cites the solicitation, and the
 *  agency's posting is where that solicitation lives, so the link is the same
 *  document the claim came from. Every other type would be MISATTRIBUTED by it
 *  — an award-history (`fpds`) pin cites a past contract, a `profile`/`sam` pin
 *  cites the member's own record, and a conversation cites something said. None
 *  of those is proved by the opportunity's posting, and pointing at it would be
 *  a fabricated citation dressed as a convenience. */
function outboundHref(
  ref: string,
  type: ProvenanceType,
  sourcePath?: string | null,
): { href: string; hrefLabel: string } | null {
  const url = externalSourceUrl(ref);
  if (url) return { href: url, hrefLabel: "Open the original" };
  if (type !== "solicitation") return null;
  const agency = agencySource(sourcePath);
  return agency ? { href: agency.url, hrefLabel: agency.label } : null;
}

function provLineFor(pin: Pin): string {
  const p = pin.provenance;
  const base = labelFor(p.type);
  const at = str(p.retrievedAt);
  return at ? `${base} · retrieved ${at}` : base;
}

/** The pin's own label, which the chip and two headlines render. */
const labelOf = (pin: Pin): string => str(pin?.label) ?? "this source";

export function resolveSource(pin: Pin, ctx: SourceContext = {}): SourceView {
  try {
    return resolve(pin, ctx);
  } catch {
    // The invariant is that a tappable chip always answers. A pin shaped in a
    // way no branch above anticipated is still a pin the member just tapped —
    // and this runs during render, so throwing would take the page with it.
    return {
      kind: "unavailable",
      sourceLabel: "Source",
      locator: "Source",
      provLine: "Source",
      href: null,
      hrefLabel: null,
      headline: `Grant couldn't open ${labelOf(pin)}`,
      reason: "The reference came through in a shape we couldn't read.",
      usedInAnalysis: true,
    };
  }
}

function resolve(pin: Pin, ctx: SourceContext): SourceView {
  const { noticeId, sourcePath } = ctx;
  const p = pin?.provenance;
  const base: Base = {
    kind: "doc",
    sourceLabel: "Source",
    locator: "Source",
    provLine: "Source",
    href: null,
    hrefLabel: null,
  };
  // 0 · A pin with no provenance at all. `no pin, no ship` means this should be
  //     unreachable — but it arrives over the wire, so it gets a body like
  //     anything else rather than a destructuring throw inside the canvas.
  if (!p || typeof p !== "object") {
    return {
      ...base,
      kind: "unavailable",
      headline: `No source recorded for ${labelOf(pin)}`,
      reason: "Grant made this claim without attaching a reference to it.",
      usedInAnalysis: true,
    };
  }

  const ref = refOf(p);
  const outbound = outboundHref(ref, p.type, sourcePath);
  Object.assign(base, {
    sourceLabel: labelFor(p.type),
    locator: locatorFor(pin),
    provLine: provLineFor(pin),
    href: outbound?.href ?? null,
    hrefLabel: outbound?.hrefLabel ?? null,
  });

  // 1 · Explicitly flagged unreadable — say so, and say whether it mattered.
  if (p.unavailable) {
    return {
      ...base,
      kind: "unavailable",
      headline: `${labelOf(pin)} could not be read`,
      reason: str(p.unavailable.reason) ?? "Grant could not read this source.",
      usedInAnalysis: p.unavailable.usedInAnalysis !== false,
    };
  }

  // 2 · Something that was said — the member's own words to an agent, or a
  //     stretch of a mentor-call transcript.
  if (p.type === "chat" || p.type === "transcript") {
    const c = p.conversation;
    const turns = turnsOf(c);
    if (c && turns.length) {
      const cited = turns.find((t) => t.id === c.citedTurnId) ?? turns[0];
      const isSelf = cited.role === "member";
      const speaker = str(cited.speaker) ?? "They";
      return {
        ...base,
        kind: "conversation",
        // Publisher-first labelling: name whose words these are, not "[1]".
        sourceLabel: isSelf ? "Your own words" : `${speaker}, on the call`,
        // Who confirmed it matters: quoting the member back to themselves is a
        // different claim from quoting their mentor.
        provLine: c.attested
          ? isSelf
            ? "You confirmed this · verbatim, not paraphrased"
            : `${speaker} said this · verbatim, not paraphrased`
          : "Verbatim from the recording",
        href: null,
        hrefLabel: null,
        // The narrowed conversation, not the raw one — the body renders what we
        // checked here, so nothing unrenderable reaches React and `playAt`
        // (which the footer calls `.replace` on) is a string or absent.
        conversation: {
          ...c,
          turns,
          playAt: str(c.playAt) ?? undefined,
          learning: str(c.learning) ?? undefined,
          learningBy: str(c.learningBy) ?? undefined,
        },
        citedSpeaker: speaker,
        isSelf,
      };
    }
    return {
      ...base,
      kind: "unavailable",
      headline: "That exchange isn't on file",
      reason:
        p.type === "transcript"
          ? "Grant referenced a call but the transcript for it wasn't captured."
          : "Grant referenced something you said but the conversation wasn't kept.",
      usedInAnalysis: true,
    };
  }

  // 2b · A PUBLIC GOVERNMENT RECORD — the fourth geometry. Either one register
  //      row (an award) or a figure counted over many of them. `fpds` is the
  //      pre-existing spelling of the same thing and still resolves.
  //
  //      Both name the GOVERNMENT SYSTEM OF RECORD, never the aggregator we buy
  //      the data through and never a vague "our data": a member believes an
  //      incumbent claim because it is a federal award record, not because a
  //      vendor asserted it.
  if (p.type === "public" || p.type === "fpds") {
    const d = resolvePublic(ref, p);
    if (d?.shape === "entry") {
      return {
        ...base,
        kind: "public",
        sourceLabel: d.origin,
        locator: d.locator,
        provLine: `${d.origin} · ${d.asOf}`,
        // The register itself is not a member-facing destination — the
        // aggregator's page is the only URL that exists for it, and that is the
        // one thing we may never show.
        href: null,
        hrefLabel: null,
        entry: d,
      };
    }
    if (d?.shape === "tally") {
      return {
        ...base,
        kind: "tally",
        sourceLabel: d.origin,
        locator: d.locator,
        provLine: `${d.origin} · ${d.sampleOf} ${d.unit ?? "records"} · ${d.asOf}`,
        href: null,
        hrefLabel: null,
        tally: d,
      };
    }
    return {
      ...base,
      kind: "unavailable",
      headline: "That record isn't in the government's files",
      reason: `Grant referenced ${refLabel(ref)}, but no matching public record came back.`,
      usedInAnalysis: true,
    };
  }

  // 3 · A record the member owns — their profile, roadmap, registrations.
  if (p.type === "profile" || p.type === "sam") {
    const record = resolveRecord(p.type === "sam" ? "sam" : ref);
    if (record) {
      return {
        ...base,
        kind: "record",
        sourceLabel: "Your record",
        locator: record.locator,
        provLine: "From your record · not editable here",
        href: record.href,
        hrefLabel: record.href === "/roadmap" ? "Open in roadmap" : "Open in profile",
        record,
      };
    }
    return {
      ...base,
      kind: "unavailable",
      headline: "That record isn't on file yet",
      reason: ref
        ? `Grant looked for ${ref} and found nothing saved against your company.`
        : "Grant looked for a saved record and found nothing against your company.",
      usedInAnalysis: false,
    };
  }

  // 4 · Arithmetic — no passage exists, so show the working.
  if (p.type === "computed") {
    return {
      ...base,
      kind: "computed",
      note: str(p.quote) ?? "Derived from the dates and figures already shown above.",
    };
  }

  // 5 · A document passage. Full context when authored; bare quote otherwise.
  //     `span` is narrowed before it becomes a React child: an object here is
  //     not a bad-looking excerpt, it is an unmounted page.
  const span = str(p.excerpt?.span) ?? str(p.quote);
  if (span) {
    const before = str(p.excerpt?.before);
    const after = str(p.excerpt?.after);
    return {
      ...base,
      kind: "doc",
      before,
      span,
      after,
      contextMissing: !before && !after,
      revealRef: revealFor(p.type, ref),
    };
  }

  // 6 · No authored quote, but the ref names a section whose text we hold.
  const sec = sectionExcerpt(ref, noticeId);
  if (sec) {
    return {
      ...base,
      kind: "doc",
      locator: `Solicitation · ${sec.title} · ${ref}`,
      before: null,
      span: sec.body,
      after: null,
      // Section-level, not sentence-level — say so rather than implying a
      // precision we don't have.
      contextMissing: true,
      sectionOnly: true,
      revealRef: revealFor(p.type, ref),
    };
  }

  // 7 · Genuinely nothing to show. Still a real, explained state.
  return {
    ...base,
    kind: "unavailable",
    headline: `No excerpt for ${labelOf(pin)}`,
    reason:
      p.type === "web"
        ? "This came from a web source we link to rather than quote."
        : "Grant recorded this reference but did not capture a verbatim passage from it.",
    usedInAnalysis: true,
  };
}

/** Chip variant for a pin, so the inline chip matches what the sheet will show. */
export type ChipVariant = "doc" | "record" | "said" | "public" | "missing";

export function chipVariant(pin: Pin, ctx: SourceContext = {}): ChipVariant {
  const view = resolveSource(pin, ctx);
  if (view.kind === "unavailable") return "missing";
  if (view.kind === "record") return "record";
  if (view.kind === "conversation") return "said";
  // Both public shapes share a chip because both are COUNTED from government
  // records. If an INFERRED figure is ever added it needs its own variant — it
  // must not reach for this one (public-records-PRD.md §3 D2).
  if (view.kind === "public" || view.kind === "tally") return "public";
  return "doc";
}
