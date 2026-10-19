"use client";

import { useEffect, useMemo, useState } from "react";
import { createAddressGate, type AddressGate, type AddressGateState } from "./addressGate";

/** The gate state and its three actions, for a checkout screen and `BusinessAddressForm`. */
export interface BusinessAddressGate extends AddressGateState {
  run: AddressGate["run"];
  submit: AddressGate["submit"];
  cancel: AddressGate["cancel"];
}

const INITIAL: AddressGateState = { asking: false, saving: false, error: null };

/**
 * The checkout address gate for one member location. It reads the answer when
 * the calling component mounts, so the answer is ready before she clicks.
 * Every rule is in `addressGate.ts`; this hook only mirrors its state.
 */
export function useBusinessAddressGate(locationId: string): BusinessAddressGate {
  const [state, setState] = useState<AddressGateState>(INITIAL);
  const gate = useMemo(() => createAddressGate({ locationId, onChange: setState }), [locationId]);

  useEffect(() => {
    void gate.check();
  }, [gate]);

  return { ...state, run: gate.run, submit: gate.submit, cancel: gate.cancel };
}
