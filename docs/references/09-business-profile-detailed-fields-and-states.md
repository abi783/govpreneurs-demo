# Detailed PRD — Business Profile: Fields, Validation, States & Communication

**Product:** GovPreneurs
**Surface:** `/business-profile` + cross-surface field-level behaviour (Roadmap verification panels, Hunter embed, opportunity gates)
**Owner:** Karthik (CPO)
**Driver PM:** Siddharth (AI PM)
**Status:** v1 — detailed field, validation, and state-by-state communication spec
**Date:** May 2026
**Companion docs:**
- `08-design-business-profile-and-prerequisite-gating.md` — high-level Profile architecture (predecessor to this doc)
- `agent_context_step3_to_step4.md` — Business Profile Graph schema
- `PRD_ROADMAP_JOURNEY.md` — existing Roadmap verification flows (the validator and result-card patterns this doc extends)
- `06-prd-v4-final.md` — Hunter UX
- `07-prd-data-and-ai-architecture.md` — Hunter data + AI architecture

---

## 0. What this doc is and what changed

The high-level design doc (08) established that Business Profile lives as a dedicated page + Hunter embed + just-in-time opportunity gates. It answered *where* things live. This doc answers *what each field is, what data type it has, how we validate it, and what the Member sees in every possible state.*

This is a **field-level operational spec.** It is to the Business Profile what `PRD_ROADMAP_JOURNEY.md` is to the Roadmap — the document a PM, designer, or engineer can pick up and know exactly what to build for each field.

Three things changed from doc 08:

1. **A new GovCon-domain research section (Part 1).** What competitors capture, what they miss, what we should capture that they don't.
2. **A universal field state model (Part 3).** Every field follows the same 9-state pattern. This is the visual and behavioural contract underlying the entire Profile page.
3. **A complete field inventory across all 9 sections (Part 5).** Every field, with type, validator, severity, source, communication template, and edit pathway.

A handful of fields and one whole new tab (**Bid Readiness**) are added that the existing onboarding doesn't capture. Part 4 explains the rationale.

---

## Part 1 — GovCon competitive research: what platforms capture and what we should differ on

I looked at how seven GovCon platforms — Sweetspot, FedScout, HigherGov, GovTribe, Deltek GovWin, EZGovOpps, Procura/CLEATUS/GovSignals — handle vendor profile data. Three patterns emerged.

### 1.1 What they all capture (the common floor)

Every platform captures these 12 baseline fields. We have all of them via Hank's onboarding plus SAM.gov sync:

