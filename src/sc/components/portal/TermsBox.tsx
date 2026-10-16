"use client";

// The required terms box of the pilot checkout (PRD §8.2 item 7, US-2), with
// its two links and the invoice note under it. It has no style of its own:
// the host passes its classes, so a legacy checkout stays legacy and roadmap
// v3 stays Design System (FD4: the style of the component that owns the
// purchase button). Every string lives in walletCopy.ts; the two links open
// the official pages on govpreneurs.com in a new tab.

import { useId, type Ref } from "react";
import {
  CHECKOUT_INVOICE_NOTE,
  CHECKOUT_REFUND_LINK,
  CHECKOUT_TERMS_JOIN,
  CHECKOUT_TERMS_LINK,
  CHECKOUT_TERMS_PREFIX,
  REFUND_POLICY_URL,
  TERMS_URL,
} from "@sc/lib/walletCopy";

/** The classes of the four parts of the terms box. */
export interface TermsBoxClasses {
  root: string;
  /** The label that holds the checkbox and the sentence. */
  row: string;
  /** The invoice note under the box. */
  note: string;
  /** The message under the box when she pressed Pay without the tick. */
  error: string;
}

/**
 * The required terms box with its two links, and the invoice note under it.
 * With an `error`, the message shows right under the box as an alert, and the
 * checkbox is marked invalid and described by it.
 */
export function TermsBox({
  ticked,
  onChange,
  disabled,
  error,
  inputRef,
  classes,
}: {
  ticked: boolean;
  onChange: (ticked: boolean) => void;
  disabled?: boolean;
  error?: string | null;
  /** The checkbox, so the checkout can move the focus to it. */
  inputRef?: Ref<HTMLInputElement>;
  classes: TermsBoxClasses;
}) {
  const errorId = useId();
  return (
    <div className={classes.root}>
      <label className={classes.row}>
        <input
          ref={inputRef}
          type="checkbox"
          checked={ticked}
          required
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {CHECKOUT_TERMS_PREFIX}
          <a href={TERMS_URL} target="_blank" rel="noreferrer">
            {CHECKOUT_TERMS_LINK}
          </a>
          {CHECKOUT_TERMS_JOIN}
          <a href={REFUND_POLICY_URL} target="_blank" rel="noreferrer">
            {CHECKOUT_REFUND_LINK}
          </a>
        </span>
      </label>
      {error && (
        <p id={errorId} role="alert" className={classes.error}>
          {error}
        </p>
      )}
      <p className={classes.note}>{CHECKOUT_INVOICE_NOTE}</p>
    </div>
  );
}

/**
 * The legacy classes of the terms box, for the booking modals and the renewal
 * button. `accentColor` is the host's own colour class for the checkbox (for
 * example `accent-[#1d4ed8]`); `accent-color` inherits, so it goes on the row.
 * No Design System class or token goes here.
 */
export function legacyTermsBoxClasses(accentColor: string): TermsBoxClasses {
  return {
    root: "flex flex-col gap-1.5 mb-2",
    row: `flex items-start gap-2 text-xs text-gray-700 leading-relaxed cursor-pointer [&_a]:underline [&_input]:mt-0.5 ${accentColor}`,
    note: "text-xs text-gray-500 leading-relaxed",
    error: "text-xs font-semibold text-red-700",
  };
}
