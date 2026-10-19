# Decisions log

Shyam delegated every decision during the build (16 Oct 2026). Each decision
below is one I made. Shyam reviews this list at the end. To change any item,
name its number.

## Rulings from Shyam (not mine)

- R1. Copy production's `frontend-v2` and use sample data; Abhi hosts.
- R2. Clean menu: only our items, in GHL's order and with GHL's names, plus Ava.
- R3. Ava appears as plain "Ava", with no "early access" tag.
- R4. No Community and no Settings items.
- R5. Success Center home, Roadmap, Tasks, Mentors and My Business are in the demo and work fully, on sample data.
- R6. Nothing may break or do nothing when clicked.
- R7. Subagents use Sonnet.
- R8. (17 Oct) Add a "Know Your Market" menu section at the bottom: Government Buyers, Partners, Awards, Vehicles, Labor Pricing. Partners and Awards move there from Explore.

## Story

- D1. **Sample business: Amira Haddad, Haddad Catering & Food Services LLC, Fayetteville NC.** Karthik's prototype already holds her data, including Ava's bids, so it is the cheapest complete story.
- D2. **The business formed in 2021, not 2024.** Her 2021 church catering job was older than the business.
- D3. **The church is fictional** ("Riverside Fellowship Church"). The prototype named a real church.
- D4. **She has a capability statement on file**, and the demo opens with her past Get Registered and Get Positioned. Hunter's "Why these?" panel needs a capability statement; without one, production shows the preview gate instead of matches.
- D5. **Three hero opportunities:** Camp Mackall field meals (Grant: Bid), Fort Bragg dining halls (Grant: Bid as a subcontractor), and the Camp Mackall restricted site (Grant: No-bid).
- D6. **Fort Bragg dining is now about $2M a year.** The prototype's Hunter said $420K–$560K, but Grant's review was built on a $2M bond (100% of the annual price). The value now agrees with the bond.
- D7. **The restricted site needs a Secret clearance**, not Top Secret, with no sponsorship. Grant's No-bid then rests on one plain fact.
- D8. **The Fort Bragg sources sought gets a realistic notice ID** (`W912EE-27-S-0004`, was `DEMO-SPECIAL-02`). "DEMO" showed on screen.
- D9. **Ava builds 4 bids, not 5.** I dropped the Aurora, Illinois picnic, because an 800-mile job doesn't fit a North Carolina caterer.
- D10. **Each Ava bid starts at a different point**, so Tim can show the whole flow: Camp Mackall needs answers, Fayetteville is finished and reviewed, Cumberland is paused on certificates, and the Fort Bragg reply is ready to send.
- D11. **Pipeline statuses come from the same file as Ava.** The prototype marked bids "expired" or "won" while Ava was still building them.
- D12. **One mentor everywhere: Sarah Mitchell.** The prototype also used "Diana Potts".
- D13. **Real companies are not named as bidders, incumbents or partners.** Government buyers are real. Companies are fictional; Sodexo, Aramark, Compass and Eurest are replaced.
- D14. **Hunter never says "win"** and never uses Bid / No-bid words. Grant makes the call. Hunter's reasons are capped at 210 characters, like production's.
- D15. **Every Hunter claim is machine-checked against her profile** (value, distance, set-aside, code, past job). See `src/demo/story/check.ts`.
- D16. **All dates count from the day the demo opens.** Nothing closes in 6 days or fewer: production treats 5 days or fewer as too late to bid.
- D17. **The Pipeline shows every stage**, including one submitted bid, one win (Womack) and one loss on price. Production's board only fills "saved" and "with mentor" from real data.
- D18. **Wallet: $500 top-up minus two $97 mentor reviews = $306.**

## App

