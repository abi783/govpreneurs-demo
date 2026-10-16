import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Search, Sparkles, Bookmark, Send, ArrowRight, type LucideIcon } from "lucide-react";
import { NAV_COMMANDS, type CmdGroup, type Command } from "./commands";
import { relayCrossPageNav } from "../../lib/ghlNav";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetailPage: boolean;
  currentNoticeId: string | null;
}

interface Row {
  id: string;
  group: CmdGroup;
  icon: LucideIcon;
  label: string;
  hint: string;
  run: () => void;
}

export function CommandBar({ open, onClose, onDetailPage, currentNoticeId }: Props) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query when reopened
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  function dispatchAfterNav(eventName: string, detail: Record<string, unknown>, delay = 80) {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }, delay);
  }

  const rows = useMemo<Row[]>(() => {
    const trimmed = q.trim();
    const lower = trimmed.toLowerCase();

    // Navigate rows (always shown, filtered by query)
    const navRows: Row[] = NAV_COMMANDS.filter((c) => {
      if (!lower) return true;
      const hay = [c.label, ...(c.keywords ?? [])].join(" ").toLowerCase();
      return hay.includes(lower);
    }).map((c) => ({
      id: c.id,
      group: "Navigate",
      icon: c.icon,
      label: c.label,
      hint: c.hint,
      run: () => {
        // A page that is its own GHL menu link opens through the parent when embedded.
        if (!relayCrossPageNav(c.to)) navigate({ to: c.to });
        onClose();
      },
    }));

    const dynamic: Row[] = [];

    if (trimmed.length >= 2) {
      // Search opportunities
      dynamic.push({
        id: "search-opps",
        group: "Search",
        icon: Search,
        label: `Search opportunities for "${trimmed}"`,
        hint: "Search",
        run: () => {
          navigate({ to: "/opportunities" });
          dispatchAfterNav("commandbar:search-opps", { text: trimmed }, 120);
          onClose();
        },
      });

      // Ask Hunter / Ask Grant (page-bound identity)
      if (onDetailPage && currentNoticeId) {
        dynamic.push({
          id: "ask-grant",
          group: "Ask an agent",
          icon: Sparkles,
          label: `Ask Grant: "${trimmed}"`,
          hint: "Ask Grant",
          run: () => {
            dispatchAfterNav("commandbar:ask-grant", { text: trimmed }, 0);
            onClose();
          },
        });
      } else {
        dynamic.push({
          id: "ask-hunter",
          group: "Ask an agent",
          icon: Sparkles,
          label: `Ask Hunter: "${trimmed}"`,
          hint: "Ask Hunter",
          run: () => {
            navigate({ to: "/opportunities" });
            dispatchAfterNav("commandbar:ask-hunter", { text: trimmed }, 120);
            onClose();
          },
        });
      }
    }

    // Quick actions
    if (onDetailPage && currentNoticeId) {
      dynamic.push({
        id: "save-opp",
        group: "Quick actions",
        icon: Bookmark,
        label: "Save this opportunity",
        hint: "Action",
        run: () => {
          dispatchAfterNav("commandbar:save-opp", { noticeId: currentNoticeId }, 0);
          onClose();
        },
      });
      dynamic.push({
        id: "send-mentor",
        group: "Quick actions",
        icon: Send,
        label: "Send to mentor",
        hint: "Action",
        run: () => {
          dispatchAfterNav("commandbar:send-to-mentor", { noticeId: currentNoticeId }, 0);
          onClose();
        },
      });
    }
    dynamic.push({
      id: "go-saved",
      group: "Quick actions",
      icon: Bookmark,
      label: "Go to my saved opportunities",
      hint: "Action",
      run: () => {
        navigate({ to: "/pipeline" });
        onClose();
      },
    });

    // Filter quick actions by query
    const filteredDynamic = dynamic.filter((d) => {
      if (!lower) return true;
      return d.label.toLowerCase().includes(lower) || d.group.toLowerCase().includes(lower);
    });

    return [...navRows, ...filteredDynamic];
  }, [q, navigate, onClose, onDetailPage, currentNoticeId]);

  // Group rows preserving order
  const grouped = useMemo(() => {
    const map = new Map<CmdGroup, Row[]>();
    for (const r of rows) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    const order: CmdGroup[] = ["Navigate", "Search", "Ask an agent", "Quick actions"];
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [rows]);

  // Clamp active index
  useEffect(() => {
    if (active >= rows.length) setActive(Math.max(0, rows.length - 1));
  }, [rows.length, active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      rows[active]?.run();
    }
  }

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmdk-index="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active]);

  let runningIdx = 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="cmdk-overlay" />
        <Dialog.Content className="cmdk-panel" onKeyDown={onKeyDown} aria-label="Command bar">
          <Dialog.Title className="sr-only">Command bar</Dialog.Title>
          <div className="cmdk-input-row">
            <Search size={16} className="cmdk-input-icon" />
            <input
              autoFocus
              className="cmdk-input"
              type="text"
              aria-label="Search commands"
              value={q}
              placeholder="Search or type a command…"
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="kbd">esc</span>
          </div>

          <div ref={listRef} className="cmdk-list" role="listbox">
            {grouped.length === 0 && (
              <div className="cmdk-empty">
                No results. Try a page name or a search like "roofing in NC under $1M".
              </div>
            )}
            {grouped.map(({ group, items }) => (
              <div key={group} className="cmdk-group">
                <div className="cmdk-group-label">{group}</div>
                {items.map((row) => {
                  const idx = runningIdx++;
                  const Icon = row.icon;
                  const isActive = idx === active;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-cmdk-index={idx}
                      className={`cmdk-row${isActive ? " is-active" : ""}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => row.run()}
                    >
                      <Icon size={16} className="cmdk-row-icon" />
                      <span className="cmdk-row-label">{row.label}</span>
                      <span className="cmdk-row-hint">{row.hint}</span>
                      <ArrowRight size={13} className="cmdk-row-arrow" aria-hidden />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="cmdk-footer">
            <span>
              <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
            </span>
            <span>
              <span className="kbd">↵</span> select
            </span>
            <span>
              <span className="kbd">esc</span> close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
