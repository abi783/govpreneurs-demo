/**
 * Digital Compliance — single source of truth for the IDs referenced by
 * the customer-side RoadmapPageClient switch logic, the admin-side
 * Compliance tab, the validator, and the report endpoint.
 *
 * All IDs seeded by prisma/migrations/2026-06-digital-compliance.sql.
 */

export const DC_PARENT_MAIN_STEP_ID = "23539750-beeb-4ea5-b6a3-8280e1398827"; // "Digital Compliance Check"

export const DC_SUB_STEPS = {
  intake: "dc_intake_2026_06_01",
  call: "dc_call_2026_06_01",
  fix: "dc_fix_2026_06_01",
  compliant: "dc_compliant_2026_06_01",
} as const;

export const DC_SECTIONS = {
  intake: "dc_sec_intake_2026",
  call: "dc_sec_call_2026",
  fix: "dc_sec_fix_2026",
  compliant: "dc_sec_compliant_2026",
} as const;

export const DC_TASKS = {
  intake: "dc_task_intake_2026",
  call: "dc_task_call_2026",
  callAuditUploaded: "dc_task_call_audit_2026",
  fix: "dc_task_fix_2026",
  compliant: "dc_task_compliant_2026",
} as const;

/**
 * Per-item Task IDs seeded on the Fix Items section. Used by the admin
 * compliance-items PUT to tick the customer-facing "Inside this step:"
 * checklist row that matches the item just marked DIY/DFY.
 */
export const DC_FIX_TASK_BY_ITEM: Record<string, string> = {
  dc_item_2026_1: "dc_task_fix_1_2026",
  dc_item_2026_2: "dc_task_fix_2_2026",
  dc_item_2026_3: "dc_task_fix_3_2026",
  dc_item_2026_4: "dc_task_fix_4_2026",
  dc_item_2026_5: "dc_task_fix_5_2026",
  dc_item_2026_6: "dc_task_fix_6_2026",
  dc_item_2026_7: "dc_task_fix_7_2026",
  dc_item_2026_8: "dc_task_fix_8_2026",
  dc_item_2026_9: "dc_task_fix_9_2026",
};

/** The DFY service that fixes these gaps for the member — TaskSection.dfySlug.
 *  Used to record whether a fixed gap was DIY or DFY without hardcoding the
 *  service's display title, which admins rename. */
export const DC_DFY_SLUG = "govcompliant-digital-setup";

export const DC_VERIFICATION_ID = "dc_intake_verif_2026_06_01";
export const DC_VALIDATION_KEY = "digital_compliance_intake";
export const DC_MENTOR_PLACEHOLDER_ID = "dc_mentor_sinan_placeholder";

/**
 * A member's own send from her roadmap page is a `ComplianceItemRuling` row
 * with this `call` (the only other is "gaps"), authored by this actor. Kept on
 * the ruling table, not `RoadmapItemCompletion`, because a completion row's
 * existence reads as done to several readers — see `recordMemberDcSend`.
 */
export const DC_MEMBER_SENT_CALL = "sent";
export const DC_MEMBER_ACTOR = "member";

/** Ordered list of the 9 RoadmapChecklistItem IDs seeded for sub-step 3. */
/**
 * "GAPS FOUND" CARRIES THE GAP. A ruling with no reason leaves the member
 * nothing to fix and the next mentor nothing to check, so both places a mentor
 * can say it — the Command Center (`fact.verdict`) and the older mentor audit
 * drawer (`dc-audit`) — refuse it without a note, by this one rule. Lives here,
 * with no imports, so the drawer (a client component) can read the limit too.
 */
export const RULING_NOTE_MAX = 2000;

export function parseGapsNote(raw: unknown): { ok: true; note: string } | { ok: false; error: string } {
  return parseRulingText(raw, "Say what the gap is — the member has to know what to fix.");
}

/** A ruling's text: trimmed, not empty, and not longer than `RULING_NOTE_MAX`. */
function parseRulingText(raw: unknown, emptyError: string): { ok: true; note: string } | { ok: false; error: string } {
  const note = typeof raw === "string" ? raw.trim() : "";
  if (!note) return { ok: false, error: emptyError };
  if (note.length > RULING_NOTE_MAX) return { ok: false, error: `That note must be ${RULING_NOTE_MAX} characters or fewer` };
  return { ok: true, note };
}

/**
 * A ruling row with this `call` records that the team REOPENED a closed item
 * (DC-07, `recordReopenRuling`). The row keeps the value that the item held.
 */
export const DC_REOPEN_CALL = "reopened";
/** The words in front of the reason on a reopen ruling's `note`. */
export const DC_REOPEN_NOTE_PREFIX = "Reopened: ";

/**
 * THE REASON FOR A REOPEN IS REQUIRED (DC-07). It has the same limits as a
 * "gaps found" note. A reopen with no reason cannot be told from a mis-click.
 */
export function parseReopenReason(raw: unknown): { ok: true; note: string } | { ok: false; error: string } {
  return parseRulingText(raw, "Say why you are reopening this item.");
}

export const DC_ITEM_IDS = [
  "dc_item_2026_1",
  "dc_item_2026_2",
  "dc_item_2026_3",
  "dc_item_2026_4",
  "dc_item_2026_5",
  "dc_item_2026_6",
  "dc_item_2026_7",
  "dc_item_2026_8",
  "dc_item_2026_9",
] as const;

