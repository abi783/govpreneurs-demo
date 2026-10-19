/**
 * TellLauncher — the way in to "Tell Hunter everything". FRAMEWORKS & DRIVERS.
 *
 * ── A LAUNCHER, NOT A PANEL, AND NOT A LINK OUT ───────────────────────────
 * It opens a real destination in the main column — `…/business/tell` — rather
 * than living permanently in the side rail, which is the shape NN/g measured
 * getting 0.8% of attention for 25% of the area. It was an external link to
 * another product until this feature, which it should never have been: what she
 * says has to become proposals in HER record, and only this app writes those.
 *
 * ── IT SITS IN THE PAGE HEADER, NOT IN THE RAIL ───────────────────────────
 * The rail answers "where can I go"; this answers "what can I do to all of it",
 * which is a page-level action and belongs with the page title. Position and
 * affordance are unchanged from the link it replaces — only the destination is.
 *
 * ── WHY IT IS A COMPONENT AND NOT A `<Link>` IN THE LAYOUT ────────────────
 * On the tell screen NOTHING in the rail is current, so this button has to
 * carry `aria-current` or the page has no current destination at all. That
 * needs the pathname, which a server layout cannot read.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { MicIcon } from "@sc/components/portal/tasks/Icon";
import "./mybusiness.css";

export interface TellLauncherProps {
  locationId: string;
}

/** The one hatch: everything at once, instead of one question at a time. */
export function TellLauncher({ locationId }: TellLauncherProps): ReactElement {
  const href = `/${locationId}/business/tell`;
  const current = usePathname() === href;
  return (
    <Link className="mb-tell" href={href} aria-current={current ? "page" : undefined}>
      <MicIcon />
      Tell Hunter everything
    </Link>
  );
}
