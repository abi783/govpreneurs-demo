"use client";

// Roadmap v3 — the member-run verification panel, the compact DS-vocabulary
// counterpart of v1/v2's SubStepVerificationPanel. Renders under a step's
// checklist when the step exposes one of the five member-runnable checks:
//
//   llc         upload the Articles of Organization PDF → validate
//   sam         legal name (+ optional mailing ZIP) → SAM.gov check
//   sbs         SBA profile URL → check
//   capability  upload the Capability Statement PDF → validate
//   sled        registration rows (type / state / business name) → check
//
// Contracts are v1's exactly (upload/verify/verify-reset routes); a pass
// refreshes the page, and the roadmap re-derives the step as done. All
// actions are disabled in ?scenario= fixture mode.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { V3Payload } from "@sc/lib/roadmapV3/types";
import { useMemberDate } from "./memberDate";
import { ArrowRight, Check, CircleAlert, Clock } from "./Icon";
// One field map for both roadmaps — v2 renders these same rows.
import { SBA_CERT_BADGES, pickFields } from "@sc/lib/verificationFields";

type VerifyKey = "llc" | "sam" | "sbs" | "capability" | "sled" | "cmmc";

const SLED_REGISTRY_TYPES = ["State", "City", "County", "Local", "Education"];

const UEI_RE = /^[A-Z0-9]{12}$/i;

const VERIFY_TITLE: Record<VerifyKey, string> = {
  llc: "Verify your LLC",
  sam: "Verify your SAM.gov registration",
  sbs: "Verify your SBA profile",
  capability: "Verify your capability statement",
  sled: "Verify your SLED registrations",
  cmmc: "Verify your CMMC status",
};

/**
 * What we say when a check could not run, in one line.
 *
 * Plain, and it names the site — "SAM.gov is down" puts the problem where it
 * is. The raw failure ("SAM.gov HTTP 500: {…}") is kept OUT of her view and
 * stays on the validation row for support: an HTTP code is not something she
 * can act on, and printing it invites her to try.
 *
 * The document checks name no third party, because there is none to blame —
 * an error there is ours, and it says so.
 */
const OUTAGE_LINE: Record<VerifyKey, string> = {
  sam: "SAM.gov is down — check back in a while.",
  sbs: "The SBA directory is down — check back in a while.",
  llc: "Something went wrong on our end — check back in a while.",
  capability: "Something went wrong on our end — check back in a while.",
  cmmc: "Something went wrong on our end — check back in a while.",
  sled: "Something went wrong on our end — check back in a while.",
};

/**
 * Did this SAM check fail because the registration LAPSED, rather than because
 * we could not find one?
 *
 * Both come back as `fail`, and only one of them has renewal as its answer.
 * Read from the record SAM.gov returned where possible — its own
 * registrationStatus is the authority — and fall back to a past expiry date,
 * then to the wording the validator composed.
 */
function samExpired(message: string | null | undefined, data: Record<string, unknown>): boolean {
  const reg = data.entityRegistration as Record<string, unknown> | undefined;
  const status = typeof reg?.registrationStatus === "string" ? reg.registrationStatus : null;
  if (status) return status.toLowerCase() !== "active";
  const exp = typeof data.expirationDate === "string" ? Date.parse(data.expirationDate) : NaN;
  if (Number.isFinite(exp) && exp < Date.now()) return true;
  return /inactive|expire/i.test(message ?? "");
}

const VERIFY_HINT: Record<VerifyKey, string> = {
  llc: "Upload your Articles of Organization and we check them for you.",
  sam: "We look your business up on SAM.gov — exactly as a buyer would.",
  sbs: "Paste your SBA Dynamic Small Business Search profile link.",
  capability: "Upload the finished PDF and we check it covers what buyers expect.",
  sled: "Tell us where you are registered and we confirm each one.",
  cmmc: "Upload your CMMC self-assessment report (the SPRS / CyberAB PDF export) and we check it for you.",
};

