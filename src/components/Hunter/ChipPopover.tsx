import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui";

export function ChipPopover({
  open,
  onClose,
  onApply,
  children,
  applyLabel = "Apply",
  hideFooter = false,
  width = 280,
}: {
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
  children: ReactNode;
  applyLabel?: string;
  hideFooter?: boolean;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      className="chip-popover"
      style={{ width }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="chip-popover-body">{children}</div>
      {!hideFooter && (
        <div className="chip-popover-footer">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => onApply?.()}>
            {applyLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
