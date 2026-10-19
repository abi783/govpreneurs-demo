// Roadmap v3 — the Design System classes of the business address form
// (`.rm3-addr` in roadmap-v3.css). Every roadmap v3 checkout passes these to
// the shared `AddressStep` (ARCHITECTURE §3.5).

import type { BusinessAddressFormClasses } from "../BusinessAddressForm";

/** The Design System classes of the address form on roadmap v3. */
export const RM3_ADDRESS_FORM_CLASSES: Required<BusinessAddressFormClasses> = {
  root: "rm3-addr",
  title: "rm3-addr__title",
  note: "rm3-addr__note",
  field: "rm3-addr__field",
  label: "rm3-addr__label",
  input: "rm3-addr__input",
  fieldError: "rm3-addr__error",
  serverError: "rm3-addr__error rm3-addr__error--server",
  actions: "rm3-addr__actions",
  submit: "rm2-btn rm3-addr__submit",
  cancel: "rm2-btn rm2-btn--blue-outline",
};
