// DEMO: every change a visitor can make to the My Business record.
//
// Each function here is the demo version of one Success Center route
// (`src/app/api/portal/[locationId]/business-profile/...`). It changes the store value
// (`state.ts`) and returns the whole `MyBusinessPayload`, which is what the real routes
// answer with. The lifted components set their state from that answer, so the rail,
// the score and the rows move together, and a reload shows the same record.
//
// The rules are the production rules: the same validator (`acceptStoredValue`), the same
// states a confirmed suggestion lands in, the same texts for a refusal.

import { demoResponse } from "../../runtime/router";
import { PERSONA } from "../../story/persona";
import { isoDaysFromNow } from "../../story/clock";
import { newId } from "../../api/util";
import { BEFORE_FIRST_CALL_TOTAL, basicInfoAnswered } from "@sc/lib/businessProfile/catalog";
import { isKnownFieldKey } from "@sc/lib/businessProfile/crosswalk";
import { FRESHNESS_DECLINED, FRESHNESS_TODAY } from "@sc/lib/businessProfile/freshness";
import { handoffMode } from "@sc/lib/businessProfile/handoff";
import { UNSAVABLE_VALUE } from "@sc/lib/businessProfile/proposalAnswer";
import {
  ORIGIN_PROSE,
  ORIGIN_PROSE_EDIT,
  admitProposal,
  landingState,
  type OriginKey,
} from "@sc/lib/businessProfile/proposalPolicy";
import { REQUIRED_KEYS } from "@sc/lib/businessProfile/registry";
import { acceptStoredValue } from "@sc/lib/businessProfile/storedValue";
import { SUBSET_REFUSALS, subsetRule, validateSubset } from "@sc/lib/businessProfile/subsetConfirm";
import {
  TELL_ORIGIN_KEY,
  TELL_SOURCE_LABEL,
  planTell,
  readTellText,
  tellProvenance,
  type TellPlan,
} from "@sc/lib/businessProfile/tell";
import { TRADE_FIELD_KEY, parseTradeSaveScope, tradeNaicsCodes, tradeNaicsUpdate } from "@sc/lib/businessProfile/writeBack";
import { computeNaics } from "@sc/lib/naics/computeNaics";
import { dcDomainMatch, dcOptOut, dcProvidedHref } from "@sc/lib/digitalCompliance";
import { DIGITAL_COMPLIANCE_FIELDS } from "@sc/lib/roadmapV3/forms";
import type { MyBusinessPayload } from "@sc/lib/businessProfile/payload";
import { demoExtract } from "./demoTell";
import { MEDIA_LOGO_URL, imageToDataUrl, initialsAvatar } from "./media";
import { buildPayload } from "./payload";
import { readBusiness, updateBusiness, writeBusiness } from "./state";
import type {
  DemoBusinessState,
  DemoDigitalAudit,
  DemoDocument,
  DemoFieldRow,
  DemoPreCheck,
  DemoProposal,
} from "./types";

const now = () => new Date();
const iso = () => now().toISOString();

/** The payload for the record as it stands. */
export function currentPayload(): MyBusinessPayload {
  return buildPayload(readBusiness());
}

function refuse(status: number, message: string) {
  return demoResponse(status, { error: message });
}

function upsertRow(state: DemoBusinessState, row: DemoFieldRow): DemoBusinessState {
  const has = state.rows.some((r) => r.fieldKey === row.fieldKey);
  return {
    ...state,
    rows: has ? state.rows.map((r) => (r.fieldKey === row.fieldKey ? row : r)) : [...state.rows, row],
  };
}

function supersedeOpen(state: DemoBusinessState, fieldKey: string, except?: string): DemoBusinessState {
  return {
    ...state,
    proposals: state.proposals.map((p) =>
      p.fieldKey === fieldKey && p.status === "open" && p.id !== except ? { ...p, status: "superseded" } : p,
    ),
  };
}

/** "Your trade" also writes the NAICS codes that matching reads (SPEC §A.4). */
function mirrorTrade(
  state: DemoBusinessState,
  stored: unknown,
  scope: ReturnType<typeof parseTradeSaveScope>,
): DemoBusinessState {
  const codes = tradeNaicsCodes(stored);
  // A save that keeps no code changes nothing on her profile.
  if (codes.length === 0 && (scope?.kept.length ?? 0) === 0) return state;
  const bySource = tradeNaicsUpdate(codes, iso(), scope)(state.naicsBySource);
  const computed = computeNaics(bySource, { primaryNaics: PERSONA.primaryNaics });
  return { ...state, naicsBySource: bySource, naicsCodes: computed.naicsCodes };
}

