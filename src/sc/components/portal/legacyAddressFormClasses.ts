// The legacy classes of the business address form (ARCHITECTURE §3.5, FD4).
// The form takes the style of the component that owns the purchase button, so
// every legacy checkout (the two legacy roadmaps, the booking modals and the
// renewal button) passes these. They are the grey Tailwind utilities those
// hosts already use. No Design System class or token goes here.

import type { BusinessAddressFormClasses } from "./BusinessAddressForm";

/**
 * The legacy form classes. `submitColor` is the host's own button colour class
 * (for example `bg-[#1d4ed8]`), so the submit button matches the host's
 * confirm button.
 */
export function legacyAddressFormClasses(submitColor: string): BusinessAddressFormClasses {
  return {
    root: "flex flex-col gap-3",
    title: "text-sm font-bold text-gray-900",
    note: "text-xs text-gray-600 leading-relaxed",
    field: "flex flex-col gap-1",
    label: "text-xs font-semibold text-gray-700",
    input:
      "w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600",
    fieldError: "text-xs font-semibold text-red-700",
    serverError: "text-xs font-semibold text-red-700",
    actions: "flex gap-2",
    submit: `flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 ${submitColor}`,
    cancel: "flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg",
  };
}
