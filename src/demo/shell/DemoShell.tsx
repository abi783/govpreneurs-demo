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
 * Escape and mark the key as handled, so this does nothing for them. A hand-built one is either a
 * `role="dialog"` box or a Tailwind `fixed inset-0` cover (a booking modal, a drawer). The top-most
 * one goes first. Escape presses its close button, or its backdrop, or the cover itself, as a click
 * outside the box would.
 */
function useEscapeForHandBuiltDialogs() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const visible = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      };
      const handBuilt = (el: HTMLElement) => !el.hasAttribute("data-state") && !el.closest("[data-radix-portal], [data-state]") && visible(el);
      const open = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"], div.fixed.inset-0'),
      ).filter(handBuilt);
      const top = open[open.length - 1];
      if (!top) return;
      const buttons = Array.from(top.querySelectorAll<HTMLElement>("button, [role='button']")).filter(visible);
      const labelled =
        buttons.find((b) => /^(close|dismiss)\b/i.test(b.getAttribute("aria-label") ?? "")) ??
        buttons.find((b) => b.classList.contains("ui-modal-close")) ??
        buttons.find((b) => /^(close|cancel|not now|done|back)$/i.test((b.textContent ?? "").trim()));
      if (labelled) {
        e.preventDefault();
        labelled.click();
        return;
      }
      // No labelled button. A cover closes on a click outside its box: press the backdrop, or the cover.
      const backdrop = top.querySelector<HTMLElement>(":scope > .absolute.inset-0, :scope > [class*='backdrop' i], :scope > [class*='overlay' i]");
      if (backdrop) {
        e.preventDefault();
        backdrop.click();
        return;
      }
      if (top.matches("div.fixed.inset-0")) {
        e.preventDefault();
        top.click();
        // A cover that ignores that click has an icon-only close button in its header.
        window.setTimeout(() => {
          if (!top.isConnected) return;
          const icon = Array.from(top.querySelectorAll<HTMLElement>("button")).filter(visible).find((b) => (b.textContent ?? "").trim() === "");
          icon?.click();
        }, 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** What a click is about: the control, its label and state, and the list row around it. */
function clickSignature(node: Node | null): string {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  const control = el?.closest("button, a, [role=button], [role=tab], [role=checkbox], [role=switch], summary, label") ?? el;
  const row = control?.closest("li, article, tr, [role=listitem]");
  const text = (n: Element | null | undefined, max: number) => (n?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  return [text(control, 60), text(row, 80), control?.getAttribute("aria-label") ?? "", control?.getAttribute("aria-pressed") ?? ""].join("|");
}

/**
 * DEMO: the second click of a quick double-click often lands on something else. The first click can
 * close a dialog, tick a task so the list moves up, save a card, or open a page. The second click then
 * presses whatever sits under the pointer: a card under the dialog, the next task, a button on the
 * new page (even "Show me the analysis"). This drops a second click when the thing under the pointer
 * is no longer what the first click pressed. A double-click on one steady control still counts twice.
 */
function useNoClickThroughOnDoubleClick() {
  useEffect(() => {
    let last: { at: number; target: Node | null; signature: string } = { at: 0, target: null, signature: "" };
    const onClick = (e: MouseEvent) => {
      const now = performance.now();
      const target = e.target as Node | null;
      const signature = clickSignature(target); // read before the app reacts to this click
      if (e.detail >= 2 && last.target && target && now - last.at < 900) {
        const before = last.target;
        const same = before.isConnected && (before === target || before.contains(target) || target.contains(before)) && signature === last.signature;
        if (!same) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }
      }
      last = { at: now, target, signature };
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
  useNoClickThroughOnDoubleClick();

  return (
    <div className="demo-shell">
      <aside className="demo-menu" aria-label="Main menu">
        <Link to="/" className="demo-logo" aria-label="GovPreneurs, go to the Success Center">
          <span className="demo-logo__shield">
            <img src={`${import.meta.env.BASE_URL}brand/govpreneurs-logo.svg`} alt="" />
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
