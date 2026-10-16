"use client";

// The business address step before a wallet purchase. It has no style of its
// own, as `WalletAmountLines.tsx`: the host passes every class, so a legacy
// checkout keeps its legacy classes and roadmap v3 keeps its Design System
// classes. The rules are in `checkCheckoutAddress` and in the gate.

import { useId, useState, type FormEvent } from "react";
import {
  checkCheckoutAddress,
  type CheckoutAddressDraft,
  type CheckoutAddressField,
} from "@sc/lib/billing/checkoutAddress";
import {
  ADDRESS_CANCEL_LABEL,
  ADDRESS_CITY_LABEL,
  ADDRESS_LINE1_LABEL,
  ADDRESS_LINE2_LABEL,
  ADDRESS_SAVING_LABEL,
  ADDRESS_STATE_LABEL,
  ADDRESS_SUBMIT_LABEL,
  ADDRESS_ZIP_LABEL,
  BUSINESS_ADDRESS_NOTE,
  BUSINESS_ADDRESS_TITLE,
} from "@sc/lib/walletCopy";
import type { BusinessAddressGate } from "./useBusinessAddressGate";

/** Every class the form uses. The host passes all of them; the form has no style of its own. */
export interface BusinessAddressFormClasses {
  root?: string;
  title?: string;
  note?: string;
  field?: string;
  label?: string;
  input?: string;
  fieldError?: string;
  serverError?: string;
  actions?: string;
  submit?: string;
  cancel?: string;
}

const EMPTY_DRAFT: CheckoutAddressDraft = { line1: "", line2: "", city: "", state: "", postalCode: "" };

/** A two-letter state code. */
const STATE_MAX_LENGTH = 2;

const FIELDS: ReadonlyArray<{ name: CheckoutAddressField; label: string; autoComplete: string; maxLength?: number }> = [
  { name: "line1", label: ADDRESS_LINE1_LABEL, autoComplete: "address-line1" },
  { name: "line2", label: ADDRESS_LINE2_LABEL, autoComplete: "address-line2" },
  { name: "city", label: ADDRESS_CITY_LABEL, autoComplete: "address-level2" },
  { name: "state", label: ADDRESS_STATE_LABEL, autoComplete: "address-level1", maxLength: STATE_MAX_LENGTH },
  { name: "postalCode", label: ADDRESS_ZIP_LABEL, autoComplete: "postal-code" },
];

/** The address form. Renders nothing while the gate is not asking. */
export function BusinessAddressForm({
  gate,
  classes,
}: {
  gate: BusinessAddressGate;
  classes: BusinessAddressFormClasses;
}) {
  const idPrefix = useId();
  const [draft, setDraft] = useState<CheckoutAddressDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<CheckoutAddressField, string>>>({});

  if (!gate.asking) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = checkCheckoutAddress(draft);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    void gate.submit(check.value);
  }

  return (
    <form className={classes.root} onSubmit={handleSubmit} noValidate>
      <p className={classes.title}>{BUSINESS_ADDRESS_TITLE}</p>
      <p className={classes.note}>{BUSINESS_ADDRESS_NOTE}</p>
      {FIELDS.map(({ name, label, autoComplete, maxLength }) => {
        const id = `${idPrefix}-${name}`;
        const error = errors[name];
        return (
          <div key={name} className={classes.field}>
            <label htmlFor={id} className={classes.label}>
              {label}
            </label>
            <input
              id={id}
              name={name}
              className={classes.input}
              autoComplete={autoComplete}
              maxLength={maxLength}
              value={draft[name]}
              aria-invalid={error ? true : undefined}
              onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
            />
            {error && <p className={classes.fieldError}>{error}</p>}
          </div>
        );
      })}
      {gate.error && (
        <p className={classes.serverError} role="alert">
          {gate.error}
        </p>
      )}
      <div className={classes.actions}>
        <button type="submit" className={classes.submit} disabled={gate.saving}>
          {gate.saving ? ADDRESS_SAVING_LABEL : ADDRESS_SUBMIT_LABEL}
        </button>
        <button type="button" className={classes.cancel} onClick={gate.cancel}>
          {ADDRESS_CANCEL_LABEL}
        </button>
      </div>
    </form>
  );
}
