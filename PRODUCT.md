# Govpreneurs — product contract

Helps a small business win government contracts. **Hunter** finds opportunities,
**Grant** calls bid or no-bid, **Ava** writes the bid, mentors review it, and nine
done-for-you services fill gaps. This repo is the sales demo, on sample data.

## Surface type
Standalone web app. (Production sits in a GoHighLevel iframe; the demo copies its menu.)

## Persona
**Amira Haddad**, owner of Haddad Catering & Food Services LLC, Fayetteville NC,
five people. English is her second language. Phone-first, often standing in a
kitchen. Uses WhatsApp, Instagram and a banking app; has never used a CRM. Keeps
her licence, insurance and LLC papers as photos on her phone. Bidding for the
first time; does not know what NAICS, UEI or set-aside mean, and should not need to.
- **Her fear:** filling in a government form wrong and causing a problem she
  cannot undo. Nothing saves until she confirms. "I don't know" is a real answer.
  A missing thing is never shown in red.
- **Plain English, enforced:** about grade 6. Sentences under 15 words. No idioms,
  no metaphors in labels. The plain sentence is the headline; the official term is
  the smaller line under it. Dates in full ("15 April 2027"). Verdict first.
- **Voice:** calm and professional. Outcome-framed ("so Hunter stops showing
  jobs that are too big"), never field-framed. Never blame her for missing data.
- **Never a dead chip.** Every source reference opens the real thing, or says
  "unavailable" and why.
- **One fact, one owner.** My Business owns every business fact; other screens
  link to it. Nothing is typed twice.
- **Progress counts to the next milestone, with a real date.** Never a completion %.
- **Zero high-severity questions before she has given one fact.** Count every
  question a screen asks that is not about her business; fix the high ones first.
- Marcus Williams (roofing, SDVOSB) is a legacy fixture in older docs. Never design to him.

## Jobs
1. Find contracts I can win, without searching. (Opportunities)
2. Know if one contract is worth bidding on, and why. (Grant on the opportunity)
3. Write the bid and send it, by talking, not typing. (Ava)
4. Tell Govpreneurs about my business once, and keep it right. (My Business)
5. Know my one next step. (Success Center, Roadmap, Tasks)
6. Track the bids I am working on. (Pipeline)
7. Get a mentor to check a bid before I send it. (Mentors)

## Glossary
- NAICS code — the number for the kind of work a business does
- Set-aside — a contract only some small businesses can bid on
- Set-aside type — which group a set-aside is for
- SDVOSB — service-disabled veteran-owned small business
- WOSB — women-owned small business
- HUBZone — the SBA program for small businesses in historically underused business zones
- 8(a) — the SBA program for disadvantaged small businesses
- Period of performance — the dates the work runs
- SAM.gov registration — the sign-up that lets a business sell to the US government
- UEI — the 12-character ID SAM.gov gives a business
- CAGE code — the 5-character ID for a registered business
- Capability statement — a one-page summary of what a business can do
- Past performance — earlier jobs that prove a business can do the work
- Solicitation — the government's request for bids
- RFP — request for proposal
- RFQ — request for quote
- IFB — invitation for bid; sealed bids, lowest fair price wins
- PSC — product and service code; the government's code for what it is buying
- Sources sought — the government asking who could do a job, before it asks for bids
- Notice ID — the number on a solicitation
- Response deadline — when the bid must arrive
- Contracting officer — the government person who runs the purchase
- Prime — the business that holds the contract
- Subcontractor — a business doing part of the work for the prime
- Teaming partner — another business that bids with you
- Incumbent — the business doing the work today
- Award — a contract the government has given to a business
- Forecast — a contract the government plans to buy later
- Contract vehicle — an existing contract that agencies buy through
- IDIQ — indefinite delivery, indefinite quantity contract
- GSA Schedule — a contract vehicle run by GSA
- Wage determination — the lowest pay the contract allows for each job
- Bonding — a guarantee that the business will finish the work
- SLED — state, local and education buyers
- Bid — Grant's call to go after a contract; also the response Ava writes and you send
- No-bid — Grant's call to skip a contract
- Bid as a subcontractor — Grant's call to join a prime instead
- Needs review — Grant's call when a contract is not a clear bid or no-bid
- Hunter — the agent that finds and matches opportunities
- Grant — the agent that reads a solicitation and calls bid or no-bid
- Ava — the agent that writes the bid
- Tell Hunter — tell Hunter a fact about your business
- Send to mentor — ask a mentor to review a bid
- Have us do it — buy the done-for-you service for this item; shows the price
- Your papers — licences, insurance and certificates
- Success Center — the member's home page
- My Business — everything Govpreneurs knows about the business
- Quarterly Targeting Call — the call where a mentor sets the next quarter's targets

## Gated concepts
- **Field tiers.** About 12 must-have facts show first; good-to-have facts sit
  below, lighter. Advanced facts (bonding detail, CMMC, ISO, GSA Schedule, DCAA)
  stay behind "Show advanced fields". Hunter never asks for an advanced fact.
- **Done-for-you button.** "Have us do it — $<price>" shows only on a missing or
  error fact that one of the nine real services fills. Never invent a service.
- **Prerequisite gates.** Hard gate blocks Send to mentor where she cannot bid
  (federal job, no SAM.gov registration). Soft gate is a yellow band, no block.
  Capability gate only lowers Hunter's match.
- **Inference proposes; authority writes.** An AI or call-derived fact arrives as
  a proposal she accepts, corrects or dismisses. A government-record fact shows its
  source and date. Nothing writes to her record without her confirming.
- **Never shown:** confidence scores, completion percentages, badges, streaks,
  confetti. An empty fact beats a confident wrong one.

## Competitors
SAM.gov (the official system she must use), GovWin IQ (Deltek), HigherGov,
GovTribe, Unison; GovCon AI tools GovDash, Sweetspot and Rogue. They show the
member a black box; we show her what we know and let her correct it.

## Trusted references
Approved by Karthik, 19 October 2026 (`decisions/001-trusted-references.md`).
- TurboTax — turns a scary government form into one plain question at a time
- Gusto — works out which registrations a small business needs instead of asking
- Stripe Dashboard and Atlas — calm detail pages; status with source and date; why each sensitive field is asked
- Shopify admin — a small owner's home that shows the next setup step
- Airbnb hosting — phone-first, step-by-step setup with photo uploads
- Wise — verification status and "what happens next" in plain English for a global audience
- Granola — you talk, it writes a clean draft you can edit
- Linear — list-to-detail triage and a board, one primary action per view

## Sample data
No backend: every API call is answered in the browser from sample data about Amira.
- `src/demo/story/` — the story: Amira's facts, opportunities (`HERO_IDS`), Grant's
  calls, pipeline, tasks, mentor replies. `bunx vitest run src/demo/story` checks it.
- `src/demo/api/` — one handler file per area (`ENDPOINTS.md` lists every call);
  `src/demo/<area>/` holds per-area data.
- Scenarios: the 11 story segments in `src/demo/presenter/segments.ts` (`jumpTo`;
  presenter panel Shift+Alt+P). Visitor changes live in `sessionStorage`; "Reset
  demo" restores the start. Roadmap test states exist in
  `src/sc/lib/roadmapV3/scenarios.ts`, but the demo pins `scenarioId: null`, so
  `?scenario=` does nothing here yet.

## Viewports
`1440x900,1366x768,375x812` — 375 because Amira is phone-first and opens the
app from her phone between jobs. Approved 19 October 2026.

## Preview command
`bun run build --outDir <outDir> --emptyOutDir && bun run preview --outDir <outDir> --port <port> --strictPort`
(The build takes about 3 minutes.)

## Install command
`bun install`

## Gate routes
`/,/opportunities,/opportunities/SP4701-26-Q-0021,/ava/SP4701-26-Q-0021,/my-business,/pipeline,/tasks`
SP4701-26-Q-0021 is the first hero bid (Camp Mackall field meals): Hunter → Grant "Bid" → Ava.
