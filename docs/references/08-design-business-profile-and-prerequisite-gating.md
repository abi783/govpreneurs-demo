# Design Doc — Business Profile, Prerequisite Gating & Hunter Profile-Awareness

**Product:** GovPreneurs
**Surface:** New `Business Profile` page + Hunter `/opportunities` profile-aware embed + opportunity-level prerequisite gates
**Owner:** Karthik (CPO)
**Driver PM:** Siddharth (AI PM)
**Status:** v1 — design + research synthesis + functional PRD
**Date:** May 2026
**Companion docs:**
- `06-prd-v4-final.md` — Hunter UX PRD
- `07-prd-data-and-ai-architecture.md` — Hunter data + AI architecture
- `agent_context_step3_to_step4.md` — Business Profile Graph schema
- `PRD_ROADMAP_JOURNEY.md` — existing Roadmap (the "doing surface")

---

## 0. The problem in one paragraph

A Member arrives at `/opportunities` for the first time. Two things are simultaneously true: **they may not be eligible to bid on what they're seeing** (federal opps require SAM.gov, EIN, NAICS; SLED opps require state vendor registration), and **Hunter may not know enough about them to rank well** (positioning is empty, capability vector is weak, capacity unknown). Both are blockers — one to *acting*, one to *being served*. The product needs a coherent answer for both: a way to **show the Member what we know**, **surface what's missing**, **route them back to the Roadmap to fix it**, and **upsell DFY services where appropriate** — without breaking the discovery experience for Members who are ready to act.

This doc answers four questions:

1. How are tier-1 SaaS platforms outside GovCon solving this exact pattern?
2. Should profile data live on a dedicated page, embedded inside Hunter, or both?
3. What does the prerequisite-gating UX look like at the opportunity level?
4. How does this all connect to the Roadmap and Hunter without breaking either?

---

## Part 1 — Research synthesis

I looked at how a dozen tier-1 SaaS products handle the *"user has gaps in their profile/setup → product needs to either gate features or guide completion → ideally monetise the gap"* pattern. Five distinct design archetypes emerged. None of them belongs in GovCon as-is, but each has elements worth borrowing.

### 1.1 Archetype A — The Compliance Dashboard (Mercury, Stripe, Carta, Brex)

**The pattern:** a dedicated page (often called "Compliance," "Verification," "Setup," or "Onboarding") that shows every requirement the user must satisfy to unlock specific features. Status indicators per item: ✓ done, ⚠ in review, ○ not started. Each item has a CTA to complete inline or a deep-link to the relevant flow.

**Where it works well:**
- **Mercury** — dashboard banner *"Verify your business to send wires over $50K"*. Banner persists until resolved. Feature gates are explicit and contextual.
- **Stripe** — a Verifications page that lists every KYC/KYB item, with status, with the exact action to resolve each. Stripe's playbook: never silently fail; every gate has a labelled path forward.
- **Carta** — "Company Setup" sidebar progress that's always visible, with deep-links to specific tasks. They treat setup as a *first-class navigation peer* to the working surfaces.

**What works:**
- **Status transparency is the entire feature.** Users tolerate a lot of complexity if they can see exactly where they stand.
- **Feature gates point to the path.** No dead ends — every gate is also a button.
- **Persistent banner pattern.** The compliance state is surfaced everywhere relevant, not hidden in settings.

**What doesn't translate:**
- The aesthetic is heavy and bureaucratic — appropriate for banking, wrong for a Member who wants to feel like they're winning contracts.
- These products aren't selling DFY services on top — the DIY path is the only path. We need the UX to monetise as well as guide.

**Takeaway for GovPreneurs:** the *information architecture* is right (status + path + persistence), the *tone* is wrong (we should feel like a teammate, not a regulator).

### 1.2 Archetype B — The Profile Completeness Widget (LinkedIn, Indeed, Tinder, Airbnb host)

**The pattern:** a sidebar widget that shows a completion percentage with a list of suggested fields to add next. Embedded everywhere — on the home feed, on the dashboard, in the corner. The widget directly correlates fill-rate with outcome quality (better matches, more bookings, more views).

**Where it works well:**
- **LinkedIn's "All-Star" profile.** Widget on every page nudging a specific next item. Profile completion correlates measurably with views/connections/recruiter contact. They've turned profile-fill into a status game.
- **Tinder/Hinge.** Profile completeness gates match quality. *"Add 3 more photos to see better matches"* — explicit value tradeoff.
- **Airbnb (host).** *"Listings with X attribute get Y% more bookings."* — turns profile completion into a revenue conversation.

**What works:**
- **The widget is everywhere but small.** It doesn't dominate any page; it's a sidekick that hands you the next action.
- **The next action is always specific.** Not "complete your profile" — "add your years of experience" or "upload a photo."
- **Outcome framing.** "Add X to get Y" is more motivating than "your profile is N% complete."

**What doesn't translate fully:**
- A simple % completion is misleading in our context — a Member with 95% profile completion but no SAM.gov registration is *not* 95% ready. Some fields are gates, not points.
- LinkedIn-style gamification cheapens the GovCon moment. Marcus is running a serious business; turning profile completion into a status game feels small.

**Takeaway for GovPreneurs:** the *embed-everywhere small widget* pattern is right. The *one-question-at-a-time* nudge is right. The *naive % completion* is wrong — we need a more nuanced "readiness" representation.

### 1.3 Archetype C — The AI "What I Know About You" Surface (Claude, ChatGPT, Glean, Notion AI, Mem)

**The pattern:** AI products are increasingly making their *internal model of the user* visible and editable. Claude has a Memory feature listing literal facts the AI remembers, with the user able to delete or correct. ChatGPT has Custom Instructions + Memory. Glean shows a "knowledge graph" of what it has indexed about you. Mem similarly surfaces what its model of you contains.

**Where it works well:**
- **Claude's Memory feature.** A settings panel showing every "memory" Claude has, with the source, with delete/edit affordances. Builds trust via radical transparency.
- **Notion AI.** When you ask Notion AI a question, it cites which pages/blocks it pulled from. The AI's working set is visible.
- **Glean.** Shows you what corpus it's searching, what permissions apply, which sources it cites. Removes the "magic black box" feeling.

**What works:**
- **Transparency builds trust.** When users see the AI's working model, they trust it more, even when it's incomplete.
- **Editability without forms.** Conversational or single-click edits, not 12-field forms.
- **Provenance.** "We learned this from your SAM record" / "you told me this in onboarding" / "I inferred this from your past clicks."

**What doesn't translate fully:**
- These surfaces are usually settings-page-deep — not where most users live. We need the surface to be more frequented than once-a-month-settings.
- The Claude Memory model is conversational/factoid; ours is structured (10 entities, ~80 fields). We need richer structure than a flat memory list.

**Takeaway for GovPreneurs:** **this is the closest analog to what we should build.** The Business Profile page should feel like *"this is what Hunter, Grant, and Ava know about your business — see it, edit it, watch it grow."* Provenance and confidence are first-class. Edits are conversational where possible.

### 1.4 Archetype D — Just-in-Time Gating (Plaid, Persona, Mercury wires, Webflow publish)

**The pattern:** features are gated, but the gate triggers *contextually* at the moment of intent — not upfront. The user can browse, explore, configure freely; the moment they try to do the thing that requires the gate, they hit the gate, and the gate offers the path through.

