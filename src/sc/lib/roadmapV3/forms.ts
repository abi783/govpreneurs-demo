/**
 * The internal forms a v3 step can put in front of a member.
 *
 * These are OUR forms, not links to somewhere else: the Digital Compliance
 * Audit Form writes a `MemberValidation` row when she submits it. So an admin
 * picks one from a list rather than pasting a URL — a pasted URL can point at
 * the wrong place, at nothing, or at a form whose submission we would never
 * hear about.
 *
 * Each entry carries everything the card and its drawer need:
 *   · the fields to render, and where each one is prefilled from;
 *   · which verification her submission creates, which is both what the drawer
 *     POSTs and how the card knows to clear itself and let the service through.
 *
 * ONE HALF IS GENERIC, THE OTHER IS NOT. The drawer renders whatever is
 * declared here, but the server does not: `/api/portal/{locationId}/verify`
 * has a hand-written `digital_compliance_intake` branch. Adding a second form
 * means adding a branch there too — this list alone will not carry it.
 */

import {
  DC_GAP_DESCRIPTIONS,
  DC_ITEM_IDS,
  DC_ITEM_INPUT_KEY,
  dcFindingPill,
  dcItemIdForKey,
  type DcPreCheckResult,
} from "@sc/lib/digitalCompliance";

/** The center columns a field can be prefilled from. */
export type FormPrefillSource = "legalName" | "ownerEmail" | "website" | "phone";

export interface FormField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  /** Input type; omitted = text. */
  type?: string;
  /** Seeded from this column of her record. Absent = we do not hold it. */
  prefillFrom?: FormPrefillSource;
  /**
   * Which checklist tick this answer satisfies. Several fields can share one
   * (either LinkedIn URL ticks "linkedin"), and a field with none ticks
   * nothing. Absent from the tick list ≠ absent from the form.
   */
  tickKey?: string;
  /**
   * Other ticks this answer ALSO satisfies, because the check itself treats
   * them as one question. A website with no separate domain box is still a
   * domain — `dcPreCheck` derives one from the other — so a checklist that
   * asked her twice would be asking for something she already gave us.
   * Not offered as its own option in the admin dropdown.
   */
  alsoTicks?: string[];
}

/** One row of "what we found" after a form was submitted and checked. */
export interface FormResult {
  /** The thing checked, in her words — "Professional email address". */
  title: string;
  /** pass/fail/needs_review/skipped from the check, "fixed" once closed, or
   *  the member's own opt-out answer (N/A · REFUSE — verified, no action). */
  status: "pass" | "fail" | "needs_review" | "skipped" | "fixed" | "not_applicable" | "refused";
  /** What the check actually saw. Absent when there is nothing to show. */
  evidence?: string;
  /** What this item is and why it matters — on every row, not just gaps
   *  (owner, 2026-09-03: each item explains itself under its title). */
  description?: string;
  /** What SHE answered on the form for this item, verbatim. */
  provided?: string;
}

export interface InternalForm {
  key: string;
  /** The card's heading when the step sets none of its own. Names the form. */
  label: string;
  /** One line under the heading — what she is being asked for and why. */
  blurb: string;
  /** The `MemberValidation.service` row her submission creates. Its presence
   *  IS the signal that the form is in; the result it later carries is a
   *  different question. */
  verificationKey: string;
  fields: FormField[];
  /**
   * The stored verification payload → the rows her results card shows.
   * Pure, and per-form because only the form knows the shape it wrote.
   * `fixed` maps a completion item id to how it was closed, so a gap someone
   * has since fixed stops reading "Gap found".
   */
  results?: (data: unknown, fixed: Record<string, "diy" | "dfy">) => FormResult[];
  /** Completion item ids whose "fixed" state overrides a finding. */
  fixedItemIds?: readonly string[];
}

/**
 * The tick options an admin can attach to a checklist line for this form:
 * "she submitted it at all", plus one per distinct answer.
 */
export function formTickOptions(form: InternalForm): { key: string; label: string }[] {
  const out = [{ key: FORM_SUBMITTED_TICK, label: "Form submitted" }];
  const seen = new Set<string>();
  for (const f of form.fields) {
    if (!f.tickKey || seen.has(f.tickKey)) continue;
    seen.add(f.tickKey);
    // Where fields share a tick, the first one names it — "LinkedIn personal
    // profile URL" reads better on the dropdown than the bare key.
    out.push({ key: f.tickKey, label: f.label });
  }
  return out;
}

