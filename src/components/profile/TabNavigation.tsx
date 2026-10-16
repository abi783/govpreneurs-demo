// Section nav for /business-profile. The file is still called TabNavigation
// for back-compat (TAB_SLUGS / TabSlug are imported elsewhere), but it now
// renders a grouped vertical rail rather than horizontal tabs.
import { Link, useSearch } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";

export const TAB_SLUGS = [
  "positioning",
  "identity",
  "capabilities",
  "certifications",
  "digital",
  "sled",
  "bidder-profile",
  "past-performance",
  "knowledge",
  "stay-ready",
  "mentor-history",
] as const;

export type TabSlug = (typeof TAB_SLUGS)[number];

export const TAB_LABELS: Record<TabSlug, string> = {
  positioning: "Positioning",
  identity: "Identity",
  capabilities: "Capabilities",
  certifications: "Certifications",
  digital: "Digital",
  sled: "SLED",
  "bidder-profile": "Bidder Profile",
  "past-performance": "Past Performance",
  knowledge: "Knowledge",
  "stay-ready": "Stay Ready",
  "mentor-history": "Mentor History",
};

export const SECTION_GROUPS: { label: string; slugs: TabSlug[] }[] = [
  { label: "Profile", slugs: ["positioning", "identity", "capabilities"] },
  { label: "Compliance", slugs: ["certifications", "digital", "sled", "bidder-profile"] },
  { label: "Evidence", slugs: ["past-performance", "knowledge"] },
  { label: "Ongoing", slugs: ["stay-ready", "mentor-history"] },
];

// Mocked completeness for Marcus Williams / Williams Construction (NC roofing).
export const SECTION_COMPLETENESS: Record<TabSlug, "complete" | "needs-input"> = {
  positioning: "complete",
  identity: "complete",
  capabilities: "complete",
  digital: "complete",
  certifications: "needs-input",
  sled: "needs-input",
  "bidder-profile": "needs-input",
  "past-performance": "needs-input",
  knowledge: "needs-input",
  "stay-ready": "complete",
  "mentor-history": "complete",
};

export const PRIORITY_SECTIONS = new Set<TabSlug>(["past-performance"]);

export function TabNavigation() {
  const search = useSearch({ from: "/business-profile" }) as { tab: TabSlug };
  const active = search.tab;

  return (
    <nav className="bp-section-nav" role="tablist" aria-label="Business Profile sections">
      {SECTION_GROUPS.map((group) => (
        <div className="bp-nav-group" key={group.label}>
          <div className="bp-nav-group-label">{group.label}</div>
          {group.slugs.map((slug) => {
            const status = SECTION_COMPLETENESS[slug];
            const isPriority = PRIORITY_SECTIONS.has(slug);
            const isActive = active === slug;
            return (
              <Link
                key={slug}
                to="/business-profile"
                search={(prev: Record<string, unknown>) => ({ ...prev, tab: slug })}
                className="bp-nav-item"
                data-active={isActive ? "true" : "false"}
                role="tab"
                aria-selected={isActive}
              >
                <span
                  className={`bp-nav-item__dot bp-nav-item__dot--${status}`}
                  aria-hidden
                >
                  {status === "complete" ? <Check size={10} strokeWidth={3} /> : null}
                </span>
                <span className="bp-nav-item__label">{TAB_LABELS[slug]}</span>
                {isPriority ? (
                  <Star
                    size={12}
                    className="bp-nav-item__star"
                    aria-label="High-impact section"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
