import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const chipVariants = cva("ui-chip", {
  variants: {
    variant: {
      filter: "ui-chip--filter",
      status: "ui-chip--status",
      count: "ui-chip--count",
    },
    tone: {
      neutral: "ui-chip--tone-neutral",
      pos: "ui-chip--tone-pos",
      warn: "ui-chip--tone-warn",
      urg: "ui-chip--tone-urg",
      insight: "ui-chip--tone-insight",
      ai: "ui-chip--tone-ai",
    },
  },
  defaultVariants: { variant: "status", tone: "neutral" },
});

export interface ChipProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange">,
    VariantProps<typeof chipVariants> {
  label?: ReactNode;
  /** Removable chips: rendered × button calls this with click event. */
  onRemove?: () => void;
  /** Accessible label override for the remove button. Defaults to "Remove {label}". */
  removeLabel?: string;
  leadingIcon?: ReactNode;
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { variant, tone, className, label, children, onRemove, removeLabel, leadingIcon, ...rest },
  ref,
) {
  const content = label ?? children;
  const isRemovable = variant === "filter" && typeof onRemove === "function";
  return (
    <span ref={ref} className={cn(chipVariants({ variant, tone }), className)} {...rest}>
      {leadingIcon ? <span className="ui-chip__icon">{leadingIcon}</span> : null}
      <span className="ui-chip__label">{content}</span>
      {isRemovable ? (
        <button
          type="button"
          className="ui-chip__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={
            removeLabel ?? (typeof content === "string" ? `Remove ${content}` : "Remove")
          }
        >
          <X size={12} aria-hidden />
        </button>
      ) : null}
    </span>
  );
});
