import { useEffect, useState } from "react";
import { ALL_STATES } from "../../lib/filters/states";
import { CheckList } from "./FilterPanel";

const ALL = "ALL";

const COPY = {
  all: "All of the US",
  yours: "Your area",
  search: "Search states",
};

/**
 * One picker for "where": all of the US, or the states she ticks. Her own states come
 * first, so the usual answer is near the top. No states ticked means all of the US.
 *
 * Every box unticks. When no box is ticked, the results show all of the US, because no
 * state limits them. Removing the "Where" chip ticks "All of the US" again.
 */
export function StatePicker({
  label,
  value,
  onChange,
  memberStates,
}: {
  label: string;
  value: string[];
  onChange: (states: string[]) => void;
  /** Her service-area states. Empty means she works anywhere in the country. */
  memberStates: string[];
}) {
  // True after she unticks "All of the US" and before she picks a state.
  const [allOff, setAllOff] = useState(false);
  useEffect(() => {
    if (value.length > 0) setAllOff(false);
  }, [value.length]);

  // Order: "All of the US", then the states she ticked, then her area, then the rest. A state
  // she ticked far down the list is easy to see and untick. The order is fixed while the list
  // is open, so a box does not jump away from the pointer.
  const mine = new Set(memberStates);
  const [ticked] = useState(() => new Set(value));
  const row = (s: { code: string; name: string }) =>
    mine.has(s.code)
      ? { id: s.code, label: s.name, detail: COPY.yours }
      : { id: s.code, label: s.name };
  const items = [
    { id: ALL, label: COPY.all },
    ...ALL_STATES.filter((s) => ticked.has(s.code)).map(row),
    ...ALL_STATES.filter((s) => !ticked.has(s.code) && mine.has(s.code)).map(row),
    ...ALL_STATES.filter((s) => !ticked.has(s.code) && !mine.has(s.code)).map(row),
  ];
  return (
    <CheckList
      label={label}
      placeholder={COPY.search}
      items={items}
      selected={value.length ? value : allOff ? [] : [ALL]}
      onToggle={(id) => {
        if (id === ALL) {
          const allTicked = value.length === 0 && !allOff;
          setAllOff(allTicked);
          if (!allTicked) onChange([]);
          return;
        }
        const next = value.includes(id) ? value.filter((s) => s !== id) : [...value, id];
        // Unticking her last state leaves the list empty. "All of the US" does not tick itself.
        if (next.length === 0) setAllOff(true);
        onChange(next);
      }}
    />
  );
}
