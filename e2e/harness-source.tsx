// Adversarial harness for the SOURCE-REFERENCE surface (PR #29 port): the
// EvidencePin chip and the SourceSheet it opens, driven with the pin shapes a
// live backend, a prompt-injected LLM, or a contract drift could actually emit.
//
// Everything a pin carries is server-supplied and currently trusted end-to-end:
// provenance.type, .ref, .quote, .excerpt, .locator, .unavailable, and the whole
// .conversation sub-tree (turns, ids, timestamps, the derived `learning`).
//
// `real-*` scenarios are NOT hostile — they mount the shipped Fort Bragg fixture
// so the spec can prove each of the four sheet bodies actually renders in the app.
// Paired with source-sheet-hostile.spec.ts.
import "../src/styles.css"; // the REAL app CSS — layout assertions need it
import { createRoot } from "react-dom/client";
import { EvidencePin } from "../src/components/Grant/primitives";
import { GrantCanvas } from "../src/components/Grant/GrantCanvas";
import { getGrantAnalysis } from "../src/lib/grant";
import { OPPORTUNITIES } from "../src/lib/mock/opportunities";
import type { Conversation, Pin } from "../src/lib/grant/types";

const XSS = `<img src=x onerror="window.__xss=(window.__xss||0)+1">`;
const HUGE = "A".repeat(20_000);
const LONGWORD = "x".repeat(4_000); // one unbreakable token — the overflow classic
const RTL = "‮reversed‭ — ؀؁ ﷽ 🏗️👷‍♀️ z̴͑ͫa̵l͢g҉o";

const claim = "Bonding is the one thing that blocks a prime bid today.";

const turn = (id: string, speaker: string, role: string, at: string, text: string) =>
  ({ id, speaker, role, at, text }) as Conversation["turns"][number];

const convo = (patch: Partial<Conversation> = {}): Conversation =>
  ({
    channel: "mentor-call",
    title: "Positioning call with Diana",
    occurredAt: "2026-04-22T09:00:00Z",
    citedTurnId: "t2",
    attested: true,
    playAt: "14:32",
    turns: [
      turn("t1", "Diana Potts", "mentor", "14:11", "Can you do work two hours around you?"),
      turn("t2", "You", "member", "14:24", "Two, maybe three hours. Crew of three."),
      turn("t3", "Diana Potts", "mentor", "14:32", "Then go in as a sub on the big packages."),
    ],
    learning: "Sub-first for a year, on crew-size grounds.",
    learningBy: "Grant, from the recording",
    ...patch,
  }) as Conversation;

/** A pin, deliberately built through `unknown` — the point of this harness is
 *  the shapes TypeScript would reject but the wire will happily deliver. */
const p = (provenance: unknown, label = "Source"): Pin =>
  ({ label, provenance }) as unknown as Pin;

