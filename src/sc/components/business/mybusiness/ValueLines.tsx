/**
 * ValueLines — a value as she reads it. FRAMEWORKS & DRIVERS.
 *
 * F13.
 *
 * Every string here was written by `formatValue` (via `valueLines`); this only
 * decides where the line breaks are. It exists so no surface grows a second
 * idea of what a multi-part value looks like — `Row.tsx` renders through this
 * one, `muted` and all.
 */

"use client";

import type { ReactElement } from "react";
import type { DisplayPart } from "@sc/lib/businessProfile/formatValue";
import "./mybusiness.css";

/** An empty value, exactly as `formatValue` writes one. Never "not provided". */
const EM_DASH = "—";

export interface ValueLinesProps {
  parts: DisplayPart[];
  /** `ROW_CONTRACT`'s `muted` treatment: ours until she confirms it, so it is
   *  set back a shade — never to the point of looking disabled. */
  muted?: boolean;
}

/**
 * One line per piece — and BULLETS when the pieces are a list.
 *
 * Several unlabelled pieces are a set of things she listed: her top services,
 * her codes, the options she ticked. A list is what it is, so it renders as
 * one, which is what the prototype shows and what stops three services reading
 * as one comma-spliced sentence. Labelled pieces — the parts of a service area,
 * of a job — are one thing described from several angles, so they stay as
 * stacked lines with their labels.
 */
export function ValueLines({ parts, muted }: ValueLinesProps): ReactElement {
  const className = muted ? "mb-lines mb-lines--muted" : "mb-lines";
  if (parts.length === 0) return <p className={className}>{EM_DASH}</p>;

  const isList = parts.length > 1 && parts.every((part) => part.label === null);
  if (isList) {
    return (
      <ul className={`${className} mb-lines--bullets`}>
        {parts.map((part, i) => (
          <li className="mb-line" key={`${part.text}${i}`}>
            {part.text}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      {parts.map((part, i) => (
        <p className="mb-line" key={`${part.label ?? ""}${i}`}>
          {part.label ? <span className="mb-line__label">{part.label}</span> : null}
          {part.text}
        </p>
      ))}
    </div>
  );
}
