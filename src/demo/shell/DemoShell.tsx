// DEMO: the frame around every page. A left menu, a thin "sample data" strip, and a
// main area that scrolls on its own. It copies the look of the GoHighLevel member menu.
//
// The menu is fixed. Only `#demo-main` scrolls. Page code that needs the scroll
// container can read `document.getElementById("demo-main")`.

import { useState, type ReactNode } from "react";
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

const IS_MAC = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

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