const SCENARIOS: Record<string, Pin> = {
  // ── injection ────────────────────────────────────────────────────────────
  // Markup in every model-authored string the sheet renders.
  "xss-doc": p({
    type: "solicitation",
    ref: "§L.4",
    locator: `Section L · ${XSS}`,
    excerpt: { before: `before ${XSS}`, span: `span ${XSS}`, after: `after ${XSS}` },
  }),
  "xss-convo": p({
    type: "transcript",
    ref: "call.x",
    conversation: convo({
      title: `Call ${XSS}`,
      learning: `We concluded ${XSS}`,
      learningBy: `Grant ${XSS}`,
      turns: [turn("t2", `Diana ${XSS}`, "mentor", "14:11", `He said ${XSS}`)],
    }),
  }),
  "xss-unavail": p({
    type: "solicitation",
    ref: "att-4",
    unavailable: { reason: `Scanned, no text ${XSS}`, usedInAnalysis: true },
  }),

  // ── navigation sinks ─────────────────────────────────────────────────────
  // The footer escape hatch is built from provenance.ref. These are the refs
  // that must never become a live link.
  "href-js": p({ type: "web", ref: "javascript:window.__xss=1", quote: "see the clause" }),
  "href-data": p({
    type: "web",
    ref: "data:text/html,<script>window.__xss=1</script>",
    quote: "see the clause",
  }),
  "href-vbscript": p({ type: "web", ref: "vbscript:msgbox(1)", quote: "q" }),
  // An absolute off-origin http URL IS allowed by externalSourceUrl — this asserts
  // what it opens WITH (target/rel), not that it is blocked.
  "href-offsite": p({ type: "web", ref: "https://evil.example.com/steal", quote: "q" }),
  // The vendor we must never surface to a member.
  "href-highergov": p({ type: "web", ref: "https://www.highergov.com/contract/123", quote: "q" }),
  // A record href is app-internal; a ref that tries to escape it.
  "href-record-traversal": p({ type: "profile", ref: "profile.../../etc/passwd" }),

  // ── contract drift ───────────────────────────────────────────────────────
  // A provenance type outside the union: LABEL[] and locatorFor() are both
  // total-by-type lookups with no runtime default.
  "type-unknown": p({ type: "carrier-pigeon", ref: "§A.2", quote: "the pigeon said so" }),
  // `ref` that is not a string — resolveRecord/.startsWith and new URL() both eat it.
  "ref-number": p({ type: "profile", ref: 42 }),
  "ref-null": p({ type: "solicitation", ref: null, quote: "a quote with no ref" }),
  "ref-object": p({ type: "profile", ref: { toString: () => "profile.identity.UEI" } }),
  // conversation.turns is not an array — `.length` is falsy-safe but `.find` is not.
  "turns-string": p({
    type: "chat",
    ref: "c",
    conversation: { ...convo(), turns: "he said it" as unknown as Conversation["turns"] },
  }),
  "turns-null": p({
    type: "chat",
    ref: "c",
    conversation: { ...convo(), turns: null as unknown as Conversation["turns"] },
  }),
  "convo-missing": p({ type: "transcript", ref: "call.gone" }),
  // Two turns sharing an id — React key collision, and citedTurnId matches both.
  "turns-dupe-id": p({
    type: "transcript",
    ref: "c",
    conversation: convo({
      citedTurnId: "same",
      turns: [
        turn("same", "Diana Potts", "mentor", "14:11", "First utterance."),
        turn("same", "You", "member", "14:12", "Second utterance."),
      ],
    }),
  }),
  // citedTurnId names a turn that isn't in the thread.
  "cited-missing": p({
    type: "transcript",
    ref: "c",
    conversation: convo({ citedTurnId: "nope" }),
  }),
  // A role outside the union (drives a CSS modifier), and a turn with no text.
  "turn-bad-role": p({
    type: "transcript",
    ref: "c",
    conversation: convo({
      citedTurnId: "t1",
      turns: [turn("t1", "", "auditor", "14:11", "")],
    }),
  }),
  // Dates that will not parse — the locator and each turn timestamp format them.
  "dates-bad": p({
    type: "transcript",
    ref: "c",
    conversation: convo({
      occurredAt: "not-a-date",
      turns: [turn("t2", "Diana Potts", "mentor", "yesterday-ish", "Go in as a sub.")],
    }),
  }),
  // playAt drives an href fragment via .replace(":", "-").
  "playat-weird": p({
    type: "transcript",
    ref: "c",
    conversation: convo({ playAt: `"><img src=x onerror=window.__xss=1>` }),
  }),
  // An excerpt with a span that is not a string.
  "excerpt-nonstring": p({
    type: "solicitation",
    ref: "§L.4",
    excerpt: { before: 1, span: { a: 1 }, after: [] },
  }),
  // An empty excerpt — span present but blank: the highlight has nothing to mark.
  "excerpt-empty": p({ type: "solicitation", ref: "§L.4", excerpt: { span: "" } }),

  // ── unbounded / unicode ──────────────────────────────────────────────────
  "giant-doc": p({
    type: "solicitation",
    ref: "§L.4",
    excerpt: { before: HUGE, span: LONGWORD, after: HUGE },
  }),
  "giant-convo": p({
    type: "transcript",
    ref: "c",
    conversation: convo({
      turns: Array.from({ length: 200 }, (_, i) =>
        turn(`t${i}`, LONGWORD.slice(0, 200), "mentor", "14:11", HUGE.slice(0, 2000)),
      ),
      citedTurnId: "t100",
    }),
  }),
  "giant-locator": p({ type: "solicitation", ref: "§L.4", locator: LONGWORD, quote: "q" }),
  unicode: p({
    type: "transcript",
    ref: RTL,
    conversation: convo({ title: RTL, learning: RTL, turns: [turn("t2", RTL, "mentor", RTL, RTL)] }),
  }),

  // ── structurally empty ───────────────────────────────────────────────────
  "empty-everything": p({ type: "solicitation", ref: "" }, ""),
  "no-provenance": p(undefined),

  // ── the agency posting ───────────────────────────────────────────────────
  // A solicitation citation with no passage and a ref that maps to no section:
  // the common live shape (the backend Provenance type carries no excerpts yet)
  // and the one that used to dead-end. Drive it with ?sourcePath=.
  "posting-solicitation": p(
    { type: "solicitation", ref: "§ZZ.9" },
    "DHS Enterprise Architecture requirements",
  ),
  // The same absence on a pin the posting does NOT prove — an award citation.
  "posting-award": p({ type: "fpds", ref: "W912PM-19-C-0043" }, "FPDS W912PM-19-C-0043"),

  // ── public government records (the fourth geometry) ─────────────────
  // The live shape before #30: the vendor deep link every real award ref carried.
  "award-vendor-ref": p(
    { type: "fpds", ref: "https://www.highergov.com/contract/03310323D0024-15JL1B26F00000602/" },
    "Cal-Maine Foods — prior award",
  ),
  // Entry: one register row.
  "public-entry": p(
    {
      type: "public",
      ref: "award:W912PM-19-C-0043#winner",
      award: {
        awardId: "W912PM-19-C-0043",
        title: null,
        description: "Barracks roofing — modified bitumen replacement",
        awardeeName: "Sterling Roofing Systems",
        agencyName: "Department of Defense · Army",
        naicsCode: "238160",
        naicsDescription: "Roofing Contractors",
        value: 4180000,
        offers: 4,
        fiscalYear: 2024,
        actionDate: "2024-03-11",
        setAside: "Total Small Business",
        extentCompeted: "Full And Open Competition",
        popState: "NC",
        solicitationId: null,
        sourceUrl: null,
        asOf: "2026-07-20T11:42:23.602Z",
      },
    },
    "Sterling — prior award",
  ),
  // Tally: a figure counted over many rows.
  "public-tally": p(
    {
      type: "public",
      ref: "tally:comparable-awards",
      tally: {
        kind: "comparable-awards",
        figure: 1200000,
        low: 790000,
        high: 3590000,
        countedOver: 14,
        matchedOn: "NAICS 238160 · Roofing Contractors",
        yearsCovered: "FY2019–FY2024",
        asOf: "2026-07-20T11:42:23.602Z",
        sample: [
          { awardId: "W912PM-19-C-0043", title: null, description: "Barracks roofing", awardeeName: "Sterling Roofing Systems", agencyName: "Department of Defense · Army", naicsCode: "238160", naicsDescription: null, value: 4180000, offers: 4, fiscalYear: 2024, actionDate: "2024-03-11", setAside: null, extentCompeted: null, popState: "NC", solicitationId: null, sourceUrl: null, asOf: null },
          { awardId: "N4008019D0007", title: null, description: "Roof replacement, Bldg 292", awardeeName: "Etolin Strait Partners", agencyName: "Naval Facilities Engineering Command", naicsCode: "238160", naicsDescription: null, value: 900000, offers: 2, fiscalYear: 2022, actionDate: "2022-05-02", setAside: null, extentCompeted: null, popState: "VA", solicitationId: null, sourceUrl: null, asOf: null },
        ],
      },
    },
    "historical band $790K–$3.6M",
  ),
};

