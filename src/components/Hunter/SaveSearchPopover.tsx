// Inline name-and-save popover — replaces the full-screen SaveSearchModal.
// The trigger is supplied by the caller so the popover fits both the summary
// row button and the drawer footer.

import * as Popover from "@radix-ui/react-popover";
import { useState, type ReactNode } from "react";

export function SaveSearchPopover({
  onSave,
  defaultName,
  children,
}: {
  onSave: (name: string) => void;
  defaultName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? "");

  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setOpen(false);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setName(defaultName ?? "");
      }}
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="of-popover ssp"
          sideOffset={6}
          align="end"
          collisionPadding={12}
        >
          <div className="of-popover__head">
            <span className="of-popover__title">Save this search</span>
          </div>
          <form
            className="ssp__form"
            onSubmit={(e) => {
              e.preventDefault();
              commit();
            }}
          >
            <input
              className="ssp__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name it — e.g. Fort Bragg catering"
              aria-label="Saved search name"
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim()}>
              Save
            </button>
          </form>
          <p className="ssp__hint">
            Shows up under “Saved searches” at the top of the filter menu.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
