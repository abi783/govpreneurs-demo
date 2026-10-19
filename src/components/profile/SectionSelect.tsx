import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  SECTION_GROUPS,
  useSectionCompleteness,
  PRIORITY_SECTIONS,
  TAB_LABELS,
  type TabSlug,
} from "./TabNavigation";

export function SectionSelect() {
  const search = useSearch({ from: "/business-profile" }) as { tab: TabSlug };
  const navigate = useNavigate({ from: "/business-profile" });
  const completeness = useSectionCompleteness();

  return (
    <label className="bp-section-select-wrap">
      <span className="bp-section-select-label">Section</span>
      <select
        className="bp-section-select"
        value={search.tab}
        onChange={(e) => {
          const tab = e.target.value as TabSlug;
          navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tab }) });
        }}
      >
        {SECTION_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.slugs.map((slug) => {
              const status = completeness[slug];
              const star = PRIORITY_SECTIONS.has(slug) ? " ★" : "";
              const dot = status === "complete" ? "● " : "○ ";
              return (
                <option key={slug} value={slug}>
                  {dot}
                  {TAB_LABELS[slug]}
                  {star}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