/** The claim is model text too — it is restated inside the sheet (R1). */
const CLAIMS: Record<string, string> = {
  "xss-doc": `Grant said ${XSS}`,
  "giant-doc": HUGE,
};

declare global {
  interface Window {
    __xss?: number;
  }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("scenario") ?? "xss-doc";

  if (name.startsWith("real-")) {
    // The shipped Fort Bragg fixture, rendered through the real canvas — this is
    // the "was it actually implemented" half of the suite.
    const opp = OPPORTUNITIES.find((o) => o.noticeId === "W912EE-26-R-0066");
    if (!opp) return <p>fixture opportunity missing</p>;
    // `real-synth` is the production path: an opportunity that is NOT one of the
    // four hand-authored demos, so getGrantAnalysis falls through to synthesize()
    // and every pin is a bare section ref — exactly what the backend board and the
    // other ~55k opps emit. The section-text fallback also can't fire, because the
    // noticeId isn't in the mock OPPORTUNITIES list the solicitation text is
    // synthesized from.
    const target =
      name === "real-synth"
        ? { ...opp, noticeId: "HG-REAL-OPPKEY-0001" }
        : opp;
    return (
      <div style={{ padding: 16, maxWidth: 900 }}>
        <GrantCanvas analysis={getGrantAnalysis(target)} now={new Date("2026-05-07T12:00:00Z")} />
      </div>
    );
  }

  // `?scenario=public-inject&ref=…&payload=…` mounts an ARBITRARY public-record
  // payload. The register rows are vendor data reshaped by our pipeline, so the
  // hostile suite needs to drive shapes no fixture would contain — markup,
  // unbounded text, a vendor URL in every column.
  if (name === "public-inject") {
    let payload: Record<string, unknown> = {};
    try {
      // Markers rather than literals: a 200k-character field is exactly what we
      // need to drive, and exactly what a query string cannot carry.
      const raw = (params.get("payload") ?? "{}")
        .replace(/"@HUGE@"/g, JSON.stringify("A".repeat(200_000)))
        .replace(/"@LONGWORD@"/g, JSON.stringify("B".repeat(5_000)));
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
    const injected = p(
      { type: "public", ref: params.get("ref") ?? "award:X1", ...payload },
      "injected record",
    );
    return (
      <div style={{ padding: 16, maxWidth: 900 }}>
        <p id="before">A sentence before the pin.</p>
        <EvidencePin pin={injected} claim={claim} noticeId="W912EE-26-R-0066" />
      </div>
    );
  }

  const pin = SCENARIOS[name];
  if (!pin) return <p>unknown scenario</p>;
  // `?sourcePath=` drives the agency-posting fallback: the vendor record is
  // HigherGov's, but the link a member may follow is the ISSUING AGENCY's own
  // posting. Passing a highergov.com value here is how the spec proves the
  // vendor never leaks through.
  const sourcePath = params.get("sourcePath");
  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <p id="before">A sentence before the pin.</p>
      <EvidencePin
        pin={pin}
        claim={CLAIMS[name] ?? claim}
        noticeId="W912EE-26-R-0066"
        sourcePath={sourcePath}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
