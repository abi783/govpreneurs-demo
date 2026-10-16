// Adversarial harness: mounts the REAL Grant rail primitives with DELIBERATELY
// hostile analysis payloads — the shapes a compromised/degenerate backend, a
// prompt-injected LLM, or a bad merge could actually emit. Everything here is a
// server-supplied value the FE currently trusts: chip.target, chip.slot,
// chip.search, question text, briefing text, provenance refs.
//
// Nothing in this file is a fixture we ship; it exists so Playwright can prove
// the surface holds when the data does not. Paired with grant-rail-hostile.spec.ts.
import "../src/styles.css"; // the REAL app CSS — layout assertions are meaningless without it
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { GrantRail } from "../src/components/Grant/GrantRail";
import { GrantCanvas } from "../src/components/Grant/GrantCanvas";
import { EvidencePin } from "../src/components/Grant/primitives";
import { getGrantAnalysis } from "../src/lib/grant";
import type { Opportunity } from "../src/lib/mock/opportunities";
import type { GrantAnalysis, OpenQuestion, Pin } from "../src/lib/grant/types";

type Kind = OpenQuestion["input"]["kind"];
const oq = (id: string, text: string, kind: Kind = "text") => ({
  id,
  question: [{ text }],
  payoff: [{ text: "Moves this from a maybe to a yes-or-no." }],
  verdictSwing: 0.8,
  input: { kind },
  status: "open",
});

const rail = (
  openQuestions: unknown[],
  suggestedChips: unknown[],
  briefing: unknown[] = [[{ text: "I've read this one. Ask me anything." }]],
  meta: unknown = { checksRun: 14, sourcesConsulted: 5 },
): GrantAnalysis =>
  ({
    opportunityId: "OPP-TEST",
    meta,
    rail: { briefing, openQuestions, suggestedChips },
  }) as unknown as GrantAnalysis;

const BOND = oq("q_bond", "What's your bonding capacity?");
const SAFE_CHIPS = [
  { slot: "doubt", label: "Can I win this project?", query: "Can I win it?", kind: "ask" },
];

// ── the hostile payloads ─────────────────────────────────────────────────────

const XSS = `<img src=x onerror="window.__xss=(window.__xss||0)+1">`;
const HUGE = "A".repeat(20_000);
const LONGWORD = "x".repeat(4_000); // one unbreakable token — the overflow classic
const RTL = "‮reversed‭ — ؀؁ ﷽ 🏗️👷‍♀️ z̴͑ͫa̵l͢g҉o";

const SCENARIOS: Record<string, GrantAnalysis> = {
  // A javascript: URL and an off-origin URL in a route chip's target — the one
  // navigation sink on the rail (GrantRail.onChip → window.location.assign).
  "chip-js": rail(
    [BOND],
    [{ slot: "act", label: "Find a partner", kind: "route", target: "javascript:window.__xss=1" }],
  ),
  "chip-offsite": rail(
    [BOND],
    [
      {
        slot: "act",
        label: "Find a partner",
        kind: "route",
        target: "https://evil.example.com/steal",
      },
    ],
  ),
  // A route chip with no target at all, and one whose search is not a flat
  // string map (URLSearchParams stringifies objects to "[object Object]").
  "chip-notarget": rail(
    [BOND],
    [
      { slot: "act", label: "Go nowhere", kind: "route" },
      { slot: "doubt", label: "Weird search", kind: "route", target: "/partners", search: { a: { b: 1 } } },
    ],
  ),
  // Duplicate slot values — `key={c.slot}` in GrantRail collides.
  "chip-dupe-slot": rail(
    [BOND],
    [
      { slot: "doubt", label: "First doubt", kind: "ask", query: "one" },
      { slot: "doubt", label: "Second doubt", kind: "ask", query: "two" },
      { slot: "doubt", label: "Third doubt", kind: "ask", query: "three" },
    ],
  ),
  // An elicit chip pointing at a question id that is not in the queue.
  "chip-badtarget": rail([BOND], [{ slot: "improve", label: "Answer it", kind: "elicit", target: "nope" }]),
  // An unknown chip kind (contract drift): falls through to send(label).
  "chip-unknown-kind": rail([BOND], [{ slot: "act", label: "Do something", kind: "teleport" }]),
  // Markup in every model-authored string.
  xss: rail(
    [oq("q_x", `What's your bonding capacity? ${XSS}`)],
    [{ slot: "doubt", label: `Can I win? ${XSS}`, kind: "ask" }],
    [[{ text: `I've read this one. ${XSS}` }]],
  ),
  // Unbounded text: a 20k-char question, a 4k unbreakable token in a chip.
  giant: rail(
    [oq("q_g", `Bonding capacity? ${HUGE}`)],
    [{ slot: "doubt", label: LONGWORD, kind: "ask", query: "q" }],
    [[{ text: HUGE }]],
  ),
  // Bidi/combining/emoji, plus a non-numeric meta (backend contract says number).
  unicode: rail([oq("q_u", RTL)], [{ slot: "doubt", label: RTL, kind: "ask", query: RTL }], [[{ text: RTL }]], {
    checksRun: "fourteen",
    sourcesConsulted: null,
  }),
  // Structurally empty: no chips, no briefing, an empty-text question.
  empty: rail([oq("q_e", "")], [], []),
  // A queue of 40 — the "I still need" count and one-at-a-time card under load.
  flood: rail(
    Array.from({ length: 40 }, (_, i) => oq(`q_${i}`, `Question ${i + 1}?`)),
    SAFE_CHIPS,
  ),
  // Two questions sharing one id — React `key={openQuestion.id}` collision on advance.
  "dupe-qid": rail([oq("same", "First question?"), oq("same", "Second question?")], SAFE_CHIPS),
  // A question whose input.kind is not one of the three the card knows.
  "bad-kind": rail([oq("q_k", "How many crews?", "slider" as Kind)], SAFE_CHIPS),
  // rail.openQuestions missing entirely (older/degraded payload).
  "no-queue": rail(undefined as unknown as unknown[], SAFE_CHIPS),
};

