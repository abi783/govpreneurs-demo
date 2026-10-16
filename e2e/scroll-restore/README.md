# Feed scroll restoration — manual verification

`node verify.mjs`, with `npx vite --port 5199 --strictPort` running in another
shell. Everything below the dev server is stubbed, so no backend, Mongo, Redis
or GovAI is involved.

## Why this is a script and not a spec

`main` has no stubbed SPA e2e tier — `frontend-v2/e2e` is Grant harness pages and
there is no `test:e2e` wiring — so there is nowhere for this to live as a spec,
and nothing runs it in CI. It is committed anyway because the feature it covers
**shipped broken once for exactly this reason**: the behaviour was argued for in
a commit message and never executed. Anyone changing feed pagination, the filter
seeding, or `lib/feedSnapshot.ts` should run it.

When this work is ported to `staging-v2`, which does have the stubbed tier, these
seven checks should be rewritten as a proper spec with page objects and this
directory deleted.

## What it proves, and why each half is needed

The app runs in two scroll regimes, and **only one of them is production**:

| Scenario     | Who scrolls        | What has to work                        |
| ------------ | ------------------ | --------------------------------------- |
| `standalone` | the app's document | `window.scrollY` / `window.scrollTo`    |
| `embedded`   | the parent frame   | `scrollIntoView` + IntersectionObserver |

`embedded` reproduces the GoHighLevel custom-page iframe: the parent sizes the
frame to its content, so the inner document never scrolls. `window.scrollY` reads
0 no matter where the member is, and `window.scrollTo` does nothing. The harness
asserts that regime is genuinely in force before testing anything in it —
otherwise the scenario would pass by testing the wrong thing.

Two details that are load-bearing rather than incidental:

- **The filter-defaults stub is deliberately slow (400ms).** Those defaults seed
  the filters _after_ mount, which changes the feed key. That race is what broke
  restoration in production; a fast stub hides it and the harness passes for the
  wrong reason.
- **Hunter's Take is stubbed slow and long.** A take REPLACES a card's reasoning
  line, so it changes the card's HEIGHT — and it arrives after the feed has
  already been scrolled. Without that stub the harness never sees the layout
  move, and a restore that lands the member two rows off passes clean. This is
  what "it kinda works, but it scrolls a bit past where I was" was.
- **It clicks a row that is already on screen.** Clicking an off-screen row makes
  Playwright scroll the page to reach it, which moves the member's place before
  the app can record it. That is a harness artefact, not member behaviour — it
  produced a false failure while this was being written.

## Baseline

Run the checks against the commit before whichever fix you are looking at — the
harness is only worth having if it fails on unfixed code. Recorded so far:
`86f55681` (the first attempt) fails 4 of 7; `fd829983` (the second) fails 3 of 8,
all three being the member's landing position rather than the list itself.