**Where it works well:**
- **Webflow.** You can build a site with no gating. The moment you click "Publish to custom domain," domain verification + plan upgrade gates trigger. Until then, no friction.
- **Mercury wires.** You can compose a wire of any value. The moment you click Send on a $50K+ wire, the verification gate kicks in, with the exact path to verify.
- **Plaid.** You can navigate the bank linking flow far. The moment you need to authenticate, the gate appears with credentials.
- **Calendly.** You can set up a calendar event type. The moment you go live, integration gates kick in.

**What works:**
- **Browse is free; act has gates.** This protects exploration and discovery while still enforcing the necessary preconditions.
- **The gate is also the unblocker.** The moment you hit the gate, the path forward is right there.
- **No upfront friction tax.** Users who never need a gated feature never see the gate.

**What translates directly:**
- This is exactly the pattern we want for opportunity-level prerequisites. A Member can browse all opportunities. The moment they try to take action on one (Save, Send to Mentor, Apply) and the gate kicks in, they get the prerequisite flow with both DIY and DFY paths.

**Takeaway for GovPreneurs:** **this is the right pattern for opportunity-level gates.** Don't gate the discovery experience itself; gate the *act-on-this-opportunity* moment, and gate it cleanly with both paths.

### 1.5 Archetype E — The TurboTax "What We Have / What We Need" Pattern

**The pattern:** TurboTax (and TaxAct, FreshBooks year-end, others) shows a clear "everything we have" summary alongside "what we still need to ask you" — with topic-based deep-links so the user can review or fix any item without restarting the wizard. The whole tax return is browseable as a structured document, not a one-shot wizard.

**Where it works well:**
- **TurboTax summary view.** After every section, a summary: *"Here's what we have for your W-2s. Here's what's missing for deductions. Here's why we're suggesting you might qualify for X."*
- **FreshBooks / Wave year-end packages.** A consolidated "year-end checklist" that mirrors what the accountant needs.
- **HelloSign / DocuSign workflows.** The signing experience has a "what's complete / what's pending / what's next" panel.

**What works:**
- **Two-column structure.** Have / Need is intuitive and reduces anxiety.
- **Topic-based navigation.** Members can think "I want to update my W-2" without restarting. They navigate by mental model, not flow position.
- **Suggestion + upsell.** "You might qualify for X" — with an option to deep-dive (or pay for an expert review) — fits the GovPreneurs DFY model.

**What translates:**
- The Have / Need / Suggested-next pattern is exactly right for the Business Profile page header.
- Topic-based deep-links from Profile → Roadmap matches our existing structure (Profile points back to a specific sub-step on the Roadmap).

**Takeaway for GovPreneurs:** the Business Profile page header should literally show *"Here's what we know about your business. Here's what would help us help you better. Here's what's blocking you."* Three columns, three actions.

### 1.6 What none of them do well — the GovCon-specific gaps

Three things from our context that no archetype above handles cleanly, and where we have to add our own design thinking:

**1. The DFY upsell at the moment of gap discovery.** None of the AI memory products (Claude, ChatGPT) sell services. None of the compliance products (Stripe, Mercury) have a "we'll do it for you" path. None of the profile widgets (LinkedIn) charge for completion. We're unique in that **every gap is also a revenue opportunity** — and the UX needs to reflect that without feeling like a sales funnel.

**2. The hybrid AI / structured-data substrate.** Most AI memory surfaces are flat lists. Most compliance dashboards are rigid forms. We have ten structured entities that need to be readable, editable, *and* feel like an AI is using them — without falling into either extreme.

**3. The eligibility gate that's specific to the opportunity, not the user.** Compliance dashboards gate features. Job boards filter by user eligibility. We need to gate per-opportunity (different opps have different prereqs based on type, set-aside, agency, value), which means our gating logic is **opportunity-aware**, not just user-aware. This is closer to how Webflow's "publish" gate is *site-specific* than to how Mercury's wire gate is *amount-specific*.

These gaps shape the GovPreneurs design.

---

## Part 2 — The architectural decision

### 2.1 The central question

> *Should "what we know about you" live on a dedicated Business Profile page, embedded inside Hunter, or both?*

### 2.2 The three options, evaluated

| Option | Strengths | Weaknesses |
|---|---|---|
| **A. Embedded in Hunter only** | Always in context; no navigation cost; nudge in the moment | Crowds the discovery page; no "destination" for systematic review; hides behind Hunter's primary purpose; doesn't serve users who want to pause and review their profile |
| **B. Dedicated page only** | Canonical view; full edit experience; clear destination | Requires context switch from Hunter; lower in-the-moment completion rate; users may forget it exists |
| **C. Both — Profile primary, Hunter embed secondary** | Canonical destination + contextual nudge; supports two modes (settle in / quick fix); mirrors how LinkedIn/Mercury/Stripe layer | More surfaces to design and maintain; requires clear scope distinction between the two |

### 2.3 The recommendation: **Both — Profile as canonical destination, Hunter embed as contextual nudge**

This is the pattern of every tier-1 SaaS that has gotten this right. LinkedIn has Profile + completeness widget. Mercury has Compliance page + dashboard banner. Stripe has Verifications page + alert in product. Notion has Settings + inline integration chips. The reason they all converge on the same answer: **structured data benefits from a canonical home; behavior change benefits from contextual nudges.**

The two surfaces have different jobs, and the design distinguishes them clearly:

| Surface | Job | When the Member opens it |
|---|---|---|
| **Business Profile (new page)** | Show *everything* we know, with provenance and confidence; let the Member review systematically and edit deeply; route to Roadmap for completion; surface DFY upsells in context | Deliberately — to settle in, audit, or fix something specific |
| **Hunter embed** | Show *just enough* to remind the Member what Hunter is using; surface *the next single thing* that would improve matches; offer one-click path to either fix it now or open Profile | Incidentally — while in the act of finding opportunities |
| **Roadmap (existing)** | The active *doing* surface — verification flows, DIY/DFY/Exclude per sub-step | When the Member is ready to actually complete a step |

### 2.4 The relationships between the three surfaces

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     BUSINESS PROFILE GRAPH                               │
│                  (the single source of truth)                            │
└──────────────────────────────────────────────────────────────────────────┘
                ↑                  ↑                  ↑
                │                  │                  │
       reads + edits        reads + nudges      reads + completes
                │                  │                  │
   ┌────────────┴──────┐   ┌──────┴──────┐   ┌─────────┴──────────┐
   │                   │   │             │   │                    │
   │ BUSINESS PROFILE  │   │   HUNTER    │   │     ROADMAP        │
   │   (new page)      │   │ /opportun…  │   │  (existing)        │
   │                   │   │             │   │                    │
   │ "the knower"      │   │ "the matcher│   │  "the doer"        │
   │                   │   │  + nudger"  │   │                    │
   └───────────────────┘   └─────────────┘   └────────────────────┘
        │   ▲                  │   ▲                ▲
        │   │                  │   │                │
        │   └─── deep-link ────┘   │                │
        │                          │                │
        └──────── deep-link ───────┴────────────────┘
                  (to specific sub-steps)
