import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Check, Clock, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { updateJourney, useJourney } from "../../../lib/state/partnerJourney";
import type { StepProps } from "./types";

const STEPS = [
  "Find their supplier or vendor page.",
  "Register as a supplier.",
  "Send your capability statement to the person who runs subcontracting.",
];

/** The production roadmap gives Prime Registration one week ("p3-prime-registration", weeks: 1). */
const TURNAROUND_DAYS = 7;
const expectedBy = (purchasedAt: string) =>
  new Date(new Date(purchasedAt).getTime() + TURNAROUND_DAYS * 86_400_000).toISOString();

const dateWords = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * Pursuing: two ways to get on the company's vendor list.
 * "Register me" (done for you) comes first. "Do it yourself" comes second.
 */
export function PursuingStep({ entry, partner, onMoveTo }: StepProps) {
  const key = entry.awardeeKey;
  const j = useJourney(key);

  const dfyDone = j.dfy?.status === "done";
  // A company whose SAM registration has ended may not sell to the government now.
  const regEnds = partner?.registrationExpiresAt ?? null;
  const regEnded = regEnds !== null && new Date(regEnds).getTime() < Date.now();
  const contact = partner?.samContact ?? null;
  const regWarning =
    regEnded && regEnds
      ? `Their SAM registration ended on ${dateWords(regEnds)}. Check that they still sell to the government before you pay.`
      : undefined;
  const warnLine = regWarning ? (
    <p className="pursue-warn" role="note">
      <AlertTriangle size={16} aria-hidden />
      <span>{regWarning}</span>
    </p>
  ) : null;
  const now = () => new Date().toISOString();

  const steps = STEPS.map((_, i) => j.diy?.steps[i] ?? false);
  const toggle = (i: number) => {
    const next = steps.map((v, k) => (k === i ? !v : v));
    updateJourney(key, { diy: { ...j.diy, steps: next } });
  };
  const registered = () => {
    updateJourney(key, { diy: { steps, registeredAt: now() } });
    onMoveTo("on_their_bench");
  };

  let body: ReactNode;
  if (j.dfy) {
    // Done for you, bought.
    body = (
      <>
        {dfyDone && j.dfy.doneAt ? (
          <p className="pstep__status pursue-status">
            <Check size={16} aria-hidden />
            <span>
              GovPreneurs registered you with {entry.companyName} on {dateWords(j.dfy.doneAt)}.
            </span>
          </p>
        ) : (
          <section className="dfys dfys--working pursue-dfys">
            <header className="dfys__head">
              <span className="dfys__mark" aria-hidden>
                <Clock size={19} strokeWidth={2} />
              </span>
              <div>
                <h3 className="dfys__title">Prime Contractor Registration purchased</h3>
                <p className="dfys__sub">
                  Our GovPreneurs specialist is working on this.
                  <br />
                  Expected by <b>{dateWords(expectedBy(j.dfy.purchasedAt))}</b>.
                </p>
              </div>
            </header>
          </section>
        )}
      </>
    );
  } else if (j.path === "diy") {
    // Do it yourself.
    body = (
      <>
        <div className="pursue-diy-head">
          <button
            type="button"
            className="pursue-back"
            onClick={() => updateJourney(key, { path: undefined })}
          >
            <ArrowLeft size={14} aria-hidden /> Back
          </button>
          <span className="pursue-diy-title">Do it yourself</span>
        </div>
        {warnLine}
        {partner?.website && (
          <a
            className="pstep-btn pstep-btn--secondary"
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open their website <ExternalLink size={14} aria-hidden />
          </a>
        )}
        <ol className="pursue-list">
          {STEPS.map((label, i) => (
            <li key={label}>
              <label className="pursue-check">
                <input type="checkbox" checked={steps[i]} onChange={() => toggle(i)} />
                <span>{label}</span>
              </label>
              {i === 2 && contact && (
                <p className="pursue-contact">
                  SAM lists {contact.name}
                  {contact.title ? `, ${contact.title},` : ""} as their contact.
                </p>
              )}
            </li>
          ))}
        </ol>
        {steps[1] && (
          <div className="pursue-ask">
            <p className="pursue-ask__q">Are you on their vendor list now?</p>
            <button type="button" className="pstep-btn" onClick={registered}>
              <Check size={16} aria-hidden /> Yes, I am on their list
            </button>
          </div>
        )}
      </>
    );
  } else {
    // No choice yet.
    body = (
      <>
        {warnLine}
        <p className="pstep__note">
          Get on their vendor list. We can do it for you, or you can do it yourself.
        </p>
        {/* The order is placed in the Success Center, where the member's wallet and the
            roadmap's "Prime Registration" step live. Nothing is bought on this page. */}
        {/* DEMO: the Success Center is a page of this app (the Roadmap holds Prime Registration). */}
        <Link className="pstep-btn pstep-btn--dark" to="/roadmap">
          Register me
        </Link>
        <button
          type="button"
          className="pstep-btn pstep-btn--secondary"
          onClick={() => updateJourney(key, { path: "diy" })}
        >
          Do it yourself
        </button>
      </>
    );
  }

  return <div className="pstep">{body}</div>;
}