// ── save one answer ────────────────────────────────────────────────────────

/** PUT .../business-profile/:fieldKey: the member answers or edits a field. */
export function saveField(fieldKey: string, body: unknown) {
  if (!isKnownFieldKey(fieldKey)) return refuse(400, "Unknown field");
  const parsed = body as { value?: unknown; naicsScope?: unknown } | null;
  if (!parsed || typeof parsed !== "object" || parsed.value === undefined) return refuse(400, "Missing value");

  const accepted = acceptStoredValue(fieldKey, parsed.value);
  if (!accepted.ok) return refuse(422, accepted.message);

  updateBusiness((state) => {
    const existing = state.rows.find((r) => r.fieldKey === fieldKey);
    const at = iso();
    const row: DemoFieldRow = {
      fieldKey,
      value: accepted.value,
      state: "attested",
      origin: existing ? ORIGIN_PROSE_EDIT : ORIGIN_PROSE["member.typed"],
      originKey: "member.typed",
      freshnessLabel: FRESHNESS_TODAY,
      confirmedAt: null,
      attestedAt: at,
      verifiedAt: null,
      updatedAt: at,
      expiresAt: null,
      // Answering IS revoking: a field she has now filled in must not stay declined.
      declinedAt: null,
      conflict: null,
      errorMessage: null,
      // Editing a value that carried a citation drops the pin: the old source no
      // longer backs the new value.
      provenance: null,
    };
    let next = supersedeOpen(upsertRow(state, row), fieldKey);
    if (fieldKey === TRADE_FIELD_KEY) next = mirrorTrade(next, accepted.value, parseTradeSaveScope(parsed.naicsScope));
    return next;
  });
  return currentPayload();
}

// ── agree with a value we put on the record ────────────────────────────────

/** POST .../business-profile/:fieldKey: confirm a value that needs a check. */
export function confirmField(fieldKey: string) {
  const state = readBusiness();
  const existing = state.rows.find((r) => r.fieldKey === fieldKey);
  if (!existing) return refuse(404, "Nothing to confirm");
  if (existing.state !== "needs_review" && existing.state !== "inferred") {
    return refuse(409, "Field is not awaiting confirmation");
  }
  const at = iso();
  updateBusiness((s) =>
    upsertRow(s, {
      ...existing,
      state: "attested",
      origin: ORIGIN_PROSE["member.confirmed"],
      originKey: "member.confirmed",
      freshnessLabel: FRESHNESS_TODAY,
      attestedAt: at,
      updatedAt: at,
    }),
  );
  return currentPayload();
}

// ── "Do not ask me this again" ─────────────────────────────────────────────

/** POST .../business-profile/:fieldKey/decline */
export function declineField(fieldKey: string) {
  if (!isKnownFieldKey(fieldKey)) return refuse(400, "Unknown field");
  if (REQUIRED_KEYS.includes(fieldKey)) return refuse(400, "Your mentor needs this one before your call.");
  const at = iso();
  updateBusiness((state) => {
    const existing = state.rows.find((r) => r.fieldKey === fieldKey);
    const row: DemoFieldRow = {
      ...(existing ?? {
        fieldKey,
        value: null,
        confirmedAt: null,
        attestedAt: null,
        verifiedAt: null,
        expiresAt: null,
        conflict: null,
        errorMessage: null,
        provenance: null,
        originKey: null,
      }),
      fieldKey,
      state: "missing",
      origin: "You skipped this",
      freshnessLabel: FRESHNESS_DECLINED,
      declinedAt: at,
      updatedAt: at,
    } as DemoFieldRow;
    return upsertRow(state, row);
  });
  return currentPayload();
}

// ── suggestions: yes or no ─────────────────────────────────────────────────

function originKeyOf(stored: string): OriginKey | null {
  const keys: OriginKey[] = [
    "member.typed", "member.confirmed", "ghl.contact", "intake.migration",
    "hunter.warm_start", "hunter.learned", "member.told", "capability_statement", "sam.gov",
  ];
  return keys.find((k) => k === stored) ?? null;
}

