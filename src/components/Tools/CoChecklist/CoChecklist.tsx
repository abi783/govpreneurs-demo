import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, CircleCheck, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ToolRail } from "@/components/Tools/ToolRail";
import { EmailChecklistCta } from "@/components/Tools/EmailChecklistCta";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { getLatestSavedData, postToolResultFireAndForget } from "@/lib/tools/results";
import {
  CO_CHECKLIST_SECTIONS,
  CO_CHECKLIST_STORAGE_KEY,
  CO_CHECKLIST_TOTAL_ITEMS,
  evaluateCoChecklist,
} from "@/lib/tools/coChecklist";
import "./co-checklist.css";

function loadChecked(): Set<string> {
  try {
    const raw = window.localStorage.getItem(CO_CHECKLIST_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(checked: Set<string>): void {
  try {
    window.localStorage.setItem(CO_CHECKLIST_STORAGE_KEY, JSON.stringify(Array.from(checked)));
  } catch {
    /* ignore — private browsing / storage blocked */
  }
}

export function CoChecklist() {
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked());
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(false);

  const count = checked.size;
  const pct = Math.round((count / CO_CHECKLIST_TOTAL_ITEMS) * 100);
  const verdict = showResult ? evaluateCoChecklist(checked) : null;

  useEmbedBridge(showResult ? "result" : "input");

  // Restore from the account on a fresh device/browser (local state empty,
  // signed in) so the emailed link lands on the saved progress.
  useEffect(() => {
    if (checked.size > 0) return;
    void getLatestSavedData<{ checked?: string[] }>("co-checklist").then((saved) => {
      if (saved?.checked?.length) {
        const restored = new Set(saved.checked);
        setChecked(restored);
        saveChecked(restored);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (verdict && !reportedRef.current) {
      reportedRef.current = true;
      postToolResultFireAndForget({
        tool: "co-checklist",
        title: verdict.title,
        summary: verdict.sub,
        data: { score: count, total: CO_CHECKLIST_TOTAL_ITEMS, label: verdict.label },
      });
    }
  }, [verdict, count]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  };

  const evaluate = () => {
    setShowResult(true);
    reportedRef.current = false;
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resetAll = () => {
    setChecked(new Set());
    saveChecked(new Set());
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const main = (
    <div className="tool-main">
      <h1 className="tool-page-title">
        What a contracting officer checks before awarding you a contract
      </h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        The exact process a contracting officer runs through before selecting a winner — every
        unchecked box below is a gap an officer would flag.
      </p>

      <div className="coe-progress">
        <span className="t-body-sm">
          {count} of {CO_CHECKLIST_TOTAL_ITEMS} checked
        </span>
        <div className="coe-bar">
          <div className={`coe-fill${pct === 100 ? " full" : ""}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="t-body-sm coe-score">
          {count} / {CO_CHECKLIST_TOTAL_ITEMS}
        </span>
      </div>

      <EmailChecklistCta
        tool="co-checklist"
        title="Contracting officer's checklist"
        summary={`${count} of ${CO_CHECKLIST_TOTAL_ITEMS} items checked`}
        data={{ count, total: CO_CHECKLIST_TOTAL_ITEMS, checked: Array.from(checked) }}
      />

      <div>
        {CO_CHECKLIST_SECTIONS.map((s) => (
          <Card key={s.num} dense className="coe-section">
            <div className="coe-shead">
              <div className="coe-snum">{s.num}</div>
              <div>
                <div className="t-body coe-stitle">{s.title}</div>
                <div className="t-label">{s.label}</div>
              </div>
            </div>
            <div className="coe-sbody">
              <div className="t-body-sm coe-intro2">{s.intro}</div>
              {s.items.map((item, j) => {
                const id = `c${s.num}i${j}`;
                const isChecked = checked.has(id);
                return (
                  <div
                    key={id}
                    className={`coe-item${isChecked ? " checked" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggle(id);
                      }
                    }}
                  >
                    <div className={`coe-box${isChecked ? " checked" : ""}`}>
                      {isChecked && <Check size={13} aria-hidden />}
                    </div>
                    <div className="t-body-sm coe-itext">{item}</div>
                  </div>
                );
              })}
              <div className="coe-miss">
                <AlertTriangle size={17} aria-hidden />
                <div>
                  <div className="t-label coe-miss-lbl">What most businesses miss</div>
                  <div className="t-body-sm coe-miss-txt">{s.miss}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button type="button" className="coe-eval" onClick={evaluate}>
        <ClipboardCheck size={19} aria-hidden /> Evaluate my readiness
      </button>

      {verdict && (
        <div className="coe-result show" ref={resultRef}>
          <div className={`coe-rtop ${verdict.topClass}`}>
            <div className="t-label coe-rlabel">{verdict.label}</div>
            <div className="coe-rtitle">{verdict.title}</div>
            <div className="coe-rsub">{verdict.sub}</div>
          </div>
          <div className="coe-rbody">
            <div className="t-body coe-rmsg">{verdict.msg}</div>
            {verdict.gapSummary ? (
              <div className="coe-neg-wrap">
                <div className="coe-neg-head">
                  <AlertTriangle size={14} aria-hidden /> <span>{verdict.gapHeadline}</span>
                </div>
                <p className="t-body-sm coe-neg-summary">{verdict.gapSummary}</p>
              </div>
            ) : (
              <div className="coe-neg-empty">
                <CircleCheck size={20} aria-hidden /> Every box is checked — no gaps a contracting
                officer would flag.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="coe-reset-wrap">
        <button type="button" className="coe-reset" onClick={resetAll}>
          Start over
        </button>
      </div>
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "The exact checklist a contracting officer runs before award",
          "See gaps grouped by section, with what most businesses miss",
          "Your progress is saved on this device",
        ]}
        lastResult={verdict ? { title: verdict.title, createdAt: new Date().toISOString() } : null}
        crossLinks={[
          { label: "Registration checklist", to: "/tools/registration-checklist", external: true },
          { label: "Bid readiness scorecard", to: "/tools/scorecard" },
        ]}
      />
    </div>
  );
}
