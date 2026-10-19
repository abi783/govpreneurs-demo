"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DC_OPT_OUT_HINT_SEGMENTS, type FormField, type FormResult } from "@sc/lib/roadmapV3/forms";

/**
 * The audit form and its findings, in the record's own voice.
 *
 * Deliberately NOT the roadmap's drawer: this is a Design System page, so it
 * is built from `.gpds` / `.mb-*` and the shared badge classes rather than the
 * roadmap's `.rm3-*` (see design-system/PAGES.md — a page is one system or the
 * other, never both). What it submits is identical, down to the validation
 * key, because both write the one MemberValidation row.
 *
 * The form is always editable, including after a submission. Re-submitting
 * re-runs the checks and replaces the findings, which is the only way to show
 * that a gap has actually been closed — and prefill carries her last answers
 * forward, so correcting one field does not mean retyping eleven.
 */

const BADGE: Record<FormResult["status"], { cls: string; label: string }> = {
  pass: { cls: "badge badge-pos no-dot", label: "Verified" },
  fixed: { cls: "badge badge-pos no-dot", label: "Fixed" },
  needs_review: { cls: "badge badge-warn no-dot", label: "Needs review" },
  fail: { cls: "badge badge-urg no-dot", label: "Gap found" },
  // A field she left blank IS a gap — "Not yet" would read as optional.
  skipped: { cls: "badge badge-urg no-dot", label: "Gap found" },
  // Her own opt-out answers — verified, nothing to do, so quiet neutrals.
  not_applicable: { cls: "badge badge-neutral no-dot", label: "Not Applicable" },
  refused: { cls: "badge badge-neutral no-dot", label: "Refused" },
};

export function DigitalIdentityForm({
  locationId,
  fields,
  validationKey,
  prefill,
  results,
  checkedAt,
}: {
  locationId: string;
  fields: FormField[];
  validationKey: string;
  prefill: Record<string, string>;
  /** Her findings from the last submission, or null before there is one. */
  results: FormResult[] | null;
  checkedAt: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(prefill);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gaps = results?.filter((r) => r.status === "fail" || r.status === "skipped").length ?? 0;

  async function submit() {
    setError(null);
    const missing = fields.filter((f) => f.required && !values[f.key]?.trim());
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
        body: JSON.stringify({ validationKey, inputs: values }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? `Could not submit (HTTP ${res.status}). Please try again.`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-di">
      {results && (
        <section className="mb-di__found" aria-label="What we found">
          <h3 className="mb-open__h">What we found</h3>
          <p className="mb-di__lede">
            {gaps === 0
              ? "We checked your answers — nothing is flagged."
              : `We checked your answers and found ${gaps === 1 ? "1 gap" : `${gaps} gaps`}.`}{" "}
            Your mentor&apos;s audit overrides anything here.
          </p>
          <ul className="mb-di__list">
            {results.map((r) => (
              <li key={r.title} className="mb-di__row">
                <div className="mb-di__main">
                  <span className="mb-di__title">{r.title}</span>
                  {r.description && <span className="mb-di__note">{r.description}</span>}
                  {r.provided && (
                    <span className="mb-di__prov">
                      You provided:{" "}
                      {/* DEMO: shown as plain text. The sample business's web address is not
                          a real site, and the demo never opens an outside page. */}
                      {r.provided}
                    </span>
                  )}
                  {r.evidence && <span className="mb-di__ev">{r.evidence}</span>}
                </div>
                <span className={BADGE[r.status].cls}>{BADGE[r.status].label}</span>
              </li>
            ))}
          </ul>
          {checkedAt && (
            <p className="mb-di__when">
              Last checked{" "}
              {new Date(checkedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </section>
      )}

      <section aria-label="Digital Compliance Audit Form">
        <h3 className="mb-open__h">{results ? "Your answers" : "The audit form"}</h3>
        <p className="mb-di__lede">
          {results
            ? "Change anything that has moved on and submit again — we re-run the checks and your roadmap updates with them."
            : "A few questions about your domain, email and business phone. We check them against what government buyers and phone carriers require, and come back with what needs fixing. Your answers appear on your roadmap too."}
        </p>
        {/* A callout, not a whisper — members missed it in body grey and left
            fields blank they meant to opt out of. */}
        <p className="mb-di__optout">
          {DC_OPT_OUT_HINT_SEGMENTS.map((s, i) => (s.strong ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>))}
        </p>

        <div className="mb-di__fields">
          {fields.map((f) => (
            <div key={f.key} className="mb-di__field">
              <label className="mb-di__label" htmlFor={`mbdi-${f.key}`}>
                {f.label}
                {f.required && (
                  <span className="mb-di__req" aria-hidden>
                    {" "}
                    *
                  </span>
                )}
              </label>
              <input
                id={`mbdi-${f.key}`}
                className="gpds-input"
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

        {error && (
          <p className="mb-di__error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="gpds-btn mb-btn" onClick={submit} disabled={submitting}>
          {/* The checks run live against her domain and mail records, so this
              is seconds rather than milliseconds — say so rather than leaving a
              dead button. */}
          {submitting ? "Checking your answers…" : results ? "Check again" : "Submit and check"}
        </button>
      </section>
    </div>
  );
}
