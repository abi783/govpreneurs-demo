import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ToolRail } from "@/components/Tools/ToolRail";
import { EmailChecklistCta } from "@/components/Tools/EmailChecklistCta";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { getLatestSavedData, postToolResultFireAndForget } from "@/lib/tools/results";
import {
  REGISTRATION_STEPS,
  REGISTRATION_CHECKLIST_STORAGE_KEY,
} from "@/lib/tools/registrationChecklist";
import "./registration-checklist.css";

function loadDone(): Set<number> {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_CHECKLIST_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveDone(done: Set<number>): void {
  try {
    window.localStorage.setItem(
      REGISTRATION_CHECKLIST_STORAGE_KEY,
      JSON.stringify(Array.from(done)),
    );
  } catch {
    /* ignore — private browsing / storage blocked */
  }
}

export function RegistrationChecklist() {
  const [done, setDone] = useState<Set<number>>(() => loadDone());
  const total = REGISTRATION_STEPS.length;
  const count = done.size;
  const complete = count === total;

  useEmbedBridge(complete ? "result" : "input");

  // Restore from the account on a fresh device/browser (local state empty,
  // signed in) so the emailed link lands on the saved progress.
  useEffect(() => {
    if (done.size > 0) return;
    void getLatestSavedData<{ done?: number[] }>("registration-checklist").then((saved) => {
      if (saved?.done?.length) {
        const restored = new Set(saved.done);
        setDone(restored);
        saveDone(restored);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (complete) {
      postToolResultFireAndForget({
        tool: "registration-checklist",
        title: "Registration roadmap complete",
        summary: `${count} of ${total} steps checked`,
        data: { count, total },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      saveDone(next);
      return next;
    });
  };

  const reset = () => {
    setDone(new Set());
    saveDone(new Set());
  };

  const pct = Math.round((count / total) * 100);

  const main = (
    <div className="tool-main">
      <h1 className="tool-page-title">Federal contracting registration checklist: 9 steps</h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        The government spends over $700 billion a year buying from businesses like yours — work
        through these steps in order, each one builds on the last.
      </p>

      <div className="gpr-progress">
        <span className="t-label">Your progress</span>
        <div className="gpr-bar">
          <div className="gpr-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="t-body-sm gpr-count">
          {count} of {total}
        </span>
        {count > 0 && (
          <button type="button" className="gpr-reset" onClick={reset}>
            <RotateCcw size={13} aria-hidden /> Reset
          </button>
        )}
      </div>

      <EmailChecklistCta
        tool="registration-checklist"
        title="Registration roadmap"
        summary={`${count} of ${total} steps done`}
        data={{ count, total, done: Array.from(done) }}
      />

      {complete && (
        <div className="gpr-done-msg t-body-sm">
          <Check size={18} aria-hidden /> You&apos;ve mapped your full registration roadmap.
          Here&apos;s what comes next 👇
        </div>
      )}

      <div className="gpr-steps">
        {REGISTRATION_STEPS.map((step, i) => {
          const isDone = done.has(i);
          return (
            <div key={step.title} className="gpr-step">
              <div className="gpr-rail">
                <div className={`gpr-num${isDone ? " done" : ""}`}>
                  {isDone ? <Check size={16} aria-hidden /> : i + 1}
                </div>
                {i < REGISTRATION_STEPS.length - 1 && <div className="gpr-line" />}
              </div>
              <Card
                interactive
                onClick={() => toggle(i)}
                className={`gpr-body${isDone ? " done" : ""}`}
              >
                <div className="gpr-head">
                  <div className={`t-body${isDone ? " gpr-title-done" : ""}`}>{step.title}</div>
                  <div className={`gpr-check${isDone ? " done" : ""}`}>
                    {isDone && <Check size={14} aria-hidden />}
                  </div>
                </div>
                <div className="t-label gpr-why-lbl">Why it matters</div>
                <div className="t-body-sm">{step.why}</div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "Every registration step in the order it actually needs doing",
          "Why each step matters, not just what to click",
          "Your progress is saved on this device",
        ]}
        lastResult={
          complete
            ? { title: "Registration roadmap complete", createdAt: new Date().toISOString() }
            : null
        }
        crossLinks={[
          { label: "Contracting officer checklist", to: "/tools/co-checklist", external: true },
          { label: "Bid readiness scorecard", to: "/tools/scorecard" },
        ]}
      />
    </div>
  );
}
