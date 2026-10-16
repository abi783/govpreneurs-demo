# Profile v1.1 — Tiered Field Inventory & DFY Discipline

**Product:** GovPreneurs
**Surface:** `/business-profile` + cross-surface field-level behaviour
**Owner:** Karthik (CPO)
**Driver PM:** Siddharth (AI PM)
**Status:** v1.1 — persona-aware refinement of doc 09
**Date:** May 2026
**Companion docs:**
- `09-business-profile-detailed-fields-and-states.md` — the predecessor (this doc layers on top, doesn't replace)
- `08-design-business-profile-and-prerequisite-gating.md` — high-level architecture
- `PRD_ROADMAP_JOURNEY.md` — existing Roadmap (DIY/DFY/Excluded patterns)

---

## 0. What changed and why

Doc 09 specified the full field model — 9 tabs, ~80 fields, 11 new validators, state machines for every value. The criticism that triggered this revision:

> *"Our persona is small businesses pursuing government contracts for the first time. They may not have most of these set up. Don't overwhelm. Only offer DFY where we have a service today."*

That's correct. Doc 09 was specced as if every Member already had a bonding line, a CMMC certification, an ISO audit, and a registered GSA Schedule — none of which describes Marcus, our actual buyer. It also offered DFY upsells for services that don't exist yet (we don't run a CMMC consulting practice; we don't have a bonding-line introducer service).

This doc fixes two things:

1. **Tiers every field by what a first-time GovCon Member can realistically have.** Three tiers: T1 absolutely necessary, T2 good to have, T3 advanced. Progressive disclosure on the Profile page so T3 fields don't even render until a Member opens an advanced section.

2. **Disciplines DFY upsells to the real GovPreneurs service catalog.** Only the nine services we actually offer get DFY buttons. Every other gap shows DIY only.

Everything else in doc 09 — the 9-state model, the communication templates, the validation conventions, the conflict resolution flow — stays the same. This doc is a refinement, not a rewrite.

---

## Part 1 — Persona reality check

Doc 09's field inventory implicitly assumed an established federal contractor. The real Member at signup looks like this:

| Attribute | Most Members at signup |
|---|---|
| Federal contracting experience | None or minimal |
| LLC formed | Yes (usually) |
| EIN | Yes (usually — has commercial business) |
| Bank account, business credit | Yes |
| SAM.gov registered | **Often no** |
| UEI / CAGE | **Often no** (gated on SAM) |
| Capability statement | **Often no, or out of date** |
| Past federal performance | **None** (commercial work only) |
| Past commercial performance | Some — variable depth |
| Website | Sometimes, often weak |
| Custom email domain | Sometimes — many use gmail.com |
| DSBS / SBS profile | **Almost never** |
| State / SLED vendor registrations | **Almost never** |
| Bonding line | **Almost never** |
| Insurance (general liability) | Usually yes (basic) |
| Set-aside certifications | Some (SDVOSB if applicable; 8(a) is rare) |
| CMMC, ISO, SOC 2 | **Almost never** |
| DCAA-compliant accounting | **Almost never** |
| GSA Schedule / GWACs / BPAs | **Almost never** |
| Past performance — structured records | None they can articulate without help |
| Target agencies | Vague — "the military maybe" |
| Target contract value range | Wild guess — "anything I can win" |
| Win themes articulated | No |
| Concurrent contract capacity | Never thought about it |
| Cash flow tolerance | Knows what their bank account looks like |
| Mentor-Protégé arrangement | No |
| Teaming partners | "Some folks I know" |

**The implication.** Showing Marcus a Profile page with 80 mostly-empty fields is the wrong opening move. He'll bounce.

The Profile should feel **manageable on day one** — five to ten fields he can engage with, with a clear sense of what's enough to start getting opportunities flowing. Everything else exists, but doesn't intrude until later — either because Hunter has earned enough trust to elicit more, or because Marcus has graduated to a more sophisticated stage and wants to add advanced data himself.

---

## Part 2 — The three tiers

Every field on the Profile page is assigned one of three tiers. The tier determines visual placement and whether it surfaces in Hunter's nudges.

### 2.1 Tier 1 — Absolutely necessary

Definition: **without these, the product cannot do its core job for the Member.** Hunter can't surface any opportunity. The Member can't bid on what Hunter does surface. The matching engine has no signal.

Visual treatment: **rendered at the top of every section, always visible, prominent.** These are the rows the Profile page leads with.

Hunter behaviour: **Hunter's embed actively nudges to complete T1 gaps.** The Readiness Header's "you're ready to bid on" line is computed against T1 only.

T1 fields total: **roughly 12 across all sections.** That's all.

### 2.2 Tier 2 — Good to have for better recommendation

Definition: **with these, Hunter ranks better, Grant analyses deeper, Ava drafts richer.** Match quality improves measurably. None gates bidding by itself.

Visual treatment: **rendered below T1, also visible by default, but visually lighter** (smaller label weight, less prominent state indicators).

Hunter behaviour: **Hunter surfaces T2 gaps gently in the "could match better with" line of the Readiness Header, one or two at a time.** The Hunter embed offers them as the "would help" prompt when relevant. No alarm, no pressure.

T2 fields total: **roughly 25 across all sections.**

### 2.3 Tier 3 — Advanced for advanced

Definition: **fields that sophisticated Members already have and want to track, but most first-timers don't.** Bonding capacity. CMMC level. GSA Schedules. ISO certifications. DCAA-compliant accounting.

Visual treatment: **hidden by default behind a "Show advanced fields" disclosure at the bottom of each section.** Members who want to surface them — sophisticated Members or those graduating into more complex contracts — open the disclosure. The disclosure persists across sessions per Member.

Hunter behaviour: **Hunter never nudges for T3 gaps.** The Readiness Header doesn't surface them. The Hunter embed doesn't suggest them. T3 fields exist for Members who fill them deliberately; they don't haunt anyone who doesn't.

T3 fields total: **roughly 30 across all sections.**

### 2.4 The progressive-disclosure pattern within each tab

```
┌──────────────────────────────────────────────────────────────────┐
│  IDENTITY                                                        │
│                                                                  │
│  ── Tier 1 ──                                                    │
│  Legal Name              ●  Williams Construction LLC            │
│  EIN                     ●  12-3456789                           │
│  UEI                     ●  ABC123XYZ456                         │
│  CAGE                    ●  5W7X3                                │
│  SAM Status              ●  Active until 2027-04-15              │
│                                                                  │
│  ── Tier 2 ──                                                    │
│  Entity Type             ○  LLC                                  │
│  Formation State         ○  Texas                                │
│  Physical Address        ○  500 Main St, Houston, TX 77001       │
│  Business Phone          —  Not provided yet                     │
│                                                                  │
│  ▾ Show advanced fields (5 hidden)                               │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  Identity progress: 8 of 9 essentials complete                   │
│  This section unlocks: most federal opportunities                │
└──────────────────────────────────────────────────────────────────┘
```

The "Show advanced fields" disclosure reveals: Formation Date, Registered Agent details, Mailing Address (if different), LinkedIn profile, Years in Business (computed).

### 2.5 The single tier-summary table

Here's the master table — every field, every tab, every tier. This is the contract Engineering and Design should build against.

| Section | Tier 1 (must) | Tier 2 (helps) | Tier 3 (advanced) |
|---|---|---|---|
| **Identity** | Legal Name, EIN, UEI, CAGE, SAM Status | Entity Type, Formation State, Physical Address, Business Phone | Formation Date, Registered Agent, Mailing Address, LinkedIn, Years in Business |
| **Capabilities** | Primary NAICS, Core Capabilities (≥1) | Secondary NAICS, Differentiators, Past Performance (≥1 entry) | PSC Codes, Keywords/Skills, Clearance Levels, Vehicles Held (GSA/GWAC/IDIQ/BPA), DCAA-Compliant Accounting |
| **Certifications** | SAM Business Types, Small Biz Status (both auto from SAM) | DSBS Profile URL | 8(a) cert document, HUBZone cert document, SDVOSB DD-214, WOSB/EDWOSB cert document, CMMC Level, ISO certifications, SOC 2 report, State Diversity Certifications |
| **Digital** | — *(nothing here is T1)* | Website, Custom Email Domain | A2P Brand ID, Website Audit Findings (computed), GHL signals (synced) |
| **SLED** | — *(T1 only if Member is targeting SLED — see §2.6)* | SLED Registrations (per target state), SLED Target States | State Tax IDs, Insurance Certificates per State |
| **Positioning** | Target Contract Value Range, Geographic Preference (basic), Set-aside Hunger | Target Agencies, Notification Cadence, Win Themes | NAICS Targeting Priorities (rank), Agencies to Avoid, Key Personnel Highlight |
| **Bid Readiness** | — *(no T1; Member can bid without any of these)* | Annual Revenue Band, Total Employees (W-2), Insurance — basic (yes/no + GL limit), Concurrent Contract Capacity (rough) | Cash Flow Tolerance (detail), Bonding Capability (detail), Insurance — per coverage type, Risk Appetite, Competitors Known, Teaming Partners, Bid/No-Bid Deal-Breakers, Subcontractor Pool Size, Mentor-Protégé Agreement, Joint Ventures |
| **Past Performance** | — *(addressed by ≥1 entry in Capabilities T2)* | Per-entry: Customer Name, Customer Type, Contract Type, Period, Total Value, Role, Scope Description | Per-entry: Contract Number, Sub-percentage, Reference POC (full contact), CPARS Rating, Vehicle, Successful flag, Confidential/Classified flags, Supporting Documents |
| **Mentor History** | — | Past Mentor Sessions (auto), Session Takeaways | Active Mentor-Protégé Relationship details |

**Total: ~12 T1 fields, ~25 T2 fields, ~30 T3 fields.**

### 2.6 SLED is conditional

The SLED tab's tier behaviour is special: if the Member's `geographicPreference.scope` includes any SLED target, **SLED Registrations get promoted to T1** for those states. Otherwise the entire SLED tab is collapsed by default. A Member targeting only federal work shouldn't see SLED registration nudges.

### 2.7 Bid Readiness tab — lean by default

In doc 09 I specced an 11-field Bid Readiness tab. After re-tiering, only 4 fields are T2 (basic revenue/employees/insurance flag/rough capacity). The rest are T3.

The tab still exists — Grant needs the data model. But on day one for a Member, the tab looks like this:

```
┌──────────────────────────────────────────────────────────────────┐
│  BID READINESS                                                   │
│                                                                  │
│  Annual Revenue Band         —  Not provided yet                 │
│  Total Employees (W-2)       —  Not provided yet                 │
│  Basic Insurance             —  Not provided yet                 │
│  Concurrent Contract Capacity —  Not provided yet                │
│                                                                  │
│  ▾ Show advanced fields (10 hidden)                              │
│                                                                  │
│  Bid Readiness progress: 0 of 4 essentials                       │
│  This section unlocks: Grant's deeper bid memos                  │
└──────────────────────────────────────────────────────────────────┘
```

Four fields. Lean. Grant fills the rest opportunistically when needed for specific bids.

---

## Part 3 — DFY discipline

### 3.1 The principle

> **Only fields with a real, sellable GovPreneurs DFY service get a DFY upsell.** Every other gap shows "Add now" only. We don't invent services to monetise.

This is a tone shift from doc 09. We optimise for trust — every DFY button needs to lead to a real service the Member can buy and that we can deliver. Pretending we have a "Bonding Setup DFY" when we don't is a credibility leak; the Member who clicks and finds nothing concrete will trust the product less.

### 3.2 The actual DFY service catalog (per govpreneurs.com/services)

The current GovPreneurs catalog is nine services:

| DFY Service | Price | Type |
|---|---|---|
| LLC Application | $600 | One-time |
| SAM.gov Registration | $2,997 | One-time |
| Capability Statement | $2,000 | One-time |
| SBS Visibility Setup | $997 | One-time |
| SLED Enrollment | $2,497 | One-time (per state, presumably) |
| GovCompliant Digital Setup (website, email, phone) | $2,997 | Subscription |
| Profile Maintenance & Compliance Alerts | $290 | Subscription |
| Custom Roadmap | $1,997 | One-time |
| Prime Contractor Registration | $175 | One-time |

### 3.3 Service-to-field mapping

The mapping between each service and the Profile fields it fills:

| Service | Fields populated post-delivery |
|---|---|
| LLC Application | `legalName`, `entityType`, `formationState`, `formationDate`, `registeredAgent*` (after state issues Articles) — and triggers downstream EIN and SOS workflows |
| SAM.gov Registration | `UEI`, `CAGE`, `samRegistrationStatus`, `samExpiresAt`, `samBusinessTypes[]`, `samSmallBusinessFlag`, `primaryNaics`, parts of `physicalAddress`/`mailingAddress` |
| Capability Statement | Creates the `capabilityStatementUrl`; extraction then populates `coreCapabilities[]`, `differentiators[]`, and initial `pastPerformance[]` entries |
| SBS Visibility Setup | `dsbsProfileUrl`, refreshed `samBusinessTypes[]` visibility |
| SLED Enrollment | Adds entries to `sledRegistrations[]` — per state delivered |
| GovCompliant Digital Setup | `website`, `customEmailDomain` (+ `emailMxRecords`, `emailSpfPresent`), `businessPhoneNumber` |
| Profile Maintenance & Compliance Alerts | (Meta service — runs re-verification on cached/stale fields, alerts on amendments and renewals) |
| Custom Roadmap | (Meta service — DFY consulting on the Roadmap journey itself) |
| Prime Contractor Registration | (Specific service — likely a particular state or vehicle registration; flag for clarification per §10.1) |

### 3.4 The DFY upsell rendering rule

For every field on the Profile page, render DFY buttons by this rule:

```
IF field is `missing` OR `error`:
  show "[Add now]"
  IF the field maps to a service in the catalog above:
    also show "[Have us do it — $<price>]"

IF field is `verified`/`needs_review`/`attested`/`inferred`/`stale`:
  show "[Edit]" / "[Confirm]" / "[Re-verify]" as relevant
  do NOT show DFY upsell unless field is `error` or `missing`
```

Three corollaries:

1. **EIN, bonding, insurance, CMMC, ISO, set-aside cert documents, vehicles held, DCAA — none of these get DFY buttons.** These are advisory-only fields. The Member fills them themselves (or doesn't, until they do).

2. **Some DFY services span multiple fields** (Digital Setup covers three; Capability Statement covers three through extraction). For these, the DFY upsell appears on the **lead field** (the most representative) and is referenced (not repeated) on the others. E.g.:
   - Website row: *"[Add manually] [Have us set up your website, email, and phone — $2,997]"*
   - Email row: *"[Add manually] [Includes our GovCompliant Digital Setup above]"* — linking to the same service, not duplicating the button.

3. **Subscription services get a different button visual** to signal recurring cost — secondary button styling with a "/mo" or "/yr" suffix in the label.

### 3.5 The aggregated upsell view — recomputed from the real catalog

The Readiness Header's *"[Resolve gaps with DFY services]"* CTA opens an aggregated panel. After this revision, the panel only shows services that exist:

```
┌──────────────────────────────────────────────────────────────────┐
│  Resolve your gaps with our services                             │
│                                                                  │
│  Pick what you want done for you. Sorted by what unlocks         │
│  the most for you right now.                                     │
│                                                                  │
│  ☐ SAM.gov Registration                                $2,997    │
│    → Unlocks ~250 federal opportunities                          │
│                                                                  │
│  ☐ Capability Statement                                $2,000    │
│    → Improves Hunter's match quality across the board            │
│    → Also adds your past performance entries                     │
│                                                                  │
│  ☐ GovCompliant Digital Setup                          $2,997    │
│    → Website + email domain + business phone in one              │
│                                                                  │
│  ☐ SBS Visibility Setup                                  $997    │
│    → Builds your DSBS profile so federal buyers can find you     │
│                                                                  │
│  ☐ SLED Enrollment — Texas                             $2,497    │
│    → Unlocks ~84 SLED opportunities in Texas                     │
│                                                                  │
│  Total: $X,XXX  (pick individual services above)                 │
│                                                                  │
│  [Enroll selected]                                               │
└──────────────────────────────────────────────────────────────────┘
```

What's gone from doc 09's version of this panel: the imaginary "Bonding Line Setup," "CMMC Consulting," "Insurance Compilation," "Past Performance Drafting" services. None of them exist; they're not in the panel.

What's added: the SLED Enrollment line is dynamically scoped to states the Member has marked as targets. The other services appear only if the relevant field is missing or stale.

### 3.6 Suppression — services in flight, already enrolled, or declined

- **Service already delivered:** the upsell is gone; the field renders as verified/attested with delivery provenance.
- **Service enrolled but pending delivery:** the field renders in `pending_dfy` state (per doc 09 §3.3.8); no upsell button.
- **Member declined the service 3 times for the same gap:** suppress the DFY upsell for 30 days; show DIY only. (Per doc 09 §8.7.)

---

## Part 4 — The cold-start journey for Marcus

Concretely, what does a brand-new Marcus see when he opens Business Profile for the first time?

### 4.1 Marcus's starting state

- LLC formed (Williams Construction LLC, Texas)
- EIN issued
- Bank account, basic insurance (general liability $1M)
- No SAM.gov registration
- No website
- gmail.com email
- Some commercial past performance — 4 projects he could describe
- Believes he's an SDVOSB (he's a service-disabled veteran)
- No idea what UEI, CAGE, DSBS, or NAICS even mean

### 4.2 What the Readiness Header says on day one

```
You're ready to bid on:    0 federal · 0 SLED
Not yet ready for:         most federal (need SAM.gov) · SLED (no state registrations)
Hunter could match better with:  your industry (NAICS), your value range

[Open Roadmap]   [Resolve gaps with DFY services]
```

Brutal honesty — but with paths. Three actions visible on the first screen.

### 4.3 What Profile sections look like

Marcus lands on **Positioning** by default (per doc 08 §4.10 cold-start rule). Why? Because Positioning needs human input — it can't be auto-populated from any document. SAM and entity stuff are downstream of Hank's onboarding.

The Positioning tab shows:

```
┌──────────────────────────────────────────────────────────────────┐
│  POSITIONING                                                     │
│                                                                  │
│  ── Tier 1 ──                                                    │
│  Target Contract Value Range  —  Not provided yet                │
│    Tell Hunter the size of contracts you actually want to bid on │
│    [Tell us]  [Help me think — talk to Hunter]                   │
│                                                                  │
│  Geographic Preference       —  Not provided yet                 │
│    Where can you actually deliver work?                          │
│    [Tell us]  [I work in Texas only]                             │
│                                                                  │
│  Set-aside Appetite         —  Not provided yet                  │
│    Some contracts are reserved for certified firms (SDVOSB,      │
│    WOSB, 8(a), HUBZone). Others are open to everyone.            │
│    [Tell us]                                                     │
│                                                                  │
│  ── Tier 2 ──                                                    │
│  Target Agencies              ○  Cast a wide net (default)       │
│  Notification Cadence         ○  Weekly digest (default)         │
│  Win Themes                   —  Not provided yet                │
│                                                                  │
│  ▾ Show advanced fields (3 hidden)                               │
│                                                                  │
│  Positioning progress: 0 of 3 essentials complete                │
│  This is the highest-impact section for Hunter's match quality.  │
└──────────────────────────────────────────────────────────────────┘
```

Three T1 fields with quick-answer chips. Two T2 fields with sensible defaults. Three T3 fields hidden. Marcus can complete the visible Positioning essentials in 3–4 minutes — clicks on "Tell us" for value range, gets a chip-picker ($250K–$1M / $1M–$5M / etc.), picks one; clicks "I work in Texas only" and is done with geography; for set-aside hunger he gets a one-tap *"I want set-asides only / both / no set-asides"* picker.

### 4.4 What Marcus does next — and how the experience nudges him

After Positioning, Marcus glances at **Identity**. He sees:

```
Legal Name          ●  Williams Construction LLC   (verified)
EIN                 —  Not provided yet
                       Federal tax ID. Required for most federal contracts.
                       [Add manually]
UEI                 —  Not yet — you'll get one when you complete SAM.gov
                       [Start SAM.gov registration]  [Have us do it — $2,997]
CAGE                —  Comes with SAM.gov
SAM Status          —  Not registered
                       [Start SAM.gov registration]  [Have us do it — $2,997]
```

He types his EIN in 20 seconds. He sees SAM.gov has a DFY option at $2,997. He could click and enrol — or he could go to the Roadmap to do it himself.

Either way, his profile is meaningfully populated. Hunter starts ranking opportunities. The Readiness Header updates.

### 4.5 The next 30 days

| Day | What happens |
|---|---|
| Day 1 | Marcus completes Positioning T1 (3 fields), Identity T1 EIN (1 field) — 4 fields in ~10 minutes |
| Day 3 | SAM.gov registration delivered (whether DIY or DFY) — UEI, CAGE, SAM Status, business types, primary NAICS all flip to verified |
| Day 4 | Marcus uploads a capability statement; needs_review for `coreCapabilities[]`, `differentiators[]`, 2 past performance entries; he confirms all |
| Day 7 | Hunter has surfaced 12 strong matches; Marcus clicks into one; Hunter embed nudges *"Tell me your concurrent contract capacity — Grant uses this for the bid memo on this one"*; Marcus types "1 contract" in chat; Bid Readiness gets one T2 field |
| Day 14 | Stale-data check triggers SOS re-verify; Marcus does it (10 seconds); Hunter notices Marcus has saved 3 USACE opps and prompts *"Want to target USACE specifically?"*; Marcus says yes — Target Agencies fills |
| Day 30 | Profile has ~15 fields filled (all T1, half of T2, none of T3). That's enough. Hunter has reliable signal. Grant can run memos. Ava can draft. Marcus has spent maybe 30 minutes total in Profile across the month. |

That's the goal trajectory. Compare to doc 09's implicit ask of "fill 80 fields" — clearly intractable.

---

## Part 5 — What changed from doc 09

A precise diff for the engineering and design teams.

### 5.1 Fields demoted to T3 (hidden by default)

These fields stay in the data model but live under "Show advanced fields" disclosure. Most first-timers don't have them; Hunter doesn't nudge for them.

| Field | Old (doc 09) | New (this doc) |
|---|---|---|
| PSC Codes | Top-level in Capabilities | T3 — hidden |
| Clearance Levels Held | Top-level | T3 |
| Vehicles Held (GSA/GWAC/IDIQ/BPA) | Top-level | T3 |
| DCAA-Compliant Accounting | Top-level | T3 |
| 8(a) cert document | Top-level | T3 — keep document upload but hidden |
| HUBZone cert document | Top-level | T3 |
| SDVOSB DD-214 | Top-level | T3 |
| WOSB/EDWOSB cert document | Top-level | T3 |
| CMMC Level | Top-level | T3 |
| ISO Certifications | Top-level | T3 |
| SOC 2 Report | Top-level | T3 |
| State Diversity Certifications | Top-level | T3 |
| Bonding Capability (detail) | Top-level | T3 |
| Insurance — per coverage type | Top-level (5+ types) | T3 (only basic GL stays T2) |
| Risk Appetite | Top-level | T3 |
| Competitors Known | Top-level | T3 — Grant elicits opportunistically |
| Teaming Partners | Top-level | T3 — Grant elicits opportunistically |
| Bid/No-Bid Deal-Breakers | Top-level | T3 |
| Subcontractor Pool Size | Top-level | T3 |
| Mentor-Protégé Agreement | Top-level | T3 |
| Past Performance — Reference POC full contact | Required-ish | T3 (project-level basics stay T2) |
| Past Performance — CPARS Rating | Top-level | T3 |
| Past Performance — Confidential/Classified flags | Top-level | T3 |
| Past Performance — Supporting Documents | Top-level | T3 |
| Past Performance — Contract Number | Top-level | T3 |
| Past Performance — Vehicle (per entry) | Top-level | T3 |
| Past Performance — Sub-percentage | Top-level | T3 |

### 5.2 Fields whose validators are deferred to v2+

In doc 09 I proposed 11 new validators. After tiering, several aren't needed in v1 because the field becomes attestation-only (no document upload required for first-timers). Deferred:

| Validator | Old plan | New plan |
|---|---|---|
| `eighta_certification` | New PDF validator in v1 | Deferred — attestation only in v1; rely on SAM business types |
| `hubzone_certification` | New PDF validator in v1 | Deferred — same |
| `sdvosb_dd214` | New PDF validator in v1 | Deferred — same |
| `wosb_certification` | New PDF validator in v1 | Deferred — same |
| `cmmc_certification` | New PDF validator in v1 | Deferred — attestation only |
| `iso_certification` | New PDF validator in v1 | Deferred — attestation only |
| `dcaa_audit` | New PDF validator in v1 | Deferred — boolean attestation only |
| `insurance_coi` | New PDF validator in v1 | Deferred — basic limit attestation only in v1 |
| `state_diversity_cert` | New PDF validator in v1 | Deferred — attestation only |

### 5.3 Validators still proposed for v1

| Validator | Purpose |
|---|---|
| `ein_letter` | Validate IRS CP-575 letter + extract EIN (T1 field; valuable to verify) |
| `business_phone` | Format check + optional reverse lookup (T2 field; lightweight) |

Two new validators in v1 instead of eleven. Significant simplification.

### 5.4 DFY upsells removed

Doc 09 referenced DFY upsells that don't exist. Removed:

| Old "DFY upsell" | Reality |
|---|---|
| "Have us do your EIN — $97" | No such service. Field is DIY only. |
| "Have us assess DCAA compliance — $497" | No such service. T3 attestation only. |
| "Have us connect you with a bonding company — $97" | No such service. T3 attestation only. |
| "Have us set up your CMMC — $1,497" | No such service. T3 attestation only. |
| "Have us file your insurance COI — $97" | No such service. T3 attestation only. |
| "Have us write your past performance entries — $X" | No such service (Capability Statement DFY covers extraction). |
| "Have us register you with multiple SLED states at once — bundle" | We don't have a bundle SKU today. SLED Enrollment is per-state at $2,497. |
| "Have us prepare your DBE/MBE/WBE application — $X" | No such service. T3 attestation only. |

### 5.5 DFY upsells that are correct and remain

| Field | DFY upsell |
|---|---|
| `legalName`/`entityType`/`formationState` (when LLC not yet formed) | LLC Application — $600 |
| `UEI`/`CAGE`/`samRegistrationStatus` (when SAM not done) | SAM.gov Registration — $2,997 |
| `capabilityStatementUrl` + `coreCapabilities[]` + `differentiators[]` + `pastPerformance[]` initial | Capability Statement — $2,000 |
| `dsbsProfileUrl` | SBS Visibility Setup — $997 |
| `sledRegistrations[]` per target state | SLED Enrollment — $2,497 |
| `website` + `customEmailDomain` + `businessPhoneNumber` | GovCompliant Digital Setup — $2,997 |
| Stale fields (SAM re-verify, SOS re-verify, etc.) | Profile Maintenance & Compliance Alerts — $290/mo |

### 5.6 Tabs unchanged

- The 9 tabs from doc 09 (Identity, Capabilities, Certifications, Digital, SLED, Positioning, Bid Readiness, Past Performance, Mentor History) are preserved.
- The state model (9 states) from doc 09 §3 is preserved.
- The communication templates from doc 09 §4 are preserved.
- The conflict resolution flow from doc 09 §6.5 is preserved.

---

## Part 6 — Hunter embed behaviour with tiered fields

Doc 08 §5 specified the Hunter embed: a right-rail panel showing "Hunter knows you" + "one thing would help." With tiered fields, the embed behaviour gets sharper:

### 6.1 The "would help" slot — strict tier priority

The embed surfaces one gap at a time. The priority order:

1. **T1 gaps that hard-gate the most opportunities** (e.g., missing SAM.gov)
2. **T1 gaps that gate matching at all** (e.g., missing Target Value Range)
3. **T2 gaps that would lift match quality by ≥10%** (e.g., no past performance entries, no capability statement)
4. **T2 gaps that improve specific opportunity classes** (e.g., no SLED registration when targeting SLED)

T3 gaps are **never** surfaced by the embed. Period.

### 6.2 The "knows you" slot — show what's actually populated

The 3–5 "knows you" facts in the embed pull from the highest-confidence fields available, regardless of tier. Day-one Marcus might see:

```
Hunter knows you                          ▴

✓ Williams Construction LLC (Texas)
✓ Targeting USACE work
✓ Value range $250K – $1M
✓ Set-asides preferred (SDVOSB)

+1 thing would help me match better:

Your industry (NAICS code)
"Without your NAICS, I'm matching on general scope only.
SAM gives us this when you register — would unlock real
matching."

[Start SAM.gov registration] [Have us do it — $2,997]
```

Note: the embed surfaces only T1+T2 facts. Even if Marcus opens a T3 field and fills CMMC Level: 2, that won't appear in "knows you" — it's a gritty detail Hunter uses behind the scenes, not a headline.

### 6.3 Contextual T2 nudges remain proactive

Per doc 08 §5.7, the embed expands proactively when context warrants. After tiering:

- Member dismisses 3+ opps with reason "wrong size" → expand with Target Value Range (T1) prompt — *fast path*
- Member saves 3+ opps at the same agency → expand with Target Agencies (T2) prompt — *gentle path*
- Member views a construction opp with bonding requirement → embed does **not** ask about bonding (T3); instead Grant flags the bonding requirement on the opportunity detail page and lets the Member self-attest if relevant

---

## Part 7 — Readiness Header with tiering

The Readiness Header (per doc 08 §4.3) is the most important real estate on the Profile page. Tiering changes what each line surfaces:

### 7.1 The three lines, re-specified

**Line 1: "You're ready to bid on..."**
- Computed against **T1 only.** All T1 fields complete for federal → "ready to bid on federal."
- T2/T3 gaps never reduce this count.

**Line 2: "Not yet ready for..."**
- Specific T1 gaps blocking specific opportunity classes.
- Examples:
  - *"set-aside contracts (need SAM business type)"*
  - *"SLED in Texas (no state registration)"*
  - *"most federal (no SAM.gov registration)"*

**Line 3: "Hunter could match better with..."**
- **T2 gaps only**, ranked by impact (how many matches improve, by how much).
- Surfaces 1–3 items at a time.
- Each clickable → inline edit OR Hunter chat thread OR Roadmap deep-link.
- Examples:
  - *"a capability statement (improves match across the board)"*
  - *"target agencies (we'll prioritise them in your feed)"*
  - *"a few past projects (Grant uses these in bid memos)"*

T3 fields **never** appear in this header. A Member who completes all T1 + T2 will see Line 3 say: *"You're well-matched. Hunter has what it needs. (Show advanced fields if you want to add more.)"*

### 7.2 The aggregated DFY CTA — only when applicable

The *"[Resolve gaps with DFY services]"* button only appears when at least one gap has a corresponding DFY service. If a Member has completed all DFY-resolvable gaps but is missing only non-DFY fields (e.g., positioning, bonding), the CTA is replaced with *"[Open Roadmap]"* — focusing the Member on the DIY path.

---

## Part 8 — Communication patterns refined for tiers

The communication templates from doc 09 §4 stay. Two refinements for tiered fields:

### 8.1 T1 empty-state — clear urgency, never pressure

```
[Field name]
[One sentence explaining what this unlocks — outcome-framed]
[Add now] [DFY option only if real service exists]
```

Example:
```
Target Contract Value Range  —  Not provided yet
The size of contracts you actually want. Hunter needs this to stop
showing you ones that are too big or too small.
[Tell us]  [Help me think — talk to Hunter]
```

Note: no DFY here because no "Target Value Range DFY" exists. Just Add + chat help.

### 8.2 T2 empty-state — softer framing

```
[Field name]
[Optional outcome line]
[Add when ready]
```

Example:
```
Win Themes                 —  Not provided yet
Why customers pick you. Helps Ava draft proposals.
[Add when ready]  [Talk it through with Hunter]
```

No urgency. No DFY (no service for this). Available, not pushed.

### 8.3 T3 empty-state — neutral, brief

When a Member opens the "Show advanced fields" disclosure, T3 fields render with minimal copy:

```
Bonding Capability         —  Not provided yet     [Add]
```

That's it. One line. Outcome framing only if hover/tap. T3 fields are for Members who know what they're entering; explanatory copy would patronize them.

---

## Part 9 — Implementation impact on existing onboarding

The existing Roadmap onboarding (per `PRD_ROADMAP_JOURNEY.md`) elicits a subset of Profile fields through verification panels. After tiering, the Roadmap should align:

### 9.1 Roadmap sub-step priorities (mapped to tiers)

| Roadmap sub-step | Fields | Tier in Profile |
|---|---|---|
| Form an LLC | `legalName`, `entityType`, `formationState`, Articles upload | T1 (auto-promotes via LLC verification) |
| Get an EIN | `EIN` | T1 |
| Register on SAM.gov | `UEI`, `CAGE`, `samRegistrationStatus`, `samBusinessTypes`, `primaryNaics`, `samExpiresAt` | T1 |
| Get a CAGE Code | (covered by SAM) | T1 |
| Verify Secretary of State | `sosId`, `sosStatus` | T2 |
| Create a Capability Statement | `capabilityStatementUrl` + extractions | T2 |
| Build a website | `website` + audit findings | T2 |
| Set up custom email | `customEmailDomain` + DNS check | T2 |
| Set up A2P | `a2pBrandId` | T3 |
| SBS Visibility | `dsbsProfileUrl` | T2 |
| SLED Registrations | `sledRegistrations[]` | Conditional T1 / T2 (per §2.6) |

The Roadmap journey itself can be visualized to show *"Step 1: Register (T1 — get bid-ready). Step 2: Get Visible (T2 — improve credibility and match quality). Step 3: Advanced (T3 — for more sophisticated bidding)."* This aligns the Roadmap's journey framing with Profile's tiering.

### 9.2 Field promotion rule

When a Roadmap sub-step's verification panel passes:
- The fields populate at `verified` confidence (per existing convention).
- The Profile page reflects this immediately.
- The tier doesn't change — a T2 field that gets verified is still T2; the verification just upgrades its confidence.

---

## Part 10 — Open decisions

### 10.1 Prime Contractor Registration — what does this service do?

The catalog lists *Prime Contractor Registration* at $175. It's the cheapest service and the only one I can't confidently map to specific Profile fields. **Question for Tim/Sara:** is this a state-level registration, a vehicle-specific registration, or something else? Once clarified, map to the right field(s).

### 10.2 SLED Enrollment — per-state vs. bundle

Each SLED state needs its own registration. The DFY service is $2,497. **Question:** is this per-state, or bundled across multiple states for one fee? My assumption is per-state. If it's bundled, the aggregated upsell view should reflect that. If per-state, we should consider whether a multi-state bundle SKU would help Members targeting 3+ states.

### 10.3 GovCompliant Digital Setup — subscription vs. one-time

The catalog lists it as Subscription. **Question:** does the subscription include ongoing maintenance (renewals, DNS monitoring, email deliverability) or is the subscription model just for billing convenience? This affects how we frame the upsell — *"$2,997 setup + monthly maintenance"* vs *"$2,997 one-time, with optional Profile Maintenance at $290/mo."*

### 10.4 Should Bid Readiness be a separate tab in v1?

After re-tiering, Bid Readiness has only 4 T2 fields visible. Options:

**(a) Keep as separate tab** — predictable IA; Grant has a clear home.
**(b) Fold the 4 T2 fields into Positioning** — fewer tabs; aligns with the Member's mental model of "who I am as a bidder."
**(c) Hide the tab unless a Bid Memo has been generated** — emergent IA; only sophisticated Members see it.

**My recommendation:** (a) keep separate. Grant needs a home. But name the tab *"Bidder Profile"* instead of "Bid Readiness" — softer, less audit-y. Members understand "this is about me as a bidder," not "are you ready to be audited."

### 10.5 What's the trigger to surface T3 to a Member?

Right now T3 lives behind "Show advanced fields." Should we ever proactively prompt a Member to look at T3? Options:

**(a) Never proactive — Member opens it themselves.** Simplest. Trusts Member's instincts.
**(b) Prompt when Member wins their first contract.** Earning the right to upsell — "now that you're working federal contracts, here's deeper data we should capture."
**(c) Prompt when Member's profile is otherwise complete (all T1+T2 done).** Reward for completion.

**My recommendation:** (c) — gentle prompt at completion. Banner: *"You've completed the essentials and the recommendations. Want to add advanced details? It helps Grant write deeper memos."*

### 10.6 Should we add a "Member experience level" self-assessment at signup?

If we know a Member is sophisticated (e.g., has past federal performance, has a GSA Schedule, has set-asides), we could default-open T3 for them. **Recommendation:** infer rather than ask. If onboarding extracts past federal contracts, vehicles held, or specific certs, auto-open the relevant T3 sub-sections. No self-rating dropdown.

---

## Part 11 — Success metrics (refined)

The metrics from doc 09 §11 and doc 08 §12 still apply. After tiering, add or refine:

### 11.1 Tier-aware completion metrics

| Metric | Target |
|---|---|
| % of active Members with all T1 fields complete by week 2 | >75% |
| % of active Members with ≥80% of T2 fields complete by week 6 | >50% |
| % of Members who ever open "Show advanced fields" | >20% (sign of healthy depth) |
| Average T3 fields completed per Member who opens advanced | >3 |

### 11.2 DFY conversion — disciplined

| Metric | Target |
|---|---|
| % of Members who view the DFY aggregated panel | >40% in first 4 weeks |
| % who enrol in ≥1 service from the panel | >15% |
| DFY revenue per Profile MAU | Tracked, target set after baseline |
| DFY upsell-to-completion conversion (clicked Have us do it → completed enrollment) | >50% |
| **Member-reported confusion about a DFY service they couldn't find / understand** | <2% (after this fix, should be near zero — no imaginary services) |

### 11.3 Tone and clarity

| Metric | Target |
|---|---|
| Member-reported feeling of "this is too much" in first session (qualitative) | <10% (was the concern that drove this revision) |
| Profile session 1 length (median) | 5–10 min (down from doc 09's implicit 20–30 min) |
| % of Members who return to Profile within 7 days | >40% (sign that Profile is sticky, not overwhelming) |

---

## Part 12 — Summary

Three things this revision establishes:

1. **Field tiering. Tier 1 must, Tier 2 helps, Tier 3 advanced.** Profile renders T1 first, T2 below, T3 collapsed. Hunter's nudges only surface T1 and T2. ~12 T1 fields total — that's the entire "this is what we need to start matching for you" surface area.

2. **DFY discipline. Only real services get DFY buttons.** Nine services exist; ~10 fields map to them. Every other gap is DIY-only. The aggregated upsell view shows real services with real prices.

3. **Cold-start journey designed for a real first-timer.** Marcus completes 4 fields on day 1 in under 10 minutes, has SAM done by day 3, has 15 fields filled by day 30 — all without ever opening "Show advanced fields." That's the trajectory. Anything more aggressive overshoots the persona.

Everything else from doc 09 — the 9-state model, the universal row layout, the communication templates, the validator conventions, the conflict resolution flow, the new validators we *did* keep (`ein_letter`, `business_phone`) — stays. This doc is a refinement, not a rewrite.

The single most important downstream effect: the Profile page on day one should feel **manageable**, not exhaustive. A first-time GovCon Member should look at it and think *"OK, I can do this"* — not *"there are 80 fields and I've never heard of half of them, I'll come back later."* That's the discipline this revision encodes.

---

*End of v1.1. Take this to Tim, Sara, Mariam, Siddharth, Abhinav. Sprint 1 build should reflect this tiering from day one — re-tiering after build is more expensive than building tiered.*
