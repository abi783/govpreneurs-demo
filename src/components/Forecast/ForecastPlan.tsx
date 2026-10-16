// Get ready: the dated plan from today until the bid request posts (v5 box 9). It is
// the only place for to-dos and deadlines. Tasks are numbered so a limit can point at
// one, and the first unfinished task says Start here, which does the work the old
// "Recommended next move" box did. A step that waits for an event is shown, but not
// counted until it happens. With no steps, the box is not shown.

import { Check, Zap } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { StepAction, type RailFocus } from "./StepAction";
import {
  countedSteps,
  nextMove,
  stepNumbers,
  type ForecastRead,
  type PlanStep,
} from "../../lib/forecasts/grant";
import { READY } from "../../lib/forecasts/grantCopy";

function Step({
  step,
  n,
  done,
  isStart,
  onToggle,
  onRail,
}: {
  step: PlanStep;
  n: number | undefined;
  done: boolean;
  isStart: boolean;
  onToggle: () => void;
  onRail: (focus: RailFocus) => void;
}) {
  const task = step.kind === "task";
  // A step Grant can help with, and no other destination, opens Grant's chat. A step
  // with neither has no button: the title is the thing to do.
  const helps = step.owners?.some((o) => o === "grant_help" || o === "grant_drafts");
  const action: PlanStep["action"] =
    step.action ?? (helps ? { kind: "rail", label: READY.askGrant } : undefined);
  // A button that names the term already says it, so the term is not shown twice.
  const term = step.term && !action?.label.includes(step.term) ? step.term : null;
  return (
    <li
      id={`fc-step-${step.id}`}
      tabIndex={-1}
      className={`fc-step fc-step--${step.kind}${done ? " is-done" : ""}${isStart ? " is-start" : ""}`}
    >
      {task ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? READY.unmark(step.title) : READY.mark(step.title)}
          className="fc-step__box"
          onClick={onToggle}
        >
          {done && <Check size={12} strokeWidth={3} aria-hidden />}
        </button>
      ) : (
        <span className="fc-step__auto" aria-hidden>
          <Zap size={12} strokeWidth={2.2} />
        </span>
      )}
      <span className="fc-step__n mono" aria-hidden>
        {task ? n : READY.ifStep}
      </span>
      <div className="fc-step__main">
        <p className="fc-step__title">
          {isStart && <span className="fc-step__start">{READY.start}</span>}
          {step.title}
        </p>
        {(step.body || term) && (
          <p className="fc-step__body">
            {step.body}
            {term && <span className="fc-step__term">{term}</span>}
          </p>
        )}
        {(step.owners?.length || step.forWhat || !task) && (
          <div className="fc-step__tags">
            {step.owners?.map((o) => (
              <span key={o} className={`fc-owner fc-owner--${o}`}>
                {READY.owner[o]}
              </span>
            ))}
            {step.forWhat && (
              <span className="fc-step__for">
                {READY.forVerb[step.forWhat.verb]} <b>{step.forWhat.what}</b>
              </span>
            )}
            {!task && <span className="fc-step__for">{READY.notCounted}</span>}
          </div>
        )}
      </div>
      {action && (
        <StepAction
          action={action}
          className={
            isStart ? "btn btn-primary btn-sm fc-step__action" : "fc-textlink fc-step__action"
          }
          onRail={onRail}
        />
      )}
    </li>
  );
}

export function ForecastPlan({
  read,
  done,
  onToggle,
  onRail,
}: {
  read: ForecastRead;
  done: ReadonlySet<string>;
  onToggle: (stepId: string) => void;
  onRail: (focus: RailFocus) => void;
}) {
  if (read.plan.every((ph) => ph.steps.length === 0)) return null;
  const counted = countedSteps(read);
  const start = nextMove(read, done);
  const numbers = stepNumbers(read);
  const finished = counted.filter((s) => done.has(s.id)).length;

  return (
    <section className="ui-card fc-plan" aria-labelledby="fc-plan-title" id="get-ready">
      <div className="fc-plan__head">
        <h2 id="fc-plan-title" className="fc-plan__title">
          <AgentAvatar agent="grant" size={24} /> {READY.title}
        </h2>
        {counted.length > 0 && (
          <span className="fc-plan__count mono">{READY.done(finished, counted.length)}</span>
        )}
      </div>
      {read.plan
        .filter((ph) => ph.steps.length > 0)
        .map((phase) => (
          <div key={phase.id} className="fc-phase">
            <div className="fc-phase__head">
              <span className="fc-phase__name">{phase.name}</span>
              {phase.when && <span className="fc-phase__when">{phase.when}</span>}
              {phase.goal && <span className="fc-phase__goal">{phase.goal}</span>}
            </div>
            <ul className="fc-plan__steps">
              {phase.steps.map((s) => (
                <Step
                  key={s.id}
                  step={s}
                  n={numbers.get(s.id)}
                  done={done.has(s.id)}
                  isStart={start?.id === s.id}
                  onToggle={() => onToggle(s.id)}
                  onRail={onRail}
                />
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