- Legal entity name + entity type
- UEI + CAGE
- EIN (varies — some require, some don't)
- Primary NAICS + secondary NAICS
- Set-aside flags (8(a), HUBZone, SDVOSB, WOSB, etc.)
- Small business size (per NAICS)
- Geographic location (HQ + states served)
- Capability statement (upload only, varies in extraction depth)
- Past performance summary (count, average value)
- Website URL
- Point of contact (name + email)
- POC phone number

This is the *minimum credible profile.* Below this floor and you can't be taken seriously by any tool in the space.

### 1.2 What only the best capture (the differentiator floor)

Five platforms — Sweetspot, FedScout, GovWin, GovTribe, EZGovOpps — capture these in addition. We have most via SAM/cap statement extraction but several are gaps:

| Field | Captured by | We have it? |
|---|---|---|
| Past performance — full structured records (project, customer, value, period, role, references) | All five | Partially — we extract from cap statement but don't have a structured editing surface |
| GSA Schedules / GWACs / BPAs held | Sweetspot, GovWin, GovTribe | No |
| Contract vehicle history (FFP / T&M / IDIQ / Cooperative agreement) | GovWin, GovTribe | No |
| Annual revenue (banded) | FedScout, GovWin | No |
| Employee headcount (W-2 + 1099) | GovWin, FedScout | No |
| Years in federal contracting | All five | Partially (inferable from past performance dates) |
| Cleared personnel count by clearance level | GovWin, FedScout | No |
| Bonding capacity | FedScout | No |
| Insurance coverages (GL, E&O, WC, cyber) | GovWin | No |
| State / local certifications (DBE, MBE, WBE, MWBE) | All five | No |
| Industry certifications (CMMC, ISO 9001/27001, SOC 2) | Sweetspot, GovWin | Partially (CMMC sometimes appears in SAM business types) |
| DCAA-compliant accounting system | GovWin | No |

**Why it matters:** these fields are what separate "we ranked 800 firms by NAICS" from "we ranked the 12 firms that can actually deliver this contract." Hunter's matching engine ceilings out without them. Grant's bid memo is shallow without them.

### 1.3 What none of them capture well — the gap we own

Four areas are weakly covered across the entire competitive set, and represent our biggest UX edge:

#### 1.3.1 Positioning / intent data

Every platform asks for a NAICS list. None asks *"what kind of work do you actually want to win?"* in a structured way.

- Target agencies (and agencies to avoid)
- Target contract value range
- Set-aside hunger (set-asides only / both / full-and-open only)
- Win themes in the Member's own words
- Notification cadence preference

Platforms treat the Member's stated NAICS as a proxy for intent. It's a bad proxy — a Member registered under 12 NAICS may only actively want to bid on three. We capture intent explicitly, separately from registration.

#### 1.3.2 Bid-side risk and capacity

Every platform asks for capability. None captures the firm's actual ability to *deliver* if it won:

- Concurrent contract capacity ("can you take on two contracts at once or just one?")
- Cash flow tolerance ("can you wait 90 days for payment?")
- Bonding capacity ("can you post a $250K performance bond?")
- Insurance coverages
- Risk appetite (prime / sub / teaming-only)

This is Grant's domain. No competitor has a Grant-equivalent agent, so no competitor has the data model to support one.

#### 1.3.3 Provenance and confidence transparency

Every platform stores fields. None tells the Member where each field came from or how confident the platform is.

- *"This came from your SAM.gov record"* vs. *"You told us in onboarding"* vs. *"Hunter inferred this from your behaviour"*
- *"Verified"* vs. *"Confirm this"* vs. *"Editable but unverified"*

Without this, Members can't tell what to trust, what to update, or what to push back on. We make provenance + confidence first-class everywhere.

#### 1.3.4 DFY pairing on every gap

Every gap is also a revenue opportunity for us. None of the competitors operates this model. Our UX threads DFY *into the field-level interaction*, not as a separate sales surface — every missing field that has a DFY service shows both *Add manually* and *Have us do it* in the same row.

### 1.4 What we'll capture that they don't

Putting 1.2 and 1.3 together, here are the fields we should add to the existing onboarding's coverage. New fields are flagged as **NEW** in Part 5's master tables.

| Domain | Fields to add |
|---|---|
| Capabilities depth | PSC codes, clearance levels, keywords/skills tags |
| Certifications (industry) | CMMC level, ISO 9001/27001, SOC 2, AS9100 |
| Certifications (state/local) | DBE, MBE, WBE, MWBE, state-issued small business certs |
| Workforce | Total employees (W-2), subcontractor pool, cleared personnel by level, DCAA-compliant accounting |
| Financial | Annual revenue (banded), years in federal contracting, payment terms accepted |
| Vehicles | GSA Schedules + SINs, GWACs, BPAs, IDIQ contracts held |
| Bid readiness | Concurrent contract capacity, cash flow tolerance, bonding capability, insurance coverages, risk appetite |
| Past performance (structured) | Full structured per-project records (replacing today's flat extraction) |
| Positioning | Target agencies, value range, geographic preference, set-aside hunger, notification cadence, agencies to avoid, win themes |
| Compliance | Active SAM exclusions, FOCI mitigation status, recent GAO protests (if any) |
| Teaming | Active teaming agreements, partner pool, JV history, mentor-protégé relationships |

Not all of these land in v1. Part 9 sequences them.

---

## Part 2 — Design principles for data capture

Five principles that govern every interaction in the Profile page.

### 2.1 Outcome-framed, never field-framed

Every prompt explains *what completing this field unlocks for the Member.* Not *"Please enter your bonding capacity"* — *"Tell me your bonding capacity so I can stop showing you contracts that need bonds you can't post."*

This applies to:
- Field labels (when the field's purpose isn't obvious)
- Empty-state messages
- Tooltips ("Why does Hunter need this?")
- Error states
- Section footers

### 2.2 Confidence-calibrated language

Every value the platform speaks back to the Member uses tone matched to its confidence:

| Confidence | Voice example |
|---|---|
| `verified` | *"Your SAM.gov record shows you're an SDVOSB."* (state as fact) |
| `needs_review` | *"Your capability statement seems to list these 5 NAICS — confirm?"* (frame as found, request confirmation) |
| `attested` | *"You mentioned you're targeting USACE — is that still right?"* (frame as their statement, allow change) |
| `inferred` | *"Hunter's guess: you're focused on the Southeast — am I reading that right?"* (frame as guess, invite correction) |
| `stale` | *"Your SOS verification was 14 days ago — still active?"* (frame as confirmation, not re-elicitation) |

Mismatched tone destroys trust. Stating an inferred field as fact is worse than not stating it at all.

### 2.3 One question per turn (in conversational mode)

When eliciting via Hunter chat, **one question per turn.** Never stack two questions, never serve a form. This is the rule established in `agent_context_step3_to_step4.md` §8.1 and it carries here.

The Profile page is the form-style surface; chat is the one-question surface. They co-exist, never blur.

### 2.4 Always offer a path forward

Every error state, every missing field, every conflict has at least one clear next action. Dead-end states are forbidden.

- Field can't be verified → "try a different document" or "tell us manually" or "have our team handle it"
- Two sources disagree → "which is correct?" with both values shown
- API down → "we'll retry shortly; you can attest manually for now"

This rule is borrowed directly from Stripe's compliance dashboard playbook: never silently fail.

### 2.5 Never blame the Member for missing data

Empty fields, failed verifications, expired documents — none of these are framed as the Member's failure. The framing is always *"here's what we don't have yet"* or *"here's what didn't go through"* — never *"you forgot to..."*

This matters for Marcus who often arrives feeling out of his depth. Tone discipline at the field level shapes whether he stays.

---

## Part 3 — The universal field state model

Every field on the Business Profile page is in exactly one of nine states. The visual treatment, messaging, and available actions per state are defined here once and reused everywhere. This is the visual contract underlying the entire page.

### 3.1 The nine states

| State | When it applies | Visual signal | Color |
|---|---|---|---|
| `verified` | API-confirmed or document-confirmed-and-attested | ● Solid green dot | Brand Green `#16a34a` |
| `needs_review` | Extracted from a document or API; awaiting Member confirmation | ● Solid amber dot | Amber `#f59e0b` |
| `attested` | Member typed it directly, no external validation | ○ Slate dot | Slate `#67768E` |
| `inferred` | Hunter or Grant guessed based on behaviour or context | ○ Slate dot, italic value | Slate `#67768E` |
| `stale` | Was verified, but cache has expired (SAM > 365d, SOS > 7d, capability statement > 365d) | ⏳ Clock icon, value dimmed | Slate `#67768E` |
| `missing` | No value, eligible for elicitation | — Empty state | Light grey background |
| `conflict` | Two sources disagree (e.g., Member-stated vs SAM record) | ⚠ Orange triangle | Brand Red-Orange `#ea580c` |
| `pending_dfy` | DFY service enrolled, delivery not yet complete | ⌛ Spinner, GovPreneurs blue | Electric Blue `#0039FF` |
| `error` | Validator failed (API down, malformed input, document unreadable) | ✕ Red dot | Brand Red `#D82221` |

Three things to note:
- `verified` and `needs_review_confirmed` are merged into the single `verified` state at the visual layer; the underlying graph still distinguishes them for provenance.
- `excluded` (Member chose to skip a sub-step with a reason) is not a field-level state — it's a sub-step-level state on the Roadmap. In Profile, the related fields render as `attested` (the Member's exclusion reason becomes the value).
- `pending_dfy` is new vs. the Roadmap PRD's state machine — it bridges the period when DFY is enrolled but delivery isn't done.

### 3.2 The universal row layout

Every field renders as a row with three regions:

```
┌───────────────────────────────┬─────────────┬─────────────────────────────┐
│  LABEL + helper microcopy     │  STATE DOT  │  VALUE OR ACTION + meta     │
└───────────────────────────────┴─────────────┴─────────────────────────────┘
```

| Region | What it holds |
|---|---|
| **Label** | The Member-facing field name (plain English, never internal camelCase). Helper microcopy below in smaller text — only when the field is non-obvious or has a critical purpose to explain. |
| **State dot** | The visual indicator from §3.1. Hover/tap reveals the state name. |
| **Value + meta** | The current value (or empty state UI), with provenance line and edit/action buttons below. |

### 3.3 What the Member sees in each state

Below is the **canonical message template + actions per state.** Fields override the wording slightly to fit their context, but the structure is universal.

#### 3.3.1 `verified` state

```
EIN                          ●     12-3456789
                                   ✓ Verified — IRS letter uploaded 2026-04-12
                                   [Edit]  [Re-upload document]
```

- **Value:** rendered in regular weight, never italic.
- **Provenance line:** *"Verified — \<source\> on \<date\>"*. Source examples: *SAM.gov*, *Secretary of State of Texas*, *Articles of Organization*, *DNS lookup*, *Member confirmed on \<date\>*.
- **Actions:** `Edit` (opens edit affordance), `Re-upload document` (when a source document exists), `Re-verify` (API-verified fields only — re-runs the validator).

#### 3.3.2 `needs_review` state

```
Core Capabilities             ●    Concrete construction · Bridge repair · Site
                                   preparation · Steel reinforcement
                                   ⚠ Found 4 capabilities in your statement —
                                     review and confirm?
                                   [Yes, this is right]  [Edit list]  [Try a
                                   different document]
```

- **Value:** rendered in regular weight, but visually slightly dimmer than `verified` (subtle opacity 0.85).
- **Banner above value:** *"Found in your \<source document or response\> — review and confirm?"*. Yellow background `#fef3c7`.
- **Actions:** `Yes, this is right` (primary green button — flips to `verified`); `Edit list` / `Edit value` (opens edit affordance, then on save flips to `verified`); `Try a different document` (re-opens upload flow); `Discard and tell us manually` (clears extracted, opens manual entry).

#### 3.3.3 `attested` state

```
Concurrent Contract Capacity   ○   Two contracts at a time
                                   You told Hunter on 2026-05-03
                                   [Edit]  [Tell Hunter again in chat →]
```

- **Value:** rendered in regular weight.
- **Provenance line:** *"You told \<agent\> on \<date\>"* or *"You typed this on \<date\>"*.
- **Actions:** `Edit` (opens inline edit); `Tell Hunter again in chat →` (routes to Hunter chat with this field as context — a lighter-friction edit path for verbal Members).

#### 3.3.4 `inferred` state

```
Comfortable Contract Range     ○   $250K – $1.8M  (italic)
                                   ◇ Hunter's guess based on your past 4 contracts
                                   [Yes, that's right]  [Set this myself]
```

- **Value:** rendered in *italic*. The italic is the visual signal that the platform is making a guess.
- **Provenance line:** *"Hunter's guess based on \<basis\>"*. Basis examples: *your past contracts*, *your dismissal patterns*, *similar firms in your cohort*.
- **Actions:** `Yes, that's right` (flips to `attested`); `Set this myself` (opens inline edit). The Member is never forced to engage with an inferred field — they can ignore it indefinitely without harm.

#### 3.3.5 `stale` state

```
SAM.gov Registration           ⏳   Active — UEI ABC123XYZ456
                                   Last checked 412 days ago — your registration
                                   may need renewal
                                   [Re-check now]  [Renew on SAM.gov →]
```

- **Value:** rendered in regular weight but dimmed (opacity 0.7).
- **Provenance line:** *"Last checked \<N\> days ago — \<consequence\>"*.
- **Actions:** `Re-check now` (re-runs validator); contextual deep-link (e.g., `Renew on SAM.gov →` for SAM, `Refresh SOS check →` for state filings).

#### 3.3.6 `missing` state

```
Bonding Capacity               —   Not provided yet
                                   Tells Grant which contracts you can post
                                   bonds for. Federal construction usually needs
                                   performance and payment bonds.
                                   [Add now]  [Have us figure it out — $97]
```

- **Value:** *"Not provided yet"* in slate.
- **"Why does this matter?"** microcopy: 1–2 sentences explaining what completing the field unlocks. Always present for `missing` state — this is the field's pitch.
- **Actions:** `Add now` (opens inline edit OR routes to relevant Roadmap sub-step's verification panel — depending on field type, see Part 5); `Have us figure it out — $X` (DFY upsell) — only shown when a DFY service exists for this field.

#### 3.3.7 `conflict` state

```
Legal Name                     ⚠   Two values found:
                                   ● From SAM.gov: "Williams Construction LLC"
                                   ● From Articles of Org: "Williams Construction
                                                              Co. LLC"
                                   Which is correct?
                                   [Use SAM version]  [Use Articles version]
                                   [Neither — let me type the correct one]
```

- **Value:** both values shown explicitly with their sources.
- **Banner:** *"Two values found — which is correct?"* in orange `#ffedd5`.
- **Actions:** `Use \<source A\>`, `Use \<source B\>` (for two-source conflicts); `Neither — let me type the correct one` (opens manual entry); for any choice, the rejected source is logged with a note for admin review (per agent_context §11).

#### 3.3.8 `pending_dfy` state

```
Capability Statement           ⌛   Our team is preparing this
                                   Delivery call booked May 15 with David K.
                                   Contract signed, draft in progress
                                   [View enrollment]  [Reach out to your specialist →]
```

- **Value:** *"Our team is preparing this"* in Electric Blue.
- **Provenance line:** the DFY lifecycle sub-status from the Roadmap PRD §13. (Possible: *"Awaiting your delivery call"*, *"Delivery call booked \<date\>"*, *"Contract pending your signature"*, *"Signed, draft in progress"*, *"Delivered — please review"*.)
- **Actions:** `View enrollment` (routes to Roadmap sub-step's lifecycle card); `Reach out to your specialist →` (where applicable, opens Freshdesk thread).

#### 3.3.9 `error` state

```
Custom Email Domain            ✕   We couldn't verify williamsco.com
                                   No MX records found — your domain may not have
                                   email set up yet, or DNS may be slow.
                                   [Try again]  [Use a different domain]
                                   [Have us set up email — $147]
```

- **Value:** dimmed value if one was provided; *"We couldn't verify"* otherwise.
- **Banner:** the actual error message in plain English, with a probable cause. Red `#fee2e2` background.
- **Actions:** `Try again` (re-runs validator); `Use a different value` (returns to entry form); contextual DFY upsell where applicable.

### 3.4 Provenance display rules

Every value shows a one-line provenance footer below it. Examples — *exhaustive* set of sources that can appear:

| Source string | Used for |
|---|---|
| *Verified — SAM.gov on \<date\>* | UEI, CAGE, SAM business types, primary NAICS |
| *Verified — Secretary of State of \<state\> on \<date\>* | SOS ID, sosStatus, formationDate (when from SOS) |
| *Verified — Articles of Organization (\<filename\>) uploaded \<date\>* | legalName, entityType, formationState, registeredAgent fields |
| *Verified — IRS letter (\<filename\>) uploaded \<date\>* | EIN |
| *Verified — DNS lookup on \<date\>* | emailMxRecords, emailSpfPresent |
| *Verified — DSBS profile load on \<date\>* | dsbsProfileUrl |
| *Found in your capability statement (\<filename\>) — confirm?* | coreCapabilities, differentiators, pastPerformance (initial extraction) |
| *Confirmed by you on \<date\>* | needs_review_confirmed promotions |
| *You told Hank during onboarding on \<date\>* | Hank-elicited fields |
| *You told Hunter on \<date\>* | Hunter-elicited fields |
| *You told Grant on \<date\>* | Grant-elicited fields |
| *You told Ava on \<date\>* | Ava-elicited fields |
| *You typed this on \<date\>* | Direct UI edits in Profile |
| *Hunter's guess based on \<basis\>* | Inferred fields |
| *Last synced from your GHL account \<N\> hours ago* | GHL-synced fields |
| *Delivered by our DFY team on \<date\>* | DFY-delivered fields |
| *Logged from your mentor session with \<mentor\> on \<date\>* | mentor session takeaways |

Hover/tap on the provenance line reveals the full timestamp and (where applicable) the underlying document or transcript link.

### 3.5 Why does this matter? — the universal tooltip

Every field on Profile has a small `?` icon next to its label. Tapping reveals a tooltip:

```
Why does this matter?

Hunter uses your concurrent contract capacity to filter out
opportunities you couldn't deliver if you won. Without it, I
might recommend two contracts that would conflict if you won
both — wasting your proposal effort.

Affects: Hunter's match quality on capacity dimension, Grant's
bid/no-bid memo
```

Three lines maximum. Plain English. The "Affects" line names the concrete downstream system the field powers — this is what tells the Member *which agent benefits* and *what improves.*

---

## Part 4 — Communication patterns library

A small set of templates that cover ~80% of the messaging on this surface. Use these instead of writing fresh copy each time.

### 4.1 Empty-state ("Add" prompt) template

```
[Field name]
[Why this matters in 1–2 sentences, outcome-framed]
[Add now] [Have us do it — $X (if applicable)]
```

Examples:
- *"Bonding Capacity. Tells Grant which contracts you can post bonds for. Federal construction usually needs $50K–$500K performance bonds."*
- *"Past Performance Entries. Each one strengthens Hunter's match score for similar opportunities — and Grant uses them in bid memos."*
- *"Target Agencies. Tell Hunter which buyers you're hunting and we'll prioritise their solicitations in your feed."*

### 4.2 Confirm-extraction template (Needs Review state)

```
[We found this in your <source>]
[Show extracted value(s)]
[Yes, this is right] [Edit] [Try different <source>]
```

Examples:
- *"We found 4 core capabilities in your capability statement: Concrete construction, Bridge repair, Site preparation, Steel reinforcement. Look right?"*
- *"We found a Texas SOS record for Williams Construction LLC, status Active. Confirm to verify."*
- *"We extracted these past performance entries from your statement. Check the details and confirm."*

### 4.3 Conflict-resolution template

```
Two values found:
- From <source A>: <value A>
- From <source B>: <value B>
Which is correct?
[Use <source A>] [Use <source B>] [Neither — let me type it]
```

### 4.4 Stale-data template

```
[Field name]
Last checked <N> days ago — <consequence>
[Re-check now] [Take action externally →]
```

Examples:
- *"SAM.gov Registration. Last checked 412 days ago — your registration may need renewal. SAM expires every 365 days. [Re-check now] [Renew on SAM.gov →]"*
- *"Secretary of State filing. Last checked 14 days ago — verifying status takes 30 seconds. [Re-check now]"*

### 4.5 Error template

```
[Field name]
[We couldn't verify <input>.]
[Plain-English probable cause.]
[Try again] [Use different input] [DFY option if applicable]
```

The probable-cause sentence is critical. Don't just say "Verification failed"; tell the Member *why we think it failed* in their own terms.

### 4.6 Microcopy tone rules

A few linting rules to apply to all copy on this surface:

- **Never use "must" or "required" without explaining what it gates.** *"Required for federal bidding"* is fine; *"Required field"* is not.
- **Never use "complete your profile" generically.** Always: *"complete \<this section\> to unlock \<that outcome\>"*.
- **Never use "please" in error states.** It's apologetic — wrong tone. *"Try uploading a clearer scan"* is correct; *"Please upload a clearer scan"* is not.
- **Never use exclamation marks.** Tone is calm professional, not enthusiastic.
- **Use the Member's vocabulary.** If they call SAM.gov "the SAM thing", we mirror that in chat (per agent_context §8.1). On the structured Profile page, we do use canonical names (SAM.gov, UEI, CAGE) — but pair with plain-English helper microcopy on first use.

---

## Part 5 — Field inventory by section

The remaining sections (Parts 5.1–5.9) detail every field in every Profile tab. Each section follows the same structure:

1. **What this section is for** (1–2 sentence framing)
2. **Master field table** — all fields, types, validators, severity, source priority
3. **Deep specs** for the most complex fields (state machine, validation rules, edit affordances, edge cases)
4. **New fields proposed** vs. existing onboarding (where applicable)
5. **Section footer messaging** (what completion unlocks)

Severity codes: **H** = hard gate (blocks bidding on relevant opps), **S** = soft gate (warning, doesn't block), **C** = capability gate (impacts match quality only).

---

### 5.1 IDENTITY tab

**What this section is for:** the Member's legal and registered identity. This is the foundation — most federal opportunities hard-gate on these fields.

#### 5.1.1 Master field table

| Field (display label) | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| Legal Name | `legalName` | String | H (federal) | SAM > Articles PDF > SOS > Member | SAM API + Articles extraction (LLM) |
| Entity Type | `entityType` | Enum (LLC/Corp/Sole Prop/Partnership/etc.) | S | Articles PDF > SOS > Member | Articles extraction |
| Formation State | `formationState` | Enum (US states + DC) | S | Articles PDF > SOS > Member | Articles extraction |
| Formation Date | `formationDate` | Date | S | Articles PDF > SOS > Member | Articles extraction |
| Registered Agent Name | `registeredAgentName` | String | C | Articles PDF | Articles extraction |
| Registered Agent Address | `registeredAgentAddress` | Address | C | Articles PDF | Articles extraction |
| Physical Address | `physicalAddress` | Address | S | SAM > Member | SAM API |
| Mailing Address | `mailingAddress` | Address | C | SAM > Member | SAM API |
| EIN | `EIN` | String (9 digits, format `XX-XXXXXXX`) | H (federal) | EIN letter PDF > Member | EIN letter extraction (NEW) |
| UEI | `UEI` | String (12 alphanumeric) | H (federal) | SAM | SAM API |
| CAGE | `CAGE` | String (5 alphanumeric) | H (federal) | SAM | SAM API |
| SAM Status | `samRegistrationStatus` | Enum (Active/Expired/Inactive/Submitted) | H (federal) | SAM | SAM API |
| SAM Expiration | `samExpiresAt` | Date | H (federal — when expired) | SAM | SAM API |
| SOS Status | `sosStatus` | Enum (Active/Inactive/Dissolved/Forfeited) | S | Cobalt SOS | SOS API |
| SOS ID | `sosId` | String | C | Cobalt SOS | SOS API |
| Years in Business | `yearsInBusiness` | Number (computed from formationDate, refreshed daily) | C | Computed | (computed) |
| Business Phone | `businessPhoneNumber` | String (E.164) | C | Member | Format check (NEW) |
| LinkedIn Profile | `linkedInProfile` | URL | C | Member | URL check (NEW) |

#### 5.1.2 Deep spec — `EIN` (NEW field, NEW validator)

EIN is required for most federal contracting work. The existing onboarding doesn't capture it as a structured verifiable field. We add it as:

**Display label:** *Employer Identification Number (EIN)*

**Helper microcopy:** *Your federal tax ID. The IRS issued this when your business was formed. It's on your CP-575 letter.*

**Data type:** String matching `^\d{2}-\d{7}$` (display format `XX-XXXXXXX`)

**Severity:** Hard — required for most federal contracting workflows beyond pure pre-solicitation

**Source priority:** EIN/CP-575 letter PDF (verified extraction) > Member-typed (attested)

**Validator: `ein_letter`**

| Trigger | Status | Card | Member-facing message |
|---|---|---|---|
| No PDF uploaded yet | `needs_input` | Form re-shown | *"Upload your CP-575 letter (or any IRS letter showing your EIN) to verify, or type the number below."* |
| PDF unreadable | `error` | Failed/Error | *"We couldn't read this PDF. Try a clearer scan, or type the EIN below instead."* |
| AI service error | `error` | Failed/Error | *"Our extraction service hit an error. Try again, or type the EIN below."* |
| AI says document is not an IRS letter | `fail` | Failed/Error | *"This doesn't look like an IRS letter. Upload your CP-575 or another official IRS document, or type the EIN below."* |
| AI extracts EIN but format is invalid | `fail` | Failed/Error | *"We found something that looks like an EIN but the format is unexpected: \<extracted\>. Type the correct EIN below if this isn't right."* |
| AI extracts EIN, format valid | `needs_input` (`requiresConfirmation: true`) | Needs Review | *"Found EIN \<formatted\> in your document. Confirm to verify."* |
| Member typed EIN, format invalid | `fail` | Inline | *"That doesn't look like a valid EIN. Format should be XX-XXXXXXX."* |
| Member typed EIN, format valid, no document | `attested` | Inline confirm | *"Saved. Upload your CP-575 letter when you have it to bump this to verified."* |

**Edge cases:**
- EIN with all zeros (`00-0000000`) → reject as fail; placeholder pattern.
- Member uploads a 1099 instead of CP-575 → AI extracts EIN if visible; flag origin in provenance as *"From your 1099 — confirm this is your EIN."*
- Conflict between extracted EIN and Member-typed EIN → `conflict` state with both values shown.

#### 5.1.3 Deep spec — `UEI` and `CAGE`

These come from SAM and are read-only on Profile. The Roadmap PRD §9.4.1 covers the validator. On Profile:

**`verified` state messaging:** *"Your SAM.gov record shows UEI \<value\>. Verified \<date\>."*
**`stale` state messaging:** *"Last checked \<N\> days ago. SAM registration is good for 365 days; renew before it expires."*
**`missing` state messaging:** *"Not yet — you'll get a UEI when you complete SAM.gov registration. Federal opportunities require this. [Open Roadmap → SAM.gov]"*

Members cannot type a UEI/CAGE manually here. Editing routes to the Roadmap verification panel where the SAM validator runs.

#### 5.1.4 Conflict scenarios

| Scenario | How it surfaces | Default resolution |
|---|---|---|
| Member-typed legal name differs from SAM-returned legal name | `conflict` on `legalName` field | Surface both; Member chooses; admin queue if Member rejects SAM (per agent_context §11) |
| Articles PDF legal name has different entity suffix vs. SAM (e.g., "LLC" vs "Co. LLC") | `needs_review` with banner: *"Name on document doesn't exactly match SAM record. Pick the canonical version."* | Surface the diff; Member picks |
| Address on SAM differs from address user provided | `conflict` on `physicalAddress` | Surface both; Member picks; SAM update path linked |

#### 5.1.5 Section footer

```
Identity:  ●●●●●●●●○○○  9 of 12 fields complete
This section unlocks: most federal opportunities (with active SAM)
```

If `samRegistrationStatus = Active` and `EIN` is verified → footer instead reads: *"Identity: complete. You're set for federal bidding from an identity standpoint."*

---

### 5.2 CAPABILITIES tab

**What this section is for:** what kind of work the firm can actually do — the inputs to Hunter's capability matching dimension and Grant's deliverability assessment.

#### 5.2.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| Primary NAICS | `primaryNaics` | String (6-digit NAICS) + size standard | H (federal) | SAM | SAM API |
| Secondary NAICS | `secondaryNaics[]` | Array of NAICS objects | C | SAM > Capability statement extraction | SAM API + extraction |
| PSC Codes (NEW) | `pscCodes[]` | Array of 4-character PSC codes | C | Member | PSC code lookup (NEW) |
| Core Capabilities | `coreCapabilities[]` | Array of strings (1–8 entries, 2–60 chars each) | C | Capability statement extraction > Member | Capability statement validator + length check |
| Differentiators | `differentiators[]` | Array of strings (1–5 entries, 5–120 chars each) | C | Capability statement extraction > Member | Capability statement validator + length check |
| Keywords / Skills (NEW) | `keywordsSkills[]` | Array of tags (3–30 entries) | C | Capability statement extraction > Member | Tag normaliser (NEW) |
| Clearance Levels Held (NEW) | `clearanceLevels[]` | Array of enum (None/Public Trust/Secret/Top Secret/TS-SCI) with counts | C | Member | Inline form (NEW) |
| GSA Schedules / GWACs / BPAs Held (NEW) | `vehiclesHeld[]` | Array of objects (vehicle name, contract number, SINs/labour categories, expiration) | C | Member | Inline form (NEW) |
| DCAA-compliant Accounting (NEW) | `dcaaCompliant` | Boolean + audit-letter URL (optional) | C (gates cost-reimbursable opps) | Member | Boolean attest + optional doc upload |

#### 5.2.2 Deep spec — `coreCapabilities[]` and `differentiators[]`

These come primarily from capability statement extraction (Roadmap PRD §9.4.3). On Profile:

**Display label:** *Core Capabilities*

**Helper microcopy:** *Three to eight short phrases describing what your firm does. Hunter uses these to match the scope of opportunities to your work.*

**Data type:** Array of strings, length 1–8, each 2–60 characters.

**Validation rules:**
- Each entry: 2–60 chars after trim; no entries that are pure numbers; no duplicates (case-insensitive).
- Total: 1–8 entries.
- Auto-deduplication on save.

**`needs_review` state (post-extraction):**

```
Core Capabilities                ●  Concrete construction
                                    Bridge repair
                                    Site preparation
                                    Steel reinforcement

                                    ⚠ We found these 4 in your capability
                                      statement (uploaded 2026-04-15) — confirm?

                                    [Yes, this is right]  [Edit list]
                                    [Try a different document]
```

**Edit affordance:** chip-style editor — each capability is a removable chip; "+ Add capability" button at end; reorder via drag.

**AI assist on edit:**
When the Member opens the edit affordance, an *"Ask Hunter to suggest more"* button is offered. Clicking triggers Hunter to propose 2–4 additional capabilities based on cap statement text + scraped website + onboarding free-text. Each suggestion is a chip the Member can accept or dismiss.

**Edge cases:**
- Member adds a capability that looks like a NAICS code (e.g. "236220") → reject inline: *"Looks like a NAICS code. Add it to the NAICS section instead."*
- Member adds duplicates → silently deduplicated.
- Member adds a 200-character paragraph → truncated with notice *"Capabilities should be short — 60 characters max. Trim or split into two."*

#### 5.2.3 Deep spec — `pastPerformance[]` (cross-references Past Performance tab §5.8)

The `capabilities.pastPerformance[]` array is **not directly edited on this tab.** It lives in the dedicated Past Performance tab where each entry is a structured record. The Capabilities tab shows only a count and a link:

```
Past Performance                 ●  4 entries · Total value $3.8M
                                    Contributes to Hunter's matching and Grant's
                                    bid memos
                                    [View all →]  [Add a project]
```

#### 5.2.4 Deep spec — `clearanceLevels[]` (NEW)

**Display label:** *Personnel Clearances*

**Helper microcopy:** *Some federal opportunities require cleared personnel. Tell us how many people you have at each level.*

**Data type:** Array of objects: `{ level: enum, headcount: integer, sponsorAgency?: string }`

**Validation rules:**
- Levels: `none`, `public_trust`, `secret`, `top_secret`, `ts_sci`. Member can pick zero or more.
- Headcount: integer ≥ 0. *"None"* defaults to 0 and shouldn't appear with a count.
- If any non-zero count is entered, the field is `attested`.

**`missing` state:**

```
Personnel Clearances             —  Not provided yet
                                    Some federal opportunities require cleared
                                    personnel. Without this, Hunter can't filter
                                    out opps that need clearance you don't have.
                                    [Add now]  [I have no cleared personnel]
```

**`I have no cleared personnel` button:** sets `clearanceLevels[]` to `[{ level: 'none', headcount: 0 }]` and flips state to `attested`. This is a positive declaration, not a missing field.

**Edit form:**

```
Personnel Clearances

How many of your people hold each level?
○ Public Trust       [  0 ]
○ Secret             [  3 ]  Sponsor: [Department of Defense]
○ Top Secret         [  1 ]  Sponsor: [Department of Defense]
○ TS/SCI             [  0 ]

[Save]  [Cancel]
```

**Edge cases:**
- Total headcount across levels exceeds Member's stated total employees → soft warning: *"You said your firm has 12 employees but listed 15 cleared. Double-check?"*
- Sponsor field is freeform but auto-suggests known agency names from a dropdown.

#### 5.2.5 Deep spec — `vehiclesHeld[]` (NEW)

**Display label:** *Contract Vehicles & Schedules*

**Helper microcopy:** *GSA Schedules, GWACs (CIO-SP3, Alliant 2, OASIS), and IDIQ contracts. These are how a lot of federal work flows — having them is a major advantage.*

**Data type:** Array of objects:
```
{
  vehicleType: enum (GSA_Schedule | GWAC | IDIQ | BPA | Cooperative_Agreement | State_Contract)
  vehicleName: string  // e.g. "GSA Schedule 70", "CIO-SP3 Small Business"
  contractNumber: string
  sinsOrLabourCategories: array of strings  // for GSA Schedules
  awardDate: date
  expirationDate: date
  primeOrSub: enum (Prime | Sub)  // for GWACs/IDIQs you can be a sub
}
```

**Validation rules:**
- vehicleName: 3–100 chars
- contractNumber: 5–30 chars, alphanumeric + hyphens
- expirationDate: must be in the future for the vehicle to count as active

**Edit form:** modal, one vehicle at a time.

**`needs_review` state when extracted from capability statement:**

If the AI capability statement extractor detects vehicle mentions ("Held GSA Schedule 70 since 2019"), it surfaces as a `needs_review` chip the Member can confirm or dismiss.

**Edge cases:**
- Expired vehicle → automatically moved to "Expired vehicles" sub-list with an *"Renew?"* prompt.
- Member enters a vehicle but no contract number → save as `attested` but flag with a *"missing contract number"* sub-issue.

#### 5.2.6 Deep spec — `dcaaCompliant` (NEW)

**Display label:** *DCAA-Compliant Accounting System*

**Helper microcopy:** *DCAA = Defense Contract Audit Agency. If you can do cost-reimbursable contracts (T&M, Cost-Plus), your accounting system needs DCAA-compliant tracking. This unlocks higher-value contracts.*

**Data type:** Object: `{ compliant: boolean, auditLetterUrl?: string, lastAuditDate?: date }`

**`missing` state:**

```
DCAA-Compliant Accounting       —  Not provided yet
                                   Some opportunities only go to firms with
                                   DCAA-compliant accounting. Tell us if you
                                   have it.
                                   [Yes, we're DCAA-compliant] [Not yet]
                                   [Have us assess — $497]
```

The two affirmative buttons set the field to `attested` immediately. If the Member says "Yes," they can optionally upload an audit letter, which would bump to `verified`.

**Validator: `dcaa_audit_letter`** (only runs if a document is uploaded)

| Trigger | Status | Card | Message |
|---|---|---|---|
| No PDF uploaded | `attested` | (no validator runs) | *"Saved. Upload your DCAA audit letter when you have it to bump this to verified."* |
| PDF uploaded, AI confirms it's a DCAA audit letter with positive finding | `needs_input` (`requiresConfirmation: true`) | Needs Review | *"We found a DCAA audit letter dated \<date\>. Confirm to verify."* |
| AI says document isn't a DCAA audit letter | `fail` | Failed/Error | *"This doesn't look like a DCAA audit letter. Try a different document, or skip — your attestation still counts."* |

#### 5.2.7 New fields summary (Capabilities tab)

PSC Codes, Keywords/Skills, Clearance Levels, Vehicles Held, DCAA-Compliant Accounting are all new vs. existing onboarding. Roadmap impact: these will need new sub-steps OR can be elicited entirely on the Profile page (no Roadmap counterpart needed since most have no API verification).

#### 5.2.8 Section footer

```
Capabilities:  ●●●●●●○○○  6 of 9 fields complete
This section unlocks: better Hunter matches, Grant's deeper bid memos
```

---

### 5.3 CERTIFICATIONS tab

**What this section is for:** the certifications that gate set-aside contracts and signal credibility on full-and-open ones.

#### 5.3.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| SAM Business Types | `samBusinessTypes[]` | Array of enums (small_business, 8a, HUBZone, SDVOSB, VOSB, WOSB, EDWOSB, etc.) | H (per set-aside) | SAM | SAM API |
| Small Business Status (per NAICS) | `samSmallBusinessFlag` | Boolean (with NAICS context) | H (small-biz set-asides) | SAM | SAM API |
| DSBS Profile | `dsbsProfileUrl` | URL | C | Member | DSBS validator (existing §9.4.4) |
| 8(a) Certification Letter (NEW) | `eightaCertificationLetterUrl` | PDF + extracted: cert date, expiration, BD specialist | H (8(a) opps) | SBA letter > SAM | New PDF validator |
| HUBZone Certification (NEW) | `hubZoneCertificationUrl` | PDF + qualifying address + cert date | H (HUBZone opps) | SBA letter > SAM | New PDF validator |
| SDVOSB Certification — DD-214 (NEW) | `sdvosbDD214Url` | PDF (the veteran's DD-214) + service-disabled rating | H (SDVOSB opps) | VA letter | New PDF validator |
| WOSB / EDWOSB Certification (NEW) | `wosbCertificationUrl` | PDF + cert date | H (WOSB opps) | SBA letter | New PDF validator |
| State Diversity Certifications (NEW) | `stateDiversityCertifications[]` | Array of objects: { state, certType, certNumber, expirationDate, certUrl } | C (state opps) | Member | Inline form (NEW) |
| CMMC Level (NEW) | `cmmcLevel` | Enum (None / Level_1 / Level_2 / Level_3) + assessment date + assessor | H (CMMC-required DoD opps) | Member + assessment letter | New PDF validator (optional) |
| ISO Certifications (NEW) | `isoCertifications[]` | Array: { standard (9001/14001/27001), certificateNumber, expirationDate, registrar } | C | Member + cert PDF | New PDF validator |
| SOC 2 Report (NEW) | `soc2Report` | Object: { type (Type 1/Type 2), reportDate, auditFirm, reportUrl? } | C (IT services opps) | Member + cert PDF | Inline form (NEW) |

#### 5.3.2 Deep spec — `samBusinessTypes[]`

This comes from SAM. Read-only on Profile (changes happen on SAM, sync via re-verify).

**Display label:** *SBA Set-Aside Eligibility (from SAM)*

**`verified` state (multiple types):**

```
SBA Set-Aside Eligibility       ●   Small Business
                                    SDVOSB (Service-Disabled Veteran-Owned Small Business)
                                    HUBZone

                                    ✓ Verified — SAM.gov on 2026-04-15
                                    [Re-check on SAM.gov]
```

**`verified` state (none):**

```
SBA Set-Aside Eligibility       ●   None on file
                                    ✓ Verified — SAM.gov on 2026-04-15
                                    Hunter won't show you set-aside-only
                                    opportunities. Want to pursue a certification?
                                    [Explore set-asides on Roadmap →]
```

The "explore set-asides" link routes to a Roadmap section that walks through each cert (eligibility check, application path, DFY service if available).

#### 5.3.3 Deep spec — Each individual cert document field (8(a), HUBZone, SDVOSB, WOSB)

These are new fields. They store the certification document and key extracted metadata so Grant can reference them in bid memos.

**Why we capture even when SAM has the flag:** SAM's set-aside flag tells us the Member is eligible. The certification document gives us the *expiration date*, *BD specialist*, and *qualifying details* that affect specific opportunities. Plus, agencies often ask for the cert document in proposal submissions.

**Generic validator pattern (each variant):**

| Trigger | Status | Card | Message |
|---|---|---|---|
| No PDF uploaded | `needs_input` | Form | *"Upload your SBA letter (or VA letter for SDVOSB) to verify your certification."* |
| PDF unreadable | `error` | Failed/Error | *"We couldn't read this PDF. Try a clearer scan."* |
| AI says document isn't this cert type | `fail` | Failed/Error | *"This doesn't look like an 8(a) certification letter. Upload your SBA-issued 8(a) letter."* (variant per cert) |
| AI extracts cert with expiration in the past | `fail` | Failed/Error | *"This certification expired \<date\>. If you've recently renewed, upload the new letter."* |
| AI extracts cert with valid future expiration | `needs_input` (`requiresConfirmation: true`) | Needs Review | *"Found 8(a) certification, valid through \<date\>. Confirm to verify."* |

**Edge case — cert in `verified` state but SAM flag is missing:** flag in admin queue. The two should agree. If SAM doesn't show the cert flag, either SAM is stale or the cert document is invalid. Surface to Member: *"Your 8(a) certification looks valid, but it's not flagged on your SAM record. We've flagged this for our team to review."*

#### 5.3.4 Deep spec — `cmmcLevel` (NEW, increasingly important)

**Display label:** *CMMC Level (Cybersecurity Maturity Model Certification)*

**Helper microcopy:** *Required for many DoD contracts handling controlled unclassified info. Level 1 = basic; Level 2 = mature; Level 3 = high. As of 2026, most DoD contracts require Level 2.*

**Data type:** Object: `{ level: enum (None / Level_1 / Level_2 / Level_3 / Pursuing), assessmentDate?: date, assessor?: string, c3paoUrl?: string, certificateUrl?: string }`

**`missing` state:**

```
CMMC Level                     —  Not provided yet
                                  Required for many DoD contracts in 2026.
                                  Tell us your level (or that you're pursuing one).
                                  [I have a CMMC level] [Pursuing a level]
                                  [No CMMC] [Have us guide you — $1,497]
```

**Edit form:**

```
CMMC Level

What's your current state?
○ I'm certified at Level 1
○ I'm certified at Level 2
○ I'm certified at Level 3
○ I'm pursuing certification at Level [____]
○ No CMMC — and I don't pursue DoD work that requires it
○ No CMMC — but I want to pursue DoD work and need to start

[If certified, show:]
Assessment date: [_______]
C3PAO (assessor): [_______]
Certificate (PDF): [Upload]
```

**Member-friendly states:**
- "Pursuing" is a valid state — Members may be 6 months into the assessment process.
- "I want to pursue" triggers a Hunter chat thread offering DFY help (CMMC consulting tied to a partner) or guiding the Member through the next steps.

#### 5.3.5 Deep spec — `stateDiversityCertifications[]` (NEW)

**Display label:** *State / Local Diversity Certifications*

**Helper microcopy:** *DBE, MBE, WBE, MWBE certifications issued by states or municipalities. These open up state and local opportunities reserved for diverse businesses.*

**Data type:** Array of objects:
```
{
  state: enum (US states + DC + territories)
  certType: enum (DBE | MBE | WBE | MWBE | LBE | DVBE | other)
  certifyingAgency: string  // e.g. "Texas Department of Transportation"
  certificateNumber: string
  expirationDate: date
  certificateUrl?: string
}
```

**Edit form:** modal, one entry at a time.

**Validation:**
- expirationDate: must be future-dated
- certificateNumber: 3–50 chars

**Edge case — state cert overlaps with SLED registration:** if a Member has both a state cert (e.g., Texas DBE) and Texas SLED vendor registration, surface this in the SLED tab as a positive cross-reference.

#### 5.3.6 Section footer

```
Certifications:  ●●●○○○○  3 of 7 fields complete
This section unlocks: set-aside opportunities, DoD CMMC-required work, state diversity opps
```

---

### 5.4 DIGITAL tab

**What this section is for:** the digital trust signals that make a small business look credible to federal buyers — website, custom email, A2P registration, business phone.

#### 5.4.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| Website | `website` | URL | S | Member | Existing website validator |
| Website Audit Findings | `websiteAuditFindings[]` | Array of strings | C | AI website audit | (computed during validator) |
| Custom Email Domain | `customEmailDomain` | String | S | Member | Existing email validator |
| Email — MX records | `emailMxRecords` | Boolean | C | DNS | (computed during validator) |
| Email — SPF | `emailSpfPresent` | Boolean | C | DNS | (computed during validator) |
| Business Phone (NEW) | `businessPhoneNumber` | String (E.164) | C | Member | Format check + reverse lookup (NEW) |
| A2P Brand ID | `a2pBrandId` | String | C | Member | Existing A2P validator |
| GHL Has Calendar | `ghlHasCalendar` | Boolean | C | GHL sync | Cron |
| GHL Has Pipeline | `ghlHasPipeline` | Boolean | C | GHL sync | Cron |
| GHL Has Contacts | `ghlHasContacts` | Boolean | C | GHL sync | Cron |
| GHL Plan | `ghlPlan` | String | C | GHL sync | Cron |

#### 5.4.2 Deep spec — `website` and `websiteAuditFindings[]`

The validator is established (Roadmap PRD §9.4.7). On Profile, the Audit Findings get richer treatment.

**`verified` state with audit findings:**

```
Website                        ●   williamsconstruction.com

                                   ✓ Verified — DNS lookup on 2026-04-15
                                   [Re-verify]  [Visit website →]

                                   Audit findings (3):
                                   ⚠ Add a clear <title> tag with your company name
                                   ⚠ No contact info above the fold
                                   ⚠ No services page

                                   These don't block bidding — but federal buyers
                                   do check websites. Worth fixing.
                                   [Have us refresh your site — $497]
```

The audit findings are presented as an **opportunity for improvement**, not a problem. Each finding has the specific fix described. The DFY upsell appears once at the bottom (not per finding) and is conditional on having ≥3 findings.

#### 5.4.3 Deep spec — `businessPhoneNumber` (NEW)

**Display label:** *Business Phone Number*

**Helper microcopy:** *The phone number you use for business calls and want on RFP submissions. Federal proposals require a phone POC.*

**Data type:** String formatted as E.164 (e.g., `+15551234567`); display format `(555) 123-4567` for US.

**Validation rules:**
- Must be a valid E.164 phone (libphonenumber).
- US-only by default; international allowed but flagged.
- A reverse lookup is performed (best-effort) to surface caller-ID name; this is informational only, not a hard validator.

**`needs_input` validator: `business_phone`**

| Trigger | Status | Card | Message |
|---|---|---|---|
| No phone provided | `needs_input` | Form | *"What's the phone number on your business proposals?"* |
| Format invalid | `fail` | Failed/Error | *"That doesn't look like a valid phone number. Use a 10-digit US number like (555) 123-4567."* |
| Reverse lookup matches Member's stated business name | `verified` | Pass | *"Verified — caller ID matches \<legal name\>."* |
| Reverse lookup returns a different name OR no match | `attested` | Pass-with-flag | *"Saved. Couldn't auto-verify the caller-ID — confirm this is the right number for federal POC."* |

#### 5.4.4 Section footer

```
Digital:  ●●●●●○○  5 of 7 fields complete
This section unlocks: better proposal credibility, A2P-required SMS workflows
```

---

### 5.5 SLED REGISTRATIONS tab

**What this section is for:** state and local vendor registrations that gate SLED opportunities.

#### 5.5.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| SLED Registrations | `sledRegistrations[]` | Array of objects | H (per state — for SLED opps in that state) | Wizard / DFY delivery | Existing SLED validator (§9.4.5) |
| SLED Target States | `sledTargetStates[]` | Array of state enums | C | Member | Inline (NEW) |
| State Tax IDs (NEW) | `stateTaxIds[]` | Array of objects: { state, taxId } | S (per state) | Member | Format check per state |
| Insurance Certificates per State (NEW) | `stateInsurance[]` | Array of objects: { state, certUrl, expiration } | S (per state — varies by state) | Member + PDF upload | New PDF validator |

#### 5.5.2 Deep spec — `sledRegistrations[]`

The existing validator (Roadmap PRD §9.4.5) checks the list. On Profile, this is a richer table:

**Display:**

```
SLED Registrations             ●   Registered in 4 states:

                                   ┌─────────────┬──────────────┬──────────┐
                                   │ State       │ Vendor ID    │ Portal   │
                                   ├─────────────┼──────────────┼──────────┤
                                   │ Texas       │ V-12345-TX   │ SmartBuy │
                                   │ Oklahoma    │ OK-789012    │ OK Marketplace │
                                   │ Louisiana   │ L987654321   │ LaPAC    │
                                   │ Arkansas    │ AR-5544      │ AR Vendor │
                                   └─────────────┴──────────────┴──────────┘

                                   ✓ Verified — at least one entry has both state + vendor ID
                                   [Add another state]  [Edit existing]
```

**`needs_input` state:**

```
SLED Registrations             ●   1 entry, but missing vendor ID:

                                   ┌─────────────┬──────────────┐
                                   │ State       │ Vendor ID    │
                                   ├─────────────┼──────────────┤
                                   │ Texas       │ — Missing —  │
                                   └─────────────┴──────────────┘

                                   ⚠ Add at least one state with a vendor ID
                                   [Add vendor ID for Texas]  [Add another state]
                                   [Have us register you in additional states]
```

**Edge case — Member registers in a state they don't target:** soft warning: *"You're registered in Wyoming but didn't list it as a target state. Want to add it as a target?"*

#### 5.5.3 Deep spec — `sledTargetStates[]` (NEW)

**Display label:** *Target SLED States*

**Helper microcopy:** *Where you want to win state and local work. Hunter prioritises these in your feed. Different from where you're registered — you can target a state you're not yet registered in.*

**Data type:** Array of state enums (50 + DC + territories).

**Edit affordance:** chip-style multi-select with a US map visualization.

**Edge case — target state without registration:** triggers a soft suggestion: *"You're targeting Texas but aren't registered as a Texas vendor yet. [Register now] [Have us register you — $197]"*

#### 5.5.4 Section footer

```
SLED:  ●●○○  2 of 4 fields complete
This section unlocks: SLED opportunities in your registered states (88 active right now)
```

---

### 5.6 POSITIONING tab — *the most important tab for Hunter*

**What this section is for:** the Member's *intent* — what they want to win, where they want to win it, what scale they can handle. Per agent_context §2.8, this entity is "almost always empty" at Step 4 and is Hunter's highest-leverage elicitation surface.

This tab gets the most attention from Hunter (chat-driven elicitation) and is also fully editable on the Profile page.

#### 5.6.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| Target Agencies | `targetAgencies[]` | Array of agency names (with auto-complete) | C | Member | Agency name normaliser |
| Target Contract Value Range | `targetContractValueRange` | Object `{min, max}` (USD) | C | Member | Range validator |
| Geographic Preference | `geographicPreference[]` | Array of states/regions + travel willingness | C | Member | State enum validator |
| NAICS Targeting Priorities | `naicsTargetingPriorities[]` | Ranked array of NAICS codes (subset of registered) | C | Member | NAICS validator (must be in registered list) |
| Set-aside Hunger | `setAsideHunger` | Enum | C | Member | Enum |
| Notification Cadence | `notificationCadence` | Enum (immediate / daily / weekly / smart) | C | Member | Enum |
| Agencies to Avoid | `agenciesToAvoid[]` | Array of agency names | C | Member | Agency normaliser |
| Win Themes | `winThemes[]` | Array of strings (1–5 entries, 5–200 chars) | C | Member (Hunter or Ava can elicit) | Length check |
| Key Personnel Highlight (NEW) | `keyPersonnel[]` | Array of objects: { name, title, capabilityArea, bio } | C | Member | Inline form |

#### 5.6.2 Deep spec — `targetAgencies[]`

**Display label:** *Target Agencies*

**Helper microcopy:** *Federal buyers you want to win work from. Hunter prioritises these in your feed and surfaces solicitations early. Add as many as you want — this is about focus, not exclusion.*

**Data type:** Array of normalized agency strings. Auto-complete sourced from a curated agency list (federal departments + sub-agencies + major commands like USACE, DLA, NAVAIR).

**Edit affordance:** chip-style multi-select with auto-complete. Suggested chips at top (most-common agencies + agencies the Member has clicked on in Hunter).

**Smart suggestions:** if Hunter has observed the Member click into 3+ opportunities at the same agency, that agency appears as *"Hunter noticed you've been clicking into USACE opportunities — want to target them?"*

**`missing` state:**

```
Target Agencies                —   Not provided yet
                                   Tell Hunter who you're hunting and we'll
                                   prioritise their solicitations in your feed.
                                   [Add agencies]  [Cast a wide net]
```

**`Cast a wide net` button:** sets `targetAgencies[]` to empty *but* sets a sibling field `castWideNet = true`. This is a positive declaration that the Member doesn't want to filter by agency. Hunter respects this and doesn't re-elicit.

#### 5.6.3 Deep spec — `targetContractValueRange`

**Display label:** *Target Contract Value Range*

**Helper microcopy:** *The size of contracts you actually want to bid on. Federal proposals are wildly different at $50K vs $5M — bidding on the wrong size is the #1 reason small businesses waste effort.*

**Data type:** Object `{ min: number, max: number }` in USD.

**Validation rules:**
- min ≥ 0
- max > min
- max ≤ $1B (sanity ceiling)
- Suggested presets: *"Under $250K"*, *"$250K – $1M"*, *"$1M – $5M"*, *"$5M – $25M"*, *"$25M+"*

**Edit affordance:** dual-slider OR preset chips OR inline numeric inputs. Member can pick any.

**`inferred` state:** if Member has past performance entries, Hunter infers a comfortable range and surfaces it as `inferred`:

```
Target Contract Value Range    ○   $400K – $2.4M  (italic)
                                   ◇ Hunter's guess based on your past 4 contracts
                                   [Yes, that's right]  [Set this myself]
```

**Edge case — range too narrow:** if min and max are within 20% of each other, soft warning: *"That's a tight range — most small businesses target a 3–5x range. Sure?"*

#### 5.6.4 Deep spec — `geographicPreference[]`

**Display label:** *Where You Can Work*

**Helper microcopy:** *Geographic scope of work you can deliver — your state, multi-state region, or anywhere. Different from your HQ.*

**Data type:** Object:
```
{
  scope: enum (single_state | multi_state_radius | multi_state_named | nationwide | remote_only)
  states?: array of state enums
  hqState: string
  travelRadiusMiles?: number  // for multi_state_radius
  willingToTravel: boolean
  travelConditions?: string  // freeform "depends on contract value"
}
```

**Edit form:**

```
Where You Can Work

How wide can you go?
○ My state only ([Texas])
○ My state + neighbors within [200] miles
○ Specific states: [Texas] [Oklahoma] [Louisiana] [Arkansas] [+ Add]
○ Nationwide
○ Remote work only

Are you willing to travel for the right contract?
○ Yes, anywhere
○ Yes, within US
○ Only for high-value contracts ($____+)
○ No

[Save]
```

**Edge case — Member selects nationwide but has zero past performance outside HQ state:** info banner: *"Heads up — you don't have past performance outside Texas yet. Past performance in the place of performance is a common evaluation factor."*

#### 5.6.5 Deep spec — `setAsideHunger`

**Display label:** *Set-Aside Appetite*

**Helper microcopy:** *Set-aside contracts have less competition (only certified firms can bid) but are smaller. Full-and-open contracts are bigger but compete with everyone.*

**Data type:** Enum: `set_asides_only | full_and_open_only | both_lean_set_aside | both_lean_full_and_open | both_equal`

**Edit form:** radio with explanations.

**`inferred` state:** if Member has set-aside certifications + has saved 80%+ set-aside opportunities, Hunter infers `set_asides_only` and surfaces.

**Edge case — Member selects `set_asides_only` but has no certifications:** error: *"Set-asides require certification. You don't have any active set-aside certifications — change to full-and-open or pursue a certification."*

#### 5.6.6 Deep spec — `winThemes[]`

**Display label:** *Win Themes*

**Helper microcopy:** *In your own words: why should a contracting officer pick you over a competitor? Don't worry about polish — your honest answer is what Ava uses to draft proposals.*

**Data type:** Array of strings, 1–5 entries, 5–200 chars each.

**Edit affordance:** textarea-style entry, one theme per line.

**AI assist:** an *"Ask Hunter to help me articulate this"* button. Triggers a Hunter chat thread that elicits themes through conversation:

```
Hunter: I'd help you find win themes. To start — when you've won
work in the past, what was the reason the customer picked you over
others? Even one example helps.

Member: We were on-time and under-budget on every job we ever did.

Hunter: Strong start. So a theme is "consistent on-time, on-budget
delivery." Anything else? Speed? Quality? Local presence? Specialty
expertise?

[continues, one question per turn]
```

After 3–5 exchanges, Hunter writes the themes back to Profile in the Member's own words.

#### 5.6.7 Section footer

```
Positioning:  ●●●●○○○○○  4 of 9 fields complete
This section unlocks: highly relevant Hunter matches, Ava's win themes
```

The Positioning tab footer is special: it explicitly says *"This is the highest-impact tab for match quality. Each field here measurably improves your feed."*

---

### 5.7 BID READINESS tab — *Grant's domain* (NEW tab)

**What this section is for:** the operational data Grant needs to score risk and feasibility on a specific opportunity. None of this is in the existing onboarding.

#### 5.7.1 Master field table

| Field | Internal name | Type | Severity | Source priority | Validator |
|---|---|---|---|---|---|
| Concurrent Contract Capacity | `concurrentContractCapacity` | Object `{ max: number, comfortableLevel: number, notes?: string }` | C | Member | Inline form |
| Cash Flow Tolerance | `cashFlowTolerance` | Object `{ daysToWaitForPayment: number, lineOfCreditAvailable: boolean, lineOfCreditAmount?: number }` | C | Member | Inline form |
| Bonding Capability | `bondingCapability` | Object | C | Member | Inline form (NEW) |
| Insurance Coverages | `insuranceCoverages[]` | Array of objects (per coverage type) | C | Member + COI upload | New PDF validator |
| Risk Appetite | `riskAppetite` | Enum (prime_only / sub_only / both / teaming_priority) | C | Member | Enum |
| Annual Revenue (banded) | `annualRevenueBand` | Enum ($0–$500K / $500K–$2M / $2M–$5M / $5M–$10M / $10M–$25M / $25M+) | C | Member | Enum |
| Total Employees (W-2) | `totalEmployeesW2` | Number | C | Member | Numeric |
| Subcontractor Pool Size | `subcontractorPoolSize` | Number | C | Member | Numeric |
| Competitors Known | `competitorsKnown[]` | Array of objects: { name, beatenBefore, lostToBefore } | C | Member (Grant elicits) | Inline form |
| Teaming Partners | `teamingPartners[]` | Array of objects: { name, relationship, capabilities, agreementOnFile } | C | Member (Grant elicits) | Inline form |
| Bid / No-Bid Deal-Breakers | `bidNoBidPreferences` | Object: { capacityCaps, dealBreakerClauses, mustHaves } | C | Member (Grant elicits) | Inline form |

#### 5.7.2 Deep spec — `bondingCapability` (NEW)

**Display label:** *Bonding Capability*

**Helper microcopy:** *Construction and some IT contracts require performance bonds (typically 100% of contract value) and payment bonds. Tell Grant what you can post.*

**Data type:**
```
{
  hasBondingLine: boolean
  bondingCompany?: string
  singleBondCapacity: number  // max bond amount on one contract
  aggregateBondCapacity: number  // total outstanding bond amount
  bidBondCapability: boolean
  performanceBondCapability: boolean
  paymentBondCapability: boolean
  recentBondsPosted?: array of { contractName, value, date }
  notes?: string
}
```

**`missing` state:**

```
Bonding Capability             —   Not provided yet
                                   Federal construction usually needs $50K–$500K
                                   performance bonds. Without this, Grant might
                                   recommend opportunities you can't bond for.
                                   [Tell us about your bonding] [I don't bond]
                                   [Have us connect you with a bonding company]
```

The `[I don't bond]` button is critical — many small businesses don't have a bonding line yet and the field shouldn't feel like a deficit. Setting this flips the field to `attested` with `hasBondingLine = false`.

**Edit form:**

```
Bonding Capability

Do you have a bonding line?
○ Yes
○ No, but interested in setting one up
○ No, and not pursuing bonded contracts

[If Yes:]
Bonding company: [_____________]
Single contract bond capacity: $[__________]
Aggregate bond capacity: $[__________]
What can you post?
☐ Bid bonds  ☐ Performance bonds  ☐ Payment bonds

[Recent bonds posted (optional):]
[+ Add a bond]
```

**Edge case — Member says they bond but `aggregateBondCapacity < singleBondCapacity`:** validation error: *"Aggregate should be at least as large as single — usually it's a multiple."*

#### 5.7.3 Deep spec — `insuranceCoverages[]` (NEW)

**Display label:** *Insurance Coverages*

**Helper microcopy:** *General liability, professional liability, workers' comp, cyber. Federal RFPs often spell out minimum coverage requirements — having yours documented helps Grant flag mismatches.*

**Data type:** Array of objects, one per coverage type:
```
{
  type: enum (general_liability | professional_liability | workers_comp | auto_liability | cyber_liability | umbrella | other)
  perOccurrenceLimit?: number
  aggregateLimit?: number
  carrier?: string
  policyNumber?: string
  expirationDate?: date
  certificateUrl?: string  // COI upload
}
```

**Validator: `insurance_coi_pdf`** (only runs if a COI is uploaded)

| Trigger | Status | Card | Message |
|---|---|---|---|
| No PDF | `attested` | Pass-with-flag | *"Saved. Upload a Certificate of Insurance to verify limits."* |
| PDF uploaded, AI extracts coverage type and limits | `needs_input` (`requiresConfirmation: true`) | Needs Review | *"Found a Certificate of Insurance covering \<types\> with limits \<X\>. Confirm to verify."* |
| AI says document isn't a COI | `fail` | Failed/Error | *"This doesn't look like a Certificate of Insurance. Try again."* |
| COI extracted but expiration in the past | `fail` | Failed/Error | *"This COI expired \<date\>. Upload a current certificate."* |

#### 5.7.4 Deep spec — `concurrentContractCapacity`

**Display label:** *Concurrent Contract Capacity*

**Helper microcopy:** *How many contracts can your firm comfortably manage at once before it breaks something?*

**Data type:**
```
{
  max: number  // theoretical max
  comfortableLevel: number  // realistic preferred
  currentInProgress?: number  // for context
  notes?: string  // freeform
}
```

**Edit form:** sliders or numeric inputs, with a free-text "any context to add?" field.

**`inferred` state:** if Member has 3+ past performance entries with overlapping periods of performance, Grant can infer concurrent capacity from history.

#### 5.7.5 Deep spec — `cashFlowTolerance`

**Display label:** *Payment Terms Tolerance*

**Helper microcopy:** *Federal payment terms are often Net 30 to Net 90+ days. How long can you wait between doing the work and getting paid?*

**Data type:**
```
{
  daysToWaitForPayment: number  // typical max acceptable, e.g. 60
  lineOfCreditAvailable: boolean
  lineOfCreditAmount?: number
  bankPartner?: string
  notes?: string
}
```

#### 5.7.6 Deep spec — `competitorsKnown[]` and `teamingPartners[]`

These are elicited primarily by Grant during bid/no-bid conversations, not on Profile directly. Profile shows them in read-only-ish mode with edit affordances:

```
Known Competitors              ○   3 firms identified

                                   Acme Construction (lost to twice)
                                   ABC Contracting (beaten once)
                                   XYZ Builders (similar size, never head-to-head)

                                   [Edit list]
                                   ◇ Identified during conversations with Grant
```

#### 5.7.7 Section footer

```
Bid Readiness:  ●●●●○○○○○○○  4 of 11 fields complete
This section unlocks: Grant's risk-aware bid memos, smarter capacity matching
```

---

### 5.8 PAST PERFORMANCE tab

**What this section is for:** the structured record of every prior contract the Member has performed. This is the second-most-important tab for match quality after Positioning.

#### 5.8.1 Tab structure

The Past Performance tab is **list-based, not field-based.** It shows:

- A header: count, total value, breakdown by federal vs SLED vs commercial
- A list of past performance entries (each is a row)
- An "Add a project" button
- Filters (by type, by recency)
- Bulk import affordance

#### 5.8.2 Master field table — per past performance entry

Each entry has these fields:

| Field | Internal name | Type | Required? | Source |
|---|---|---|---|---|
| Project Title | `projectTitle` | String (5–120 chars) | Yes | Member or capability statement extraction |
| Customer Name | `customerName` | String | Yes | Member or extraction |
| Customer Type | `customerType` | Enum (federal_prime / federal_sub / state / local / commercial / non_profit / other) | Yes | Member |
| Contract Type | `contractType` | Enum (FFP / T&M / Cost-Plus / IDIQ / GSA Schedule / BPA / Cooperative / Grant / other) | Yes | Member |
| Contract Number | `contractNumber` | String | No | Member |
| NAICS Code | `naicsCode` | String (6-digit) | No | Member |
| Period Start | `periodStartDate` | Date | Yes | Member or extraction |
| Period End | `periodEndDate` | Date | Yes | Member or extraction |
| Total Value | `totalValue` | Number (USD) | Yes | Member or extraction |
| Role | `role` | Enum (prime / sub) | Yes | Member |
| Sub-percentage | `subPercent` | Number (0–100) | If role=sub | Member |
| Scope Description | `scopeDescription` | Text (50–2000 chars) | Yes | Member or extraction |
| Reference POC Name | `referencePOCName` | String | No (recommended) | Member |
| Reference POC Title | `referencePOCTitle` | String | No | Member |
| Reference POC Email | `referencePOCEmail` | Email | No (recommended) | Member |
| Reference POC Phone | `referencePOCPhone` | String | No | Member |
| CPARS Rating | `cparsRating` | Enum (Exceptional / Very Good / Satisfactory / Marginal / Unsatisfactory / N/A) | No | Member |
| Vehicle (if applicable) | `vehicle` | String | No | Member |
| Successful? | `successful` | Boolean (with optional reason if not) | Yes | Member |
| Confidential? | `confidential` | Boolean | No | Member |
| Supporting Documents | `supportingDocuments[]` | Array of URLs (contracts, deliverables, references) | No | Member |

#### 5.8.3 Entry display modes

**Compact (default in list view):**

```
┌──────────────────────────────────────────────────────────────────┐
│ Houston Port Pier 23 Reconstruction              [Edit]  [×]    │
│ US Army Corps of Engineers · Federal prime · FFP                 │
│ Aug 2023 – Mar 2024 · $1.4M · NAICS 237310                       │
│ ✓ Reference: David Hartwell, USACE Galveston                     │
│ ⭐ CPARS: Very Good                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Expanded:** clicking opens a detail panel with the full scope description and supporting documents.

#### 5.8.4 Add / Edit form

A multi-step modal (3 steps to avoid form fatigue):

**Step 1 — Basics:**
```
What's the project?
- Project title: [_______________]
- Customer name: [_______________]
- Customer type: [Federal | SLED | Commercial | ...]
- Contract type: [FFP | T&M | IDIQ | ...]

[Next]
```

**Step 2 — Details:**
```
When and how big?
- Period: [Aug 2023] to [Mar 2024]
- Total value: $[1,400,000]
- Role: [Prime | Sub]
- NAICS: [237310] (auto-suggest from your list)
- Vehicle: [optional]
- Successful: [Yes | Partially | No]

What did you do? (50–2000 chars)
[textarea]

[Back] [Next]
```

**Step 3 — References (optional but valuable):**
```
Add a reference for this project (optional but strongly recommended)
- Name: [_______]
- Title: [_______]
- Email: [_______]
- Phone: [_______]

CPARS rating (if available): [dropdown]

Supporting docs: [Upload]

[Back] [Save]
```

#### 5.8.5 AI assist — extraction from capability statement

When the cap statement extractor finds past performance entries, they pre-populate this list as `needs_review` rows. The Member confirms each:

```
Past Performance               ●  3 entries found in your capability statement —
                                  review each:

  ┌────────────────────────────────────────────────────────────┐
  │ Houston Port Pier 23 Reconstruction        ⚠ needs_review  │
  │ USACE · 2023–2024 · ~$1.4M (extracted)                     │
  │ [Confirm details] [Edit] [This isn't real]                 │
  └────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────┐
  │ Galveston Coast Guard Pier Repair          ⚠ needs_review  │
  │ Coast Guard · 2022–2023 · ~$890K (extracted)               │
  │ [Confirm details] [Edit] [This isn't real]                 │
  └────────────────────────────────────────────────────────────┘

  [Add another project manually]  [Bulk import from CSV]
```

#### 5.8.6 Bulk import (CSV / paste)

For Members with many past projects, a bulk import path:

1. **Upload CSV** — a template is downloadable (project_title, customer, type, value, period_start, period_end, etc.)
2. **Paste from spreadsheet** — paste a tab-separated block; AI parses headers and maps to fields
3. **Review extracted rows** — each row appears as `needs_review`; Member confirms in batch

#### 5.8.7 Validation rules per entry

- `periodStartDate` < `periodEndDate`
- `totalValue` ≥ 0
- `role = sub` requires `subPercent`
- `customerType = federal_prime` strongly suggests `contractNumber` (but doesn't require)
- `referencePOCEmail` if provided must be valid email
- `confidential = true` hides the customer name from any external rendering (e.g., proposal templates)

#### 5.8.8 Section footer

```
Past Performance:  4 entries · Total $3.8M · 3 federal, 1 commercial
This section unlocks: Hunter's past-performance dimension, Grant's bid memos,
and Ava's proposal narratives
```

---

### 5.9 MENTOR HISTORY tab

**What this section is for:** mentor session bookings, contracts, and (when ingested) takeaways.

#### 5.9.1 Master field table

| Field | Internal name | Type | Source |
|---|---|---|---|
| Mentor Bookings | `mentorBookings[]` | Array of `{ appointmentId, mentorName, startTime, status }` | Step 3 booking flow |
| Signed Mentor Contracts | `mentorSignedContracts[]` | Array of `{ enrollmentId, signedContractUrl }` | Webhook |
| Mentor Session Takeaways (NEW) | `mentorSessionTakeaways[]` | Array of `{ sessionId, mentorName, dateTime, takeaway, paraphrasedBy }` | Member-paraphrased OR ingested from Freshdesk |
| Active Mentor-Protégé Relationship (NEW) | `mentorProtegeAgreement` | Object: { protegeOrMentor, partnerFirm, startDate, expiration, certNumber } | Member |

#### 5.9.2 Display

```
Past Mentor Sessions:

┌──────────────────────────────────────────────────────────────────┐
│ Apr 22, 2026 · 9:00 AM with Sarah Mitchell                       │
│ Status: Completed                                                │
│                                                                  │
│ Your takeaway:                                                   │
│ "Focus on USACE small business set-asides; capability statement  │
│  needs more recent past performance."                            │
│                                                                  │
│ [Edit takeaway]  [Book another session →]                        │
└──────────────────────────────────────────────────────────────────┘
```

If a session has no takeaway yet:

```
┌──────────────────────────────────────────────────────────────────┐
│ Apr 22, 2026 · 9:00 AM with Sarah Mitchell                       │
│ Status: Completed                                                │
│                                                                  │
│ ⚠ No takeaway captured yet                                       │
│ One sentence helps Hunter and Grant build on what you discussed. │
│ [Add takeaway]  [Have us request notes from Sarah →]             │
└──────────────────────────────────────────────────────────────────┘
```

#### 5.9.3 Section footer

```
Mentor History:  2 sessions, 1 takeaway captured
[Book your next session →]
```

---

## Part 6 — Cross-cutting validation logic

### 6.1 New validators required

In addition to the eight existing validators (SAM, SOS, LLC, Capability, SBS, SLED, Website, Email, A2P from Roadmap PRD §9.4), this design requires the following new validators:

| Validator | Purpose | Trigger | Outcome |
|---|---|---|---|
| `ein_letter` | Validate IRS CP-575 letter and extract EIN | PDF upload | pass / needs_input / fail / error |
| `eighta_certification` | Validate 8(a) SBA letter | PDF upload | pass / needs_input / fail / error |
| `hubzone_certification` | Validate HUBZone SBA letter + qualifying address | PDF upload + address check | pass / needs_input / fail / error |
| `sdvosb_dd214` | Validate DD-214 with service-disabled rating | PDF upload | pass / needs_input / fail / error |
| `wosb_certification` | Validate WOSB/EDWOSB SBA letter | PDF upload | pass / needs_input / fail / error |
| `cmmc_certification` | Validate CMMC C3PAO assessment letter | PDF upload | pass / needs_input / fail / error |
| `iso_certification` | Validate ISO certificate | PDF upload | pass / needs_input / fail / error |
| `dcaa_audit` | Validate DCAA audit letter | PDF upload | pass / needs_input / fail / error |
| `insurance_coi` | Validate Certificate of Insurance | PDF upload | pass / needs_input / fail / error |
| `business_phone` | Validate phone format and reverse-lookup | Format + lookup | pass / fail |
| `state_diversity_cert` | Validate state-issued diversity certificate | PDF upload | pass / needs_input / fail / error |

Each follows the existing convention from Roadmap PRD §9.4 — same status enum (`pass` / `fail` / `needs_input` / `error`), same card styles (Pass / Needs Review / Failed/Error), same review-and-confirm pattern for `needs_input` with `requiresConfirmation`.

### 6.2 Validation severity ladder (when Member edits a previously-verified field)

When a Member edits a field that was `verified`:

1. **For fields with API verification (UEI, CAGE, etc.):** edits not allowed in Profile. Re-verification through the Roadmap is the only path.
2. **For fields with document verification (legal name, EIN, certs):** edit triggers a confirm modal — *"Editing this will downgrade it from verified to attested. The verified value was \<X\>. Are you sure?"*
3. **For fields without verification (positioning, preferences):** edits go through immediately.

### 6.3 Cross-field validation

Several fields have cross-validation rules that fire on save:

| Rule | Behaviour |
|---|---|
| `setAsideHunger = set_asides_only` AND no certifications | Block save with error message |
| `geographicPreference.scope = nationwide` AND `totalEmployeesW2 < 5` | Soft warning (not blocking) |
| `targetContractValueRange.max > 5 × largest past performance value` | Soft warning + suggestion to consider teaming |
| `concurrentContractCapacity.max < currentInProgress` | Block — math doesn't work |
| `bondingCapability.aggregateBondCapacity < singleBondCapacity` | Block with explanation |

### 6.4 Stale-data refresh policy

| Field | Cache TTL | Refresh strategy |
|---|---|---|
| SAM record | 365 days (matches expiration cycle) | Auto-prompt on stale; Member triggers re-verify |
| SOS via Cobalt | 7 days | Auto-prompt on stale; Member triggers re-verify |
| DSBS profile | 90 days | Soft prompt only; not blocking |
| Website audit | 90 days | Re-run on Profile load if older than TTL (background) |
| Email DNS | 30 days | Re-run on Profile load if older than TTL |
| Capability statement | 365 days OR on document re-upload | Soft prompt on stale; suggest refresh |
| Past performance entries | Never auto-stale (manual edit only) | Member-triggered |
| Inferred fields (capacity envelope, comfortable range) | Recomputed on every new past performance entry | Background |

### 6.5 Conflict resolution flow

When two sources disagree on a field, the resolution flow is:

1. Field flips to `conflict` state visually.
2. Both values are shown with sources.
3. Member chooses one OR types a new value.
4. Member's choice is logged with provenance: *"You chose the SAM value over the Articles of Org value on \<date\>. The rejected value (\<X\>) is in your edit history."*
5. The rejected value is queued for admin review (per agent_context §11) — high-impact fields (legal name, UEI, EIN) trigger immediate admin review; low-impact fields are batched.

---

## Part 7 — AI-driven elicitation patterns

The Profile page is form-style. But many fields can also be filled via Hunter chat, which is friendlier for verbal Members. The patterns:

### 7.1 Single-field chat elicitation

For fields with a single answer (target value range, set-aside hunger, etc.), the *Tell Hunter in chat* button on the field row triggers a Hunter chat thread:

```
Hunter: I see you haven't told me your target contract value range yet.
This is the size of contracts you actually want to bid on. Federal
proposals are wildly different at $50K vs $5M. Roughly what range
are you comfortable with?

Quick replies: [Under $250K] [$250K–$1M] [$1M–$5M] [Help me think]

Member: $500K to $2M

Hunter: Got it — $500K to $2M. I've updated your profile and I'll
re-rank your matches now.
```

After Hunter writes back, the field on Profile updates to `attested` with provenance *"You told Hunter on \<date\>"*.

### 7.2 Multi-field structured elicitation

For fields like a past performance entry, chat elicitation is structured but still one-question-per-turn:

```
Hunter: Want to add a past project? I'll walk you through it. Start
with the title — what would you call this one?

Member: Houston Pier 23 Reconstruction

Hunter: Good. Who was the customer?

Member: USACE Galveston District

Hunter: Got it. Federal prime contract, I assume — was this prime or
sub?

[continues]

Hunter: Saved. Houston Pier 23, USACE, Aug 2023 – Mar 2024, $1.4M,
prime, FFP. Anything you want to fix?
```

Elicited fields are written as a `needs_review` past performance entry; the Member confirms in one click on Profile to flip to `verified`.

### 7.3 Bulk chat elicitation

For positioning ("tell me about your business"), the Hunter chat can do a 3–5 turn elicitation that fills multiple fields at once. Used at cold-start or when the Member explicitly asks *"help me set up my profile"*.

### 7.4 Proactive nudges (context-triggered)

Hunter proactively elicits when the Member's behaviour suggests a gap:

| Trigger | Hunter says |
|---|---|
| Member dismisses 3+ opps with reason "wrong size" | *"I notice you keep dismissing opportunities for being the wrong size. Want to set your target value range? I'll stop showing the wrong ones."* |
| Member saves 3+ opps at the same agency | *"You've saved 3 USACE opps. Want me to prioritise USACE in your feed?"* |
| Member asks Hunter about bonding | *"Bonding question — quick — do you have a bonding line set up? If yes, I can be more confident on construction matches; if no, we have a partner we work with."* |
| Member is about to send a hard-gated opportunity to Mentor | (See Part 6 of doc 08 for the gate modal.) |

### 7.5 AI assist on Profile inputs (in-form helpers)

Embedded inside form modals:

- **Suggested values from cohort:** *"Most firms in your cohort target $500K–$2M. Want to start there?"*
- **Auto-complete from existing data:** for NAICS, target agencies, partner firms — auto-complete sourced from the canonical lists.
- **Field reasoning:** every form has a *"Why does Hunter need this?"* link revealing the universal tooltip from §3.5.

---

## Part 8 — Edge cases

### 8.1 The "I'll come back to this" Member

A Member opens an edit form, partially fills it, navigates away. We auto-save drafts as `pending_save` (not visible state — internal only). On return, the form reopens with the partial data intact. After 7 days of no completion, the draft expires.

### 8.2 The over-eager Member who fills everything in one sitting

We don't reward this with a "100% complete!" badge — that would feel gamified. Instead the Readiness Header simply confirms: *"You're set up for federal + SLED bidding. Hunter has everything it needs to match well."*

### 8.3 The Member with bad source data (e.g., SAM record has wrong address)

If SAM is wrong, the Member must fix it on SAM.gov first. Profile cannot edit verified fields directly. We surface the path: *"To update this, change it on SAM.gov first, then re-verify here. [Open SAM.gov →]"*

### 8.4 The Member who hides confidential past performance

Some past projects are confidential (NDAs, classified work). The `confidential = true` flag hides customer name from external rendering but preserves it for internal matching (Hunter can still use the scope description and value to score capability fit).

### 8.5 The Member who has multiple entities

A Member may run two LLCs (rare but happens). Profile is tied to a single `successCenterId` — multi-entity Members manage them as separate accounts. Out of scope for v1.

### 8.6 The Member who edits a `needs_review` value without confirming

If Member edits a `needs_review` value and saves, the field flips to `attested` with provenance noting the original extraction was overridden: *"You edited the value on \<date\>. Original from \<source\>: \<X\>."*

### 8.7 The Member who declines DFY repeatedly

If the Member declines DFY for the same field 3 times, we suppress further DFY upsells for that field for 30 days. The field still surfaces as `missing` with a DIY path; just no DFY offer.

### 8.8 The expired certification

If a cert document is uploaded with an expiration in the past, validator returns `fail` with a renewal-path message. The field remains `missing` for matching purposes — Hunter doesn't surface set-aside opps to a Member with an expired cert.

### 8.9 The Member who edits something during a Hunter chat

If the Member is in Hunter chat being elicited about Field X and simultaneously edits Field X on Profile, the most recent timestamp wins. Hunter's chat acknowledges: *"Looks like you just updated this on Profile — I've got the new value. Moving on."*

---

## Part 9 — Build sequencing

This is a lot of new work. Recommended sequencing:

| Sprint | Scope |
|---|---|
| **Sprint 1** | Profile shell, top nav entry, Identity tab read-only with existing data. State model implementation (the 9 states, universal row layout, provenance display). |
| **Sprint 2** | Capabilities tab (existing fields), Certifications tab (existing fields), Digital tab. Edit affordances for `attested` fields. Conflict resolution UI. |
| **Sprint 3** | Positioning tab (entirely new content). Hunter chat elicitation for single-field positioning answers. Inferred-field rendering. |
| **Sprint 4** | Bid Readiness tab (entirely new). New validators: `ein_letter`, `insurance_coi`, `business_phone`. Past Performance tab structured editing. |
| **Sprint 5** | New cert validators (8(a), HUBZone, SDVOSB, WOSB, CMMC, ISO, DCAA). State diversity certs. Bulk import for past performance. AI extraction tied into past performance from cap statement. |
| **Sprint 6** | Mentor History tab. Stale-data refresh policy. Cross-field validation rules. Cohort suggestions in form helpers. |

This roughly aligns with Hunter UX Sprints 1–6 from the v4 PRD. Sprint 1–2 are foundational — must land before Hunter Sprint 3 (which depends on Profile readiness for the matching engine).

---

## Part 10 — Open decisions

### 10.1 Where does the new `Bid Readiness` tab elicitation live?

Currently this doc has the Profile page as the primary surface for editing Bid Readiness. But Grant could elicit these fields on the opportunity detail page during bid memo generation. **Recommendation:** both. Profile is the canonical surface; Grant elicits opportunistically when needed for a specific memo.

### 10.2 How granular should the Bid Readiness "concurrent capacity" field be?

Options:
- (a) Just a number ("how many concurrent contracts max?")
- (b) Number + freeform context
- (c) Per-contract-size capacity ("you can do up to 2 contracts under $1M, but only 1 contract over $1M")

**Recommendation:** (b) for v1. (c) is more accurate but harder to elicit. Track signal from Members and upgrade in v2 if (c) proves valuable.

### 10.3 Should we capture "subcontractor pool size" as a number or as named partners?

Named partners (`teamingPartners[]`) is more precise and useful for Grant's analysis of teaming options. But it's expensive to elicit. **Recommendation:** capture both — a number (band) for capacity signal, plus optional named partners for Grant's deeper diligence. Number first, partners as deeper Grant elicitation.

### 10.4 PSC codes — do we capture them or stick to NAICS?

PSC adds value for matching but Members usually don't know their PSC codes by heart. **Recommendation:** auto-derive PSC from NAICS using a public mapping table; allow Member to refine. Don't elicit PSC directly in v1.

### 10.5 Confidentiality — how do we handle classified past performance?

Some Members have classified past performance they can describe vaguely but can't disclose. **Recommendation:** add a `classified = true` flag separate from `confidential = true`. Classified entries hide ALL fields except a Member-typed sanitized description. Hunter cannot use them for matching (no scope text to embed); Grant can reference them in bid memos for credibility ("you have classified past performance in this domain") without revealing details.

### 10.6 Multi-language profiles for international firms

Out of scope for v1. Federal contracting is English-dominated; SLED in some jurisdictions has Spanish-language portals. Track demand.

### 10.7 Profile sharing (e.g., for proposals or teaming partners)

Could a Member generate a "shareable profile snapshot" PDF for partners, mentors, or proposal teams? Out of scope for v1. Strong candidate for v2.

### 10.8 "Why does this matter?" tooltip authoring

Each field's tooltip is critical microcopy. Authoring needs Sara + Mariam + Sinan input. Suggest a working session before Sprint 1 ship to author all ~80 tooltips.

---

## Part 11 — Success metrics specific to this detailed spec

In addition to the metrics in doc 08 §12, this spec has its own:

### 11.1 Field-level completeness

| Metric | Target |
|---|---|
| % of `missing` Bid Readiness fields completed within 4 weeks of Profile launch | >40% for active Members |
| % of `needs_review` fields confirmed within 7 days of extraction | >70% |
| % of `verified` fields that get edited (downgraded) | <2% — high churn here is a signal of bad extraction |
| Median past performance entries per Member | ≥3 by 8 weeks active |

### 11.2 Validator quality

| Metric | Target |
|---|---|
| New-validator extraction accuracy (manual sample) | >90% |
| `error` rate on first attempt (any new validator) | <5% |
| `fail`-then-retry-success rate | >70% (indicates retry path works) |

### 11.3 Communication quality

| Metric | Target |
|---|---|
| Member-reported confusion in Profile (qualitative interviews) | <10% on tone, <5% on what to do next |
| Profile session length | 8–15 min target — too short = surface unused; too long = friction |
| Profile abandonment mid-edit | <15% per modal |

### 11.4 DFY conversion via Profile

| Metric | Target |
|---|---|
| DFY enrollments originating on Profile | ≥20% of total DFY enrollments by Sprint 6 |
| Aggregated upsell view conversion (% who open it and enroll in ≥1 service) | >15% |

---

## Part 12 — Summary

This doc takes the Business Profile architecture from doc 08 and operationalises it down to the field level:

1. **Nine universal states** define every field's visual and behavioural treatment.
2. **A communication template library** keeps tone consistent across hundreds of small interactions.
3. **A complete field inventory across nine tabs** covers every existing field plus ~30 new fields needed for tier-1 GovCon match quality.
4. **Eleven new validators** extend the existing eight, following the same Trigger/Status/Card/Message pattern from the Roadmap PRD.
5. **Cross-field validation rules** catch impossible combinations early.
6. **AI-driven elicitation patterns** thread Hunter chat as a friendlier alternative to forms for verbal Members.
7. **Edge cases** are handled with documented degradation paths.

The single most important contribution of this doc: **provenance and confidence are first-class on every field**. Members always know where data came from, how confident we are, and what to do about it. No competitor in the GovCon space does this — it's our trust differentiator.

Take this to design + engineering review. Mocks at full fidelity needed for Sprint 1 launch.

---

*End of detailed Business Profile PRD. Owner: Karthik. Distribute to Siddharth, Mariam, Sara, Sinan, Abhinav.*
