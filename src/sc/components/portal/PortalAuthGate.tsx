// DEMO SHIM. Do not overwrite this file when you lift Success Center code.
// The real gate blocks a page that is not inside the GoHighLevel iframe. The demo
// is never inside it, so the gate always shows its children.

import type { ReactNode } from "react";

export function PortalAuthGate({
  children,
}: {
  children: ReactNode;
  iframeOnly?: boolean;
}) {
  return <>{children}</>;
}

/** The real one shows a "log in" notice. The demo never shows it. */
export function StandaloneNotice() {
  return null;
}
