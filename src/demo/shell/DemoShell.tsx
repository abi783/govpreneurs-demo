// DEMO: the frame around every page. A left menu, a thin "sample data" strip, and a
// main area that scrolls on its own. It copies the look of the GoHighLevel member menu.
//
// The menu is fixed. Only `#demo-main` scrolls. Page code that needs the scroll
// container can read `document.getElementById("demo-main")`.

import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { RotateCcw, Search } from "lucide-react";
import { PERSONA } from "../story/persona";
import { MENU_SECTIONS, isMenuItemActive } from "../nav/menu";
import { CommandPalette } from "./CommandPalette";
import { ResetDemoDialog } from "./ResetDemo";
import { DemoNoticeHost } from "./DemoNoticeHost";
import { ScChatHost } from "../sc/ScChatHost";
import "./shell.css";
import "../nav/storySearch";

/**
 * DEMO: Escape closes a dialog that production built by hand. Radix dialogs already close on
 * Escape and mark the key as handled, so this does nothing for them. A hand-built one (the booking
 * sheet, a drawer) has a close button, and Escape presses it. The top-most dialog goes first.
 */
function useEscapeForHandBuiltDialogs() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const visible = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      };
      const open = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'))
        .filter((el) => !el.hasAttribute("data-state") && visible(el));
      const top = open[open.length - 1];
      if (!top) return;
      const buttons = Array.from(top.querySelectorAll<HTMLElement>("button, [role='button']")).filter(visible);
      const close =
        buttons.find((b) => /^close\b/i.test(b.getAttribute("aria-label") ?? "")) ??
        buttons.find((b) => b.classList.contains("ui-modal-close")) ??
        buttons.find((b) => /^(close|cancel|not now|done|back)$/i.test((b.textContent ?? "").trim()));
      if (!close) return;
      e.preventDefault();
      close.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/**
 * DEMO: a quick double-click on a dialog button closes the dialog with the first click. The second
 * click then lands on whatever sits under the dialog (a card, a link) and opens it by surprise. This
 * drops that second click. It only applies when the first click was inside a dialog and the second
 * is outside every dialog, within a short time.
 */
function useNoClickThroughAfterDialog() {
  useEffect(() => {
    let last = { at: 0, inDialog: false };
    const onClick = (e: MouseEvent) => {
      const inDialog = Boolean((e.target as Element | null)?.closest?.('[role="dialog"], [role="alertdialog"]'));
      const now = performance.now();
      if (e.detail >= 2 && last.inDialog && !inDialog && now - last.at < 900) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }
      last = { at: now, inDialog };
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

const IS_MAC = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  useEscapeForHandBuiltDialogs();
  useNoClickThroughAfterDialog();

  return (
    <div className="demo-shell">
      <aside className="demo-menu" aria-label="Main menu">
        <Link to="/" className="demo-logo" aria-label="GovPreneurs, go to the Success Center">
          <span className="demo-logo__shield">
            <img src="/brand/govpreneurs-logo.svg" alt="" />
          </span>
          <span className="demo-logo__word">GovPreneurs</span>
        </Link>

        {/* Not a button: it only shows who is signed in. */}
        <div className="demo-account">
          <div className="demo-account__avatar" aria-hidden>
            {PERSONA.businessShortName.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="demo-account__name">{PERSONA.businessShortName}</div>
            <div className="demo-account__meta">
              {PERSONA.plan} · {PERSONA.hqCity}, {PERSONA.hqState}
            </div>
          </div>
        </div>

        <button type="button" className="demo-search" onClick={() => setPaletteOpen(true)}>
          <Search size={15} aria-hidden />
          <span className="demo-search__label">Search</span>
          <span className="demo-kbd">{IS_MAC ? "⌘K" : "Ctrl K"}</span>
        </button>

        <nav className="demo-nav" aria-label="Pages">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="demo-nav__title">{section.title}</div>
              {section.items.map((item) => {
                const active = isMenuItemActive(item, pathname);
                return (
                  <Link
                    key={item.key}
                    to={item.to as "/"}
                    className={`demo-nav__item${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="demo-content">
        <div className="demo-strip">
          <span className="demo-strip__text">
            Sample data — {PERSONA.businessShortName} is a fictional business.
          </span>
          <button type="button" className="demo-strip__reset" onClick={() => setResetOpen(true)}>
            <RotateCcw size={12} aria-hidden />
            Reset demo
          </button>
        </div>
        <div className="demo-main" id="demo-main" data-scroll-restoration-id="demo-main">
          {children}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
      <DemoNoticeHost />
      <ScChatHost />
    </div>
  );
}
