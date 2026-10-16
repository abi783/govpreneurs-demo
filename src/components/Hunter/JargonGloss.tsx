import * as Tooltip from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function JargonGloss({
  gloss,
  children,
  inline = false,
}: {
  gloss: string;
  children?: ReactNode;
  inline?: boolean;
}) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={`of-gloss${inline ? " of-gloss--inline" : ""}`}
            tabIndex={0}
            role="button"
            aria-label="What does this mean?"
          >
            {children ?? <Info size={12} aria-hidden />}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="of-tooltip" sideOffset={6} collisionPadding={12}>
            {gloss}
            <Tooltip.Arrow className="of-tooltip__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
