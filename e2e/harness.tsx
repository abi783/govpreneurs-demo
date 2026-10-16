// Dev-only harness: mounts the REAL GrantRail with a chosen fixture (?scenario=)
// so Playwright can drive every rail interaction in a real browser, with
// /grants-take/rail intercepted. GrantRail reads only analysis.{opportunityId,
// meta, rail}, so these fixtures are intentionally minimal. Window hooks let a
// test simulate a same-opp regen or an opportunity switch.
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
// The real stylesheet, so the harness shows the rail AS SHIPPED — the specs are
// behavioral, but visual captures off this page must not show raw browser chrome.
import "../src/styles.css";
import { GrantRail } from "../src/components/Grant/GrantRail";
import type { GrantAnalysis, OpenQuestion } from "../src/lib/grant/types";

type Kind = OpenQuestion["input"]["kind"];
const oq = (id: string, text: string, kind: Kind, chipNoun?: string) => ({
  id,
  question: [{ text }],
  payoff: [{ text: "Moves this from a maybe to a yes-or-no." }],
  verdictSwing: 0.8,
  input: { kind },
  status: "open",
  ...(chipNoun ? { chipNoun } : {}),
});

// A reworded doubt chip (label ≠ query) proves the PR #25 pin.
const askChips = [
  { slot: "doubt", label: "Can I win this project?", query: "Can I win it?", kind: "ask" },
  { slot: "improve", label: "Answer the bonding question", kind: "elicit", target: "q_bond" },
  { slot: "act", label: "What should my response say?", kind: "ask" },
];
const routeChips = [
  { slot: "doubt", label: "Why not as prime?", kind: "ask" },
  { slot: "improve", label: "Answer the bonding question", kind: "elicit", target: "q_bond" },
  { slot: "act", label: "How do I find a partner?", kind: "route", target: "/partners" },
];

const rail = (openQuestions: unknown[], suggestedChips: unknown[]): GrantAnalysis =>
  ({
    opportunityId: "OPP-TEST",
    meta: { checksRun: 14, sourcesConsulted: 5 },
    rail: {
      briefing: [[{ text: "I've read this one. Ask me anything." }]],
      openQuestions,
      suggestedChips,
    },
  }) as unknown as GrantAnalysis;

const BOND = oq("q_bond", "What's your bonding capacity?", "text", "bonding");
const SITE = oq("q_sv", "Did you attend the site visit?", "yesno");
const RATE = oq("q_rate", "What is your loaded labor rate?", "currency", "pricing");
const WHEN = oq("q_when", "When can you certify?", "date");

const SCENARIOS: Record<string, GrantAnalysis> = {
  default: rail([BOND], askChips),
  yesno: rail([SITE], askChips),
  currency: rail([RATE], askChips),
  date: rail([WHEN], askChips),
  multi: rail([BOND, SITE, RATE], askChips),
  route: rail([BOND], routeChips),
  // One question still open, two already answered — the edit-answers surface.
  answered: {
    ...rail([RATE], askChips),
    rail: {
      ...rail([RATE], askChips).rail,
      answeredQuestions: [
        {
          id: "q_bond",
          question: [{ text: "What's your bonding capacity?" }],
          value: "$1.5M single, $4M aggregate",
        },
        {
          id: "q_sv",
          question: [{ text: "Did you attend the site visit?" }],
          value: "Yes",
        },
      ],
    },
  } as unknown as GrantAnalysis,
};

declare global {
  interface Window {
    __answered: number;
    /** Times the mentor CTA under a draft_request reply was dispatched. */
    __mentor: number;
    __regenSameOpp: () => void;
    __switchOpp: () => void;
  }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const initial = SCENARIOS[params.get("scenario") ?? "default"] ?? SCENARIOS.default;
  const [a, setA] = useState<GrantAnalysis>(initial);

  useEffect(() => {
    window.__answered = 0;
    window.__mentor = 0;
    // Same-opp regen: a NEW analysis object, SAME opportunityId, queue drained.
    window.__regenSameOpp = () =>
      setA((p) => ({ ...p, rail: { ...p.rail, openQuestions: [] } }));
    // Opportunity switch: a different opportunityId.
    window.__switchOpp = () =>
      setA((p) => ({
        ...p,
        opportunityId: "OPP-OTHER",
        rail: { ...p.rail, openQuestions: [] },
      }));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <GrantRail
        analysis={a}
        open={true}
        onOpenChange={() => {}}
        onAnswered={() => {
          window.__answered += 1;
        }}
        onReviewWithMentor={() => {
          window.__mentor += 1;
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
