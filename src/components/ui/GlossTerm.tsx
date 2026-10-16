import * as Tooltip from "@radix-ui/react-tooltip";
import { useId, useRef, useState, type ReactNode } from "react";
import { glossFor } from "../../lib/filterGlosses";

const OPEN_DELAY_MS = 120;
const TOOLTIP_SIDE_OFFSET_PX = 6;
const TOOLTIP_COLLISION_PADDING_PX = 12;

/** Props for the {@link GlossTerm} primitive. */
export type GlossTermProps = {
  /** The lookup key: a displayed label, or a backend set-aside code. */
  term: string;
  /** What the trigger shows. Defaults to the term itself. */
  children?: ReactNode;
  /** Extra classes for the trigger element. */
  className?: string;
  /** Replaces the central glossary lookup, for a term that one page explains. */
  gloss?: string;
};

/** Shows a term with a dotted underline and reveals its gloss on hover, focus or tap. */
export function GlossTerm({ term, children, className, gloss: glossOverride }: GlossTermProps) {
  const tooltipId = useId();
  const gloss = glossOverride ?? glossFor(term);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [tapOpen, setTapOpen] = useState(false);
  const pointerType = useRef("mouse");
  const label = children ?? term;

  if (!gloss) {
    return <span className={className}>{label}</span>;
  }

  // Radix closes the tooltip on every click, so a tap would open and close it in
  // one gesture. `tapOpen` holds the tooltip open for a touch or pen tap, which
  // is the only way a touch user can read the gloss. A mouse click does not set
  // it, because the term sits inside a clickable card.
  function handleClick() {
    if (pointerType.current !== "mouse") setTapOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setHoverOpen(next);
    if (!next) setTapOpen(false);
  }

  return (
    <Tooltip.Provider delayDuration={OPEN_DELAY_MS}>
      <Tooltip.Root open={hoverOpen || tapOpen} onOpenChange={handleOpenChange}>
        <Tooltip.Trigger asChild>
          <span
            className={className ? `gloss-term ${className}` : "gloss-term"}
            tabIndex={0}
            aria-describedby={tooltipId}
            onPointerDown={(event) => {
              pointerType.current = event.pointerType;
            }}
            onClick={handleClick}
          >
            {label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            id={tooltipId}
            className="of-tooltip"
            sideOffset={TOOLTIP_SIDE_OFFSET_PX}
            collisionPadding={TOOLTIP_COLLISION_PADDING_PX}
          >
            {gloss}
            <Tooltip.Arrow className="of-tooltip__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