/** POST .../proposals/:proposalId/confirm. `body` may hold the items she kept. */
export function confirmProposal(proposalId: string, body: unknown) {
  const state = readBusiness();
  const proposal = state.proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== "open") return refuse(409, "That suggestion is already answered.");

  let value: unknown = proposal.value;
  if (body && typeof body === "object") {
    const checked = validateSubset(proposal.fieldKey, proposal.value, body);
    if (!checked.ok) return refuse(400, checked.reason);
    value = checked.value;
  } else if (subsetRule(proposal.fieldKey, proposal.value)) {
    return refuse(400, SUBSET_REFUSALS.subsetRequired);
  }

  const accepted = acceptStoredValue(proposal.fieldKey, value);
  if (!accepted.ok) return refuse(400, UNSAVABLE_VALUE);

  const channel = originKeyOf(proposal.originKey);
  const at = iso();
  updateBusiness((s) => {
    const row: DemoFieldRow = {
      fieldKey: proposal.fieldKey,
      value: accepted.value,
      state: channel ? landingState(channel) : "attested",
      origin: ORIGIN_PROSE["member.confirmed"],
      originKey: "member.confirmed",
      freshnessLabel: FRESHNESS_TODAY,
      confirmedAt: at,
      attestedAt: at,
      verifiedAt: null,
      updatedAt: at,
      expiresAt: null,
      declinedAt: null,
      conflict: null,
      errorMessage: null,
      // The card's source stays with the answer, so she can still open it.
      provenance: proposal.provenance,
    };
    let next = upsertRow(s, row);
    next = {
      ...next,
      proposals: next.proposals.map((p) => (p.id === proposalId ? { ...p, status: "confirmed" } : p)),
    };
    if (proposal.fieldKey === TRADE_FIELD_KEY) next = mirrorTrade(next, accepted.value, null);
    return next;
  });
  return currentPayload();
}

/** POST .../proposals/:proposalId/reject: the row keeps whatever it had. */
export function rejectProposal(proposalId: string) {
  const state = readBusiness();
  const proposal = state.proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== "open") return refuse(409, "That suggestion is already answered.");
  updateBusiness((s) => ({
    ...s,
    proposals: s.proposals.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p)),
  }));
  return currentPayload();
}

// ── send the fourteen to the mentor ────────────────────────────────────────

/** POST .../business-profile/handoff */
export function sendHandoff() {
  const state = readBusiness();
  const answered = basicInfoAnswered(state.rows);
  const mode = handoffMode({
    answered,
    total: BEFORE_FIRST_CALL_TOTAL,
    sentAt: state.intakeSentAt ? new Date(state.intakeSentAt) : null,
  });
  if (mode === "filling") {
    return demoResponse(409, {
      error: "There are still questions to answer before this goes to your mentor.",
      mode,
    });
  }
  if (mode === "ready") {
    updateBusiness((s) => ({
      ...s,
      intakeSentAt: iso(),
      // The mentor on the receipt is the mentor on the confirmation screen.
      intakeSentMentor: s.onboarding.mentorName,
    }));
  }
  return currentPayload();
}

// ── Tell Hunter everything ─────────────────────────────────────────────────

/** POST .../business-profile/tell: what she says becomes suggestions, never answers. */
export function tellHunter(body: unknown) {
  const said = readTellText(body);
  if ("error" in said) return refuse(400, said.error);

  const state = readBusiness();
  const held = new Map(state.rows.map((r) => [r.fieldKey, r]));
  const open = new Map(
    state.proposals
      .filter((p) => p.status === "open" && p.originKey === TELL_ORIGIN_KEY)
      .map((p) => [p.fieldKey, { value: p.value }] as const),
  );
  const plan: TellPlan = planTell({
    extraction: demoExtract(said.text),
    held: (fieldKey) => {
      const row = held.get(fieldKey);
      return row ? { value: row.value, state: row.state, originKey: row.originKey } : null;
    },
    openProposal: (fieldKey) => open.get(fieldKey) ?? null,
  });

  if (plan.proposals.length > 0) {
    const record = tellProvenance(said.text, now());
    const provenance = {
      type: record.type,
      sourceLabel: TELL_SOURCE_LABEL,
      locator: null,
      quote: null,
      excerpt: null,
      retrievedAt: null,
      conversation: record.conversation as unknown as Record<string, unknown>,
      unavailable: null,
    };
    updateBusiness((s) => {
      let next = s;
      for (const item of plan.proposals) {
        // This channel's older open card for the same row is closed.
        next = {
          ...next,
          proposals: next.proposals.map((p) =>
            p.fieldKey === item.fieldKey && p.originKey === TELL_ORIGIN_KEY && p.status === "open"
              ? { ...p, status: "superseded" }
              : p,
          ),
        };
        const card: DemoProposal = {
          id: newId("prop"),
          fieldKey: item.fieldKey,
          value: item.value,
          originKey: TELL_ORIGIN_KEY,
          origin: ORIGIN_PROSE[TELL_ORIGIN_KEY],
          heard: item.heard,
          provenance,
          proposedAt: iso(),
          status: "open",
        };
        next = { ...next, proposals: [card, ...next.proposals] };
      }
      return next;
    });
  }
  return { ...currentPayload(), tell: plan };
}

