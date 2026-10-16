import { FeedIntro } from "./feedIntroCopy";
import { OpportunitiesTabs } from "./OpportunitiesTabs";

const noop = () => {};

/** How many placeholder rows sit behind the blur. Matches the feed's page size. */
const BACKDROP_ROW_COUNT = 12;

/**
 * The bar layout of a row, as widths only. `true` marks the short modifier.
 * Two patterns alternate so twelve rows read as withheld content rather than as
 * a repeating grid.
 */
const ROW_PATTERNS: readonly (readonly boolean[])[] = [
  [false, true],
  [false, true, true],
];

/** One inert row: bars sized by CSS, carrying no text. */
function BackdropRow({ pattern }: { pattern: readonly boolean[] }) {
  return (
    <div className="locked-backdrop__row">
      {pattern.map((short, i) => (
        <div
          key={i}
          className={
            short ? "locked-backdrop__bar locked-backdrop__bar--short" : "locked-backdrop__bar"
          }
        />
      ))}
    </div>
  );
}

/**
 * Static, self-contained backdrop shown behind the Pilot upsell gate.
 *
 * It renders GEOMETRY ONLY — twelve rows of blank bars. It holds no opportunity,
 * real or invented: a member paying us must never be shown a fabricated agency,
 * title, value or deadline, and a screenshot of this page cannot be mistaken for
 * a contract.
 *
 * SECURITY: it fires ZERO network requests. Pilot users never mount the real feed
 * (`OpportunitiesFeed`), so there is no `/opportunities/discover/v2` call to find
 * in the Network tab and no real opportunity data in the DOM — removing the blur
 * in devtools reveals only empty bars. The wall cannot be bypassed client-side
 * because the protected data was never fetched. `LockedOpportunitiesBackdrop.test.tsx`
 * asserts both properties; do not add a fetch, or a hook that fetches, here.
 *
 * The whole backdrop is `aria-hidden`: it is decoration behind a gate, and the
 * gate (`PilotUpsellGate`) carries the accessible content.
 */
export function LockedOpportunitiesBackdrop() {
  return (
    // `inert` as well as `aria-hidden`: the intro's glossed terms are focusable,
    // and a focusable element inside an aria-hidden region is a keyboard trap.
    <div style={{ display: "flex", flex: 1, minWidth: 0 }} aria-hidden="true" inert>
      <section
        style={{
          flex: 1,
          minWidth: 0,
          padding: "var(--s-8) var(--s-6) var(--s-12)",
          maxWidth: 980,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <header style={{ marginBottom: "var(--s-4)" }}>
          <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>
            Discovery
          </div>
          <h1 className="t-display-lg">Opportunities</h1>
          {/* The backdrop counts nothing, so it passes no count. Same sentence
              as the live feed, from the same module. */}
          <FeedIntro count={null} />
        </header>

        {/* Every count is null. The backdrop counts nothing, so it claims nothing. */}
        <OpportunitiesTabs
          tab="for_you"
          onChange={noop}
          openCount={null}
          allCount={null}
          savedCount={null}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: "var(--s-4)" }}>
          {Array.from({ length: BACKDROP_ROW_COUNT }, (_, row) => (
            <BackdropRow key={row} pattern={ROW_PATTERNS[row % ROW_PATTERNS.length]} />
          ))}
        </div>
      </section>
    </div>
  );
}
