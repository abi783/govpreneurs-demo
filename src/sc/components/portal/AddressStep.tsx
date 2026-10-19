"use client";

// The business address step before a wallet purchase: while the gate asks, the
// address form takes the place of the host's confirm area (ARCHITECTURE §3.5).
// It has no style of its own. A legacy host passes `legacyAddressFormClasses`,
// and roadmap v3 passes `RM3_ADDRESS_FORM_CLASSES`, so each host keeps its own
// token system. The host must not put this inside its own <form>.

import type { ReactNode } from "react";
import { BusinessAddressForm, type BusinessAddressFormClasses } from "./BusinessAddressForm";
import type { BusinessAddressGate } from "./useBusinessAddressGate";

/**
 * While the gate asks, shows the address form. Else shows the host's confirm
 * area. If `frameClassName` is set, the form sits in a <div> with that class,
 * so the form keeps the frame (padding, border) of the confirm area it replaces.
 */
export function AddressStep({
  gate,
  classes,
  frameClassName,
  children,
}: {
  gate: BusinessAddressGate;
  classes: BusinessAddressFormClasses;
  frameClassName?: string;
  children: ReactNode;
}) {
  if (!gate.asking) return <>{children}</>;
  const form = <BusinessAddressForm gate={gate} classes={classes} />;
  return frameClassName ? <div className={frameClassName}>{form}</div> : form;
}