/** POST .../business-profile/tell/transcribe: the demo has no microphone model. */
export function transcribe() {
  return {
    text:
      "We cook and deliver up to 1,100 meals a day from our kitchen in Fayetteville. We have two refrigerated vans for same-day delivery. We can wait 30 days to be paid. We want to win our first prime contract in the next 90 days.",
  };
}

// ── uploads ────────────────────────────────────────────────────────────────

function fileFrom(body: unknown): File | null {
  if (body instanceof FormData) {
    const f = body.get("file");
    return f instanceof File ? f : null;
  }
  return null;
}

/** POST /api/portal/:locationId/business-documents (multipart: file, kind). */
export function storeDocument(body: unknown) {
  if (!(body instanceof FormData)) return refuse(400, "A file and a valid kind are needed");
  const file = fileFrom(body);
  const kind = String(body.get("kind") ?? "");
  if (!file || !kind) return refuse(400, "A file and a valid kind are needed");
  if (file.size > 15 * 1024 * 1024) {
    return refuse(413, "That file is over 15 MB. A PDF export is usually much smaller.");
  }
  const doc: DemoDocument = {
    id: newId("doc"),
    kind,
    name: file.name || `${kind}.pdf`,
    mime: file.type || "application/octet-stream",
    sizeBytes: file.size,
    uploadedAt: iso(),
    fieldKey: null,
  };
  updateBusiness((s) => {
    let next: DemoBusinessState = { ...s, documents: [...s.documents, doc] };
    if (kind === "llc") {
      next = {
        ...next,
        onboarding: { ...next.onboarding, llcUploadedAt: doc.uploadedAt },
        // Same as production: a first check asks her to confirm what it read.
        llcVerification:
          next.llcVerification?.status === "pass"
            ? next.llcVerification
            : {
                status: "needs_input",
                message: "We read your document. Please confirm that this is your business.",
                requiresConfirmation: true,
                legalName: PERSONA.businessName,
              },
      };
    }
    return next;
  });
  return { saved: true, documentId: doc.id, url: `demo-document://${doc.id}`, status: "stored" };
}

/** POST /api/portal/:locationId/upload (multipart: type, file). Photo or logo. */
export async function storeMedia(body: unknown) {
  if (!(body instanceof FormData)) return refuse(400, "Send an image.");
  const type = String(body.get("type") ?? "");
  const file = fileFrom(body);
  if ((type !== "contact" && type !== "logo") || !file) return refuse(400, "Send an image.");
  const url = await imageToDataUrl(
    file,
    type === "logo" ? MEDIA_LOGO_URL : initialsAvatar(`${PERSONA.ownerFirstName[0]}${PERSONA.ownerName.split(" ")[1]?.[0] ?? ""}`),
  );
  updateBusiness((s) => ({
    ...s,
    media: { ...s.media, [type === "logo" ? "logoUrl" : "photoUrl"]: url },
  }));
  return { url };
}

// ── verify ─────────────────────────────────────────────────────────────────

const DC_KEY = "digital_compliance_intake";

const DC_ITEM_TITLES: Record<string, string> = {
  websiteCage: "Website with CAGE code + required footer info",
  domainMatch: "Domain name matches at least 60% of legal name or DBA",
  professionalEmail: "Professional email address",
  businessPhone: "Business phone number",
  a2p: "A2P compliance",
  contactConsent: "Contact us page with consent checkboxes",
  govLandingCaps: "Government contractor landing page with CAPS statement",
  letterhead: "Company letterhead",
  privacyPolicy: "Privacy policy",
};

const FREE_MAIL = /@(gmail|yahoo|outlook|hotmail|icloud|aol|live|msn|proton(mail)?)\./i;