export const DC_ITEMS: { id: typeof DC_ITEM_IDS[number]; key: string; title: string }[] = [
  { id: "dc_item_2026_1", key: "websiteCage", title: "Website with CAGE code + required footer info" },
  { id: "dc_item_2026_2", key: "domainMatch", title: "Domain name matches at least 60% of legal name or DBA" },
  { id: "dc_item_2026_3", key: "professionalEmail", title: "Professional email address" },
  { id: "dc_item_2026_4", key: "businessPhone", title: "Business phone number" },
  { id: "dc_item_2026_5", key: "a2p", title: "A2P compliance" },
  { id: "dc_item_2026_6", key: "contactConsent", title: "Contact us page with consent checkboxes" },
  { id: "dc_item_2026_7", key: "govLandingCaps", title: "Government contractor landing page with CAPS statement" },
  { id: "dc_item_2026_8", key: "letterhead", title: "Company letterhead" },
  { id: "dc_item_2026_9", key: "privacyPolicy", title: "Privacy policy" },
];

// Per-item explanation shown under a skipped (field-not-provided) row so the
// customer knows what the gap is and why it matters. Keyed by
// DcPreCheckResult.itemKey. Exported — both RoadmapPageClients reuse it in
// their inline "Preliminary findings" panels.
export const DC_GAP_DESCRIPTIONS: Record<string, string> = {
  websiteCage:       "A website displaying your CAGE code and required footer info is required to be fully compliant.",
  domainMatch:       "Your website domain must match your legal business name (or DBA) to be fully compliant.",
  professionalEmail: "A professional email address on your own domain is required to be fully compliant.",
  businessPhone:     "A dedicated business phone number is required to be fully compliant.",
  a2p:               "A2P registration is required so your business texting stays deliverable and compliant.",
  contactConsent:    "A contact-us page with consent checkboxes is required to be fully compliant.",
  govLandingCaps:    "A government-contractor landing page with your capability statement is required to be fully compliant.",
  letterhead:        "Official company letterhead is required to be fully compliant.",
  privacyPolicy:     "A published privacy policy on your website is required to be fully compliant.",
};


/**
 * Which audit-form field answers each item — so a result row can show the
 * member what SHE provided next to the verdict about it. Client-safe; used by
 * the v2 compliant grid, v3's results card and the business page alike.
 */
export const DC_ITEM_INPUT_KEY: Record<string, keyof DcIntakeInputs> = {
  websiteCage: "website",
  domainMatch: "website",
  professionalEmail: "email",
  businessPhone: "phone",
  a2p: "a2pBrandId",
  contactConsent: "contactUsUrl",
  govLandingCaps: "landingUrl",
  letterhead: "letterheadUrl",
  privacyPolicy: "privacyUrl",
};

/**
 * Items whose Command Center value is NOT the audit-form answer they map to.
 * The v2 page asks item 1 for the page that shows the CAGE (…/about) and item
 * 2 for a bare domain, yet both map to `website`. Writing either one there
 * replaced the member's website, and the next rescan checked the wrong page.
 */
const DC_VALUE_IS_NOT_ANSWER: ReadonlySet<string> = new Set(["websiteCage", "domainMatch"]);

/** Item 8 asks for a file; only a link can stand in for `letterheadUrl`. */
const DC_URL_ONLY_ANSWER: ReadonlySet<string> = new Set(["letterhead"]);
const HTTP_URL_RE = /^https?:\/\/\S+$/i;

/**
 * One team edit of a member's answer, kept in `data.answerEdits[inputKey]` so
 * that clearing the value can give her own answer back. `previous` is null
 * when she left the field blank.
 */
export interface DcAnswerEdit {
  previous: string | null;
  value: string;
  actor: string;
  at: string;
}

/** Who made a team edit, and when. */
export interface DcAnswerEditBy {
  actor: string;
  at: Date;
}

type DcData = Record<string, unknown>;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** The answer field a team value for this item may replace, or null. */
function dcAnswerKey(itemId: string): keyof DcIntakeInputs | null {
  const itemKey = DC_ITEMS.find((i) => i.id === itemId)?.key;
  if (!itemKey || DC_VALUE_IS_NOT_ANSWER.has(itemKey)) return null;
  return DC_ITEM_INPUT_KEY[itemKey] ?? null;
}

function dcAcceptsValue(itemId: string, value: string): boolean {
  const itemKey = DC_ITEMS.find((i) => i.id === itemId)?.key;
  return !itemKey || !DC_URL_ONLY_ANSWER.has(itemKey) || HTTP_URL_RE.test(value.trim());
}

function dcAnswerEdits(base: DcData): Record<string, DcAnswerEdit> {
  return (asRecord(base.answerEdits) ?? {}) as Record<string, DcAnswerEdit>;
}

