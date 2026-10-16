// "When will they ask for bids?" — one question, five answers (always-on pattern 10).
// Each tab carries its own definition on the page, not in a hover, so "Start capture"
// and "Position early" say what they mean where she reads them.
//
// The counts are the server's page-1 `captureCounts`: `all` counts every row of the
// view, and each status counts the open rows. A count that is not back yet shows no
// number, because an unread count is not a measurement.

import {
  CAPTURE_ORDER,
  CAPTURE_STATUS,
  LIST_COPY,
  type CaptureStatus,
} from "../../lib/forecasts/copy";
import type { ForecastCaptureCounts } from "../../lib/forecastsApi";

export type TabValue = "all" | CaptureStatus;

/** The capture-time tabs, with the server's counts. */
export function CaptureTabs({
  value,
  counts,
  allAdvice,
  onChange,
}: {
  value: TabValue;
  /** Page 1's capture counts. Null while they load. */
  counts: ForecastCaptureCounts | null;
  /** The order the list is in, when a sort other than best match is chosen. */
  allAdvice?: string;
  onChange: (tab: TabValue) => void;
}) {
  return (
    <div className="fc-tabs">
      <p className="fc-tabs__question" id="fc-tabs-question">
        {LIST_COPY.question}
      </p>
      <div className="fc-tabs__row" role="tablist" aria-labelledby="fc-tabs-question">
        <Tab
          selected={value === "all"}
          name={LIST_COPY.all.label}
          count={counts?.all ?? null}
          when={LIST_COPY.all.when}
          advice={allAdvice ?? LIST_COPY.all.advice}
          onSelect={() => onChange("all")}
        />
        {CAPTURE_ORDER.map((status) => (
          <Tab
            key={status}
            status={status}
            selected={value === status}
            name={CAPTURE_STATUS[status].label}
            count={counts?.[status] ?? null}
            when={CAPTURE_STATUS[status].when}
            advice={CAPTURE_STATUS[status].advice}
            onSelect={() => onChange(status)}
          />
        ))}
      </div>
    </div>
  );
}

function Tab({
  status,
  selected,
  name,
  count,
  when,
  advice,
  onSelect,
}: {
  status?: CaptureStatus;
  selected: boolean;
  name: string;
  count: number | null;
  when: string;
  advice: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`fc-tab${selected ? " is-active" : ""}${status ? ` fc-tab--${status}` : " fc-tab--all"}`}
      onClick={onSelect}
    >
      <span className="fc-tab__top">
        {status && <span className="fc-tab__dot" aria-hidden />}
        <span className="fc-tab__name">{name}</span>
        {count != null && <span className="fc-tab__count">{count}</span>}
      </span>
      <span className="fc-tab__when">{when}</span>
      <span className="fc-tab__advice">{advice}</span>
    </button>
  );
}
