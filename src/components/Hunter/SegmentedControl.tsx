// Segmented single-select — ported from govpreneurs-v2's SegmentedControl.
// A generic, reusable radiogroup for mutually exclusive 2–5-option facets
// (due window, status, posted-within, scope). Clicking the already-active
// segment is a guarded no-op so identical values never touch the filter
// store (no history noise, no redundant onChange calls) — unless a
// `resetValue` is configured, in which case clicking the already-active
// segment resets to that value instead (see below).

export type SegmentedOption = { value: string; label: string; count?: number };

export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  resetValue,
}: {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Opt-in: clicking the already-active option resets the control to this
   *  value instead of no-op'ing. Undefined (the default) leaves clicking the
   *  already-active option as a no-op. */
  resetValue?: string;
}) {
  return (
    <div className="of-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const isOn = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={isOn}
            className={`of-seg__btn${isOn ? " is-on" : ""}`}
            onClick={() => {
              if (!isOn) {
                onChange(o.value);
              } else if (resetValue !== undefined && resetValue !== value) {
                onChange(resetValue);
              }
            }}
          >
            <span>{o.label}</span>
            {o.count !== undefined && <span className="of-seg__count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
