import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatHeadline } from "@/components/Tools/StatHeadline";
import { StatBreakdown } from "@/components/Tools/StatBreakdown";
import { LeadGate } from "@/components/Tools/LeadGate";
import {
  GateProgress,
  LockedStack,
  LOCKED_SECTIONS_COUNT,
} from "@/components/Tools/SnapshotTeaser";
import { ToolFreshness } from "@/components/Tools/ToolShell";
import { ToolRail } from "@/components/Tools/ToolRail";
import { SummitPitch } from "@/components/Tools/SummitPitch";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { useSnapshotUnlock } from "@/lib/tools/useSnapshotUnlock";
import { toolsHead } from "@/lib/tools/toolsHead";
import {
  postScorecard,
  postResult,
  searchNaics,
  getToolsToken,
  type NaicsStat,
  type ScorecardResult,
} from "@/lib/tools/api";

interface Question {
  id: string;
  question: string;
  sub?: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "Is your business legally registered?",
    sub: "LLC, Corporation, or Sole Proprietor with an EIN",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q2",
    question: "How long have you been in business?",
    options: [
      { value: "new", label: "Less than 1 year" },
      { value: "mid", label: "1 to 3 years" },
      { value: "established", label: "3+ years" },
    ],
  },
  {
    id: "q3",
    question: "Are you registered on SAM.gov with an active UEI?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "partial", label: "I started but didn't finish" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q4",
    question: "Do you know your NAICS code(s)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "partial", label: "I have a rough idea" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q5",
    question: "Do you have a DSBS profile?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "What is DSBS?" },
    ],
  },
  {
    id: "q6",
    question: "Do you have a Capability Statement?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "What is that?" },
    ],
  },
  {
    id: "q7",
    question:
      "Have you assessed set-aside certification eligibility (8(a), WOSB, SDVOSB, HUBZone)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Not familiar" },
    ],
  },
  {
    id: "q8",
    question: "Does your website support your government contracting credibility?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "partial", label: "Somewhat" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q9",
    question: "Have you submitted a bid or responded to a solicitation?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q10",
    question: "Do you have past performance you can reference?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
];

const COLOR_COPY: Record<ScorecardResult["color"], string> = {
  red: "Not ready yet, but that's fixable",
  yellow: "Registered but not competitive yet",
  green: "Ready to compete",
};

const STORAGE_KEY = "tools:scorecard:answers";

function loadStoredAnswers(): { answers: Record<string, string>; naicsCode?: string } {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { answers: {} };
    const parsed = JSON.parse(raw);
    return {
      answers: parsed && typeof parsed.answers === "object" ? parsed.answers : {},
      naicsCode: typeof parsed?.naicsCode === "string" ? parsed.naicsCode : undefined,
    };
  } catch {
    return { answers: {} };
  }
}

function saveStoredAnswers(answers: Record<string, string>, naicsCode?: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, naicsCode }));
  } catch {
    /* ignore — private browsing / storage blocked */
  }
}

export const Route = createFileRoute("/tools/scorecard")({
  head: () =>
    toolsHead(
      "Bid Readiness Scorecard for Federal Contracts",
      "Score your readiness to bid on federal contracts in about 3 minutes. See exactly which gaps to close first — no email required, results on screen instantly.",
    ),
  component: ScorecardPage,
});

