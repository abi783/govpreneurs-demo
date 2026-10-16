Business Profile — knowledge for Hunter and Business Profile features

What Business Profile is

A new top-level page at /business-profile that renders everything we know about the Member's business. Three roles:

The canonical, transparent view of all profile data (the "knower" — separate from Roadmap which is the "doer", and Hunter which is the "matcher")

The destination for systematic review and editing

The single source of truth for prerequisite gates on opportunities

The persona reality

The primary Member is a small business pursuing federal contracts for the FIRST time. Most don't have: bonding lines, GSA Schedules, CMMC, ISO certs, DCAA-compliant accounting, classified past performance, joint ventures. They have: a business, an EIN, basic insurance, sometimes a website.

Don't show 80 fields. Show what they can actually engage with. The rest is hidden behind "Show advanced fields" disclosure.

The three field tiers

EVERY field on Profile is assigned to one of three tiers:

T1 Absolutely necessary — without these, Hunter can't match and Member can't bid. About 12 fields total. Rendered prominently at top of each section. Hunter actively nudges to complete these.

T2 Good to have — improves match quality and Grant's analysis but never gates bidding. About 25 fields. Rendered below T1, lighter visual weight. Hunter surfaces gently as "could match better with".

T3 Advanced for advanced — bonding detail, CMMC, ISO, GSA Schedules, etc. About 30 fields. Hidden by default behind "Show advanced fields" disclosure. Hunter NEVER nudges for these.

The 9 universal field states

Every field is in exactly one of these states. Same visual treatment across the entire Profile.

StateVisual signalColorverified● solid green dotgreen-500needs_review● solid amber dotamber-500attested○ slate dotslate-500inferred○ slate dot, italic valueslate-500stale⏳ clock icon, dimmedslate-500missing— empty state, light grey rowslate-300conflict⚠ orange trianglered-orange (use red-500)pending_dfy⌛ animated spinner, blueblue-600error✕ red dotred-600

The 9 GovPreneurs DFY services (real catalog from govpreneurs.com/services)

Only these services are real. DO NOT invent services.

ServicePriceFields it populatesLLC Application$600legalName, entityType, formationState, formationDateSAM.gov Registration$2,997UEI, CAGE, samRegistrationStatus, samBusinessTypes, primaryNaicsCapability Statement$2,000capabilityStatementUrl, coreCapabilities, differentiators, pastPerformance (extracted)SBS Visibility Setup$997dsbsProfileUrlSLED Enrollment$2,497 (per state)sledRegistrationsGovCompliant Digital Setup$2,997 (subscription)website, customEmailDomain, businessPhoneNumberProfile Maintenance & Compliance Alerts$290/mostale-data refresh, re-verificationCustom Roadmap$1,997(meta — DFY roadmap consulting)Prime Contractor Registration$175(specific registration — clarify w/ Tim)

DFY upsell discipline

For every field row on Profile, the rule for showing a "Have us do it" button:

IF field is `missing` OR `error`:
  show "[Add now]" button
  IF field maps to a real service in the catalog above:
    ALSO show "[Have us do it — $<price>]" button

ELSE (verified / needs_review / attested / inferred / stale):
  show "[Edit]" / "[Confirm]" / "[Re-verify]" as relevant
  DO NOT show DFY button

Fields with NO DFY (no service exists): EIN, bonding, insurance, CMMC, ISO, DCAA, 8(a)/HUBZone/SDVOSB/WOSB cert documents, vehicles held, state diversity certs, positioning, past performance entries (other than via Capability Statement service).

The Marcus Williams persona

The mock data throughout uses Marcus Williams:

Williams Construction LLC, Fayetteville, North Carolina

Service-disabled veteran (SDVOSB eligible)

Roofing and HVAC commercial contractor

LLC formed June 14, 2024

UEI: LW1SL1HLED3, CAGE: 16WG0 (post-SAM)

Primary NAICS: 238160 Roofing Contractors

3 employees, ~$650K annual revenue

Targeting USACE work

4 commercial past projects, no federal yet

The Hunter "knows you" embed

A right-rail panel inside /opportunities (the Hunter page). Two states:

Collapsed (default for established Members): Single-line strip: "Hunter knows you ✓ · +1 thing would help · ▾ expand"

Expanded:

3–5 "knows you" facts (top capabilities driving today's matches)

1 "would help" gap (one at a time, T1 priority then T2; never T3)

Each gap has [Tell Hunter now] and (if DFY service exists) [Have us do it — $X]

Link at bottom: "View full profile →"

The prerequisite gate UX

Three gate severities:

Hard gate — blocks Send-to-Mentor on opps where Member can't bid (e.g., federal opp + no SAM). Card shows muted badge. Detail page shows banner. Send-to-Mentor click triggers gate modal.

Soft gate — yellow warning band on detail page; doesn't block actions

Capability gate — no UI block; only reduces Hunter's match confidence

For Marcus right now, hard-gated examples include any federal opp (no SAM yet) and any SDVOSB-set-aside opp (no cert document on file, though SAM business type is SDVOSB).

Voice and tone rules

Outcome-framed always ("tells Hunter your size so I stop showing wrong-sized opps") — never field-framed ("enter target value range")

Never use "must" or "required" without explaining what it gates

Never use "please" in error states

Never use exclamation marks

Never blame the Member for missing data

Calm professional tone, not enthusiastic

Reference PRDs (do not deviate)

08-design-business-profile-and-prerequisite-gating.md

09-business-profile-detailed-fields-and-states.md

10-business-profile-v1.1-tiered-and-dfy-disciplined.md