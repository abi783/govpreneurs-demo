"use client";

// Digital Compliance, step one: the audit form, inline.
//
// Ported from the prototype's components/Roadmap/DigitalComplianceAudit.tsx,
// with one difference that is the whole point of this app existing: the
// prototype writes to an in-memory store, this posts to the same
// /api/portal/{locationId}/verify endpoint FormDrawer does, so one submission
// is one real MemberValidation row whichever surface she used.
//
// It renders INLINE rather than behind a drawer button, because that is what
// the step is: Digital Compliance does not begin with the twelve things on
// its checklist, it begins with a twelve-FIELD form the specialist reads
// before he audits anything. A button that opens a drawer puts a door in
// front of the only thing there is to do.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DC_OPT_OUT_HINT_SEGMENTS } from "@sc/lib/roadmapV3/forms";
import type { V3Payload } from "@sc/lib/roadmapV3/types";
import { ArrowRight } from "./Icon";

type FormCard = NonNullable<V3Payload["detail"][string]["form"]>;

export function DigitalComplianceAudit({
  form,
  locationId,
  fixtureMode,
}: {
  form: FormCard;
  locationId: string;
  /** ?scenario= mode — everything renders, nothing is written. */
  fixtureMode: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(form.prefill);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = form.fields.filter((f) => f.required && !values[f.key]?.trim());
  // The two required fields, checked here rather than left to the browser, so
  // the button can say it is not ready before she clicks it.
  const ready = missing.length === 0;

  async function submit() {
    setError(null);
    if (!ready) {
      setError(
        missing.length === 1
          ? `${missing[0]!.label} is required.`
          : `${missing.map((f) => f.label).join(" and ")} are required.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portal/${locationId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationKey: form.validationKey, inputs: values }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? `Could not submit (HTTP ${res.status}). Please try again.`);
        return;
      }
      // The refreshed payload carries submitted: true, which is what moves the
      // step on from the form stage to the call it earns.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="dca"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !submitting) void submit();
      }}
    >
      <div className="dca__eyebrow">Step 1 · Audit form</div>
      <h3 className="dca__title">Tell your Mentor about your business</h3>
      {/* The lede is the form's own gap analysis, stated up front: an empty
          field is not a failure to fill the form in, it is the answer. Saying
          so is what makes ten optional fields feel like ten fewer jobs rather
          than ten things she is getting wrong. */}
      <p className="dca__lede">
        Only <strong>Business legal name</strong> and <strong>Email</strong> are required — fill in
        whatever else you have. Empty fields just mean Your Mentor will flag those items as gaps in
        the audit.
      </p>
      {/* The opt-out promise: the server honours N/A and REFUSE only because
          this told her to. A callout, not a whisper. */}
      <p className="rm3-optout">
        {DC_OPT_OUT_HINT_SEGMENTS.map((s, i) =>
          s.strong ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>,
        )}
      </p>

      <div className="dca__grid">
        {form.fields.map((f) => (
          <label key={f.key} className="dca__field">
            <span className="dca__label">
              {f.label}
              {f.required ? (
                <span className="dca__req" aria-hidden>
                  *
                </span>
              ) : null}
            </span>
            <input
              className="dca__input"
              type={f.type ?? "text"}
              inputMode={f.key === "phone" ? "tel" : undefined}
              placeholder={f.placeholder}
              required={f.required}
              aria-required={f.required || undefined}
              value={values[f.key] ?? ""}
              disabled={submitting}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </label>
        ))}
      </div>

      {error && <p className="rm3-verify__error">{error}</p>}

      <button type="submit" className="rm2-btn rm2-btn--green" disabled={!ready || submitting || fixtureMode}>
        {submitting ? "Checking your answers…" : "Submit Digital Compliance Audit Form"}{" "}
        <ArrowRight size={14} />
      </button>
    </form>
  );
}