// A provenance pin whose ref is a javascript: URL — externalSourceUrl only
// rejects HigherGov hosts and unparseable strings, and window.open is the sink.
const HOSTILE_PIN: Pin = {
  label: "Source",
  provenance: { type: "web", ref: "javascript:window.__xss=1", quote: "see clause" },
};

// ── canvas scenarios ─────────────────────────────────────────────────────────
// The canvas renders the WHOLE take (verdict, reads, gates, real deadline,
// compliance matrix, evidence, CTA). It is built from a synthesized analysis and
// then corrupted the way a bad backend payload would corrupt it.

const BASE_OPP = {
  noticeId: "HOSTILE-1",
  title: "Re-roof of 6 barracks",
  agency: "USACE",
  workType: "Roofing",
  valueLow: 420_000,
  valueHigh: 560_000,
  location: "Fort Bragg, NC",
  closesAt: "2026-09-30T17:00:00Z",
  matchTier: "strong",
  matchScore: 96,
  hunterReasoning: "Right in your lane.",
  eligibility: "qualify",
  setAside: "SDVOSB",
  mode: "prime",
  scope: "fed",
} as unknown as Opportunity;

/** A fresh synthesized analysis (the cache is keyed by noticeId, so vary it). */
const baseAnalysis = (id: string): GrantAnalysis =>
  structuredClone(getGrantAnalysis({ ...BASE_OPP, noticeId: id }));

const corrupt = (id: string, mutate: (a: GrantAnalysis) => void): GrantAnalysis => {
  const a = baseAnalysis(id);
  mutate(a);
  return a;
};

const CANVAS: Record<string, GrantAnalysis> = {
  // Enum drift: values outside the unions every lookup table is keyed by.
  "canvas-bad-enums": corrupt("H-enums", (a) => {
    (a.verdict as { value: string }).value = "maybe";
    (a.verdict as { path: string }).path = "sideways";
    a.reads.forEach((r) => {
      (r as { status: string }).status = "sideways";
      (r as { epistemic: string }).epistemic = "vibes";
    });
  }),
  // Numbers that are not numbers, and a deadline that will not parse.
  "canvas-nan": corrupt("H-nan", (a) => {
    (a.meta as { checksRun: unknown }).checksRun = "many";
    (a.realDeadlineInputs as { responseDue: string }).responseDue = "not-a-date";
    (a.realDeadlineInputs as { bondingLeadDays: unknown }).bondingLeadDays = NaN;
    (a.realDeadlineInputs as { writingDays: unknown }).writingDays = -5;
  }),
  // A deadline that has already passed — negative runway.
  "canvas-past": corrupt("H-past", (a) => {
    (a.realDeadlineInputs as { responseDue: string }).responseDue =
      "2020-01-01T00:00:00Z";
  }),
  // Structurally empty: no reads, no compliance rows, no findings.
  "canvas-empty": corrupt("H-empty", (a) => {
    a.reads = [];
    a.complianceMatrix = [];
    (a as { findings?: unknown[] }).findings = [];
  }),
  // Unbounded model text in the verdict + every read.
  "canvas-huge": corrupt("H-huge", (a) => {
    a.verdict.gist = [{ text: HUGE }];
    a.reads.forEach((r) => (r.sentence = [{ text: LONGWORD }]));
  }),
  // A javascript: provenance ref reached through the canvas, not standalone.
  "canvas-evil-pin": corrupt("H-pin", (a) => {
    a.complianceMatrix.forEach((row) => {
      (row as { sourceClause: Pin }).sourceClause = HOSTILE_PIN;
    });
  }),
  // Markup in the verdict + reads.
  "canvas-xss": corrupt("H-xss", (a) => {
    a.verdict.gist = [{ text: XSS }];
    a.reads.forEach((r) => (r.sentence = [{ text: XSS }]));
  }),
};

declare global {
  interface Window {
    __answered: number;
    __xss?: number;
    __assigned?: string[];
    __switchOpp: () => void;
    __setAnalysis: (patch: Record<string, unknown>) => void;
  }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("scenario") ?? "xss";
  const [a, setA] = useState<GrantAnalysis>(SCENARIOS[name] ?? SCENARIOS.xss);

  useEffect(() => {
    window.__answered = 0;
    window.__switchOpp = () =>
      setA((p) => ({ ...p, opportunityId: "OPP-OTHER", rail: { ...p.rail, openQuestions: [] } }));
    window.__setAnalysis = (patch) => setA((p) => ({ ...p, ...patch }) as GrantAnalysis);
  }, []);

  if (name === "pin") return <EvidencePin pin={HOSTILE_PIN} />;
  if (name.startsWith("canvas-")) {
    const analysis = CANVAS[name];
    if (!analysis) return <p>unknown canvas scenario</p>;
    return (
      <div style={{ padding: 16, maxWidth: 900 }}>
        <GrantCanvas analysis={analysis} now={new Date("2026-07-29T12:00:00Z")} />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <GrantRail
        analysis={a}
        open={true}
        onOpenChange={() => {}}
        onAnswered={() => {
          window.__answered += 1;
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
