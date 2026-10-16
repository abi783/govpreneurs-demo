# sources — notes for Claude (moved from root CLAUDE.md)

### Source references — the four geometries (`frontend-v2/src/lib/sources/`)

Every Grant claim carries a pin that resolves to exactly one renderable body. **The invariant: every pin resolves** — no path returns null, none leaves an empty body, and a source we can't show becomes an explicit explained state, never a dead chip. Pins are server- and model-supplied and resolve during *render* inside the canvas, so every value read off one is narrowed first.

| Geometry | Located in | Body | Built from |
|---|---|---|---|
| Document | Space | A passage, highlighted | `provenance.excerpt` / `quote` / section text |
| Record | Structure | The member's own field list | `sources/records.ts` |
| Conversation | Time | A thread, cited turn highlighted | `provenance.conversation` |
| **Public record** | **A register** | **A register entry, or a counted set** | `sources/publicRecords.ts` |

The fourth geometry (design-reference `docs/design-system/source-references/public-records-PRD.md`) has two shapes and its own grammar — the object type rides in the **ref**, not in `ProvenanceType`, so adding a register stays cheap:

```
award:<awardId>#<highlight,fields>   one federal prime contract
entity:<awardeeKey|name>#<fields>    one registered contractor (SAM.gov registration)
buyer:<agencyKey>#<fields>           one contracting office (its own award history)
tally:comparable-awards              median value, counted over award records
tally:field-size                     median offers received, counted
tally:market-winners                 firms that have WON comparable work
```

Rules that are load-bearing rather than cosmetic:

- **Fixed fields per object type; only the highlight moves.** A field set that changed per claim would let us quietly drop the inconvenient row. An absent field renders "Not in the record" rather than vanishing, so a reader can tell we looked.
- **A tally's basis IS its claim.** "$170K" is an assertion; "$170K, median of 186 awards matched on NAICS 238160, FY2006–FY2021" is a finding. `yearsCovered` is **derived from the rows counted**, never a window we assert — we apply no date filter, and a claimed-but-unapplied filter is worse than no basis because it looks like rigour.
- **Every public figure is counted, never predicted.** Who *will* bid is not releasable before award (Procurement Integrity Act; FAR 3.1) and has no ground truth. `tally:market-winners` (who *has won*) is the retrospective replacement — see the PRD's D2 audit before adding anything that resembles a bidder estimate.
- **Freshness is on the face of it** (`asOf`, from `_hgSyncedAt`), and material lag is named — defense award records run ~90 days behind. Stale-but-flagged is fine; stale-and-silent is a failure.
- **Self-certified ≠ certified.** SAM's `cert_flag` decides whether a set-aside bid is responsive, so the entity register prints "(self-certified)" rather than flattening the two.
- **A register value is never re-cased.** 99.9% of live `award_description_original` values are ≥90% uppercase, and that prose carries part numbers, contract ids and MIL specs — any casing heuristic mangles identifiers at scale, which is the surface misquoting the record it exists to let a member verify. Whitespace is collapsed (cannot change meaning); casing is not.

**Not built, and why:** wage-rate, protest and forecast registers have no data source (DOL / GAO / agency forecasts). Hunter's Partners and Government Buyers pages are **mock-driven**, so they carry no provenance — attaching a government citation to mock data would fabricate the exact thing this pattern prevents.