/**
 * The stored audit payload with one answer replaced — or null when there is
 * nothing to replace: the form was never submitted, the item has no answer
 * field, or the value is not an answer (items 1 and 2, and item 8 unless the
 * value is a link).
 *
 * A VALUE THE TEAM TYPES IN REPLACES THE MEMBER'S ANSWER (owner, 2026-09-26,
 * option A). The Command Center kept it only on
 * `RoadmapItemCompletion.providedValue`, which no Roadmap reads — so Sinan
 * corrected Maamoun Issa's email to `…-int.co` and her Roadmap went on showing
 * the `…-int.com` she typed on 2 Sep. Writing it into `data.inputs` gives one
 * value on every screen. Deliberately NOT bound by rule 5 (the old drawer's
 * refusal to edit an answer the scan passed): here the team's correction wins.
 * The scan is left alone — it says what was checked, and re-verify re-checks.
 *
 * Her own answer is kept in `answerEdits`, so `dcDataWithoutAnswer` can put it
 * back. A second edit keeps the first `previous`: it is still her answer.
 */
export function dcDataWithAnswer(data: unknown, itemId: string, value: string, by: DcAnswerEditBy): DcData | null {
  const base = asRecord(data);
  const inputKey = dcAnswerKey(itemId);
  if (!base || !inputKey || !dcAcceptsValue(itemId, value)) return null;
  const inputs = asRecord(base.inputs) ?? {};
  const current = typeof inputs[inputKey] === "string" ? (inputs[inputKey] as string) : null;
  const edits = dcAnswerEdits(base);
  const earlier = edits[inputKey];
  const previous = earlier && earlier.value === current ? earlier.previous : current;
  const edit: DcAnswerEdit = { previous, value, actor: by.actor, at: by.at.toISOString() };
  return { ...base, inputs: { ...inputs, [inputKey]: value }, answerEdits: { ...edits, [inputKey]: edit } };
}

/**
 * The stored audit payload with a team edit taken back — or null when there is
 * no edit to take back.
 *
 * If the answer still holds the team's value, her `previous` answer returns
 * (or the field goes blank, if she had left it blank). If she has answered
 * again since, her new answer stays and only the edit record goes. Without
 * this, "Remove it" left the team's value in `inputs`, and the screens then
 * labelled it as hers.
 */
export function dcDataWithoutAnswer(data: unknown, itemId: string): DcData | null {
  const base = asRecord(data);
  const inputKey = dcAnswerKey(itemId);
  if (!base || !inputKey) return null;
  const { [inputKey]: edit, ...otherEdits } = dcAnswerEdits(base);
  if (!edit) return null;
  const inputs = { ...(asRecord(base.inputs) ?? {}) };
  if (inputs[inputKey] === edit.value) {
    if (edit.previous === null) delete inputs[inputKey];
    else inputs[inputKey] = edit.previous;
  }
  return { ...base, inputs, answerEdits: otherEdits };
}

/** Who reopened an item, when, and why — the input of `dcDataReopened`. */
export interface DcReopenBy {
  actor: string;
  byName: string;
  reason: string;
  at: Date;
}

/**
 * The stored audit payload with the scan row of one item moved to
 * `needs_review` — or null when there is nothing to move: the form was never
 * submitted, the item was never scanned, or the row is not member-verified.
 *
 * DC-07, decision D-10 (B). A member-verified row (pass, N/A, refused) makes
 * the member's Roadmap say "Verified" whatever the completion says
 * (`dcFindingPill`). So a reopen moves that row, and records why on it. The
 * earlier status and evidence stay on the row (`reopened`), so the change can
 * be read back and reversed. Her answers (`inputs`) are NEVER changed here.
 */
export function dcDataReopened(data: unknown, itemId: string, by: DcReopenBy): DcData | null {
  const base = asRecord(data);
  const itemKey = DC_ITEMS.find((i) => i.id === itemId)?.key;
  if (!base || !itemKey || !Array.isArray(base.preCheck)) return null;
  const preCheck = base.preCheck as DcPreCheckResult[];
  const idx = preCheck.findIndex((r) => r.itemKey === itemKey);
  if (idx < 0 || !dcMemberVerified(preCheck[idx].status)) return null;
  const row = preCheck[idx];
  const next = [...preCheck];
  next[idx] = {
    ...row,
    status: "needs_review",
    evidence: `Reopened by ${by.byName}: ${by.reason}`,
    reopened: { previousStatus: row.status, previousEvidence: row.evidence ?? null, actor: by.actor, at: by.at.toISOString() },
  };
  return { ...base, preCheck: next };
}

/**
 * A clickable href for a provided value, or null when it is not a link.
 * Schemeless-but-dotted values ("yourbiz.com/contact") get https:// prepended,
 * the same normalisation the scanner applies; phone numbers, DBA names and
 * N/A answers stay plain text.
 */
