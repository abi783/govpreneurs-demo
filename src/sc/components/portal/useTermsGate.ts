"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { payDisabledByTerms, termsMissing } from "./checkoutTerms";
import { CHECKOUT_TERMS_REQUIRED } from "@sc/lib/walletCopy";

/** The props that a checkout passes to `TermsBox` (or roadmap v3's `TermsConsent`). */
export interface TermsBoxState {
  ticked: boolean;
  onChange: (ticked: boolean) => void;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
}

/** The terms box state of one checkout, and the check that its Pay handler runs first. */
export interface TermsGate {
  ticked: boolean;
  /** Spread into the terms box. */
  box: TermsBoxState;
  /** True only while the server's decision is not known yet. */
  payDisabled: boolean;
  /**
   * Call first in the Pay handler. False means stop and send nothing: the box
   * then shows `CHECKOUT_TERMS_REQUIRED` and takes the focus.
   */
  allowsPay: () => boolean;
  /** Unticks the box and clears the message, for a closed or reset checkout. */
  reset: () => void;
}

/**
 * The pilot terms box of one checkout (PRD §8.2, US-2). `enabled` is the
 * server's decision, null until it is known. Pay stays enabled with the box
 * unticked; a press then shows the message instead of a silent dead button.
 * The rules are in `checkoutTerms.ts`.
 */
export function useTermsGate(enabled: boolean | null): TermsGate {
  const [ticked, setTicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = useCallback((next: boolean) => {
    setTicked(next);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTicked(false);
    setError(null);
  }, []);

  function allowsPay(): boolean {
    if (!termsMissing(enabled, ticked)) return true;
    setError(CHECKOUT_TERMS_REQUIRED);
    inputRef.current?.focus();
    return false;
  }

  return {
    ticked,
    box: { ticked, onChange, error, inputRef },
    payDisabled: payDisabledByTerms(enabled),
    allowsPay,
    reset,
  };
}