/** The tick every form offers: she sent it, whatever it said. */
export const FORM_SUBMITTED_TICK = "submitted";

/**
 * The audit form's fields. Also rendered by `DcAuditForm` on the v2 roadmap,
 * which imports them from here — the two surfaces must ask for the same
 * things, because they write the same `MemberValidation` row.
 */
export const DIGITAL_COMPLIANCE_FIELDS: FormField[] = [
  { key: "businessLegalName", label: "Business legal name", placeholder: "Your Biz LLC", required: true, prefillFrom: "legalName", tickKey: "businessLegalName" },
  { key: "email", label: "Contact email", placeholder: "you@yourbiz.com", required: true, type: "email", prefillFrom: "ownerEmail", tickKey: "email" },
  { key: "website", label: "Website URL", placeholder: "https://yourbiz.com", prefillFrom: "website", tickKey: "website", alsoTicks: ["domain"] },
  // Her TRADE NAME, not a URL. The old "Domain / DBA name" label read as
  // either, and members typed both; the pre-check derives the actual domain
  // from the website field and compares it against legal name OR this.
  { key: "domain", label: "DBA / trade name (if different from your legal name)", placeholder: "Acme Consulting", tickKey: "domain" },
  { key: "phone", label: "Business phone", placeholder: "+1 555 0123", prefillFrom: "phone", tickKey: "phone" },
  { key: "a2pBrandId", label: "A2P Brand ID (if registered)", placeholder: "BN…", tickKey: "a2pBrandId" },
  { key: "contactUsUrl", label: "Contact-us page URL", placeholder: "https://yourbiz.com/contact", tickKey: "contactUsUrl" },
  { key: "landingUrl", label: "Government landing page URL", placeholder: "https://yourbiz.com/government", tickKey: "landingUrl" },
  { key: "privacyUrl", label: "Privacy policy URL", placeholder: "https://yourbiz.com/privacy", tickKey: "privacyUrl" },
  // Any shareable document URL — the check is a reachability HEAD, and never
  // cared where the file lives; only this label demanded Google Docs.
  { key: "letterheadUrl", label: "Letterhead document URL", placeholder: "https://…/your-letterhead.pdf", tickKey: "letterheadUrl" },
  { key: "linkedinPersonalUrl", label: "LinkedIn personal profile URL", placeholder: "https://www.linkedin.com/in/…", tickKey: "linkedin" },
  { key: "linkedinCompanyUrl", label: "LinkedIn company/business profile URL", placeholder: "https://www.linkedin.com/company/…", tickKey: "linkedin" },
];

/**
 * The audit form's stored payload → result rows.
 *
 * `MemberValidation.data.preCheck` is a FROZEN snapshot written when she
 * submitted, so on its own it goes on saying "Gap found" long after a mentor
 * closed the gap — `dcFindingPill` is what makes the card's promise ("your
 * Mentor's audit overrides anything here") true. Identical rule to v2's
 * DcFindingsCard, which is why it lives here rather than in either renderer.
 */
function digitalComplianceResults(data: unknown, fixed: Record<string, "diy" | "dfy">): FormResult[] {
  const d = data && typeof data === "object" ? (data as { preCheck?: unknown; inputs?: unknown }) : null;
  const rows = Array.isArray(d?.preCheck) ? (d.preCheck as DcPreCheckResult[]) : [];
  const inputs =
    d?.inputs && typeof d.inputs === "object" && !Array.isArray(d.inputs)
      ? (d.inputs as Record<string, unknown>)
      : {};
  return rows.map((r) => {
    const itemId = dcItemIdForKey(r.itemKey);
    const fulfilledBy = itemId ? fixed[itemId] ?? null : null;
    const status = dcFindingPill(r.status, fulfilledBy);
    const out: FormResult = { title: r.itemTitle, status };
    if (r.evidence) out.evidence = r.evidence;
    // Every row explains itself and shows what she answered (owner,
    // 2026-09-03) — previously only an unclosed blank got the explanation.
    const description = DC_GAP_DESCRIPTIONS[r.itemKey];
    if (description) out.description = description;
    const provided = inputs[DC_ITEM_INPUT_KEY[r.itemKey] ?? ""];
    if (typeof provided === "string" && provided.trim()) out.provided = provided.trim();
    return out;
  });
}