```

**The three surfaces share one substrate.** Edits made on Profile, completions made on Roadmap, and behavior captured in Hunter (saves, dismisses, sends-to-mentor) all flow into the same Business Profile Graph defined in `agent_context_step3_to_step4.md`.

**The cross-links are first-class.** Every Profile field that's incomplete has a "Complete on Roadmap" deep-link. Every Hunter embed has a "View full profile" link. Every Roadmap sub-step has a small "View profile" link in its header so Members understand the connection.

### 2.5 What changes vs. status quo

| Surface | Status quo | Post-this-design |
|---|---|---|
| Roadmap | Canonical doing surface | Unchanged in core flow. Add a small "View profile" link in header, and surface DFY upsells consistently. |
| Hunter `/opportunities` | Discovery surface only | Adds a "Hunter knows you" embed (right rail or top, see §5) and prerequisite gating per opportunity (see §4). |
| Business Profile | Doesn't exist | New top-level navigation peer. Renders the Business Profile Graph in human-readable form. Routes to Roadmap for completion. |
| Top navigation | Roadmap, Tasks, Mentors, Opportunities | Adds **Business Profile** as a peer of these. |

---

## Part 3 — Prerequisite mapping (what's needed to bid on what)

Before we design the gating UX, we need to be clear about *what actually gates what*. Different opportunity types have different prerequisites. The gating logic is opportunity-aware.

### 3.1 The prerequisite matrix

| Opportunity type | Hard prerequisites (must have to bid) | Soft prerequisites (strongly recommended) |
|---|---|---|
| **Federal — full-and-open solicitation** | Active SAM.gov registration (UEI + CAGE), EIN, business entity (LLC/Corp/etc.), at least one NAICS code registered, NAICS size standard met | Capability statement, SBS/DSBS profile, custom email domain, website |
| **Federal — small-business set-aside** | All of above + small-business flag verified in SAM | All of soft above |
| **Federal — SDVOSB / VOSB set-aside** | All of above + SDVOSB/VOSB certification verified | DSBS profile listing the certification |
| **Federal — WOSB / EDWOSB set-aside** | All of above + WOSB/EDWOSB certification | DSBS profile |
| **Federal — 8(a) set-aside** | All of above + active 8(a) certification | DSBS profile |
| **Federal — HUBZone set-aside** | All of above + HUBZone certification + qualifying address | DSBS profile |
| **Federal — sources sought / pre-solicitation / RFI** | Business entity + SAM (active or in-progress) | Capability statement (often the deliverable) |
| **SLED — state RFP** | LLC/Corp in good standing in *that state*, state vendor registration, EIN | W-9 ready, state-specific commodity codes, insurance documentation |
| **SLED — local government RFP** | Business entity + local business license (often) + state vendor registration | W-9, insurance, references |
| **BYOO — user-uploaded opportunity** | Business entity (minimum) | Whatever the source RFP requires (passed through) |

### 3.2 The three gate severities

Not every prerequisite is a hard block. The system distinguishes three severities:

| Severity | Behavior on the discovery page | Behavior on the detail page | Behavior on action |
|---|---|---|---|
| **Hard gate** (blocks bidding) | Card visible, but with a "⚠ Prereq missing" badge | Detail page visible, but action buttons replaced with a prereq prompt | Save/Send-to-Mentor blocked; modal with the prereq path |
| **Soft gate** (warns but allows) | Card visible; standard styling | Detail page visible with an inline warning band ("you'd need X to bid") | Save/Send-to-Mentor allowed; warning surfaced in flow |
| **Capability gate** (no block; reduced quality) | Card visible; standard styling | Detail page visible | All actions allowed; only impact is on Hunter's match confidence (lower) and Hunter's one-liner (more hedged) |

### 3.3 Mapping severity to prerequisite type

- **Hard gates:** SAM.gov registration for federal, business entity for everything, certifications for set-asides, state vendor registration for SLED.
- **Soft gates:** custom email domain (recommended but not legally required), website, capability statement (best-practice, not required for most bids).
- **Capability gates:** missing positioning data (target agencies, value range, geographic preference), missing past performance entries, missing bonding details. None of these block a bid; they just reduce match quality.

### 3.4 Deriving the gate at runtime

For any (Member, Opportunity) pair, the system computes:

1. **Required prereqs for this opportunity** — derived from opportunity attributes (type, set-aside, agency, market segment, value).
2. **Member's status on each prereq** — read from the Business Profile Graph + Roadmap state.
3. **Gap = required − held.** Each gap inherits its severity (hard / soft / capability).
4. **Worst severity wins** — if any hard gate is unmet, the opportunity is hard-gated. Soft gates only matter if no hard gates exist. Capability gates never override.

This computation happens once per (Member, Opportunity) pair and is cached on the Match Object (per `07-prd-data-and-ai-architecture.md` §4) as a `prerequisiteState` field.

---

## Part 4 — The Business Profile page (PRD)

### 4.1 What the page is

The Business Profile page is **the canonical, human-readable view of everything the GovPreneurs AI Team knows about the Member's business.** It renders the Business Profile Graph (10 entities, ~80 fields) as a navigable, editable, transparent surface. It is the Member's "system of record" view of themselves.

**Conceptual framing for users:** *"This is the file that Hunter, Grant, and Ava read to do their jobs. The more complete it is, the better they can serve you."* (The page does not literally say this in marketing copy, but every design choice reinforces it.)

### 4.2 Page-level layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Business Profile                                            [Edit Mode] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   READINESS HEADER                                                       │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │  You're ready to bid on:    18 federal · 4 SLED                │     │
│   │  Not yet ready for:         set-aside contracts (need cert)    │     │
│   │  Hunter could match better with:  past performance, capacity   │     │
│   │  [Open Roadmap]   [Resolve gaps with DFY services]             │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│   SECTION TABS                                                           │
│   [Identity] [Capabilities] [Certifications] [Digital] [SLED]            │
│   [Positioning] [Bid risk] [Past performance] [Mentor history]           │
│                                                                          │
│   ─── ACTIVE SECTION (rendered below tabs) ───                           │
│                                                                          │
│   IDENTITY                                                               │
│   ┌─────────────────────────────┬──────────────────────────────────┐     │
│   │  Legal Name                 │  Status                          │     │
│   │  Williams Construction LLC  │  ✓ Verified — SAM.gov            │     │
│   ├─────────────────────────────┼──────────────────────────────────┤     │
│   │  UEI                        │  Status                          │     │
│   │  ABC123XYZ456               │  ✓ Verified — SAM.gov            │     │
│   ├─────────────────────────────┼──────────────────────────────────┤     │
│   │  EIN                        │  Status                          │     │
│   │  ──                         │  ⚠ Missing — needed for          │     │
│   │                             │  federal bids                    │     │
│   │                             │  [Add manually] [Have us do it]  │     │
│   ├─────────────────────────────┼──────────────────────────────────┤     │
│   │  Entity type                │  Status                          │     │
│   │  LLC                        │  ✓ Verified — Articles of Org    │     │
│   │                             │  uploaded 2026-04-12             │     │
│   └─────────────────────────────┴──────────────────────────────────┘     │
│                                                                          │
│   ... more rows ...                                                      │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │  Section progress:  ●●●●●●●○○○  7 of 10 fields complete        │     │
│   │  This section unlocks: most federal bids                       │     │
│   └────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

The page has four regions, top to bottom: **Readiness Header**, **Section Tabs**, **Active Section content**, and an in-section **Footer summary**.

### 4.3 The Readiness Header

This is the most important real estate on the page. Borrowed from the TurboTax pattern (§1.5) but tightened.

Three lines:

1. **"You're ready to bid on:"** — a count of opportunities that have all hard gates met. Broken down by market segment (federal / SLED). The numbers are clickable and link to a pre-filtered Hunter view.
2. **"Not yet ready for:"** — categories of opportunities the Member is hard-gated from. E.g. *"set-aside contracts (need cert)"*, *"SLED in California (need state registration)"*. Each item is clickable and routes to either a Roadmap sub-step or a DFY upsell modal.
3. **"Hunter could match better with:"** — capability gates. The top 1–3 things the Member could provide that would improve Hunter's match quality. Each is a one-click "Tell us now" inline edit OR a "Have us figure it out" DFY path (where applicable).

Two CTAs at the bottom:
- **[Open Roadmap]** — primary, neutral. Routes to the next incomplete sub-step.
- **[Resolve gaps with DFY services]** — secondary, the upsell path. Opens a panel listing every DFY service available for the Member's current gaps, with prices.

The Readiness Header explicitly avoids a "% complete" number. We replace it with **outcome-framed readiness**: *what you can bid on, what you can't, what would help.*

### 4.4 The section tabs — one tab per Graph entity, lightly reorganized

The Business Profile Graph has 10 entities. We don't render them as 10 tabs (cognitive overload). We collapse and reorganize for human navigation:

| Tab | Maps to Graph entity/entities |
|---|---|
| **Identity** | `entity` + key `documents` (Articles of Org, EIN letter) |
| **Capabilities** | `capabilities` (NAICS, PSC, core capabilities, differentiators, past performance) |
| **Certifications** | `certifications` (SAM business types, SBA flags, certification documents) |
| **Digital** | `digital` (website, email domain, A2P, GHL signals) |
| **SLED registrations** | `sled` |
| **Positioning** | `positioning` (target agencies, value range, geographic preference, set-aside hunger, etc. — the highest-leverage tab for Hunter) |
| **Bid readiness** | Grant-relevant subset of `positioning` (capacity, cash flow tolerance, bonding, insurance, risk appetite) |
| **Past performance** | The structured list from `capabilities.pastPerformance[]` rendered with project-level depth |
| **Mentor history** | `mentor` (sessions booked, contracts signed) |

Two entities are not directly visible as tabs — they live elsewhere or behind admin views:
- `ownership` — ownership/UBO data, sensitive, lives behind a "show ownership" affordance only when the Member opens it
- `system` — wallet, enrollments, verification history — lives in the existing Wallet/Account area

### 4.5 The field-level treatment

Every field in every section follows the same row pattern:

```
┌─────────────────────────────┬──────────────────────────────────┐
│  Field name                 │  Status / value / action          │
└─────────────────────────────┴──────────────────────────────────┘
```

Status states (from §1.3 confidence model in `agent_context_step3_to_step4.md`):

| Confidence | Visual treatment |
|---|---|
| `verified` | Green check + value + provenance (*"Verified — SAM.gov"*); read-only with a small "edit" link |
| `needs_review_confirmed` | Same as verified |
| `needs_review` | Yellow/amber dot + value + *"Extracted from your capability statement — confirm?"*; one-click confirm |
| `attested` | Slate dot + value + *"You told us this on [date]"*; edit affordance |
| `inferred` | Slate dot + value + *"Hunter's best guess based on your past clicks"*; edit affordance |
| `stale` | Same as previous status + *"Last checked X days ago — re-verify?"* link |
| `missing` | Empty cell + *"Missing — needed for [purpose]"* + buttons: **[Add manually]** **[Have us do it]** (if DFY exists) |

The buttons matter. Every missing field that has a DFY path shows both: the DIY path (manual entry → routes to Roadmap or inline form) and the DFY path (opens the upsell drawer). This is how we monetise gaps without feeling pushy — the DFY option is offered, not demanded.

### 4.6 Provenance — visible everywhere

Every value carries a provenance tag. Hover or tap to see full detail:

- *"Verified via SAM.gov on 2026-04-15"* — for SAM-sourced fields
- *"Extracted from your Articles of Organization PDF"* — for PDF-extracted fields
- *"You told Hank during onboarding on 2026-04-12"* — for elicited fields
- *"You told Hunter on 2026-05-03 'I'm targeting USACE work'"* — for in-conversation elicited fields
- *"Inferred by Hunter from your last 14 saves and 8 dismisses"* — for inferred fields
- *"Last synced from your GHL account 6 hours ago"* — for cron-synced fields

Provenance does two jobs: **builds trust** (the user sees we're not making things up) and **calibrates edits** (the user understands what would change if they updated the field).

### 4.7 Edit affordances

Three edit paths, depending on the field:

| Field type | Edit path |
|---|---|
| Verified-from-API fields (UEI, CAGE, SAM business types) | **Not directly editable.** "Re-verify" button routes to the Roadmap's verification flow. Conflicts (Member-stated vs. API) trigger admin escalation per agent_context §11. |
| PDF-extracted fields (legal name, formation date, etc.) | Inline edit, but flagged as "this conflicts with your uploaded document — re-upload?" |
| Member-elicited fields (positioning entries, bidding preferences) | Inline edit + a chat affordance — *"Or just tell Hunter and he'll update this for you"* |
| List fields (NAICS codes, past performance, SLED registrations, target agencies) | Add/remove/edit pattern. Each entry is a row. |
| Inferred fields | Inline edit; saving converts confidence from `inferred` to `attested` |

The chat affordance is critical. For fields that are positioning/preference-flavored, the Member should be able to update by saying *"actually, I'm focusing on Texas only now"* in the Hunter chat — and Hunter writes back to the Profile.

### 4.8 The DFY upsell choreography

Every DFY upsell on the Business Profile page lives in one of two places:

**1. Inline next to a missing field.** When a missing field has a DFY service tied to it (e.g., missing capability statement → "Capability Statement DFY for $497"), a small **[Have us do it]** button appears next to the **[Add manually]** button. Clicking opens the existing Service Detail Drawer pattern from the Roadmap (`PRD_ROADMAP_JOURNEY.md` §11), so the experience is consistent across surfaces.

**2. Aggregated in the Readiness Header CTA.** *"[Resolve gaps with DFY services]"* opens a panel showing every DFY-resolvable gap, sorted by impact (gaps that would unlock the most opportunities first). Each is a row with the gap, the price, and a one-click enroll. This is the "checkout-style" view of all gaps.

Both paths route through the same enrollment flow — same wallet charge, same delivery contract, same post-enrollment lifecycle. The Profile page is just an *additional surface* where DFY is offered; the Roadmap remains the authoritative DFY administration surface.

### 4.9 The section footer

At the bottom of each section's content, a small summary band:

```
┌────────────────────────────────────────────────────────────────┐
│  Section progress:  ●●●●●●●○○○  7 of 10 fields complete        │
│  This section unlocks: most federal bids                       │
└────────────────────────────────────────────────────────────────┘
```

Two pieces of information:
- **Progress** — visual dot pattern (not a percentage). Just the count.
- **Unlocks** — what completing this section would unlock. *"Most federal bids"* / *"Set-aside opportunities (with cert)"* / *"SLED registrations in [N] states"* / *"Better Hunter match quality"*. The unlocks language is **outcome-framed**, not field-framed.

### 4.10 Cold-start state — what the Member sees on day 1

A Member who has just completed Hank's onboarding and lands on Business Profile for the first time sees:

- **Identity:** mostly populated (SAM, articles of organization). High completion.
- **Capabilities:** partial (NAICS from SAM, capabilities extracted from cap statement if uploaded).
- **Positioning:** **mostly empty.** This is the highest-leverage gap and the page should make this obvious — Positioning tab has a "0 / 5 essential fields" indicator, and the Readiness Header explicitly calls out *"Hunter could match better with: target agencies, value range, geographic preference"*.

The first-time experience opens directly to the **Positioning** tab (not Identity), because that's the highest-impact action. The Member can navigate away, but the default landing is where the leverage is.

### 4.11 Returning state — what the Member sees over time

As the Member completes Roadmap sub-steps, uploads documents, gets DFY deliveries, and refines positioning through Hunter conversations, the page fills in. The progression is visible.

Specifically, when a Member returns:
- New verifications since last visit are flagged (**"New since you were here:"** band at the top of the page).
- Recently captured Hunter conversations that updated Profile fields are surfaced (*"Hunter updated your target agencies based on what you said yesterday — review?"*).
- Stale fields (SOS verification > 7d, SAM > 365d) are surfaced as needing re-check.

### 4.12 Page navigation entry points

The Profile page is reachable from:

- **Top navigation** — primary. A peer of Roadmap, Tasks, Mentors, Opportunities.
- **Hunter embed** — *"View full profile"* link in the embedded panel (see §5).
- **Roadmap header** — small *"View profile"* link near the page header so Members understand the connection between Roadmap completions and Profile state.
- **Dashboard tile** (if a dashboard exists) — a "Business Profile" tile showing readiness summary.

---

## Part 5 — The Hunter embedded mini-experience (PRD)

### 5.1 What the embed is

A persistent, lightweight panel inside the Hunter `/opportunities` page that shows:
1. **What Hunter knows about the Member** (top 3–5 facts driving today's matches)
2. **What Hunter would benefit from knowing** (the next 1–2 gaps, with one-click resolution)
3. **A clear deep-link to the full Business Profile**

The embed is a **nudge surface, not a profile surface.** Its job is to remind the Member that Hunter is using their data, surface the most valuable single next gap, and offer a frictionless path to resolution — all without forcing a context switch.

### 5.2 Where it lives in the Hunter layout

The Hunter UX from `06-prd-v4-final.md` §B has four regions: Hunter Lead Block, Ask-anything bar, Filter chips + sort + Explore link, and the list of cards.

The **Hunter chat companion** lives on the right rail and is persistent.

The embed lives **above the Hunter chat companion in the right rail**, as a collapsed-by-default panel. When collapsed, it's a single-line strip:

```
┌──────────────────────────────────────────────┐
│  Hunter knows you  ✓  ·  +1 thing would help │
│  ▾  expand                                   │
└──────────────────────────────────────────────┘
```

When expanded:

```
┌──────────────────────────────────────────────┐
│  Hunter knows you                           ▴│
│                                              │
│  ✓ SDVOSB construction firm                  │
│  ✓ Operating in Texas                        │
│  ✓ Past contracts up to $1.2M                │
│  ✓ Targeting USACE work                      │
│                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄          │
│                                              │
│  +1 thing would help me match better:        │
│                                              │
│  Past performance details                    │
│  "If you tell me about 2–3 of your biggest   │
│   past projects, I can score similar         │
│   opportunities much more confidently."      │
│                                              │
│  [Tell Hunter now]  [Open profile]           │
│                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄          │
│                                              │
│  View full profile →                         │
└──────────────────────────────────────────────┘
```

### 5.3 What the embed shows — the "knows you" section

Three to five facts, in plain English, with light icons. The facts are not the entire profile — they're the **top 3–5 Hunter is most actively using** to rank the current view.

Selection logic (background, not exposed):
1. The Member's certifications that drive set-aside eligibility (always shown if relevant)
2. The Member's geographic preference
3. The Member's primary capability domain (one summary line)
4. The Member's value range / typical past contract size
5. The Member's currently-targeted agencies (if `positioning.targetAgencies[]` is populated)

Each fact is one line. No nested data. Just the headline. Members who want depth go to the full Profile page.

### 5.4 What the embed shows — the "would help" section

**One** gap at a time. Not three, not five. One. The most impactful single next thing the Member could provide.

Selection logic:
1. Hard gates first (if any opportunity is being hard-gated, surface that — but only if it would unlock high-volume opportunities for the Member). E.g., *"Get your SAM.gov registration done — would unlock 200+ federal opportunities."*
2. Capability gates that would meaningfully improve match quality. *"Past performance details would improve match quality on ~60% of your matches."*
3. Positioning gaps. *"Tell me your target value range so I can stop showing you contracts that are too big or too small."*

The gap is presented as a value statement: *"If you tell me X, I can do Y better."* Outcome-framed, not field-framed.

Two CTAs:
- **[Tell Hunter now]** — opens an inline mini-form OR routes the chat to elicit it (depending on field type — see §5.5)
- **[Open profile]** — routes to the relevant tab on the Business Profile page

### 5.5 Inline elicitation vs. profile routing

Some fields are elicitable in a single chat turn ("what's your target contract value range?"). Others require structured forms or document uploads. The CTA adapts:

| Field type | "Tell Hunter now" routes to |
|---|---|
| Single positioning answer (target agencies, value range, geographic preference, set-aside hunger) | Inline chat — Hunter prompts, Member answers, Hunter writes back |
| Multi-field answer (past performance entry: client + value + year + scope) | Inline mini-form in the embed |
| Document required (capability statement, EIN letter) | Routes to Roadmap sub-step (with a small "Or have us do it for $X" alongside) |
| Verification-required (SAM.gov, SOS) | Routes to Roadmap sub-step's verification panel |

### 5.6 Embed behavior — when it's collapsed vs. expanded

| State | When |
|---|---|
| **Collapsed (default for established Members)** | When the Member has filled most positioning fields, the embed lives as a single line. Doesn't intrude. |
| **Expanded (default for cold-start Members)** | When `positioning` is mostly empty or capability vector confidence is `attested`, the embed is expanded by default to drive completion. |
| **Manually expanded by Member** | Click to open. State persists across sessions per Member. |
| **Updated state (post-edit)** | After a Member completes a "Tell Hunter now" inline action, the embed shows a brief confirmation ("✓ Got it. Re-ranking your matches…") and the next gap, if any. |

### 5.7 The proactive surfacing rule

The embed *can* proactively expand even when the Member has it collapsed, but only under one specific condition: **the Member just performed an action where the missing field would have helped.**

Examples:
- Member dismissed an opp with reason "wrong size" → embed expands with *"Want to tell me your target value range? I'll stop showing you ones that are too big."*
- Member saved an opp at agency X → embed expands with *"Want me to prioritise more from agency X?"* (this is also a chat affordance per `06-prd-v4-final.md` §C.7).

This is the "right context, right moment" pattern from §1.4 — the embed becomes contextually intelligent without becoming intrusive.

### 5.8 Embed and the Hunter chat — how they coordinate

The embed and the Hunter chat companion are different surfaces with different jobs:

| Surface | Job |
|---|---|
| Embed | "Hunter's working summary of you, plus one nudge" — passive most of the time |
| Hunter chat | "Real-time conversation about opportunities" — active during use |

They share state (both read from the Business Profile Graph and the per-user matching state). When the Member acts in one, the other reflects it. If the Member tells Hunter "I'm targeting Texas only," both the chat acknowledges and the embed updates its "knows you" facts.

They never repeat the same prompt. If the embed is showing "Tell me your value range," the chat doesn't also prompt for it.

---

## Part 6 — Opportunity-level prerequisite gates (PRD)

### 6.1 The principle

The Member can browse anything. Acting on something the Member isn't ready for triggers a gate. The gate is also the unblocker — it offers both DIY and DFY paths.

This is the Webflow / Mercury / Plaid pattern from §1.4. Discovery is free; action has gates.

### 6.2 Card-level treatment (Hunter discovery page)

For most opportunities, no gate visual is shown on the card. The card design from `06-prd-v4-final.md` §A is unchanged.

**Two card-level changes for gated opportunities:**

1. **Hard-gated opps with high-impact prereqs.** A small badge appears on the card: *"Prereq missing — SAM.gov"*. The badge is muted (Slate `#67768E`), not alarming. Hover reveals the specific prereq.
2. **Hard-gated opps with set-aside prereqs.** When the Member is showing strong fit on capability/scope but is hard-gated by a missing certification, the match tier shifts to **Stretch** (not Strong) and Hunter's one-liner explicitly says: *"Right scope, but this is set aside for SDVOSB-certified firms. Worth getting certified for the pipeline."* (per v4 PRD §D.5 Pattern 2). This already exists in the v4 spec; reaffirming here.

