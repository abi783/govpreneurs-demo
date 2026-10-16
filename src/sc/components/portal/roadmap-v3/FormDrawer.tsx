"use client";

// Roadmap v3 — the internal-form drawer.
//
// The Form card used to be a link OUT: it sent the member to the v2 roadmap
// page to hunt for the Digital Compliance Audit Form, then back again. The
// form now opens beside her roadmap instead, in the same right-hand drawer the
// Done-for-you card uses (`.dfyd*`), so the step she is on never leaves the
// screen.
//
// What it renders is declared data — `form.fields` from lib/roadmapV3/forms.ts
// — and it submits to the same endpoint v2's DcAuditForm posts to, with the
// same `validationKey`. One submission, one MemberValidation row, whichever
// surface she used.
//
// Note the asymmetry, because it will matter when a second form is added: the
// DRAWER is generic, the SERVER is not. /api/portal/{locationId}/verify has a
// hand-written branch per validation key.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DC_OPT_OUT_HINT_SEGMENTS } from "@sc/lib/roadmapV3/forms";
import type { V3Payload } from "@sc/lib/roadmapV3/types";
import { X } from "./Icon";

type FormCard = NonNullable<V3Payload["detail"][string]["form"]>;

export function FormDrawer({
  form,
  open,
  locationId,
  fixtureMode,
  onClose,
}: {
  form: FormCard;
  open: boolean;
  locationId: string;
  /** ?scenario= mode — everything renders, nothing is written. */
  fixtureMode: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(form.prefill);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed on open: she may have edited, closed without submitting, and come
  // back — what we hold about her is the honest starting point either way.
  useEffect(() => {
    if (open) {
      setValues(form.prefill);
      setError(null);
    }
  }, [open, form.prefill]);

  if (!open) return null;

  const missing = form.fields.filter((f) => f.required && !values[f.key]?.trim());

  async function submit() {
    setError(null);
    if (missing.length > 0) {
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
      // The refreshed payload carries submitted: true, so the card that opened
      // this drawer is replaced by the service card underneath it.
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="dfyd__overlay" onClick={onClose} />
      <div className="dfyd" role="dialog" aria-modal="true" aria-label={form.title}>
        <header className="dfyd__head">
          <h2 className="dfyd__title">{form.title}</h2>
          <button type="button" className="dfyd__close" aria-label="Close" onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="dfyd__body">
          <p className="rm3-verify__hint">{form.description}</p>
          {/* The opt-out promise, wherever the audit form is shown — the
              server honours N/A and REFUSE only because this told her to.
              A callout, not a whisper: members missed it in grey and left
              fields blank they meant to opt out of. */}
          {form.validationKey === "digital_compliance_intake" && (
            <p className="rm3-optout">
              {DC_OPT_OUT_HINT_SEGMENTS.map((s, i) => (s.strong ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>))}
            </p>
          )}

          <div className="rm3-form__fields">
            {form.fields.map((f) => (
              <div key={f.key} className="rm3-form__field">
                <label className="rm3-form__label" htmlFor={`rm3f-${f.key}`}>
                  {f.label}
                  {f.required && <span className="rm3-form__req" aria-hidden> *</span>}
                </label>
                <input
                  id={`rm3f-${f.key}`}
                  className="rm3-verify__input"
                  type={f.type ?? "text"}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  disabled={submitting}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {error && <p className="rm3-verify__error">{error}</p>}

          <div className="rm3-verify__acts">
            <button
              type="button"
              className="rm2-btn rm2-btn--green rm3-verify__btn"
              onClick={submit}
              disabled={submitting || fixtureMode}
            >
              {/* The check runs live against her domain and mail records, so
                  this is seconds, not milliseconds — say so rather than
                  leaving a dead button. */}
              {submitting ? "Checking your answers…" : `Submit ${form.title}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