export const INTERNAL_FORMS: InternalForm[] = [
  {
    key: "digital_compliance_audit",
    label: "Digital Compliance Audit Form",
    blurb:
      "A few questions about your domain, email and business phone. We check them and come back with what needs fixing.",
    verificationKey: "digital_compliance_intake",
    fields: DIGITAL_COMPLIANCE_FIELDS,
    results: digitalComplianceResults,
    fixedItemIds: DC_ITEM_IDS,
  },
];

export function internalForm(key: string | null | undefined): InternalForm | undefined {
  return key ? INTERNAL_FORMS.find((f) => f.key === key) : undefined;
}

/** The button on a results card, as stored. */
export type V3FormDoneButton = {
  label: string;
  to: { kind: "url"; url: string } | { kind: "step"; stepId: string };
};

/** Parsed, or undefined — a half-written button is no button. */
export function formDoneButton(raw: unknown): V3FormDoneButton | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as { label?: unknown; to?: { kind?: unknown; url?: unknown; stepId?: unknown } };
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!label || !o.to || typeof o.to !== "object") return undefined;
  if (o.to.kind === "url" && typeof o.to.url === "string" && o.to.url.trim()) {
    return { label, to: { kind: "url", url: o.to.url.trim() } };
  }
  if (o.to.kind === "step" && typeof o.to.stepId === "string" && o.to.stepId.trim()) {
    return { label, to: { kind: "step", stepId: o.to.stepId.trim() } };
  }
  return undefined;
}

/** The card's button when the step sets no label of its own. */
export const DEFAULT_FORM_BUTTON_LABEL = "Open the form";

/**
 * The one sentence that tells a member she may opt out of an item. Rendered on
 * EVERY surface that shows the audit form — v2's card, v3's drawer, the
 * business page — from this single constant, so the promise `dcOptOut` keeps
 * (N/A → Not Applicable, REFUSE → Refused, both counted as verified) is
 * advertised the same way everywhere it can be used.
 */
export const DC_OPT_OUT_HINT_SEGMENTS: readonly { text: string; strong?: boolean }[] = [
  { text: "Doesn't apply to your business? Type " },
  { text: "N/A", strong: true },
  { text: ". Prefer we skip an item? Type " },
  { text: "REFUSE", strong: true },
  { text: " — either way it counts as handled, nothing more needed." },
];

/** The same sentence as one string, for anything that cannot render segments. */
export const DC_OPT_OUT_HINT = DC_OPT_OUT_HINT_SEGMENTS.map((s) => s.text).join("");

/**
 * What to put in the boxes when a member opens the audit form.
 *
 * WHAT SHE LAST SUBMITTED WINS over what her record holds. The two disagree
 * often and meaningfully: the form asks for a domain, a privacy-policy URL and
 * an A2P brand id that live nowhere else, and where they do overlap — legal
 * name, email, phone, website — her own answer is the more recent statement of
 * the same fact. Re-opening the form to correct one field must not silently
 * revert the other eleven to whatever the record said months ago.
 *
 * `centerPrefill` is `formPrefill(fields, center)`, computed by the caller
 * (it reads center columns; this stays pure so both surfaces can share it).
 * Blank stored answers fall through — a field she left empty last time should
 * still offer what we know.
 */
export function dcPrefill(
  fields: FormField[],
  storedInputs: unknown,
  centerPrefill: Record<string, string>,
): Record<string, string> {
  const stored =
    storedInputs && typeof storedInputs === "object" && !Array.isArray(storedInputs)
      ? (storedInputs as Record<string, unknown>)
      : {};
  const out: Record<string, string> = {};
  for (const f of fields) {
    const prev = stored[f.key];
    const value = typeof prev === "string" && prev.trim() ? prev.trim() : centerPrefill[f.key];
    if (value) out[f.key] = value;
  }
  return out;
}