function OptionCards({
  question,
  value,
  onSelect,
}: {
  question: Question;
  value: string | undefined;
  onSelect: (value: string) => void;
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % question.options.length;
      optionRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + question.options.length) % question.options.length;
      optionRefs.current[prev]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(question.options[i].value);
    }
  };

  return (
    <div className="option-card-group" role="radiogroup" aria-label={question.question}>
      {question.options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            optionRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          tabIndex={value === opt.value || (!value && i === 0) ? 0 : -1}
          className="option-card"
          onClick={() => onSelect(opt.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ScorecardPage() {
  const initial = useRef(loadStoredAnswers());
  const [answers, setAnswers] = useState<Record<string, string>>(initial.current.answers);
  const [step, setStep] = useState(0);
  const [naicsQuery, setNaicsQuery] = useState("");
  const [naicsOptions, setNaicsOptions] = useState<NaicsStat[]>([]);
  const [naicsCode, setNaicsCode] = useState<string | undefined>(initial.current.naicsCode);
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!getToolsToken());
  const posted = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { headingRef, justUnlocked, trackGateViewed, onUnlocked } = useSnapshotUnlock("scorecard");

  const total = QUESTIONS.length;
  const question = QUESTIONS[step];
  const needsNaicsSearch =
    question.id === "q4" && (answers.q4 === "yes" || answers.q4 === "partial");
  const isLast = step === total - 1;

  useEmbedBridge(result ? "result" : "input");

  useEffect(() => {
    saveStoredAnswers(answers, naicsCode);
  }, [answers, naicsCode]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (result && !unlocked) trackGateViewed(result.naics?.code ?? "none");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, unlocked]);

  useEffect(() => {
    if (!result || !getToolsToken() || posted.current) return;
    posted.current = true;
    void postResult({
      tool: "scorecard",
      naics: result.naics?.code,
      title: result.naics?.title,
      color: result.color,
      gates: result.gates,
    }).catch(() => {
      /* best-effort */
    });
  }, [result]);

  const setAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    // Auto-advance, but not off the last question (needs "See my results" click)
    // and not when the NAICS typeahead just opened under this question.
    if (!isLast && !(question.id === "q4" && (value === "yes" || value === "partial"))) {
      advanceTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 250);
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const searchNaicsTypeahead = async (q: string) => {
    setNaicsQuery(q);
    if (!q.trim()) {
      setNaicsOptions([]);
      return;
    }
    try {
      const res = await searchNaics(q);
      setNaicsOptions(res.results);
    } catch {
      /* typeahead is best-effort */
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postScorecard({ answers, naics: naicsCode });
      setResult(res);
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setAnswers({});
    setNaicsCode(undefined);
    setNaicsQuery("");
    setStep(0);
    setResult(null);
    posted.current = false;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  // Single page-level h1 — rendered on every state below (quiz and result)
  // so there is exactly one h1 at all times; the verdict/question headings
  // are h2s.
  const pageTitle = (
    <h1 className="tool-page-title">Are you ready to bid on a federal contract?</h1>
  );

  if (result) {
    // "Revealed" = visible sections / (visible + the fix list counted as ONE
    // section + the 6 gated market findings). Visible = the verdict (1) plus
    // the NAICS headline's 4 mini-stats when a code was picked.
    const visibleSections = 1 + (result.naics ? 4 : 0);
    const totalSections = visibleSections + 1 + LOCKED_SECTIONS_COUNT;
    const revealedPct = Math.round((visibleSections / totalSections) * 100);

    const resultMain = (
      <div className="tool-main">
        {pageTitle}
        <div className={`tool-verdict-band ${result.color}`}>
          <div className="t-label">{result.color.toUpperCase()}</div>
          <h2 className="tool-page-title" style={{ marginTop: "var(--s-1)" }}>
            {COLOR_COPY[result.color]}
          </h2>
        </div>

        {result.summitPitch && <SummitPitch {...result.summitPitch} />}

        <div ref={headingRef as React.RefObject<HTMLDivElement>}>
          {/* Gate sits directly under the verdict — the fix list is the
              payoff, so the ask comes before the (blurred) list, not after. */}
          {!unlocked && (
            <div style={{ marginTop: "var(--s-5)" }}>
              {result.gates.length > 0 && (
                <p className="t-body tool-findings-line" style={{ marginBottom: "var(--s-3)" }}>
                  <strong>
                    {result.gates.length} {result.gates.length === 1 ? "fix" : "fixes"} and{" "}
                    {LOCKED_SECTIONS_COUNT} market findings
                  </strong>{" "}
                  are ready.
                </p>
              )}
              <GateProgress pct={revealedPct} label={`Your report is ${revealedPct}% revealed`} />
              <LeadGate
                source="scorecard"
                context={{ naics: result.naics?.code, color: result.color, gates: result.gates }}
                onUnlocked={() => {
                  setUnlocked(true);
                  onUnlocked(result.naics?.code);
                  void submit();
                }}
              />
            </div>
          )}

          {result.gates.length > 0 && (
            <div
              style={{ marginTop: "var(--s-5)" }}
              className={unlocked ? undefined : "tool-fixlist-lockwrap"}
            >
              <div className="t-label">
                {result.gates.length === 1
                  ? "1 thing to fix first"
                  : `${result.gates.length} things to fix first`}
              </div>
              <ol
                className={unlocked ? undefined : "tool-fixlist-locked"}
                aria-hidden={!unlocked}
                style={{
                  marginTop: "var(--s-2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-2)",
                  listStyle: "none",
                }}
              >
                {result.gates.map((gate, i) => (
                  <li
                    key={gate}
                    className="t-body-sm"
                    style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}
                  >
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--n-3)",
                        color: "var(--n-9)",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ paddingTop: 2 }}>{gate}</span>
                  </li>
                ))}
              </ol>
              {!unlocked && (
                <div className="tool-locked-stack__badge">
                  <Lock size={14} aria-hidden />
                  <span>Unlocks with your email</span>
                </div>
              )}
            </div>
          )}

          {result.naics && (
            <div style={{ marginTop: "var(--s-5)" }}>
              <StatHeadline stat={result.naics} openLine="Open in your code" />
              <ToolFreshness asOf={result.naics.asOf} />
            </div>
          )}

          {!unlocked && result.naics && (
            <div style={{ marginTop: "var(--s-4)" }}>
              <LockedStack showBadge={result.gates.length === 0} />
            </div>
          )}

          {unlocked && result.naics && (
            <>
              {justUnlocked && (
                <p className="t-body-sm tool-unlocked-toast">
                  Unlocked — your report is ready. Download the PDF any time.
                </p>
              )}
              <StatBreakdown stat={result.naics} />
            </>
          )}
        </div>

        <div className="tool-crosslink-row" style={{ marginTop: "var(--s-6)", gap: "var(--s-4)" }}>
          {result.naics && (
            <Link to="/tools/demand" search={{ naics: result.naics.code }} className="t-body-sm">
              See demand for this code →
            </Link>
          )}
          <Link to="/tools/naics" className="t-body-sm">
            Find related NAICS codes →
          </Link>
          <button
            type="button"
            onClick={retake}
            className="t-body-sm"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--blue-7)",
            }}
          >
            Retake →
          </button>
        </div>
      </div>
    );

    if (isEmbedMode()) return resultMain;

    return (
      <div className="tool-layout">
        {resultMain}
        <ToolRail
          bullets={[
            "Ten questions, one honest verdict",
            "A numbered list of exactly what to fix first",
            "Your market snapshot for the code you picked — plus a PDF",
          ]}
          lastResult={{ title: COLOR_COPY[result.color], createdAt: new Date().toISOString() }}
          hideSignIn={!unlocked}
          crossLinks={[
            { label: "Check demand for a trade", to: "/tools/demand" },
            { label: "Search NAICS codes", to: "/tools/naics" },
          ]}
        />
      </div>
    );
  }

  const main = (
    <div className="tool-main">
      {pageTitle}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-3)",
        }}
      >
        <span className="t-label" style={{ color: "var(--n-8)" }}>
          Question {step + 1} of {total}
        </span>
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="t-body-sm"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--blue-7)",
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <span className="tool-progress-bar" style={{ display: "block", marginTop: "var(--s-2)" }}>
        <span className="tool-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </span>

      <h2
        style={{
          fontSize: "clamp(22px, 2.4vw, 30px)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginTop: "var(--s-5)",
          textWrap: "balance",
        }}
      >
        {question.question}
      </h2>
      {question.sub && (
        <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: 4 }}>
          {question.sub}
        </p>
      )}

      <div style={{ marginTop: "var(--s-4)" }}>
        <OptionCards question={question} value={answers[question.id]} onSelect={setAnswer} />
      </div>

      {needsNaicsSearch && (
        <div style={{ marginTop: "var(--s-4)" }}>
          <Input
            aria-label="Search your NAICS code"
            value={naicsQuery}
            onChange={(e) => void searchNaicsTypeahead(e.target.value)}
            placeholder="Search your NAICS code"
          />
          {naicsOptions.length > 0 && !naicsCode && (
            <ul
              style={{ marginTop: "var(--s-2)", display: "flex", flexDirection: "column", gap: 4 }}
            >
              {naicsOptions.slice(0, 5).map((opt) => (
                <li key={opt.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setNaicsCode(opt.code);
                      setNaicsQuery(`${opt.code} · ${opt.title}`);
                      setNaicsOptions([]);
                    }}
                    className="t-body-sm"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "var(--s-1) 0",
                      cursor: "pointer",
                      color: "var(--blue-7)",
                      textAlign: "left",
                    }}
                  >
                    {opt.code} · {opt.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {naicsCode && (
            <div style={{ marginTop: "var(--s-3)" }}>
              <Button onClick={() => setStep((s) => Math.min(s + 1, total - 1))}>Continue</Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          className="t-body-sm"
          style={{
            color: "var(--urg-7)",
            marginTop: "var(--s-4)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s-2)",
          }}
        >
          {error}
          <button type="button" onClick={() => void submit()} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </p>
      )}

      {isLast && (
        <>
          {/* Desktop: inline button. Mobile: sticky bar pinned to viewport bottom
              (tools.css hides one or the other via the 640px breakpoint). */}
          <div style={{ marginTop: "var(--s-5)" }} className="tool-cta-inline">
            <Button onClick={submit} disabled={!answers[question.id] || loading}>
              {loading ? "Scoring…" : "See my results"}
            </Button>
          </div>
          <div className="tool-sticky-cta">
            <Button onClick={submit} disabled={!answers[question.id] || loading}>
              {loading ? "Scoring…" : "See my results"}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "Ten honest questions, one clear verdict",
          "Exactly what to fix before you bid",
          "Answers are saved if you reload the page",
        ]}
        crossLinks={[
          { label: "Check demand for a trade", to: "/tools/demand" },
          { label: "Search NAICS codes", to: "/tools/naics" },
        ]}
      />
    </div>
  );
}
