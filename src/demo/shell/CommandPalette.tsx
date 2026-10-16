// DEMO: the command palette (opens with the search box in the menu, or Cmd+K / Ctrl+K).
// It lists every menu page, and the extra entries that pages register in
// src/demo/nav/searchIndex.ts.

import { useEffect, useMemo } from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { CornerDownLeft } from "lucide-react";
import { ALL_MENU_ITEMS } from "../nav/menu";
import { useSearchEntries } from "../nav/searchIndex";
import { demoNavigate } from "../nav/navigate";

const MAX_EXTRA_ROWS = 40;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const extra = useSearchEntries();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const groups = useMemo(() => {
    const byHint = new Map<string, typeof extra>();
    for (const e of extra) {
      const list = byHint.get(e.hint) ?? [];
      list.push(e);
      byHint.set(e.hint, list);
    }
    return Array.from(byHint.entries());
  }, [extra]);

  function go(to: string) {
    onOpenChange(false);
    demoNavigate(to);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search the demo"
      overlayClassName="demo-palette-overlay"
      contentClassName="demo-palette"
    >
      <Dialog.Title className="demo-sr-only">Search the demo</Dialog.Title>
      <Dialog.Description className="demo-sr-only">
        Type to find a page or an item, then press Enter to open it.
      </Dialog.Description>
      <Command.Input placeholder="Search pages, opportunities, and more" autoFocus />
      <Command.List>
        <Command.Empty>Nothing matches that search.</Command.Empty>
        <Command.Group heading="Pages">
          {ALL_MENU_ITEMS.map((item) => (
            <Command.Item
              key={item.key}
              value={`${item.label} page ${(item.keywords ?? []).join(" ")}`}
              onSelect={() => go(item.to)}
            >
              <item.icon aria-hidden />
              <span>{item.label}</span>
              <span className="demo-palette__hint">Page</span>
            </Command.Item>
          ))}
        </Command.Group>
        {groups.map(([hint, entries]) => (
          <Command.Group key={hint} heading={hint}>
            {entries.slice(0, MAX_EXTRA_ROWS).map((e) => (
              <Command.Item
                key={`${e.to}|${e.label}`}
                value={`${e.label} ${e.hint} ${(e.keywords ?? []).join(" ")}`}
                onSelect={() => go(e.to)}
              >
                <CornerDownLeft aria-hidden />
                <span>{e.label}</span>
                <span className="demo-palette__hint">{e.hint}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
