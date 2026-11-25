// A number of days, picked from shortcut buttons or typed in a box. It uses the
// filter panel's range styles (.fp-range, .fp-preset) from the Partners and
// Awards panel. A typed number commits when she leaves the box or presses
// Enter, so typing "1" on the way to "15" never filters on 1 day.

import { useEffect, useState } from "react";

/** The most days a member can type. */
const MAX_DAYS = 999;

export function DaysField({
  label,
  presets,
  presetText,
  unit,
  value,
  onChange,
}: {
  /** Names the control for screen readers, e.g. "Closing date". */
  label: string;
  presets: number[];
  /** The text on one shortcut button, e.g. "10 days" or "3 days ago". */
  presetText: (days: number) => string;
  /** The word after the typed number, e.g. "days" or "days ago". */
  unit: string;
  /** The number of days, or null for any date. */
  value: number | null;
  onChange: (days: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => setText(value === null ? "" : String(value)), [value]);

  const commit = () => {
    const raw = text.trim();
    if (raw === "") {
      if (value !== null) onChange(null);
      return;
    }
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_DAYS) {
      if (n !== value) onChange(n);
    } else {
      // Not a whole number of days: put the current value back.
      setText(value === null ? "" : String(value));
    }
  };

  const preset = (days: number | null, buttonText: string) => {
    const on = value === days;
    return (
      <button
        key={days ?? "any"}
        type="button"
        className={`fp-preset${on ? " is-on" : ""}`}
        aria-pressed={on}
        onClick={() => onChange(days)}
      >
        {buttonText}
      </button>
    );
  };

  return (
    <div className="fp-range">
      <div className="fp-range__presets" role="group" aria-label={`${label}: shortcuts`}>
        {preset(null, "Any date")}
        {presets.map((n) => preset(n, presetText(n)))}
      </div>
      <div className="fp-range__row fp-range__row--single">
        <label className="fp-range__box">
          <span>Or type a number</span>
          <span className="fp-range__input">
            <input
              type="text"
              inputMode="numeric"
              value={text}
              placeholder="Any"
              aria-label={`${label}: number of ${unit}`}
              onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
            <em>{unit}</em>
          </span>
        </label>
      </div>
    </div>
  );
}
