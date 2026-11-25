import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { parseMoney } from "../../../lib/filters/range";
import { updateJourney, useJourney, type PartnerJourney } from "../../../lib/state/partnerJourney";
import type { StepProps } from "./types";

type Job = NonNullable<PartnerJourney["job"]>;

/**
 * "19 November 2026". A date-only value ("2026-11-19") is read as a local
 * date, so it does not move back one day in time zones west of UTC.
 */
export function dateWords(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * "$12,000" for a stored amount. The form stores whole dollars as digits. An older
 * value that is not a number shows as she typed it.
 */
export function moneyWords(value: string): string {
  const n = /^\d+$/.test(value) ? Number(value) : parseMoney(value);
  return n === null ? value : `$${n.toLocaleString("en-US")}`;
}

/**
 * Working together: she tells us about the job, then marks it finished.
 * The form opens inside the card, so she does not lose her place on the board.
 */
export function WorkingStep({ entry, onMoveTo }: StepProps) {
  const j = useJourney(entry.awardeeKey);
  // A job that just started has no details yet, so the form opens at once.
  const [editing, setEditing] = useState(!j.job);
  const job = j.job;

  const save = (next: Job) => {
    updateJourney(entry.awardeeKey, { job: next });
    setEditing(false);
  };

  const finish = () => {
    updateJourney(entry.awardeeKey, { finishedAt: new Date().toISOString() });
    onMoveTo("worked_together");
  };

  return (
    <div className="pstep">
      {editing ? (
        <JobForm initial={job} onSave={save} onCancel={() => setEditing(false)} />
      ) : job ? (
        <JobSummary job={job} onEdit={() => setEditing(true)} />
      ) : (
        <button type="button" className="pstep-btn" onClick={() => setEditing(true)}>
          Add job details
        </button>
      )}
      {!editing && (
        <button
          type="button"
          className={job ? "pstep-btn" : "pstep-btn pstep-btn--secondary"}
          onClick={finish}
        >
          Mark the job finished
        </button>
      )}
    </div>
  );
}

function JobSummary({ job, onEdit }: { job: Job; onEdit: () => void }) {
  return (
    <div className="work-summary">
      <div className="work-summary__head">
        <p className="work-summary__what">{job.what}</p>
        <button type="button" className="work-link-btn" onClick={onEdit}>
          Edit
        </button>
      </div>
      {(job.startedOn || job.value) && (
        <dl className="work-summary__facts">
          {job.startedOn && (
            <div className="work-summary__fact">
              <dt>Started</dt>
              <dd>{dateWords(job.startedOn)}</dd>
            </div>
          )}
          {job.value && (
            <div className="work-summary__fact">
              <dt>Worth</dt>
              <dd className="work-summary__num">{moneyWords(job.value)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function JobForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Job;
  onSave: (job: Job) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [what, setWhat] = useState(initial?.what ?? "");
  const [startedOn, setStartedOn] = useState(initial?.startedOn ?? "");
  const [value, setValue] = useState(initial?.value ? moneyWords(initial.value) : "");
  const [showError, setShowError] = useState(false);
  const [moneyError, setMoneyError] = useState(false);

  // The form can open in a column that is off-screen. Bring it into view.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const w = what.trim();
    // The worth is money only: "12k", "$12,000" or "1.5m".
    const typed = value.trim();
    const amount = typed ? parseMoney(typed) : null;
    const badMoney = typed !== "" && amount === null;
    setShowError(!w);
    setMoneyError(badMoney);
    if (!w || badMoney) return;
    onSave({
      what: w,
      startedOn: startedOn || undefined,
      value: amount === null ? undefined : String(amount),
    });
  };

  const errId = `${id}-what-err`;
  const moneyErrId = `${id}-value-err`;
  return (
    <form ref={formRef} className="work-form" onSubmit={submit} noValidate>
      <div className="work-field">
        <label className="work-field__label" htmlFor={`${id}-what`}>
          What work are you doing for them?
        </label>
        <input
          id={`${id}-what`}
          className="work-input"
          type="text"
          value={what}
          onChange={(e) => {
            setWhat(e.target.value);
            if (showError && e.target.value.trim()) setShowError(false);
          }}
          placeholder="For example, lunch for 200 people"
          aria-required="true"
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errId : undefined}
          autoFocus
        />
        {/* The line keeps its space, so the buttons do not move when it clears. */}
        <p id={errId} className="work-field__error" aria-live="polite">
          {showError ? "Tell us what the work is." : ""}
        </p>
      </div>
      <div className="work-field">
        <label className="work-field__label" htmlFor={`${id}-start`}>
          When did it start? <span className="work-field__optional">(optional)</span>
        </label>
        <input
          id={`${id}-start`}
          className="work-input"
          type="date"
          value={startedOn}
          onChange={(e) => setStartedOn(e.target.value)}
        />
      </div>
      <div className="work-field">
        <label className="work-field__label" htmlFor={`${id}-value`}>
          How much is the job worth? <span className="work-field__optional">(optional)</span>
        </label>
        <input
          id={`${id}-value`}
          className="work-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (moneyError) setMoneyError(false);
          }}
          onBlur={() => {
            // Say the amount back as money, so she sees what we read.
            const n = parseMoney(value);
            if (n !== null) setValue(`$${n.toLocaleString("en-US")}`);
          }}
          placeholder="$12,000"
          aria-invalid={moneyError || undefined}
          aria-describedby={moneyError ? moneyErrId : undefined}
        />
        <p id={moneyErrId} className="work-field__error" aria-live="polite">
          {moneyError ? "Type an amount, for example 12000 or 12k." : ""}
        </p>
      </div>
      <button type="submit" className="pstep-btn">
        Save job details
      </button>
      <button type="button" className="pstep-btn pstep-btn--secondary" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