export function dcProvidedHref(value: string): string | null {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (!/\s/.test(v) && /^[^@]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`;
  return null;
}

/** A pre-check row carries the item KEY ("a2p"); completion rows carry the item
 *  ID ("dc_item_2026_5"). Both roadmap clients need to join the two, so the map
 *  lives here rather than being rebuilt at each call site. */
export function dcItemIdForKey(key: string): string | undefined {
  return DC_ITEMS.find((i) => i.key === key)?.id;
}

/**
 * Which pill a Preliminary-findings row should show: what the auto-scan found
 * at intake time, unless the gap has since been fixed.
 *
 * The scan is a FROZEN snapshot (MemberValidation.data.preCheck, written once
 * when the intake was submitted) — it can never change, so on its own it goes
 * on saying "Gap found" long after a mentor has fixed the thing. The card's own
 * subtitle promises "your Mentor's audit overrides anything here"; this is what
 * makes that true.
 *
 * Returns a StatusPill status. A closed gap reads simply "Fixed" here — this
 * card answers "is it still a gap?", and the DIY-vs-DFY distinction belongs to
 * the Fix Items grid, where it is the thing a mentor actually recorded.
 */
export function dcFindingPill(
  status: DcPreCheckStatus,
  fulfilledBy: "diy" | "dfy" | null,
): DcPreCheckStatus | "fixed" {
  // A pass needs no override — nothing was wrong to fix.
  if (status === "pass") return "pass";
  // N/A and REFUSE are the member's own answer, not gaps that got closed.
  // They auto-tick a completion row (they count as verified), and without
  // this carve-out that row would relabel her "Not Applicable" as "Fixed" —
  // a thing nobody fixed.
  if (status === "not_applicable" || status === "refused") return status;
  return fulfilledBy ? "fixed" : status;
}

// ─── Mentor review (the mentor drawer's audit view) ────────────────────
//
// Rule 5 (owner, 2026-09-02): a mentor may act on GAPS, never on what the
// member already verified. These helpers are the pure halves of that rule —
// the dc-audit route enforces them server-side, the drawer mirrors them.

/** Statuses the member herself established — untouchable by mentors. A pass
 *  is the scan confirming her answer; N/A and REFUSE are her own answers. */
export function dcMemberVerified(status: DcPreCheckStatus): boolean {
  return status === "pass" || status === "not_applicable" || status === "refused";
}

/**
 * Which audit-form fields a mentor may edit before re-verifying: only the
 * inputs governing an OPEN gap (fail / skipped / needs_review, not yet
 * closed by a completion). `businessLegalName` and `domain` (the DBA) ride
 * along when the domain-match item is open, because they feed dcDomainMatch
 * even though `website` is that item's governing input.
 *
 * A field whose every governed item is member-verified never appears here —
 * defence in depth on top of dcMentorReverifyMerge, which refuses to touch
 * verified rows regardless of what inputs the scan ran with.
 */
export function dcEditableInputKeys(
  preCheck: DcPreCheckResult[],
  fulfilledByItemId: Record<string, "diy" | "dfy">,
): Set<string> {
  const out = new Set<string>();
  for (const r of preCheck) {
    if (r.status !== "fail" && r.status !== "skipped" && r.status !== "needs_review") continue;
    const itemId = dcItemIdForKey(r.itemKey);
    if (itemId && fulfilledByItemId[itemId]) continue; // already closed
    const inputKey = DC_ITEM_INPUT_KEY[r.itemKey];
    if (inputKey) out.add(inputKey);
    if (r.itemKey === "domainMatch") {
      out.add("businessLegalName");
      out.add("domain");
    }
  }
  return out;
}

/**
 * Merge a mentor-triggered fresh scan into the stored snapshot.
 *
 * Deliberately NOT dc-rescan's monotonic merge: that one is a bulk sweep
 * that may only upgrade, while this is one mentor looking at one member on
 * purpose — open rows refresh freely (downgrades included), and no verified
 * row can regress because verified rows never enter the open branch.
 *
 * The one non-obvious rule: an open gap whose fresh scan now PASSES keeps
 * its stored non-pass row and lands in `toComplete` instead. Upgrading the
 * row would render "Verified", and the owner reserves that for the member's
 * own verification — a gap a mentor closed reads "Fixed", which is exactly
 * what dcFindingPill(stored_non_pass, fulfilledBy) yields once the caller
 * writes the completion. A fresh opt-out (a mentor typed N/A into an
 * editable field) IS taken, so the pill can say what was actually answered.
 */
export function dcMentorReverifyMerge(
  stored: DcPreCheckResult[],
  fresh: DcPreCheckResult[],
  fulfilledByItemId: Record<string, "diy" | "dfy">,
): { merged: DcPreCheckResult[]; toComplete: string[] } {
  const byKey = new Map(stored.map((r) => [r.itemKey, r] as const));
  const merged: DcPreCheckResult[] = [];
  const toComplete: string[] = [];
  for (const f of fresh) {
    const old = byKey.get(f.itemKey);
    const itemId = dcItemIdForKey(f.itemKey);
    if (!old) {
      merged.push(f); // legacy snapshot missing this key — the fresh row is all there is
      continue;
    }
    if (dcMemberVerified(old.status)) {
      merged.push(old);
      continue;
    }
    if (itemId && fulfilledByItemId[itemId]) {
      merged.push(old); // already closed — don't rewrite evidence under a Fixed pill
      continue;
    }
    if (f.status === "pass") {
      merged.push(old);
      if (itemId) toComplete.push(itemId);
    } else if (f.status === "not_applicable" || f.status === "refused") {
      merged.push(f);
      if (itemId) toComplete.push(itemId);
    } else {
      merged.push(f);
    }
  }
  return { merged, toComplete };
}

/**
 * May a mentor rule Confirmed / Gaps-found on this item? `null` means yes;
 * otherwise the HTTP status + message the route answers with. The 403 branch
 * IS rule 5 — everything else is a verdict aimed at the wrong kind of row.
 */
export function dcVerdictGuard(
  status: DcPreCheckStatus | undefined,
  fulfilledBy: "diy" | "dfy" | null,
): { httpStatus: 403 | 409; error: string } | null {
  if (!status) return { httpStatus: 409, error: "No scan result for this item yet" };
  if (dcMemberVerified(status)) {
    return { httpStatus: 403, error: "This item was verified by the member and can't be changed" };
  }
  if (fulfilledBy) return { httpStatus: 409, error: "This item is already closed" };
  if (status !== "needs_review") {
    return { httpStatus: 409, error: "Only needs-review items take a verdict — Re-verify handles the rest" };
  }
  return null;
}

/** Map a step id to which DC stage it represents (1..4) for routing in the UI. */
export function dcStageForStep(stepId: string): 1 | 2 | 3 | 4 | null {
  if (stepId === DC_SUB_STEPS.intake) return 1;
  if (stepId === DC_SUB_STEPS.call) return 2;
  if (stepId === DC_SUB_STEPS.fix) return 3;
  if (stepId === DC_SUB_STEPS.compliant) return 4;
  return null;
}

// ─── Pre-check ─────────────────────────────────────────────────────────

export type DcPreCheckStatus =
  | "pass"
  | "fail"
  | "needs_review"
  | "skipped"
  // The member's own answers, not scan outcomes: "this doesn't apply to my
  // business" and "I don't want this checked". Both count as verified — no
  // action needed, no gap — per owner ruling 2026-09-02.
  | "not_applicable"
  | "refused";

/**
 * Did the member answer a field with an opt-out instead of a value?
 *
 * Members are TOLD they can do this (DC_OPT_OUT_HINT renders on every form
 * surface), so the accepted spellings are generous: what a person plausibly
 * types when following that instruction, case-insensitively.
 */
export function dcOptOut(value: string | null | undefined): "not_applicable" | "refused" | null {
  const v = String(value ?? "").trim().toUpperCase().replace(/\.$/, "");
  if (!v) return null;
  if (["N/A", "NA", "N.A", "N.A.", "NOT APPLICABLE"].includes(v)) return "not_applicable";
  if (["REFUSE", "REFUSED"].includes(v)) return "refused";
  return null;
}

/**
 * The domain check's verdict, pure and exported for tests: does the website's
 * domain resemble the LEGAL NAME or the DBA (≥ 60 Levenshtein similarity)?
 * The item title has always promised "legal name or DBA"; comparing against
 * whichever scores higher is what makes that promise true for a business
 * trading under a name unlike its registered one.
 */
export function dcDomainMatch(
  legalName: string,
  dba: string | null,
  websiteHost: string,
): { sim: number; against: string } {
  const bare = websiteHost.replace(/\.[a-z]+$/i, "");
  const legalSim = similarity(legalName, bare);
  const dbaSim = dba ? similarity(dba, bare) : -1;
  return dbaSim > legalSim ? { sim: dbaSim, against: dba! } : { sim: legalSim, against: legalName };
}

/** The GHL status-field vocabulary, pure for tests. Owner semantics
 *  (2026-09-02): "Successful" = the audit form was submitted; "Completed" =
 *  totally digitally compliant — every item verified, fixed, refused or N/A.
 *  Written by syncDcStatusField (digitalComplianceWrite.ts). */
export function dcStatusValue(allDone: boolean): "Completed" | "Successful" {
  return allDone ? "Completed" : "Successful";
}

export interface DcPreCheckResult {
  itemKey: typeof DC_ITEMS[number]["key"];
  itemTitle: string;
  status: DcPreCheckStatus;
  evidence?: string;
  /** Set when the team reopened a member-verified row (`dcDataReopened`). */
  reopened?: DcScanReopen;
}

/** What a reopen changed on a scan row: the earlier status and evidence, who, and when. */
export interface DcScanReopen {
  previousStatus: DcPreCheckStatus;
  previousEvidence: string | null;
  actor: string;
  at: string;
}

export interface DcIntakeInputs {
  businessLegalName: string;
  email: string;
  website?: string | null;
  domain?: string | null;
  phone?: string | null;
  a2pBrandId?: string | null;
  contactUsUrl?: string | null;
  landingUrl?: string | null;
  privacyUrl?: string | null;
  letterheadUrl?: string | null;
  linkedinPersonalUrl?: string | null;
  linkedinCompanyUrl?: string | null;
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "aol.com", "live.com", "msn.com", "protonmail.com", "proton.me",
]);

async function safeFetch(url: string, init?: RequestInit): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GovPreneursPreCheck/1.0)",
        ...(init?.headers ?? {}),
      },
    });
    clearTimeout(t);
    const body = init?.method === "HEAD" ? undefined : await r.text().catch(() => undefined);
    return { ok: r.ok, status: r.status, body };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Strip scripts/styles/tags from HTML → visible page text. Used by the
 *  websiteCage check to find footer content on builder sites (Duda, Wix…)
 *  that render footers without a <footer> tag and append huge script
 *  blobs after the visible markup. */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Is this HTML a JavaScript shell — a page whose content only exists after a
 * browser runs its scripts?
 *
 * fiberclarity.com is the case that found this: a Vite build whose every
 * route returns the same 8KB scaffold with zero visible text and an empty
 * <title>, while the rendered footer plainly shows the CAGE code. Scanning
 * the raw HTML of such a site and declaring "Gap found" is asserting a gap
 * we never looked at.
 */
export function looksClientRendered(html: string): boolean {
  return visibleText(html).length < 80;
}

/**
 * The page's own same-origin script URLs, resolved and capped — where a
 * client-rendered site's content actually lives. Same-origin only: a CDN
 * framework bundle cannot contain her CAGE code, and fetching third-party
 * scripts spends our 4s budgets on other people's code.
 */
export function scriptSrcsFrom(html: string, pageUrl: string, cap = 3): string[] {
  const out: string[] = [];
  let base: URL;
  try { base = new URL(pageUrl); } catch { return out; }
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < cap) {
    try {
      const u = new URL(m[1], base);
      if (u.origin === base.origin && !out.includes(u.href)) out.push(u.href);
    } catch { /* not a resolvable src — skip */ }
  }
  return out;
}

function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function hostnameOf(raw: string | null | undefined): string | null {
  const u = normaliseUrl(raw);
  if (!u) return null;
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; }
}

/** Levenshtein-based similarity 0..100. */
function similarity(a: string, b: string): number {
  const x = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const y = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!x.length || !y.length) return 0;
  const m = x.length, n = y.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = x[i - 1] === y[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.round(((Math.max(m, n) - dp[m][n]) / Math.max(m, n)) * 100);
}

/**
 * Run a preliminary scan against the inputs the customer provided. Always
 * returns 9 results (one per item) — empty inputs degrade to `skipped`.
 *
 * Framed as a system PRE-check, NOT the mentor's formal audit. The mentor still
 * personally produces the audit report per the spec's "no AI / no VAs"
 * rule. Run in parallel; total budget ~6s.
 */
export async function dcPreCheck(inputs: DcIntakeInputs): Promise<DcPreCheckResult[]> {
  // A member may answer N/A or REFUSE instead of a value. The item then
  // reports that answer directly and nothing is fetched — "https://N/A" is
  // not a URL worth four seconds of anyone's time.
  const opt = {
    website: dcOptOut(inputs.website),
    phone: dcOptOut(inputs.phone),
    a2p: dcOptOut(inputs.a2pBrandId),
    contact: dcOptOut(inputs.contactUsUrl),
    landing: dcOptOut(inputs.landingUrl),
    privacy: dcOptOut(inputs.privacyUrl),
    letterhead: dcOptOut(inputs.letterheadUrl),
  };
  const websiteUrl = opt.website ? null : normaliseUrl(inputs.website);
  const websiteHost = opt.website ? null : hostnameOf(inputs.website);
  const contactUrl = opt.contact ? null : normaliseUrl(inputs.contactUsUrl);
  const landingUrl = opt.landing ? null : normaliseUrl(inputs.landingUrl);
  const privacyUrl = opt.privacy ? null : normaliseUrl(inputs.privacyUrl);
  const letterheadUrl = opt.letterhead ? null : normaliseUrl(inputs.letterheadUrl);

  // Kick off HTTP fetches in parallel.
  const [websiteRes, contactRes, landingRes, privacyRes, letterheadRes] = await Promise.all([
    websiteUrl ? safeFetch(websiteUrl) : Promise.resolve(null),
    contactUrl ? safeFetch(contactUrl) : Promise.resolve(null),
    landingUrl ? safeFetch(landingUrl) : Promise.resolve(null),
    privacyUrl ? safeFetch(privacyUrl) : Promise.resolve(null),
    letterheadUrl ? safeFetch(letterheadUrl, { method: "HEAD" }) : Promise.resolve(null),
  ]);

  const out: DcPreCheckResult[] = [];

  // For client-rendered pages: their content lives in their JS bundles, so
  // fetch those (once each — several pages usually share one bundle) and scan
  // the script text where the HTML had nothing to say.
  const scriptTextCache = new Map<string, Promise<string>>();
  const bundleTextFor = async (pageUrl: string, html: string): Promise<string> => {
    const parts = await Promise.all(
      scriptSrcsFrom(html, pageUrl).map((src) => {
        let p = scriptTextCache.get(src);
        if (!p) {
          p = safeFetch(src).then((r) => (r.ok && r.body ? r.body.slice(0, 800_000) : ""));
          scriptTextCache.set(src, p);
        }
        return p;
      }),
    );
    return parts.join("\n");
  };

  // 1. Website + CAGE footer
  if (opt.website) {
    out.push({ itemKey: "websiteCage", itemTitle: DC_ITEMS[0].title, status: opt.website });
  } else if (!websiteUrl) {
    out.push({ itemKey: "websiteCage", itemTitle: DC_ITEMS[0].title, status: "skipped" });
  } else if (!websiteRes || !websiteRes.ok || !websiteRes.body) {
    out.push({ itemKey: "websiteCage", itemTitle: DC_ITEMS[0].title, status: "needs_review", evidence: websiteRes?.error ?? `HTTP ${websiteRes?.status ?? "?"}` });
  } else if (looksClientRendered(websiteRes.body)) {
    // A JS shell: the footer a browser shows is not in this HTML at all.
    // Scan the site's own bundles for the CAGE token; if even they say
    // nothing, the honest verdict is needs_review — we cannot claim a gap
    // on a page we never saw rendered.
    const hasCage = /\bCAGE\b/i.test(await bundleTextFor(websiteUrl, websiteRes.body));
    out.push({
      itemKey: "websiteCage",
      itemTitle: DC_ITEMS[0].title,
      status: hasCage ? "pass" : "needs_review",
      evidence: hasCage
        ? "CAGE found in site scripts (site renders in the browser)"
        : "Site renders in the browser — Mentor to check by eye",
    });
  } else {
    // First pass: a semantic <footer> element. Fallback: the tail of the
    // page's VISIBLE text — builder sites (Duda, Wix…) often have no
    // <footer> tag and append ~20k chars of scripts after the content, so
    // a raw-HTML tail scan misses a footer a browser plainly shows.
    const footerMatch = websiteRes.body.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const inFooterTag = footerMatch ? /\bCAGE\b/i.test(footerMatch[1]) : false;
    const hasCage = inFooterTag || /\bCAGE\b/i.test(visibleText(websiteRes.body).slice(-4000));
    out.push({
      itemKey: "websiteCage",
      itemTitle: DC_ITEMS[0].title,
      status: hasCage ? "pass" : "fail",
      evidence: hasCage
        ? (inFooterTag ? "CAGE token found in footer" : "CAGE token found in page-footer text")
        : "No CAGE token in footer",
    });
  }

  // 2. Domain ↔ legal name OR DBA, similarity ≥ 60.
  //
  // The compared domain comes ONLY from the website host now. The `domain`
  // field is her DBA / trade name (owner ruling 2026-09-02 — the old
  // "Domain / DBA name" label confused everyone, and a DBA typed there used
  // to silently REPLACE the domain in this comparison, turning the check
  // into DBA-vs-legal-name and never looking at her actual domain at all.
  const dbaOpt = dcOptOut(inputs.domain); // N/A here just means "no DBA"
  const dba = dbaOpt ? null : inputs.domain?.trim() || null;
  if (opt.website) {
    out.push({ itemKey: "domainMatch", itemTitle: DC_ITEMS[1].title, status: opt.website });
  } else if (!websiteHost || !inputs.businessLegalName) {
    out.push({ itemKey: "domainMatch", itemTitle: DC_ITEMS[1].title, status: "skipped" });
  } else {
    const { sim, against } = dcDomainMatch(inputs.businessLegalName, dba, websiteHost);
    out.push({
      itemKey: "domainMatch",
      itemTitle: DC_ITEMS[1].title,
      status: sim >= 60 ? "pass" : "fail",
      evidence: `Similarity ${sim}% (${against} vs ${websiteHost})`,
    });
  }

  // 3. Professional email — domain match or non-free
  if (!inputs.email) {
    out.push({ itemKey: "professionalEmail", itemTitle: DC_ITEMS[2].title, status: "skipped" });
  } else {
    const emailDomain = inputs.email.split("@")[1]?.toLowerCase();
    if (!emailDomain) {
      out.push({ itemKey: "professionalEmail", itemTitle: DC_ITEMS[2].title, status: "fail", evidence: "Email has no domain part" });
    } else if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
      out.push({ itemKey: "professionalEmail", itemTitle: DC_ITEMS[2].title, status: "fail", evidence: `Free email provider (${emailDomain})` });
    } else if (websiteHost && emailDomain === websiteHost) {
      out.push({ itemKey: "professionalEmail", itemTitle: DC_ITEMS[2].title, status: "pass", evidence: `Matches website domain (${emailDomain})` });
    } else {
      out.push({ itemKey: "professionalEmail", itemTitle: DC_ITEMS[2].title, status: "needs_review", evidence: `Domain: ${emailDomain}` });
    }
  }

  // 4. Phone — E.164-ish
  if (opt.phone) {
    out.push({ itemKey: "businessPhone", itemTitle: DC_ITEMS[3].title, status: opt.phone });
  } else if (!inputs.phone) {
    out.push({ itemKey: "businessPhone", itemTitle: DC_ITEMS[3].title, status: "skipped" });
  } else {
    const digits = inputs.phone.replace(/[^\d+]/g, "");
    const ok = /^\+?[1-9]\d{6,14}$/.test(digits);
    out.push({
      itemKey: "businessPhone",
      itemTitle: DC_ITEMS[3].title,
      status: ok ? "pass" : "fail",
      evidence: ok ? `Looks valid (${digits})` : `Doesn't match E.164 (${digits})`,
    });
  }

  // 5. A2P — brand id shape
  if (opt.a2p) {
    out.push({ itemKey: "a2p", itemTitle: DC_ITEMS[4].title, status: opt.a2p });
  } else if (!inputs.a2pBrandId) {
    out.push({ itemKey: "a2p", itemTitle: DC_ITEMS[4].title, status: "skipped" });
  } else {
    const ok = /^BN[A-Za-z0-9]{16,}$/.test(inputs.a2pBrandId.trim());
    out.push({
      itemKey: "a2p",
      itemTitle: DC_ITEMS[4].title,
      status: ok ? "pass" : "needs_review",
      evidence: ok ? "Brand id shape OK" : "Brand id shape unusual — Mentor to review",
    });
  }

  // 6. Contact-us with consent
  if (opt.contact) {
    out.push({ itemKey: "contactConsent", itemTitle: DC_ITEMS[5].title, status: opt.contact });
  } else if (!contactUrl) {
    out.push({ itemKey: "contactConsent", itemTitle: DC_ITEMS[5].title, status: "skipped" });
  } else if (!contactRes || !contactRes.ok || !contactRes.body) {
    out.push({ itemKey: "contactConsent", itemTitle: DC_ITEMS[5].title, status: "needs_review", evidence: contactRes?.error ?? `HTTP ${contactRes?.status ?? "?"}` });
  } else if (looksClientRendered(contactRes.body)) {
    // JSX compiles a <form> element to the string "form" in the bundle, so
    // both signals are still findable there.
    const bundle = await bundleTextFor(contactUrl!, contactRes.body);
    const hasForm = /\bform\b/i.test(bundle);
    const hasConsent = /\b(consent|agree|opt[- ]?in|terms)\b/i.test(bundle);
    out.push({
      itemKey: "contactConsent",
      itemTitle: DC_ITEMS[5].title,
      status: hasForm && hasConsent ? "pass" : "needs_review",
      evidence: `scanned site scripts (renders in browser) — form: ${hasForm}, consent: ${hasConsent}`,
    });
  } else {
    const hasForm = /<form/i.test(contactRes.body);
    const hasConsent = /\b(consent|agree|opt[- ]?in|terms)\b/i.test(contactRes.body);
    out.push({
      itemKey: "contactConsent",
      itemTitle: DC_ITEMS[5].title,
      status: hasForm && hasConsent ? "pass" : "needs_review",
      evidence: `form: ${hasForm}, consent: ${hasConsent}`,
    });
  }

  // 7. Gov landing + CAPS
  if (opt.landing) {
    out.push({ itemKey: "govLandingCaps", itemTitle: DC_ITEMS[6].title, status: opt.landing });
  } else if (!landingUrl) {
    out.push({ itemKey: "govLandingCaps", itemTitle: DC_ITEMS[6].title, status: "skipped" });
  } else if (!landingRes || !landingRes.ok || !landingRes.body) {
    out.push({ itemKey: "govLandingCaps", itemTitle: DC_ITEMS[6].title, status: "needs_review", evidence: landingRes?.error ?? `HTTP ${landingRes?.status ?? "?"}` });
  } else if (looksClientRendered(landingRes.body)) {
    const hasCaps = /\b(CAPS|Capability\s+Statement)\b/i.test(await bundleTextFor(landingUrl!, landingRes.body));
    out.push({
      itemKey: "govLandingCaps",
      itemTitle: DC_ITEMS[6].title,
      status: hasCaps ? "pass" : "needs_review",
      evidence: hasCaps
        ? "CAPS found in site scripts (site renders in the browser)"
        : "Site renders in the browser — Mentor to check by eye",
    });
  } else {
    const hasCaps = /\b(CAPS|Capability\s+Statement)\b/i.test(landingRes.body);
    out.push({
      itemKey: "govLandingCaps",
      itemTitle: DC_ITEMS[6].title,
      status: hasCaps ? "pass" : "fail",
      evidence: hasCaps ? "CAPS / Capability Statement mention found" : "Page reachable but no CAPS keyword",
    });
  }

  // 8. Letterhead — any document URL that answers a HEAD with 200
  if (opt.letterhead) {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: opt.letterhead });
  } else if (!letterheadUrl) {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: "skipped" });
  } else if (!letterheadRes) {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: "skipped" });
  } else if (letterheadRes.ok) {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: "pass", evidence: `HTTP ${letterheadRes.status}` });
  } else if (letterheadRes.status === 404) {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: "fail", evidence: "404 Not Found" });
  } else {
    out.push({ itemKey: "letterhead", itemTitle: DC_ITEMS[7].title, status: "needs_review", evidence: letterheadRes.error ?? `HTTP ${letterheadRes.status ?? "?"}` });
  }

  // 9. Privacy policy
  if (opt.privacy) {
    out.push({ itemKey: "privacyPolicy", itemTitle: DC_ITEMS[8].title, status: opt.privacy });
  } else if (!privacyUrl) {
    out.push({ itemKey: "privacyPolicy", itemTitle: DC_ITEMS[8].title, status: "skipped" });
  } else if (!privacyRes || !privacyRes.ok || !privacyRes.body) {
    out.push({ itemKey: "privacyPolicy", itemTitle: DC_ITEMS[8].title, status: "needs_review", evidence: privacyRes?.error ?? `HTTP ${privacyRes?.status ?? "?"}` });
  } else if (looksClientRendered(privacyRes.body)) {
    const looksLikePrivacy = /\bprivacy\b/i.test(await bundleTextFor(privacyUrl!, privacyRes.body));
    out.push({
      itemKey: "privacyPolicy",
      itemTitle: DC_ITEMS[8].title,
      status: looksLikePrivacy ? "pass" : "needs_review",
      evidence: looksLikePrivacy
        ? "Privacy content found in site scripts (site renders in the browser)"
        : "Site renders in the browser — Mentor to check by eye",
    });
  } else {
    const looksLikePrivacy = /\bprivacy\b/i.test(privacyRes.body);
    out.push({
      itemKey: "privacyPolicy",
      itemTitle: DC_ITEMS[8].title,
      status: looksLikePrivacy ? "pass" : "fail",
      evidence: looksLikePrivacy ? "Privacy keyword found in body" : "Page reachable but no privacy keyword",
    });
  }

  return out;
}

/** Fix task id → the compliance item it fixes (the inverse of DC_FIX_TASK_BY_ITEM). */
export const DC_ITEM_BY_FIX_TASK: Record<string, string> = Object.fromEntries(
  Object.entries(DC_FIX_TASK_BY_ITEM).map(([itemId, taskId]) => [taskId, itemId]),
);
