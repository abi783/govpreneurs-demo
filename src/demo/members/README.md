# Member packs

The demo tells one member's story at a time (`src/demo/member.ts`). Every member
except the caterer keeps its whole story in `src/demo/members/<id>/`: a **pack**.
Shared code reads the member on stage's copy of a file with
`own(import.meta.glob(...))`, picks between the caterer and the pack with
`byMember({ caterer, pack })`, and finds another member's record by its number
with `others(...)`. The caterer's story sits inline in the shared code, where it
began; her folder holds only the story files.

The agency (`agency/`, Lantern Row Creative) is the template.

## Add a member

1. **Story pack first.** Write `demo-storyboard/<niche>-pack.md` (the template is
   `marketing-agency-pack.md`): real buyers and notices as models, invented
   people and companies, every invented ID checked unused.
2. **Copy `agency/` to `<id>/` and rewrite every file** for the new member. Keep
   every file name and export name: `pack.test.ts` fails on a missing one. No
   agency fact, name or word may be left (the scan finds them).
3. **Register it:** add the id to `PackMemberId` and `MEMBERS` (label and short
   label) in `src/demo/member.ts`, and one line to `MEMBER_FILES` in
   `src/demo/story/opportunities.ts`.
4. **Words** (`words.ts`): `OWN_WORDS` names the business, the owner, the primary
   NAICS and the trade words no other member would use. Every other member's
   screens are checked against them, so keep them distinctive.
5. **Ava** (`ava/`): `index.ts` exports `HERO_BID`, `HERO_ANSWERS` and `HERO_START`
   for the hero bid. Write them in `ava/fixture.ts` and `ava/start.ts`, modeled on
   the agency's (`src/lib/ava/fixtures/familyAdvocacy.ts`,
   `src/lib/ava/starts/familyAdvocacy.ts`). `ava/grantRead.ts` is Grant's written
   read of that bid; it imports types and the member's own ids only.
6. **Capability statement:** add the member's lines to `COPY` in
   `scripts/make-capability-statement.ts`, run
   `DEMO_MEMBER=<id> bun scripts/make-capability-statement.ts`, and set
   `CAPABILITY_STATEMENT_BYTES` in `copy.tsx` to the size it prints.
7. **Tests in a pack folder run in every member's mode.** Guard them:
   `describe.runIf(MEMBER === "<id>")`.

## What each file holds

| File | What |
|---|---|
| `persona.ts` | The business, owner, codes, certifications, past jobs and their story roles, mentor, key partner |
| `opportunities.ts` | `HERO_IDS` (hero, twin, team-up) and about 25 opportunities (12 For you, 13 All) |
| `workspace.ts` | Closed pursuits, mentor reviews and threads, wallet, tasks |
| `grantBriefs.ts`, `mentorReplies.ts` | Grant's hand-written briefs; Sarah's replies |
| `grant/` | Grant's analyses, details, domains (`DEFAULT_DOMAIN`) and vocabulary |
| `hunter/vocab.ts` | Hunter's words for the trade |
| `market/` | Awards, buyers, firms, forecasts, labor rates, partners, vehicles |
| `orders/data.ts` | Small Orders: the board's items, if any fit |
| `sc/` | My Business seed and the Success Center home |
| `copy.tsx` | Every shared screen's words for this member, one export per screen |
| `words.ts` | `OWN_WORDS` |
| `ava/` | The hero bid in Ava, and Grant's read of it |

## Gates before a member merges

- `bunx tsc --noEmit`
- `DEMO_MEMBER=<id> bunx vitest run` (the known failures: `metGrant.test.ts`)
- `MEMBER=<id> node demo-storyboard/tools/scan-member.mjs <url>`: 0 page errors and
  0 other-member words on every menu page
- Every page's text read once, by a person: plain words, no slop
