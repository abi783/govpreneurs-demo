// Sticky section nav for the wide filters drawer — one item per group with
// an active-value count badge; scroll-spy highlights the section in view.
// Ported from govpreneurs-v2/src/components/Hunter/SectionNav.tsx (Phase 2).

import type { DrawerSectionId } from "../../lib/filterCounts";

export function SectionNav({
  sections,
  activeId,
  onJump,
}: {
  sections: { id: DrawerSectionId; label: string; count: number }[];
  activeId: DrawerSectionId | null;
  onJump: (id: DrawerSectionId) => void;
}) {
  return (
    <nav className="fd-nav" aria-label="Filter sections">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`fd-nav__item${activeId === s.id ? " is-active" : ""}`}
          aria-current={activeId === s.id ? "true" : undefined}
          onClick={() => onJump(s.id)}
        >
          <span>{s.label}</span>
          {s.count > 0 && <span className="fd-nav__count">{s.count}</span>}
        </button>
      ))}
    </nav>
  );
}
