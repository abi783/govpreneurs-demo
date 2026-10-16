// DEMO: the "?" buttons on the Business Profile open their explanation when clicked
// (and stay open until the visitor clicks away). Production showed it only on hover,
// which does not work on a touch screen or in a screen share.

import type { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { HelpCircle } from "lucide-react";

export function HelpPopover({
  label,
  buttonClass,
  size = 14,
  children,
}: {
  label: string;
  buttonClass: string;
  size?: number;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={buttonClass} aria-label={label}>
          <HelpCircle size={size} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="rh-tooltip" side="top" sideOffset={6} role="dialog" aria-label={label}>
          {children}
          <Popover.Arrow className="rh-tooltip-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
