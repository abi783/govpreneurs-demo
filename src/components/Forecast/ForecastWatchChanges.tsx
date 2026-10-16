// "What changed since you tracked it" (feature 9, ARCHITECTURE-forecasts-watch.md §11).
// It shows only when the member tracks this forecast, watching is on, the read is ready
// and the forecast has at least one event. Any other case shows nothing: a failed read
// is never "no changes". Opening the page marks nothing seen; only the button does.
//
// A notice line (ARCHITECTURE-forecast-links.md §8.4) links only when `held` is true,
// and only to our own page. A suggestion has no New/Seen tag and never joins "Mark as seen".

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { crossPageClick } from "../../lib/ghlNav";
import {
  markForecastSeen,
  useForecastWatch,
  watchCopyState,
  type ForecastWatchForecast,
  type ForecastWatchRead,
} from "../../lib/forecasts/watch";
import { WATCH_BOX } from "../../lib/forecasts/watchCopy";
import {
  watchLines,
  type NoticeLine,
  type NoticeLink as NoticeLinkFacts,
  type WatchLine,
  type WatchLineContext,
} from "../../lib/forecasts/watchLines";

/** This forecast's watch, when the box may show it. */
function shownWatch(
  read: ForecastWatchRead,
  oppKey: string,
  tracked: boolean,
): ForecastWatchForecast | null {
  if (!tracked || read.status !== "ready" || watchCopyState(read) === "off") return null;
  const watch = read.data.forecasts.find((f) => f.oppKey === oppKey);
  return watch && watch.events.length > 0 ? watch : null;
}

function Tag({ unseen }: { unseen: boolean }) {
  return (
    <span className={`fc-watch__tag${unseen ? " is-new" : ""}`}>
      {unseen ? WATCH_BOX.newTag : WATCH_BOX.seenTag}
    </span>
  );
}

const OPEN_CLASS = "btn btn-secondary btn-sm fc-watch__open";

/** Our own page for the notice. Never a source URL. */
function NoticeLink({ link }: { link: NoticeLinkFacts }) {
  return link.target === "forecast" ? (
    <Link to="/forecasts/$forecastId" params={{ forecastId: link.id }} className={OPEN_CLASS}>
      {link.label}
    </Link>
  ) : (
    <Link
      to="/opportunities/$noticeId"
      params={{ noticeId: link.id }}
      className={OPEN_CLASS}
      onClick={crossPageClick(`/opportunities/${link.id}`)}
    >
      {link.label}
    </Link>
  );
}

function NoticeBody({ line }: { line: NoticeLine }) {
  return (
    <div className="fc-watch__notice">
      <p className="fc-watch__text">
        <strong>{line.headline}</strong>
        {line.names && ` ${line.names}`}
      </p>
      {line.sentences.map((sentence) => (
        <p key={sentence} className="fc-watch__basis">
          {sentence}
        </p>
      ))}
      {line.link ? (
        <NoticeLink link={line.link} />
      ) : (
        <p className="fc-watch__basis">{line.unavailable}</p>
      )}
    </div>
  );
}

/** An unseen line that has a tag. A suggestion has none, so it is never "new". */
function isNewCounted(line: WatchLine): boolean {
  return line.counted && line.unseen;
}

function Line({ line }: { line: WatchLine }) {
  return (
    <li className={`fc-watch__item${isNewCounted(line) ? " is-new" : ""}`}>
      <div className="fc-watch__meta">
        {line.counted && <Tag unseen={line.unseen} />}
        <span className="fc-watch__noticed">{line.noticed}</span>
      </div>
      {line.kind === "change" ? (
        <p className="fc-watch__text">{line.text}</p>
      ) : (
        <NoticeBody line={line} />
      )}
    </li>
  );
}

export function ForecastWatchChanges({
  oppKey,
  tracked,
  context,
}: {
  oppKey: string;
  tracked: boolean;
  context: WatchLineContext;
}) {
  const read = useForecastWatch();
  const [marking, setMarking] = useState(false);
  const watch = shownWatch(read, oppKey, tracked);
  if (!watch) return null;

  const lines = watchLines(watch.events, context);
  // The server counts every unseen counted event; a line exists only for an event the
  // page can word. The gap is an unseen change the page names without claiming what it
  // was, so "Mark as seen" stays reachable and the marker cannot stick. A suggestion is
  // in neither count.
  const newCounted = lines.filter(isNewCounted).length;
  const unwordedUnseen = watch.unseen > newCounted;
  if (lines.length === 0 && !unwordedUnseen) return null;
  const anyUnseen = unwordedUnseen || newCounted > 0;

  const markSeen = async () => {
    setMarking(true);
    try {
      await markForecastSeen(oppKey);
    } finally {
      setMarking(false);
    }
  };

  return (
    <section className="ui-card fc-watch" aria-labelledby="fc-watch-title">
      <div className="fc-watch__head">
        <h2 id="fc-watch-title" className="fc-watch__title">
          <History size={16} aria-hidden /> {WATCH_BOX.title}
        </h2>
        {anyUnseen && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={marking}
            onClick={() => void markSeen()}
          >
            {WATCH_BOX.markSeen}
          </button>
        )}
      </div>
      {unwordedUnseen && <p className="fc-watch__text">{WATCH_BOX.unworded}</p>}
      {lines.length > 0 && (
        <ul className="fc-watch__list">
          {lines.map((line) => (
            <Line key={line.id} line={line} />
          ))}
        </ul>
      )}
    </section>
  );
}
