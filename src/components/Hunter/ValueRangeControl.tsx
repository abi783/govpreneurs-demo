// Contract-value range control — ported from govpreneurs-v2's
// ValueRangeControl. Shorthand-parsing $ min/max inputs ("250k", "1.5m"),
// preset bucket chips with live counts (from the drawer's already-fetched
// useFacetCounts result), and a mini distribution bar per bucket so the
// range choice is informed by real data, not guesswork.
//
// Writes only to filters.valueRange { min, max } — the same field
// toServerFilters already reads. No new fetch is added here; counts are
// passed in as a prop from FiltersDrawer's existing useFacetCounts() result.

import { useEffect, useState } from "react";
import type { FacetCountsDto } from "../../lib/discoverApi";

export type ValueRange = { min: number | null; max: number | null };

/** The 6 server-defined value buckets, in display order. */
export const VALUE_BUCKET_IDS = [
  "under_25k",
  "25k_100k",
  "100k_500k",
  "500k_1m",
  "1m_5m",
  "5m_plus",
] as const;

export type ValueBucketId = (typeof VALUE_BUCKET_IDS)[number];

const VALUE_BUCKET_LABELS: Record<ValueBucketId, string> = {
  under_25k: "Under $25K",
  "25k_100k": "$25K–$100K",
  "100k_500k": "$100K–$500K",
  "500k_1m": "$500K–$1M",
  "1m_5m": "$1M–$5M",
  "5m_plus": "$5M+",
};

/**
 * Numeric bounds for a value bucket id. The top bucket (5m_plus) has no
 * upper bound — represented as `max: null`, matching how `valueRange.max`
 * already represents "no max" everywhere else in the model (emptyFilters,
 * toServerFilters, ValueRangeEditor's "Any size"/"$5M+" presets).
 */
export function bucketBounds(bucketId: string): { min: number; max: number | null } {
  switch (bucketId as ValueBucketId) {
    case "under_25k":
      return { min: 0, max: 25_000 };
    case "25k_100k":
      return { min: 25_000, max: 100_000 };
    case "100k_500k":
      return { min: 100_000, max: 500_000 };
    case "500k_1m":
      return { min: 500_000, max: 1_000_000 };
    case "1m_5m":
      return { min: 1_000_000, max: 5_000_000 };
    case "5m_plus":
      return { min: 5_000_000, max: null };
    default:
      return { min: 0, max: null };
  }
}

function fmt(n: number | null): string {
  if (n === null) return "";
  return `$${n.toLocaleString("en-US")}`;
}

/** Parse "$450,000", "250k", "1.5m", "250000" → number | null. */
export function parseValueShorthand(input: string): number | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (Number.isNaN(n)) return null;
  return Math.round(m[2] === "m" ? n * 1_000_000 : m[2] === "k" ? n * 1_000 : n);
}

function sameRange(a: ValueRange, b: ValueRange): boolean {
  return a.min === b.min && a.max === b.max;
}

function isBucketActive(value: ValueRange, bucketId: ValueBucketId): boolean {
  return sameRange(value, bucketBounds(bucketId));
}

/** The min and max money boxes. Each box takes shorthand ("250k", "1.5m") and writes
 *  whole dollars when the member leaves it or presses Enter. An empty box is no bound. */
export function ValueRangeInputs({
  value,
  onChange,
}: {
  value: ValueRange;
  onChange: (v: ValueRange) => void;
}) {
  // Local text state so typing "2" doesn't commit $2; commit on blur/Enter.
  const [minText, setMinText] = useState(fmt(value.min));
  const [maxText, setMaxText] = useState(fmt(value.max));
  useEffect(() => setMinText(fmt(value.min)), [value.min]);
  useEffect(() => setMaxText(fmt(value.max)), [value.max]);

  const commit = () => {
    const next = { min: parseValueShorthand(minText), max: parseValueShorthand(maxText) };
    if (!sameRange(next, value)) onChange(next);
    setMinText(fmt(next.min));
    setMaxText(fmt(next.max));
  };

  return (
    <div className="of-value__inputs">
      <label>
        <span>Min</span>
        <input
          type="text"
          inputMode="numeric"
          className="of-num-input of-value__money"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="$ any"
        />
      </label>
      <span className="of-value__dash">–</span>
      <label>
        <span>Max</span>
        <input
          type="text"
          inputMode="numeric"
          className="of-num-input of-value__money"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="$ any"
        />
      </label>
    </div>
  );
}

/** The feed's value range: the money boxes, and preset buckets with live counts. */
export function ValueRangeControl({
  value,
  onChange,
  counts,
}: {
  value: ValueRange;
  onChange: (v: ValueRange) => void;
  counts: FacetCountsDto | null;
}) {
  const bucketCounts = VALUE_BUCKET_IDS.map((id) => counts?.valueBuckets?.[id] ?? 0);
  const maxCount = Math.max(1, ...bucketCounts);

  return (
    <div className="of-value">
      <ValueRangeInputs value={value} onChange={onChange} />

      <div className="of-value__buckets">
        {VALUE_BUCKET_IDS.map((id, i) => {
          const isOn = isBucketActive(value, id);
          const count = bucketCounts[i];
          return (
            <button
              key={id}
              type="button"
              className={`of-value__bucket${isOn ? " is-on" : ""}`}
              onClick={() => onChange(isOn ? { min: null, max: null } : bucketBounds(id))}
              aria-pressed={isOn}
            >
              <span
                className="of-value__bar"
                style={{ height: `${Math.max(8, (count / maxCount) * 28)}px` }}
                aria-hidden
              />
              <span className="of-value__bucket-label">{VALUE_BUCKET_LABELS[id]}</span>
              <span className="of-value__bucket-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