function hostOf(value: string): string {
  const href = dcProvidedHref(value);
  try {
    return new URL(href ?? `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

/** The demo version of `dcPreCheck`: it reads her answers and makes no web request. */
function preCheck(inputs: Record<string, string>): DemoPreCheck[] {
  const out: DemoPreCheck[] = [];
  const add = (itemKey: string, status: DemoPreCheck["status"], evidence?: string) =>
    out.push({ itemKey, itemTitle: DC_ITEM_TITLES[itemKey]!, status, ...(evidence ? { evidence } : {}) });

  /** An opt-out answer is verified, with no action. Returns true when it handled it. */
  const optOut = (itemKey: string, value: string | undefined): boolean => {
    const choice = dcOptOut(value);
    if (!choice) return false;
    out.push({
      itemKey,
      itemTitle: DC_ITEM_TITLES[itemKey]!,
      status: choice,
    });
    return true;
  };

  const website = inputs.website;
  if (!optOut("websiteCage", website)) {
    if (!website) add("websiteCage", "skipped", "No website address was provided.");
    else add("websiteCage", "pass", `CAGE code ${PERSONA.cage} found in the page footer.`);
  }
  if (!optOut("domainMatch", website)) {
    if (!website) add("domainMatch", "skipped", "No website address was provided.");
    else {
      const match = dcDomainMatch(inputs.businessLegalName ?? PERSONA.businessName, inputs.domain || null, hostOf(website));
      add(
        "domainMatch",
        match.sim >= 60 ? "pass" : "fail",
        `${hostOf(website)} is ${Math.round(match.sim)}% like "${match.against}".`,
      );
    }
  }
  const email = inputs.email;
  if (!optOut("professionalEmail", email)) {
    if (!email) add("professionalEmail", "skipped", "No email address was provided.");
    else if (FREE_MAIL.test(email)) add("professionalEmail", "fail", `${email} is a free mailbox, not your own domain.`);
    else add("professionalEmail", "pass", `${email} is on your own domain.`);
  }
  const phone = inputs.phone;
  if (!optOut("businessPhone", phone)) {
    if (!phone) add("businessPhone", "skipped", "No phone number was provided.");
    else if (phone.replace(/\D/g, "").length >= 10) add("businessPhone", "pass", `${phone} is a valid US number.`);
    else add("businessPhone", "fail", `${phone} is not a full US number.`);
  }
  const a2p = inputs.a2pBrandId;
  if (!optOut("a2p", a2p)) {
    if (!a2p) add("a2p", "skipped", "No A2P brand ID was provided.");
    else add("a2p", "pass", `Brand ${a2p} is registered.`);
  }
  const link = (itemKey: string, value: string | undefined, missing: string, ok: string) => {
    if (optOut(itemKey, value)) return;
    if (!value) add(itemKey, "skipped", missing);
    else if (dcProvidedHref(value)) add(itemKey, "pass", ok);
    else add(itemKey, "fail", "That is not a web address.");
  };
  if (!optOut("contactConsent", inputs.contactUsUrl)) {
    if (!inputs.contactUsUrl) add("contactConsent", "skipped", "No contact page address was provided.");
    else add("contactConsent", "needs_review", "The contact page loads. We did not find consent checkboxes.");
  }
  link("govLandingCaps", inputs.landingUrl, "No landing page address was provided.", "The landing page loads and shows your capability statement.");
  link("letterhead", inputs.letterheadUrl, "No letterhead link was provided.", "The letterhead file opens.");
  link("privacyPolicy", inputs.privacyUrl, "No privacy page address was provided.", "The privacy page loads and names your business.");
  return out;
}

/** POST /api/portal/:locationId/verify. The LLC confirm, and the audit form. */
export function verify(body: unknown) {
  const b = body as { validationKey?: string; inputs?: Record<string, unknown>; action?: string } | null;
  if (!b || !b.validationKey) return refuse(400, "Missing validationKey");

  if (b.validationKey === DC_KEY) {
    const raw = b.inputs ?? {};
    const inputs: Record<string, string> = {};
    for (const field of DIGITAL_COMPLIANCE_FIELDS) {
      const v = raw[field.key];
      if (typeof v === "string" && v.trim()) inputs[field.key] = v.trim();
    }
    if (!inputs.businessLegalName) return refuse(400, "Business legal name is required");
    if (!inputs.email) return refuse(400, "Email is required");
    const audit: DemoDigitalAudit = { inputs, checkedAt: iso(), preCheck: preCheck(inputs) };
    updateBusiness((s) => ({ ...s, digital: audit }));
    return {
      result: {
        service: DC_KEY,
        status: "pass",
        message: null,
        data: { inputs: audit.inputs, preCheck: audit.preCheck },
      },
    };
  }

  if (b.validationKey === "llc" && b.action === "confirm") {
    updateBusiness((s) => ({
      ...s,
      llcVerification: {
        status: "pass",
        message: null,
        requiresConfirmation: false,
        legalName: s.llcVerification?.legalName ?? PERSONA.businessName,
      },
    }));
    return { result: { service: "llc", status: "pass", message: null, data: {} } };
  }

  // Any other check (SAM, capability statement, and so on) ends in a pass, because the
  // sample member's registrations are all in order.
  return { result: { service: b.validationKey, status: "pass", message: null, data: {} } };
}

/** Keep `writeBusiness` reachable for tests and tools that replace the whole record. */
export { writeBusiness };
