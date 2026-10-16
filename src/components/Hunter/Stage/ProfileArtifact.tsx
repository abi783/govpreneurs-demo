// The profile card — the `ProfilePayload` artifact on the stage.
//
// It shows what Hunter read when the member asked about her own business, so
// the reply can name a few facts and the card can show all of them. Three
// properties are load-bearing:
//
//   1. Every value names where it came from. A value she has not confirmed says
//      so, and never reads like one she typed.
//   2. An absence is STATED. A field she asked about with no value is listed as
//      not on file, and an unreadable record is never shown as an empty one —
//      the repo rule that empty is not verified-absent.
//   3. The list is bounded (`MAX_PROFILE_ROWS`), and the card says how many
//      values it left out, counting the server's cut and its own.
//
// The card opens on the main rows (`MAIN_PROFILE_ROWS`) and a "Show N more"
// control, so a whole record does not fill the stage.
//
// A list row renders as entries, each starting with a capital; a long list
// shows its first entries and "Show all". Long text folds at a word boundary
// with "Show more". Folding hides nothing for good: every control shows the
// whole value again. Every value renders as a React text node.

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import type { ProfileCardRow, ProfileCardSource, ProfilePayload } from "../../../lib/hunterChat";
import {
  COLLAPSED_LIST_ITEMS,
  FOLDED_TEXT_CHARS,
  foldText,
  MAIN_PROFILE_ROWS,
  naicsEntry,
  startWithCapital,
} from "../../../lib/hunter/profileCardText";
import { boundedList, MAX_PROFILE_ROWS } from "../../../lib/renderLimits";

/** Fixed copy. Exported so the tests read the same words the card prints. */
export const PROFILE_CARD_COPY = {
  kicker: "What Hunter knows about your business",
  source: {
    profile: "Success Center profile",
    capability_statement: "Capability statement",
    you_told_us: "You told us",
    unconfirmed: "Not confirmed",
  } satisfies Record<ProfileCardSource, string>,
  capabilityStatement: {
    unparsed: "Your capability statement is on file. Its details are not ready yet.",
    none: "No capability statement is on file. Upload one in the Success Center for richer answers.",
  },
  empty: "Nothing is on file for your business yet.",
  unavailable: "Your saved answers could not be read right now, so some details may be missing.",
  missingPrefix: "Not on file yet:",
  showMore: "Show more",
  showLess: "Show less",
  showFewer: "Show fewer",
} as const;

/**
 * The row's source, or `unconfirmed` when the payload carries a value this
 * card does not know. The server is the sender, but an unknown value must not
 * read as a confirmed one, and it must not reach a class name.
 */
function knownSource(source: string): ProfileCardSource {
  return Object.hasOwn(PROFILE_CARD_COPY.source, source)
    ? (source as ProfileCardSource)
    : "unconfirmed";
}

/** One list entry. A NAICS entry sets its code apart from its name. */
function ListEntry({ entry }: { entry: string }) {
  const naics = naicsEntry(entry);
  if (naics) {
    return (
      <li className="hunter-profile__item">
        <span className="hunter-profile__code">{naics.code}</span>
        {startWithCapital(naics.name)}
      </li>
    );
  }
  return <li className="hunter-profile__item">{startWithCapital(entry)}</li>;
}

/** A list row's entries, the first few by default and all of them on request. */
function ListValue({ items, moreItems }: { items: string[]; moreItems: number }) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = items.length > COLLAPSED_LIST_ITEMS;
  const shown = expanded || !collapsible ? items : items.slice(0, COLLAPSED_LIST_ITEMS);
  return (
    <>
      <ul className="hunter-profile__items">
        {shown.map((entry, i) => (
          <ListEntry key={i} entry={entry} />
        ))}
      </ul>
      {collapsible && (
        <button
          type="button"
          className="hunter-profile__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? PROFILE_CARD_COPY.showFewer : `Show all ${items.length}`}
        </button>
      )}
      {moreItems > 0 && (
        <span className="hunter-profile__more-items">and {moreItems} more not shown</span>
      )}
    </>
  );
}