- D19. **The demo opens on Success Center (`/`).** The Hunter feed moves to `/opportunities`.
- D20. **Mentors (Success Center's mentor directory) lives at `/find-a-mentor`.** Mentor Reviews keeps `/mentors`, as in production.
- D21. **Ava sits in the menu under Your Workspace, after Pipeline.**
- D22. **A thin "Sample data" strip with a "Reset demo" button runs across the top.** Settings is gone, so the reset control needed a home.
- D23. **The demo keeps its state through a reload.** "Reset demo" restores the starting story for the next call.
- D24. **No network call leaves the browser** except page assets and Google Fonts. Anything else is blocked and fails the tests.
- D25. **The old booth lead form, the admin bypass and the public `/tools` pages are removed.**

## Build

- D26. **The pages are built by seven parallel agents**, each in its own git worktree with its own files. I merge their work. The story file and the shared state (saved list, wallet, mentor reviews) are mine, so no two pages can disagree.
- D27. **Amira has a one-page capability statement PDF** (`public/demo-files/`), generated from the story. Hunter's "Why these?" panel and My Business link to it.
- D28. *(Retired by D80, 19 Oct 2026.)* **A new mentor review stays "Sarah is reviewing"** after Tim sends it. In the product, a reply takes about one business day. A fake instant reply would mislead a buyer.
- D29. **Sending a review costs $97 from the wallet**, as in production. The balance goes down live on the call.
- D30. **Hunter's chat is scripted.** Every starter question has a specific, true answer. About 30 typed questions are recognised. Any other question gets a helpful reply with the nearest questions as buttons.
- D31. **Grant's hand-written reviews:** Camp Mackall field meals, Fayetteville cafe, Cumberland County, Fort Bragg dining, the restricted site and the Fort Bragg reply. Every other opportunity gets a review generated from the story facts. Production's own generator still talks about roofing.
- D32. **Opportunity documents download as real PDFs**, generated from the story: the solicitation, the work statement and the wage determination.
- D33. **"Build this bid with Ava" appears on every opportunity Grant says to bid.** The 4 story bids open Ava's full flow. Any other bid opens Ava's honest "I'm reading the buyer's files" state, as the prototype designed.
- D34. **Ava's prototype controls are hidden.** Shift+Alt+A shows them, so Tim can jump to any of Ava's states.
- D35. **Small Orders shows food-service product buys** (meal components, food carriers, trays, coffee), not the auto parts in production's sample data.
- D36. **Five more fictional mentors join Sarah Mitchell** on the Mentors page. Booking a session works end to end.
- D37. **Roadmap progress is computed once**, from the Roadmap's own data. Success Center home shows the same numbers.
- D38. **Success Center home has a "Recent activity" card that production lacks.** It shows Ava drafting, Sarah's reply, Grant's pass and the submitted bid, so the first screen tells the story. Everything else on the page is production's. Remove it if you want the page exactly as members see it.
- D39. **Program specialist: "Jordan Ellis"** (fictional). Onboarding call 218 days ago; positioning call with Sarah 150 days ago. These and the other history dates live in `src/demo/sc/timeline.ts`, so Home, the Roadmap, Tasks and My Business agree (copy review, 16 Oct 2026).
- D40. **Five more mentors with prices from $75 to $120 a session.** Sarah is $97, the same as a written review.
- D41. **"Re-charge wallet" and "Add funds" open an in-app top-up** instead of GHL billing, and it succeeds.
- D42. **The Roadmap has a "Quarterly Targeting Call" step** at the start of Execution. Production retired this step, but the story's next action is to book that call with Sarah. Amira starts at 82% (11 of 14 steps). Booking the call moves her to 86%.
- D43. **Sample prices for two done-for-you services: CMMC $497, Prime Registration $197.** The coupon `DEMO10` gives 10% off. The other prices come from the prototype's catalog.
- D44. **One calendar for every page.** A call booked on the Roadmap or from Tasks appears on Success Center home too. The home progress card shows the Roadmap's own phases.
- D45. **Shared Success Center calls (wallet balance, time zone, uploads) are answered in one place** (`src/demo/api/scShared.ts`). A test fails if two pages answer the same call.
- D46. **Every deadline is midnight at the start of its day, counted in calendar days.** All pages then read the same "Closes in N days" at any hour, including after the 1 November clock change.
- D47. **Value filters hide the Fort Bragg sources sought**, which states no value. Production would keep it. This way a filter such as "Under $25K" never shows a card with no value.
- D48. **Hunter's chat may move Tim to the All tab** when a question matches nothing on For You (for example "work in Virginia"), and says so.
- D49. **The Fayetteville cafe and Cumberland County values are per year** ($185K–$235K and $290K–$410K), to match Grant's "about $210K / $350K a year".
- D50. **Six Grant reviews are written by hand**, and the other 37 are built from the story facts. Grant's next step on Fort Bragg dining is Partners, not Ava, because its prime path is no-go.
- D51. **The restricted-site No-bid ends with Grant's "how to be ready next time" list**, including a "Have us do it" request that succeeds. This follows production's rule: no cold No-bid.
- D52. **Grant's review sections that production shipped without styles** (compliance checklist, reads, red team, section ledger) got demo styles. Production shows them unstyled.
- D53. **Amira's UEI is `LW1SL1HLED37`**, 12 characters like a real UEI. The prototype's had 11, and production's own check called it wrong.
- D54. **My Business starts at a score of 47 of 55**, with real gaps: EIN, licenses, key staff, 2 of 5 food-handler certificates, and a health permit and WOSB certification that expire soon. Three suggestions wait for a yes or no. The page shows what to do next.
- D55. **Facts derived for My Business:** 100% owner share, $75,000 working capital, 2 jobs at once, 30-day payment tolerance, health inspection "Grade A, score 97", NIGP code 96190, health permit expiring in 21 days, WOSB in 48, insurance in 120.
- D56. **The voice "dictation" in Tell Hunter needs no microphone.** It types a sample sentence, so it works on any call.
- D57. **A photo or logo uploaded on Success Center home also shows in My Business**, and the Roadmap and My Business share one set of checks.
- D58. **Forecasts: 48 in all.** 40 are recorded catering forecasts with dates moved to today; 8 are written for the story. The Fort Bragg 2027 dining program comes first, and Hunter says to team up for it.
- D59. **Small Orders: about 20 food-service DLA orders** (meal pouches, spaghetti, coffee, food trays, gloves, water). 14 match her; one saved order shows on the Pipeline.
- D60. **Partners: Carolina Dining Group first**, with Mike Sutton named as her contact from the 2024 subcontract. Then 2 more top partners and fictional competitors. Some competitors are tied to her own story; for example, Falling Creek Dining Group beat her on price at Seymour Johnson.
- D61. **Closed pursuits on the Pipeline open a dialog** with the submission, the debrief or the award, rather than a dead link.
- D62. **Sending a review to a mentor also saves the record**, as production does.
- D63. **`/home` (frontend-v2's old home page) redirects to Success Center.**
- D64. **Ava's last step has an "I sent it" button** that records the day, and the list card then says "You sent it". The prototype had no done state. Ava still never submits anything herself.
- D65. **Ava's "Talk" button speaks a sample answer** instead of using the browser's speech recognition, which would send audio outside the app.
- D66. **Sarah's notes on the Fayetteville proposal are about the draft she read.** Ava has already applied them, and the current draft marks two of her edits.
- D67. **Cumberland County asks for a 5% bid bond and, after award, a performance and payment bond of half the first-year price (about $175K).** Grant, Ava and the opportunity page all say the same, and it fits her $200K bonding history.
- D68. **The Fort Bragg sources-sought reply is due at 3:00 PM Eastern.**
- D69. **Each Ava bid keeps the due time in its buyer papers** (Camp Mackall 10:00 AM, Fayetteville 2:00 PM, Cumberland 2:00 PM, Fort Bragg reply 3:00 PM, all Eastern). Grant's timeline, documents and instructions show the same time. Every other opportunity is due at 5:00 PM Eastern.
- D70. **Amira's SAM registration ends 182 days from today**, so it never shows as expired. It was a fixed 15 April 2027 date.
- D71. **All invented email addresses end in `.example`**, a reserved domain, so no address can belong to a real person.
- D72. **The Virginia catering forecast is at Defense Supply Center Richmond** (about 170 miles), not Naval Station Norfolk (220 miles). Its "Good fit" label is then true for a 200-mile service area.
- D73. **Hunter's "Which am I ready for?" answer says "a stretch on your own"** for jobs above her size, such as Fort Bragg dining. Readiness is about bidding alone. The card's priority rating is about fit. Grant's prime no-go agrees.
- D74. **Copy review:** no text promises a win, US spelling throughout, one timeline for her history (onboarding 218 days ago, positioning call 150, SAM 183), each invented person has one role, and "Blackwater Dining Group" is renamed (it echoed a real contractor). A rule set in `qa/copyRules.ts` checks every page on every crawl.
- D75. **No link leaves the demo.** "Go to DIBBS", "Open sam.gov", "Watch the video" and the like show an in-app notice instead of opening an outside site.
- D76. **What Tim does in Ava shows everywhere.** A bid he marks as sent moves to "Submitted" on the Pipeline. Uploading the Cumberland certificates un-pauses that card, and the matching tasks check themselves off.
- D77. **Due dates can fall on a weekend on some days.** Dates count from the day the demo opens; rolling them to weekdays would make "N days left" differ between pages. Accepted as a small realism gap.
- D78. **Small Orders never lists a set-aside she can't bid on as "for you"** (for example a service-disabled-veteran set-aside).
- D79. **A double-click sends once.** Mentor reviews, bookings and purchases charge the wallet once, even on a fast double-click.

## Presenter controls (19 Oct 2026, Karthik)

- D80. **Sarah can answer on the call (retires D28).** The presenter's "Sarah answers" control replies to a waiting review with Pursue, Discuss or Pass. A "One business day later" card shows first, so nobody takes it for the product's real turnaround. Her written replies live in `src/demo/story/mentorReplies.ts`; any other review gets a short reply built from the opportunity.
- D81. **A sent bid can be decided on the call.** The "Award" control moves a bid she sent in Ava to Won or Not awarded, after a "Three weeks later" card. The Pipeline card and the award dialog are the ones the story's closed pursuits already use.
- D82. **Jump to any of the 11 story segments.** It wipes the demo, writes what that segment needs (Ava's draft read, the hero bid sent), then loads its page. It is for recovering from a mis-click and for resetting the booth; on a call Tim clicks the real screens.
- D83. **Booth mode is off unless switched on.** After 3 minutes with no input it warns for 10 seconds ("touch anything to keep going"), then rests on Hunter's feed. The timer only arms after someone touches the demo, so an empty booth is not reloaded every 3 minutes. "Reset demo" turns booth mode off.
- D84. **The controls stay out of the audience's way.** A faint handle at the bottom of the dark menu, or Shift+Alt+P (like Ava's Shift+Alt+A). The panel sits over the menu, never over the page or the bottom-right chat boxes, shows only the controls that fit the screen, closes after each action, and answers to 1–9, 0 and − while open. The QA crawl skips it (`data-qa-skip`). Code: `src/demo/presenter/`.

## Two members (19 Oct 2026, Karthik)

- D85. **The demo tells two stories.** Lantern Row Creative (Dana Okafor, a 9-person woman-owned ad agency in Fayetteville) for Level Up, and Haddad Catering (Amira) as before. The member is chosen once per page load (`src/demo/member.ts`): the agency by default, the caterer with `?member=caterer` or the presenter panel's Member switch. "Reset demo" keeps the member.
- D86. **Every story file keeps its path and exports and picks the active member's data** from `src/demo/members/<member>/`. Amira's data moved there unchanged. Content written for one member imports that member's own hero ids, never `HERO_IDS`, so it can never attach to the other member's records.
- D87. **The agency's three story opportunities follow real public records.** Hero: Fort Bragg Family Advocacy print and digital ads (WOSB set-aside, Bid), modeled on PANMCC-21-P-000-009052. Twin: the same program's TV and streaming ads (No-bid: one provider's own app, crew and viewer data), modeled on PANMCC24P0000016825; Grant says it neutrally and never suggests a rigged notice. Team-up: the VA's national health-care hiring campaign follow-on (SDVOSB set-aside, ~$8M a year), modeled on 36C77623C0104; Bluestone Veteran Media Group (fictional) is the prime.
- D88. **The agency's hero starts with no mentor review**, so Tim sends it live and plays Sarah's answer forward (D80). Her other threads show Discuss (the FAST proposal) and Pass (Visit NC), so all three verdicts appear.
- D89. **Lookups by id also find the other member's records** (opportunities, past jobs, Grant briefs), so content written for one member still loads while the other is on stage. Feeds, boards and counts read the active member only. `demo-storyboard/tools/scan-member.mjs` proves no other-trade words show on any page.
- D90. **Small Orders shows the agency nothing "for you"**, with Hunter's reason (DLA small orders are parts and supplies) in production's own empty state, and a link to small video and design jobs.
- D91. **QA builds pin a member** (`QA_MEMBER`, default caterer), so the existing flow specs keep testing the caterer.
- D92. **New Hunter fact kinds `providerLock` and `setAsideGap`, and the SDVOSB set-aside.** The story check bans catering words from the agency's records.

## Five more niches (19 Oct 2026, Karthik)

- D93. **Seven members.** Chosen from real member data (aggregate counts of primary NAICS codes and capability statements; no member's details used): construction (Ninebark Builders, Derrick Faircloth, HUBZone), trucking (Rockfish Run Freight, Tanya Merritt, SDVOSB), IT services (Gallberry Technology Group, Hector Salinas, 8(a)), consulting (Coppervale Advisory Group, Simone Strayhorn, SDVOSB) and janitorial (Gray Owl Facility Services, Reggie Tyndall, HUBZone). Each is as deep as the agency: about 25 opportunities, a Bid hero, a No-bid twin and a team-up, Grant's hand-written reads, an Ava hero bid, market pages, My Business and the Success Center. Story packs: `demo-storyboard/<niche>-pack.md`.
- D94. **Member packs.** Every member but the caterer keeps its whole story in `src/demo/members/<id>/` with the agency's file and export names; shared code reads the active member's copy with `own(import.meta.glob(...))` and `byMember({ caterer, pack })`. A new member is a folder plus one line in `MEMBERS` and one in `story/opportunities.ts`. `pack.test.ts` checks every file and export, and that no notice number or past job belongs to two members. Proof the refactor changed nothing for the agency and the caterer: every page's text was the same before and after.
- D95. **Set-asides from one table** (`src/demo/story/setAsides.ts`). Hunter, Grant, the forecasts and the profile say the member's own set-asides (HUBZone, 8(a), SDVOSB as well as WOSB), not "you are woman-owned".
- D96. **A new fit fact, `lockedOut`** (opportunity `lockedTo`): only holders of a contract vehicle, approved carriers or a mandatory source such as AbilityOne can bid. Hunter counts it as "not possible today". The five twins use it.
- D97. **Each member names its own words** (`members/<id>/words.ts`); every other member's screens are checked against them (story check, tests, `scan-member.mjs`).
