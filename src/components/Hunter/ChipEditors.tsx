import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui";

export const WORK_TYPE_OPTIONS = [
  "Roofing & re-roofing",
  "Building envelope / weatherproofing",
  "Siding & exterior",
  "Roof repair & PM",
  "Facility repair & minor construction",
  "Specialty trades",
  "Other",
];

export const REGION_OPTIONS = [
  "NC only",
  "NC + nearby states (NC, VA, SC, GA)",
  "Within 200 miles of Fayetteville",
  "Anywhere in the US",
];

export const MATCH_TIER_OPTIONS = ["Strong matches", "Good matches", "Stretches", "Long shots"];

export const VALUE_OPTIONS = ["Under $500K", "Under $2M", "Under $5M", "Under $10M", "Any size"];

function parseMulti(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function summarizeMulti(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  return `${values[0]} +${values.length - 1}`;
}

export function MultiSelectEditor({
  options,
  initial,
  onChange,
}: {
  options: string[];
  initial: string;
  onChange: (value: string) => void;
}) {
  const [picked, setPicked] = useState<string[]>(parseMulti(initial));

  const toggle = (opt: string) => {
    const next = picked.includes(opt) ? picked.filter((p) => p !== opt) : [...picked, opt];
    setPicked(next);
    onChange(next.join(", "));
  };

  return (
    <div className="chip-pop-list">
      {options.map((opt) => (
        <label key={opt} className="chip-pop-row">
          <input type="checkbox" checked={picked.includes(opt)} onChange={() => toggle(opt)} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function SingleSelectEditor({
  options,
  initial,
  onChange,
  name,
}: {
  options: string[];
  initial: string;
  onChange: (value: string) => void;
  name: string;
}) {
  const [picked, setPicked] = useState<string>(initial);
  return (
    <div className="chip-pop-list">
      {options.map((opt) => (
        <label key={opt} className="chip-pop-row">
          <input
            type="radio"
            name={name}
            checked={picked === opt}
            onChange={() => {
              setPicked(opt);
              onChange(opt);
            }}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function GenericTextEditor({
  initial,
  onChange,
  placeholder,
}: {
  initial: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [val, setVal] = useState(initial);
  return (
    <Input
      autoFocus
      variant="text"
      size="sm"
      aria-label={placeholder ?? "Value"}
      value={val}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        setVal(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}