Soft-gated and capability-gated opportunities show **no card-level treatment.** They render as standard cards.

### 6.3 Detail page treatment (when Member clicks into a card)

Three states based on gate severity:

#### State A — Hard-gated opportunity

```
┌──────────────────────────────────────────────────────────────────┐
│  Multi-year construction & repair contract                       │
│  US Army Corps, Fort Worth                                       │
│  $2.4M · Fort Worth, TX · Closes in 47 days                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ⚠  You can't bid on this yet                               │  │
│  │                                                            │  │
│  │ This opportunity requires:                                 │  │
│  │ • Active SAM.gov registration   ✗ Not yet                  │  │
│  │ • EIN                            ✗ Not yet                 │  │
│  │ • Verified SDVOSB certification ✗ Not yet                  │  │
│  │                                                            │  │
│  │ [Get registered (DIY)]  [Have us register you for $497]    │  │
│  │                                                            │  │
│  │ Or: Save this and come back when you're registered →       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Grant's analysis is below — review the opportunity even        │
│   before you can bid, and decide if it's worth pursuing.]        │
│                                                                  │
│  ... full Grant bid memo ...                                     │
└──────────────────────────────────────────────────────────────────┘
```

Three things to note:

1. **The gate is prominent but not the entire page.** The opportunity itself is still readable, Grant's analysis still loads. Members can decide if it's worth pursuing *before* committing to the prereq work — which is the right business logic (don't make me register before I know if this is worth it).
2. **The prereqs are listed explicitly** with status. Not "complete onboarding" — the specific items.
3. **Both DIY and DFY paths exist.** DIY routes to Roadmap. DFY opens the Service Detail Drawer.
4. **A "save and come back" affordance** is offered. Saving is allowed (saved opps can be acted on later); only Submit/Send-to-Mentor is gated.

#### State B — Soft-gated opportunity

The detail page renders normally with a yellow inline band:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠  Heads up: this RFP recommends a custom email domain for      │
│     bid submissions. You don't have one set up yet — get it      │
│     done in [10 minutes (DIY)] or [for $97 (DFY)].               │
└──────────────────────────────────────────────────────────────────┘
```

Actions are not blocked. The warning persists through the bid flow but doesn't gate it.

#### State C — Capability-gated opportunity

The detail page renders normally. No banner. The only impact is on Hunter's match confidence (lower) and the embed's "would help" prompt.

### 6.4 Gate triggers — what the Member tries to do

The gate enforces at three action points:

| Action | Hard gate behavior | Soft gate behavior |
|---|---|---|
| View card | Shows badge if applicable; doesn't prevent click | No effect |
| View detail page | Shows the gate band; doesn't prevent reading | Shows soft warning band |
| Save | Allowed — saved opps are reminders, not commitments | Allowed |
| Send to Mentor | **Blocked**; the gate modal prompts the prereq path | Allowed with warning |
| Apply / Submit (when this exists in the future bid pipeline) | **Blocked**; gate modal | Allowed with warning |

### 6.5 The gate modal — when Send-to-Mentor is blocked

```
┌──────────────────────────────────────────────────────────────────┐
│  Hold on — let's get you ready first                             │
│                                                                  │
│  To send this to a Mentor for review, you'll need:               │
│                                                                  │
│  • Active SAM.gov registration   ○ Not yet started               │
│  • Capability statement uploaded ○ Not yet started               │
│                                                                  │
│  This usually takes:                                             │
│  • 1–2 weeks DIY                                                 │
│  • 5 days with our DFY service                                   │
│                                                                  │
│  [Resolve on Roadmap (DIY)]  [Get help from us — $497]           │
│                                                                  │
│  Or save this opportunity and come back when you're ready →      │
└──────────────────────────────────────────────────────────────────┘
```

Critical UX details:
- **Time estimate, not just steps.** Members make decisions based on time + cost, not steps.
- **Both paths costed.** "DIY" implicitly costs time; "DFY" explicitly costs money. Both are visible.
- **The "save and come back" escape hatch.** Avoids forcing a commitment in the moment.

### 6.6 The Member is hard-gated everywhere — what the discovery experience looks like

What about Members who can't bid on *anything* because they have zero prereqs? (E.g., just signed up, hasn't registered with SAM yet, no LLC, no anything.)

The Hunter discovery page still works. They see opportunities. They see match scores. They see Grant's analysis. **They just can't act.** The Hunter Lead Block adapts:

> *"You're seeing 247 strong matches based on what we know so far. To be able to bid on these, you'll need to complete a few prerequisites. Let's get you bid-ready."* [Go to Roadmap]

The discovery page becomes a *motivator* for completing the Roadmap, not a frustration. The Member sees the value (real opportunities they could bid on) and is motivated to complete the prereq work to unlock them.

This is the inverse of forcing onboarding upfront. It's "show the value first, then guide to the gates" — which is the highest-converting pattern in modern SaaS.

---

## Part 7 — DFY upsell choreography (cross-surface)

DFY services are surfaced consistently across the three surfaces. The choreography rules:

### 7.1 Where DFY is offered

| Surface | When |
|---|---|
| Roadmap (existing) | Always, per sub-step. Canonical surface. |
| Business Profile | Inline next to any missing field with a DFY service tied to it. Aggregated in the Readiness Header CTA. |
| Hunter embed | When the surfaced "would help" gap has a DFY service tied to it, the [Tell Hunter now] button is paired with [Have us do it]. |
| Opportunity detail page (gates) | When a hard or soft gate has a DFY service that resolves it. |
| Hunter chat | When the Member asks Hunter to help with something Hunter can't do alone (e.g., *"can you write my capability statement?"*) — Hunter responds *"I can help you draft the structure, but for a polished one our DFY service does this for $497. Want me to set that up?"* |

### 7.2 The single enrollment flow

Every DFY entry point routes to the same enrollment flow defined in the Roadmap PRD §11–12. **No surface re-implements DFY enrollment.** This is critical for consistency, billing accuracy, and engineering simplicity.

### 7.3 Tone discipline

DFY upsells are offered, never demanded. Tone rules:

- **Always paired with DIY.** Every upsell shows the DIY alternative.
- **Outcome-framed.** *"Get registered in 5 days vs. 1–2 weeks DIY"* — not *"buy our service."*
- **Time-cost transparent.** Both the time investment for DIY and the dollar cost for DFY are visible.
- **Never blocking.** The Member can always say no and proceed (where applicable).
- **Never repeated within a single session.** If a Member declined DFY for capability statement, don't surface it again that session.

### 7.4 The aggregated upsell view

The Readiness Header CTA *"[Resolve gaps with DFY services]"* opens an aggregated upsell panel:

```
┌──────────────────────────────────────────────────────────────────┐
│  Resolve all your gaps with our DFY services                     │
│                                                                  │
│  Sorted by what unlocks the most opportunities.                  │
│                                                                  │
│  ☐ SAM.gov Registration                              $497        │
│    → Unlocks 247 federal opportunities                           │
│                                                                  │
│  ☐ Capability Statement                              $397        │
│    → Improves match quality on ~60% of your matches              │
│                                                                  │
│  ☐ Texas SLED Vendor Registration                    $197        │
│    → Unlocks 84 SLED opportunities in Texas                      │
│                                                                  │
│  Total: $1,091  (or pick individual services above)              │
│                                                                  │
│  [Enroll selected]                                               │
└──────────────────────────────────────────────────────────────────┘
```

This is a **bundle-aware upsell** — the Member can see the full set of gaps with prices and impacts, and choose whether to resolve all, some, or none.

### 7.5 Suppression rules

Members who have completed all prereqs and have rich profile data **never see the upsell aggregate CTA in the Readiness Header.** It's replaced with a *"You're set up for federal + SLED bidding"* confirmation. Don't surface upsells that don't apply.

---

## Part 8 — Cross-surface state and data flow

### 8.1 Single source of truth

All three surfaces (Profile, Hunter embed, Roadmap) read from the **Business Profile Graph** defined in `agent_context_step3_to_step4.md`. No surface has its own data store. Edits made in any surface propagate to all surfaces immediately (or within seconds).

### 8.2 Provenance tagging on writes

Every write tags its source per agent_context §10:
- Profile direct edits → `source: ui_profile`
- Hunter embed inline edits → `source: ui_hunter_embed`
- Hunter chat elicitation → `source: conversation_hunter`
- Roadmap verification flow → `source: roadmap_verifier_<name>` (e.g. `roadmap_verifier_sam`)
- DFY delivery → `source: dfy_delivery`

This gives us per-source telemetry — we can see which surfaces are driving the most profile completion.

### 8.3 The reactive update protocol

When a field is updated, three things happen synchronously:

1. **Graph write** — value, confidence, provenance, timestamp.
2. **Cache invalidation** — any cached views (Profile sections, Hunter embed contents, Match Objects) flag for refresh.
3. **Side-effect propagation** — if the field affects matching (capability domain, NAICS, certifications, positioning), trigger a Match Object recompute for the Member.

The Member sees confirmation in whichever surface they edited from, and then sees fresh state when they navigate to other surfaces.

### 8.4 Conflict resolution

Two surfaces can occasionally race. The conflict rules:

- **API-verified data wins.** If the Member edits "legal name" in Profile and a fresh SAM.gov verification returns a different name, the SAM value wins; the Member gets a "We've updated this from SAM.gov — your previous edit is in your edit history" notification.
- **Most-recent-attestation wins for elicited data.** If the Member tells Hunter one thing in chat and edits something different in Profile, the most recent edit wins.
- **Conflicts surface explicitly.** When two sources truly disagree (e.g., Member-attested NAICS differs from SAM-registered), Profile shows both and asks the Member to reconcile. Per agent_context §7.2.

---

## Part 9 — Edge cases and failure modes

### 9.1 The Member who never completes Profile or Roadmap

The Hunter embed continues to nudge gently, but never escalates to blocking. Discovery still works. Match quality is just lower-confidence. The Member can use Hunter at degraded utility indefinitely.

This is intentional. We don't punish low-engagement Members — we serve them best-effort and keep the door open.

### 9.2 The Member with a complete Profile but excluded steps

Per the Roadmap PRD, a Member can mark sub-steps as Excluded with a reason. Profile respects this:
- Excluded sub-steps are visible in Profile but rendered with the orange "Already done — [reason]" treatment from the Roadmap.
- They don't count as gaps.
- If a Member excluded "Custom email domain" with reason "I don't need one," the Hunter embed and Profile both stop nudging on that field.

### 9.3 The Member whose verified data goes stale

SAM expires after 365 days. SOS cached for 7 days. DSBS data has its own freshness rules.

When a field is `stale`:
- Profile shows a "Last checked X days ago — re-verify?" link. Click routes to the Roadmap sub-step's verification panel.
- Hunter embed doesn't surface stale fields as gaps unless they've expired completely (e.g., SAM.gov registration *expired*, not just stale).
- For SAM expiration specifically, the Member is hard-gated on federal opportunities until they renew. The detail page banner explicitly says "SAM expired" with a renewal path.

### 9.4 The Member who has DFY services in flight

Per agent_context §7.3 and Roadmap PRD §13: when a DFY service is enrolled but not yet delivered, the related fields are still gaps **functionally** (not yet populated) but **not eliciting** — the Member has paid, data is en route, no need to pester them.

UX treatment:
- Profile shows the field as "in progress with our team" with a progress indicator (e.g., "Delivery call booked for May 15").
- Hunter embed doesn't surface this as a gap.
- Detail-page gates don't trigger for in-flight DFY items if the expected delivery date is before the opportunity's response date.

### 9.5 The Member who hits a gate at the wrong moment

E.g., Member is composing a Send-to-Mentor and hits the gate. They don't want to detour through Roadmap. The "save and come back" escape exists for this. The opportunity is saved with a marker, and when the Member completes the prereq, they get a notification: *"You're now ready to send 'Multi-year construction…' to Mentor — pick up where you left off?"*

This bridge-state UX prevents the gate from being a dead end.

### 9.6 The Member who's allergic to forms

Every "fill out this field" CTA pairs with a "tell Hunter in chat" alternative for elicitable fields. The allergic-to-forms Member can populate Profile entirely through conversation, and Hunter writes back.

---

## Part 10 — Build sequencing

The work in this doc spans three surfaces and depends on the existing Roadmap. The recommended sprint plan:

| Sprint | Work |
|---|---|
| **Sprint 1** | Business Profile page v0 — Identity + Capabilities + Certifications tabs (the most-populated entities). Provenance display. Read-only. Top nav entry. |
| **Sprint 2** | Profile editability (inline edits, deep-links to Roadmap), Positioning + Bid readiness tabs. Readiness Header v1. |
| **Sprint 3** | Hunter embed (collapsed/expanded states, "knows you" + "would help" sections, deep-links). Inline elicitation for single-field positioning answers. |
| **Sprint 4** | Prerequisite gating — opportunity-level gate computation, detail-page gate banners, Send-to-Mentor blocking modal. |
| **Sprint 5** | DFY upsell aggregated view, save-and-come-back bridge state, proactive embed expansion on contextual triggers. |

Sprints 1–3 are parallelisable; Sprint 4 requires Match Object's `prerequisiteState` field (small data work). Sprint 5 is enrichment.

This sequence aligns with the Hunter UX track in `06-prd-v4-final.md` §F and the data architecture track in `07-prd-data-and-ai-architecture.md` §11. Specifically:

- Profile v0 (Sprint 1) needs the Business Profile Graph reading APIs — already exists.
- Hunter embed (Sprint 3) ships alongside Hunter UX Sprint 2/3.
- Prerequisite gating (Sprint 4) ships alongside Hunter Sprint 4 / Grant detail page.

---

## Part 11 — Open decisions

### 11.1 Naming — "Business Profile" vs. alternatives

I've used "Business Profile" throughout this doc. Alternatives worth considering:

| Name | Argument for | Argument against |
|---|---|---|
| Business Profile | Descriptive, unambiguous | Slightly bland |
| My Business | Conversational, friendly | Sounds like a CRM |
| Foundation | Evocative | Unclear without explanation |
| Business Brief | Connotes succinct + polished | Might suggest a document deliverable |
| AI Memory | Aligns with AI memory pattern (§1.3) | Too AI-bro; might confuse |
| Profile | Generic but clean | Too generic |

**My recommendation:** stick with "Business Profile" for the spec. Test alternatives with Tim and Mariam for the brand surface.

### 11.2 Should the readiness header be opportunity-counted?

The header says *"You're ready to bid on: 18 federal · 4 SLED."* The number depends on a real-time count against the Member's filters and the current opportunity universe. This requires the matching engine to surface this count cleanly.

**Decision:** yes, but compute it on a daily refresh rather than real-time. The number doesn't need to be live to the second — daily-fresh is sufficient for the readiness framing.

### 11.3 Does the Hunter embed live in the right rail or top of page?

I've placed it in the right rail above the chat. Alternatives:
- Top of page, below the lead block — more prominent but crowds the discovery flow
- Collapsed slim banner at the very top — even more prominent
- Floating widget bottom-right — Intercom-style

**My recommendation:** right rail above the chat, collapsed by default for established Members, expanded for cold-start. Test in Sprint 3 with 5–10 Members.

### 11.4 Should excluded sub-steps be visible in Profile?

Per §9.2, excluded sub-steps render with the "Already done — [reason]" treatment. But should they be visible by default, or hidden behind a "Show excluded" toggle?

**My recommendation:** visible by default but rendered subtly (smaller, lighter). Members should be able to easily un-exclude if they reconsider, and hiding feels like sweeping decisions under the rug.

### 11.5 The "what unlocks" language per section

Section footer says e.g. *"This section unlocks: most federal bids."* The mapping (which sections unlock what) needs to be authored carefully. **Owner:** Sara + Mariam, in collaboration with Sinan.

### 11.6 Mobile design

This entire doc has assumed desktop. The mobile experience for Profile + Hunter embed needs separate thought. **Recommendation:** the Hunter embed's collapsed single-line state is the primary mobile state; expansion routes to the full Profile page on mobile rather than inlining. Profile on mobile shows the readiness header + section dropdown rather than tabs.

### 11.7 Permissioning for multi-user accounts

If GovPreneurs supports multi-user accounts in the future (founder + bid manager + ops lead), Profile permissions become an issue. Different roles see different fields, can edit different things. **Out of scope for v1.** Flag for future spec.

---

## Part 12 — Success metrics

How we know this is working:

### 12.1 Profile completion metrics

| Metric | Target |
|---|---|
| % of active Members with `positioning.targetAgencies[]` populated | >70% by 4 weeks active |
| % of active Members with `positioning.targetContractValueRange` populated | >70% by 4 weeks active |
| % of active Members with ≥3 past performance entries | >50% by 8 weeks active |
| Median fields-filled per active Member | >50 of ~80 by 8 weeks |
| % of profile updates flowing through Hunter embed (vs. Profile direct edit) | ≥30% — indicates the embed is working |

### 12.2 Gating UX metrics

| Metric | Target |
|---|---|
| Gate-to-resolution conversion (% of Members who hit a hard gate and complete the prereq) | >40% within 14 days |
| Gate abandonment (% who hit gate and never come back) | <20% |
| DFY conversion at gate (% who choose DFY when gated) | TBD by service — track per service |
| "Save and come back" usage on gates (% of gates that result in a save) | >30% — indicates the bridge works |

### 12.3 Hunter embed engagement

| Metric | Target |
|---|---|
| Embed expansion rate per session | >25% of sessions |
| "Tell Hunter now" CTR per expanded view | >40% |
| Average gaps resolved per Member per week via embed | >0.5 |
| Embed-driven profile improvements that translate to better match precision | Measurable improvement of ≥5% in save rate |

### 12.4 Cross-surface coherence

| Metric | Target |
|---|---|
| Members who use both Profile and Hunter embed in same session | ≥50% by Sprint 5 |
| Edits made on Profile that match what was elicited via Hunter chat | ≥80% — indicates consistency |
| Member-reported confusion about "which surface to use" (qualitative) | <10% |

---

## Part 13 — Summary: the answer to the central question

> *"Should I have a separate page called 'Business Profile' where this should live? Or should this live inside Hunter? Or should it be both?"*

**Both. With clear roles for each.**

- **Business Profile (new top-level page)** is the canonical, deep, transparent view of everything we know — the destination for *settle-in review and edit*. It mirrors the AI memory pattern (Claude, Glean) and the compliance dashboard pattern (Stripe, Mercury), with our own unique twist: every gap pairs DIY and DFY paths.

- **Hunter embed** is the contextual nudge — *what Hunter is using to rank, the next single thing that would help, one-click resolution.* It mirrors the LinkedIn / Tinder / Airbnb completeness widget pattern, but outcome-framed (not gamified) and AI-team-aware.

- **Roadmap (existing)** remains the canonical *doing* surface. Profile and Hunter embed point to it for verification and DFY enrollment; both consume the Graph that the Roadmap helps populate.

- **Opportunity-level prerequisite gates** apply just-in-time at the moment of action (Save → allowed; Send-to-Mentor → gate). The gate is also the path forward, with DIY and DFY both visible.

The four surfaces share one substrate — the Business Profile Graph — and they coordinate through a clean reactive update protocol so an edit anywhere propagates everywhere.

This architecture is what tier-1 SaaS converges on. It serves the Member who wants to deeply review their data, the Member who wants quick contextual nudges, the Member who's ready to act, and the Member who's blocked — without any of them feeling forced into the wrong mode.

And it monetises the gap: every missing field is also a DFY upsell opportunity, surfaced consistently across all four surfaces, never demanded, never repeated to exhaustion.

---

*End of design + research doc. Take this to design review with Siddharth, Tim, Sara, Mariam, Abhinav. Mock fidelity expected within 3 weeks of sign-off; build sequencing per §10.*