type SledEntry = { registryType: string; state: string; businessName: string };

type Result = { status: string; message: string | null; data: unknown };

export function VerifyPanel({
  verifyKey,
  locationId,
  verify,
  fixtureMode,
  completedByTeam = false,
  doneLink,
}: {
  verifyKey: VerifyKey;
  locationId: string;
  verify: V3Payload["verify"];
  fixtureMode: boolean;
  /** She bought the service, so OUR team did this work. The validator's
   *  message records how the row got there ("Confirmed by customer.") — she
   *  clicked confirm — which is not the same as who did the job. */
  completedByTeam?: boolean;
  /** The delivered-service door, when this card stands in for the service
   *  panel. Absent = no button, which is every self-verified step. */
  doneLink?: { label: string; url: string };
}) {
  const memberDate = useMemberDate();
  const router = useRouter();
  const prefill = verify.prefill;
  const latest = verify.latest[verifyKey];

  /**
   * Which surface is showing. A prior result opens on its own card rather
   * than the collapsed prompt — a member who verified last week should see
   * what was verified, not be asked whether she did it herself.
   */
  const [mode, setMode] = useState<"idle" | "form">("idle");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Per-key inputs, prefilled from the live profile.
  const [legalName, setLegalName] = useState(prefill.legalName ?? "");
  const [mailingZip, setMailingZip] = useState(prefill.mailingZip ?? "");
  // No prefill — a member who already has this on hand can hand it straight
  // to the exact UEI lookup instead of the fuzzy name search below.
  const [uei, setUei] = useState("");
  const [profileUrl, setProfileUrl] = useState(prefill.dsbsProfileUrl ?? "");
  const [pdfUrl, setPdfUrl] = useState(
    verifyKey === "llc"
      ? (prefill.articlesUrl ?? "")
      : verifyKey === "capability"
        ? (prefill.capabilityUrl ?? "")
        : verifyKey === "cmmc"
          ? (prefill.cmmcUrl ?? "")
          : "",
  );
  const [sled, setSled] = useState<SledEntry[]>(
    prefill.sledRegistrations.length > 0
      ? prefill.sledRegistrations
      : [{ registryType: "", state: "", businessName: prefill.legalName ?? "" }],
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const passed = latest?.status === "pass";
  const priorFileUrl =
    verifyKey === "llc" ? prefill.articlesUrl
    : verifyKey === "capability" ? prefill.capabilityUrl
    : verifyKey === "cmmc" ? prefill.cmmcUrl
    : null;

  async function uploadPdf(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", verifyKey === "llc" ? "articles" : verifyKey === "cmmc" ? "cmmc" : "capability");
      const res = await fetch(`/api/portal/${locationId}/upload`, { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.url) {
        setError(json?.error ?? `Upload failed (HTTP ${res.status})`);
        return;
      }
      setPdfUrl(json.url as string);
    } finally {
      setUploading(false);
    }
  }

  async function runVerify(action?: "confirm") {
    if (fixtureMode || busy) return;
    setBusy(true);
    setError(null);
    try {
      const inputs: Record<string, unknown> = {};
      if (!action) {
        if (verifyKey === "llc") inputs.articlesOfOrganizationUrl = pdfUrl;
        else if (verifyKey === "capability") inputs.capabilityStatementUrl = pdfUrl;
        else if (verifyKey === "cmmc") inputs.cmmcReportUrl = pdfUrl;
        else if (verifyKey === "sam") {
          inputs.legalName = legalName;
          if (mailingZip.trim()) inputs.mailingZip = mailingZip.trim();
          if (uei.trim()) inputs.uei = uei.trim().toUpperCase();
        } else if (verifyKey === "sbs") inputs.dsbsProfileUrl = profileUrl;
        else if (verifyKey === "sled") {
          inputs.sledRegistrations = sled
            .filter((e) => e.registryType && e.state.trim() && e.businessName.trim())
            .map((e) => ({
              registryType: e.registryType,
              state: e.state.trim().toUpperCase(),
              businessName: e.businessName.trim(),
            }));
        }
      }
      // Fire-and-forget engagement event — v1 parity.
      fetch(`/api/portal/${locationId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "verification_run", metadata: { validationKey: verifyKey, surface: "roadmap-v3" } }),
      }).catch(() => null);

      const res = await fetch(`/api/portal/${locationId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action ? { validationKey: verifyKey, action } : { validationKey: verifyKey, inputs }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? `Verification failed (HTTP ${res.status})`);
        return;
      }
      const r = json.result as Result;
      setResult(r);
      // SHOW IT. The result cards render only in "idle" — a result reached
      // while still in "form" was stored in state and never drawn, so the
      // button looked dead for every answer except a pass, which survived
      // only because router.refresh() remounted the panel underneath it.
      // That is the whole of "the verify button does nothing": it worked,
      // and said so to no one.
      setMode("idle");
      if (r.status === "pass") {
        // The page re-derives the step as done from the fresh validation.
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /** Clear the result entirely — the way out of verifying the wrong company. */
  async function performReset() {
    if (fixtureMode || resetting) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/portal/${locationId}/verify-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationKey: verifyKey }),
      });
      if (res.ok) window.location.reload();
      else {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? `Reset failed (HTTP ${res.status})`);
        setConfirmingReset(false);
      }
    } finally {
      setResetting(false);
    }
  }

  /** Open the form. Back rewinds to whatever the record implies — the
   *  verified card when something passed, the collapsed prompt otherwise. */
  function openForm() {
    setError(null);
    setResult(null);
    setMode("form");
  }

  /* ── Shared pieces of a result card ─────────────────────────────────── */

  /** The extracted fields, two columns. The whole point of these cards: she
   *  cannot confirm — or trust — what she cannot see. */
  function Fields({ data }: { data: unknown }) {
    const fields = pickFields(data);
    if (fields.length === 0) return null;
    return (
      <dl className="rm3-verify__grid">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="rm3-verify__k">{f.label}</dt>
            <dd className="rm3-verify__v" title={f.value}>{f.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  /** SBA certifications, the SBA profile link and the narrative — SBS only. */
  function SbsExtras({ data, tone }: { data: Record<string, unknown>; tone: "pass" | "warn" }) {
    if (verifyKey !== "sbs") return null;
    const certs = Array.isArray(data.certifications)
      ? (data.certifications as unknown[]).filter((c): c is string => typeof c === "string")
      : [];
    const profileUrl = typeof data.profileUrl === "string" ? data.profileUrl : null;
    const narrative = typeof data.capabilitiesNarrative === "string" ? data.capabilitiesNarrative : null;
    if (certs.length === 0 && !profileUrl && !narrative) return null;
    return (
      <>
        {certs.length > 0 && (
          <div className="rm3-verify__badges">
            {certs.map((c) => {
              const meta = SBA_CERT_BADGES[c];
              return (
                <span key={c} className={`badge ${tone === "pass" ? "badge-pos" : "badge-warn"} no-dot`} title={meta?.tip ?? c}>
                  {meta?.label ?? c}
                </span>
              );
            })}
          </div>
        )}
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="rm3-verify__out">
            Open SBA profile <ArrowRight size={12} aria-hidden />
          </a>
        )}
        {narrative && (
          <div className="rm3-verify__sub">
            <p className="rm3-verify__k">Capabilities narrative</p>
            <p>{narrative}</p>
          </div>
        )}
      </>
    );
  }

  /** One box per SLED registration — the list she just proved. */
  function SledRows({ data }: { data: Record<string, unknown> }) {
    if (verifyKey !== "sled" || !Array.isArray(data.entries)) return null;
    const entries = data.entries as { state?: string; registryType?: string; businessName?: string }[];
    if (entries.length === 0) return null;
    return (
      <div className="rm3-verify__sub">
        {entries.map((e, i) => (
          <p key={i}>
            <strong>{e.state}</strong>
            {e.registryType ? ` · ${e.registryType}` : ""}
            {e.businessName ? ` · ${e.businessName}` : ""}
          </p>
        ))}
      </div>
    );
  }

  /** What the AI flagged: "what's missing" on a failure, "heads up" on a review. */
  function Issues({ data, heading }: { data: Record<string, unknown>; heading: string }) {
    const issues = Array.isArray(data.issues)
      ? (data.issues as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    if (issues.length === 0) return null;
    return (
      <div className="rm3-verify__sub">
        <p className="rm3-verify__k">{heading}</p>
        <ul className="rm3-verify__issues">
          {issues.map((iss, i) => (
            <li key={i}>{iss}</li>
          ))}
        </ul>
      </div>
    );
  }

  const PreviewFile = () =>
    priorFileUrl ? (
      <a href={priorFileUrl} target="_blank" rel="noopener noreferrer" className="rm3-verify__link">
        Preview file
      </a>
    ) : null;

  /* ── The verified card ──────────────────────────────────────────────────
     Replaces a one-line "Verified 28 Aug": what was verified is the thing
     worth showing, and on a done step this card is the only place it lives. */
  function VerifiedCard({ data, checkedAt, message }: { data: unknown; checkedAt?: string; message?: string | null }) {
    const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    return (
      <div className="rm3-verify rm3-verify--pass">
        <span className="rm3-verify__mark" aria-hidden>
          <Check size={14} strokeWidth={3} />
        </span>
        <div className="rm3-verify__body">
          <p className="rm3-verify__title">{VERIFY_TITLE[verifyKey]} — verified</p>
          {completedByTeam ? (
            <p className="rm3-verify__hint">Completed by GovPreneurs team.</p>
          ) : (
            message && <p className="rm3-verify__hint">{message}</p>
          )}
          <SbsExtras data={d} tone="pass" />
          <Fields data={data} />
          <SledRows data={d} />
          {checkedAt && <p className="rm3-verify__when">Last checked {memberDate(checkedAt)}</p>}
          <div className="rm3-verify__acts">
            {/* Where this card replaces the delivered-service panel, it
                inherits that panel's one door — the place the record lives
                and can be corrected. */}
            {doneLink && (
              <a href={doneLink.url} className="rm2-btn rm2-btn--green rm3-verify__btn">
                {doneLink.label} <ArrowRight size={13} aria-hidden />
              </a>
            )}
            <button
              type="button"
              className={doneLink ? "rm3-verify__link" : "rm2-btn rm2-btn--green rm3-verify__btn"}
              onClick={() => openForm()}
              disabled={fixtureMode}
            >
              {verifyKey === "sled" ? "Re-verify or add another registration" : "Re-verify"}
            </button>
            <PreviewFile />
          </div>
        </div>
      </div>
    );
  }

  /* ── States, in the order they take precedence ─────────────────────── */

  // A check she just ran, or the stored one — same shapes either way.
  const showing = result ?? (mode === "idle" && latest ? { status: latest.status, message: latest.message, data: latest.data } : null);

  if (mode === "idle" && showing) {
    const d = (showing.data && typeof showing.data === "object" ? showing.data : {}) as Record<string, unknown>;
    const needsConfirm = showing.status === "needs_input" && d.requiresConfirmation === true;

    if (showing.status === "pass") {
      return (
        <VerifiedCard
          data={showing.data}
          message={showing.message}
          checkedAt={latest?.checkedAt}
        />
      );
    }

    if (needsConfirm) {
      return (
        <div className="rm3-verify rm3-verify--warn">
          <span className="rm3-verify__mark" aria-hidden>
            <Clock size={14} strokeWidth={2.5} />
          </span>
          <div className="rm3-verify__body">
            <p className="rm3-verify__title">Review and confirm</p>
            <p className="rm3-verify__hint">
              {showing.message ?? "We found the following. Confirm it looks right."}
            </p>
            <SbsExtras data={d} tone="warn" />
            <Fields data={showing.data} />
            <Issues data={d} heading="Heads up" />
            {error && <p className="rm3-verify__error">{error}</p>}
            <div className="rm3-verify__acts">
              <button
                type="button"
                className="rm2-btn rm2-btn--green rm3-verify__btn"
                disabled={busy || fixtureMode}
                onClick={() => runVerify("confirm")}
              >
                {busy ? "Confirming…" : "Yes, this is correct — confirm"}
              </button>
              <button type="button" className="rm3-verify__link" onClick={() => openForm()}>
                {verifyKey === "llc" || verifyKey === "capability" || verifyKey === "cmmc"
                  ? "Upload a different document"
                  : "Try again with different info"}
              </button>
              <PreviewFile />
            </div>
          </div>
        </div>
      );
    }

    // Fail or error — including one stored from a previous visit, which used
    // to vanish behind the collapsed prompt as if nothing had been tried.
    /* An outage is not a finding. `error` means the service we ask could not
       answer — SAM.gov down, the SBA directory 500ing, a timeout — so nothing
       here is about her registration and none of the fail copy applies: no
       "what is missing", no "double-check the link", and no red alert that
       reads as a verdict. She is told whose problem it is and invited back. */
    if (showing.status === "error") {
      return (
        <div className="rm3-verify rm3-verify--warn">
          <span className="rm3-verify__mark" aria-hidden>
            <Clock size={14} strokeWidth={2.5} />
          </span>
          <div className="rm3-verify__body">
            <p className="rm3-verify__title">{OUTAGE_LINE[verifyKey]}</p>
            <p className="rm3-verify__hint">Nothing is wrong with your details.</p>
            <div className="rm3-verify__acts">
              <button
                type="button"
                className="rm2-btn rm2-btn--blue-outline rm3-verify__btn"
                onClick={() => runVerify()}
                disabled={busy || fixtureMode}
              >
                {busy ? "Checking…" : "Try again"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (showing.status === "fail") {
      return (
        <div className="rm3-verify rm3-verify--fail">
          <span className="rm3-verify__mark" aria-hidden>
            <CircleAlert size={14} strokeWidth={2.5} />
          </span>
          <div className="rm3-verify__body">
            <p className="rm3-verify__title">{VERIFY_TITLE[verifyKey]} — could not verify</p>
            <p className="rm3-verify__hint">{showing.message ?? "That check did not pass."}</p>
            <Issues data={d} heading="What is missing" />
            {/* An expired registration is the one failure with a specific,
                known next step — renewal — and it is not obvious from
                "SAM status: Inactive". Members reach this card precisely
                because they re-verified and found out; sending them away
                with the finding and no door is where it stopped being
                useful. Shown only for expiry, so it never reads as the
                answer to a different problem. */}
            {verifyKey === "sam" && samExpired(showing.message, d) && (
              <a
                href="https://sam.gov/content/entity-registration"
                target="_blank"
                rel="noopener noreferrer"
                className="rm3-verify__out"
              >
                Renew your registration at SAM.gov <ArrowRight size={12} aria-hidden />
              </a>
            )}
            {verifyKey === "sbs" && typeof d.searchUrl === "string" && (
              <a href={d.searchUrl} target="_blank" rel="noopener noreferrer" className="rm3-verify__out">
                Search the SBA directory manually <ArrowRight size={12} aria-hidden />
              </a>
            )}
            <div className="rm3-verify__acts">
              <button
                type="button"
                className="rm2-btn rm2-btn--green rm3-verify__btn"
                onClick={() => openForm()}
                disabled={fixtureMode}
              >
                Try again
              </button>
              <PreviewFile />
            </div>
          </div>
        </div>
      );
    }
  }

  // ── Collapsed entry point: nothing has been tried ──────────────────────
  if (mode === "idle") {
    return (
      <div className="rm3-verify">
        <span className="rm3-verify__mark" aria-hidden>
          <Check size={14} strokeWidth={2.5} />
        </span>
        <span>
          Already did this yourself?{" "}
          <button type="button" className="rm3-verify__link" onClick={() => openForm()}>
            {VERIFY_TITLE[verifyKey]}
          </button>
        </span>
      </div>
    );
  }

  // ── The form ───────────────────────────────────────────────────────────
  /**
   * WHY the button is greyed out, in her words — null when it is not.
   *
   * The single most reported "the verify button doesn't work" is this control
   * disabled for a reason the page never states. It has eight of them, and a
   * dead button teaches her the feature is broken rather than that one field
   * is empty. SLED is the sharpest case: adding a row she has not finished
   * DISABLES the button, so the act of supplying more made it worse.
   *
   * Same order as `canSubmit` below, so the two cannot disagree.
   */
  function whyBlocked(): string | null {
    if (fixtureMode) return "Test state — verification is off here.";
    if (uploading) return "Waiting for the upload to finish…";
    if (busy) return null; // the button already says "Checking…"
    if (verifyKey === "llc" || verifyKey === "capability" || verifyKey === "cmmc") {
      if (!pdfUrl) return "Upload the document first — then this turns on.";
      return null;
    }
    if (verifyKey === "sam") {
      if (!legalName.trim()) return "Add your legal business name.";
      if (uei.trim() && !UEI_RE.test(uei.trim())) return "UEI should be exactly 12 letters and numbers.";
      return null;
    }
    if (verifyKey === "sbs") return profileUrl.trim() ? null : "Paste your SBA profile URL.";
    if (verifyKey === "sled") {
      const bad = sled.findIndex((e) => !(e.registryType && e.state.trim() && e.businessName.trim()));
      if (bad >= 0) {
        return `Finish row ${bad + 1} — it needs a type, a state and a business name. Remove it if you added it by mistake.`;
      }
      return null;
    }
    return null;
  }

  const canSubmit =
    !busy &&
    !uploading &&
    !fixtureMode &&
    (verifyKey === "llc" || verifyKey === "capability" || verifyKey === "cmmc"
      ? !!pdfUrl
      : verifyKey === "sam"
        ? !!legalName.trim() && (!uei.trim() || UEI_RE.test(uei.trim()))
        : verifyKey === "sbs"
          ? !!profileUrl.trim()
          : sled.every((e) => e.registryType && e.state.trim() && e.businessName.trim()));

  return (
    <div className="rm3-verify rm3-verify--form">
      <p className="rm3-verify__title">{VERIFY_TITLE[verifyKey]}</p>
      <p className="rm3-verify__hint">{VERIFY_HINT[verifyKey]}</p>

      {(verifyKey === "llc" || verifyKey === "capability" || verifyKey === "cmmc") && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadPdf(f);
            }}
          />
          <button
            type="button"
            className={`rm3-verify__drop${pdfUrl ? " is-done" : ""}`}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f && f.type === "application/pdf") void uploadPdf(f);
            }}
          >
            {uploading ? "Uploading…" : pdfUrl ? "PDF uploaded — click to replace" : "Click or drop your PDF here"}
          </button>
        </>
      )}

      {verifyKey === "sam" && (
        <div className="rm3-verify__fields">
          <div className="rm3-form__field">
            <label className="rm3-form__label" htmlFor="rm3v-legal">Legal business name</label>
            <input id="rm3v-legal" className="rm3-verify__input" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="As registered with SAM.gov" />
          </div>
          <div className="rm3-form__field">
            <label className="rm3-form__label" htmlFor="rm3v-zip">Mailing ZIP (optional)</label>
            <input id="rm3v-zip" className="rm3-verify__input" value={mailingZip} onChange={(e) => setMailingZip(e.target.value)} placeholder="12345" />
          </div>
          <div className="rm3-form__field">
            <label className="rm3-form__label" htmlFor="rm3v-uei">UEI (optional)</label>
            <input
              id="rm3v-uei"
              className="rm3-verify__input"
              value={uei}
              onChange={(e) => setUei(e.target.value)}
              placeholder="12-character UEI from SAM.gov"
              maxLength={12}
            />
          </div>
        </div>
      )}

      {verifyKey === "sbs" && (
        <div className="rm3-form__field">
          <label className="rm3-form__label" htmlFor="rm3v-sbs">SBA profile URL</label>
          <input id="rm3v-sbs" className="rm3-verify__input" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://search.certifications.sba.gov/profile/…" />
        </div>
      )}

      {verifyKey === "sled" && (
        <div className="rm3-verify__fields">
          {sled.map((entry, i) => (
            <div key={i} className="rm3-verify__row">
              <select
                className="rm3-verify__input"
                value={entry.registryType}
                onChange={(e) => setSled((prev) => prev.map((x, j) => (j === i ? { ...x, registryType: e.target.value } : x)))}
              >
                <option value="">Type…</option>
                {SLED_REGISTRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                className="rm3-verify__input rm3-verify__input--state"
                value={entry.state}
                onChange={(e) => setSled((prev) => prev.map((x, j) => (j === i ? { ...x, state: e.target.value } : x)))}
                placeholder="State"
                maxLength={2}
              />
              <input
                className="rm3-verify__input"
                value={entry.businessName}
                onChange={(e) => setSled((prev) => prev.map((x, j) => (j === i ? { ...x, businessName: e.target.value } : x)))}
                placeholder="Business name as registered"
              />
              {sled.length > 1 && (
                <button type="button" className="rm3-verify__link" onClick={() => setSled((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove row">
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="rm3-verify__link"
            onClick={() => setSled((prev) => [...prev, { registryType: "", state: "", businessName: prefill.legalName ?? "" }])}
          >
            + Add another registration
          </button>
        </div>
      )}

      {error && <p className="rm3-verify__error">{error}</p>}
      {fixtureMode && <p className="rm3-verify__error">Test state — verification is off.</p>}

      {confirmingReset ? (
        /* Asked inline rather than through window.confirm: a browser dialog
           inside the GHL iframe is easy to miss and impossible to style. */
        <div className="rm3-verify__reset">
          <p>Reset this verification? It clears the result — you can verify again straight away.</p>
          <div className="rm3-verify__acts">
            <button
              type="button"
              className="rm2-btn rm2-btn--green rm3-verify__btn"
              disabled={resetting}
              onClick={performReset}
            >
              {resetting ? "Resetting…" : "Yes, reset"}
            </button>
            <button type="button" className="rm3-verify__link" disabled={resetting} onClick={() => setConfirmingReset(false)}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="rm3-verify__acts">
          <button type="button" className="rm2-btn rm2-btn--green rm3-verify__btn" disabled={!canSubmit} onClick={() => runVerify()}>
            {busy ? "Checking…" : verifyKey === "sled" ? "Save and verify" : "Verify"}
          </button>
          {/* Rendered whenever the button is off, never when it is on — a
              reason beside a working button reads as a warning. */}
          {!canSubmit && whyBlocked() && (
            <span className="rm3-verify__blocked" role="status">{whyBlocked()}</span>
          )}
          <button
            type="button"
            className="rm3-verify__link"
            onClick={() => {
              setError(null);
              setMode("idle");
            }}
          >
            Back
          </button>
          {/* Only once something passed — there is nothing to reset before
              that, and the way out matters most when she verified the wrong
              company and every surface now reads it as hers. */}
          {passed && (
            <button type="button" className="rm3-verify__link rm3-verify__link--danger" onClick={() => setConfirmingReset(true)}>
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