/** A text row, folded at a word boundary when it is long. */
function TextValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = startWithCapital(value);
  const foldable = text.length > FOLDED_TEXT_CHARS;
  return (
    <>
      <span className="hunter-profile__text">{expanded || !foldable ? text : foldText(text)}</span>
      {foldable && (
        <button
          type="button"
          className="hunter-profile__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? PROFILE_CARD_COPY.showLess : PROFILE_CARD_COPY.showMore}
        </button>
      )}
    </>
  );
}

/** One labelled value with its source. */
function ProfileRow({ row }: { row: ProfileCardRow }) {
  const source = knownSource(row.source);
  const items = Array.isArray(row.items) ? row.items : [];
  return (
    <div className="hunter-profile__row">
      <dt className="hunter-profile__label">{row.label}</dt>
      <dd className="hunter-profile__value">
        {items.length > 0 ? (
          <ListValue items={items} moreItems={Math.max(0, row.moreItems ?? 0)} />
        ) : (
          <TextValue value={row.value ?? ""} />
        )}
        <span className={`hunter-profile__source hunter-profile__source--${source}`}>
          {PROFILE_CARD_COPY.source[source]}
        </span>
      </dd>
    </div>
  );
}

/** Renders the member's record as Hunter read it. */
export function ProfileArtifact({ payload }: { payload: ProfilePayload }) {
  const rows = payload?.rows;
  const [allRows, setAllRows] = useState(false);
  const { shown, hidden } = useMemo(() => boundedList(rows ?? [], MAX_PROFILE_ROWS), [rows]);
  const folded = shown.length - MAIN_PROFILE_ROWS;
  const visible = allRows || folded <= 0 ? shown : shown.slice(0, MAIN_PROFILE_ROWS);
  // The server's cut is stated only once the rest is open. Beside "Show N
  // more" it would read as a second count of the same rows.
  const totalHidden = allRows || folded <= 0 ? hidden + Math.max(0, payload?.hiddenCount ?? 0) : 0;
  const notOnFile = payload?.notOnFile ?? [];
  const unavailable = payload?.factsUnavailable === true;
  const statement = payload?.capabilityStatement;

  return (
    <div className="hunter-profile">
      <div className="hunter-profile__head">
        <Building2 size={13} aria-hidden />
        <span className="hunter-profile__kicker">{PROFILE_CARD_COPY.kicker}</span>
      </div>

      {unavailable && <p className="hunter-profile__notice">{PROFILE_CARD_COPY.unavailable}</p>}

      {visible.length > 0 ? (
        <dl className="hunter-profile__rows">
          {visible.map((row, i) => (
            <ProfileRow key={i} row={row} />
          ))}
        </dl>
      ) : (
        !unavailable && <p className="hunter-profile__empty">{PROFILE_CARD_COPY.empty}</p>
      )}

      {folded > 0 && (
        <button
          type="button"
          className="hunter-profile__toggle hunter-profile__toggle--rows"
          aria-expanded={allRows}
          onClick={() => setAllRows((open) => !open)}
        >
          {allRows ? PROFILE_CARD_COPY.showFewer : `Show ${folded} more`}
        </button>
      )}

      {totalHidden > 0 && <p className="hunter-profile__more">and {totalHidden} more not shown</p>}

      {notOnFile.length > 0 && (
        <p className="hunter-profile__missing">
          {PROFILE_CARD_COPY.missingPrefix} {notOnFile.join(", ")}.
        </p>
      )}

      {(statement === "unparsed" || statement === "none") && (
        <p className="hunter-profile__statement">
          {PROFILE_CARD_COPY.capabilityStatement[statement]}
        </p>
      )}
    </div>
  );
}
