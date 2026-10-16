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
- D28. **A new mentor review stays "Sarah is reviewing"** after Tim sends it. In the product, a reply takes about one business day. A fake instant reply would mislead a buyer.
- D29. **Sending a review costs $97 from the wallet**, as in production. The balance goes down live on the call.
- D30. **Hunter's chat is scripted.** Every starter question has a specific, true answer. About 30 typed questions are recognised. Any other question gets a helpful reply with the nearest questions as buttons.
- D31. **Grant's hand-written reviews:** Camp Mackall field meals, Fayetteville cafe, Cumberland County, Fort Bragg dining, the restricted site and the Fort Bragg reply. Every other opportunity gets a review generated from the story facts. Production's own generator still talks about roofing.
- D32. **Opportunity documents download as real PDFs**, generated from the story: the solicitation, the work statement and the wage determination.
- D33. **"Build this bid with Ava" appears on every opportunity Grant says to bid.** The 4 story bids open Ava's full flow. Any other bid opens Ava's honest "I'm reading the buyer's files" state, as the prototype designed.
- D34. **Ava's prototype controls are hidden.** Shift+Alt+A shows them, so Tim can jump to any of Ava's states.
- D35. **Small Orders shows food-service product buys** (meal components, food carriers, trays, coffee), not the auto parts in production's sample data.
- D36. **Five more fictional mentors join Sarah Mitchell** on the Mentors page. Booking a session works end to end.
- D37. **Roadmap progress is computed once**, from the Roadmap's own data. Success Center home shows the same numbers.
