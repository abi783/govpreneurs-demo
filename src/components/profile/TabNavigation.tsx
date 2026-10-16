// Section nav for /business-profile. The file is still called TabNavigation
// for back-compat (TAB_SLUGS / TabSlug are imported elsewhere), but it now
// renders a grouped vertical rail rather than horizontal tabs.
import { Link, useSearch } from "@tanstack/react-router";
import { Check, Star } from "lucide-react";
import { essentialsFor, type ProfileTab } from "../../demo/profile/fields";
import { useFieldOverrides } from "../../demo/profile/store";
import { usePastPerformance } from "../../demo/profile/pastPerformance";
import { useSledRegistrations } from "../../demo/profile/sled";
import { useMentorSessions } from "../../demo/profile/mentor";
import { useKnowledgeHub } from "../../lib/knowledgeHub";
import { computeStatus, useStayReady } from "../../lib/stayReady";

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

// DEMO: whether a section is complete is worked out from the profile, so the dot
// beside it changes as the visitor fills things in.
export type SectionStatus = "complete" | "needs-input";

export function useSectionCompleteness(): Record<TabSlug, SectionStatus> {
  const overrides = useFieldOverrides();
  const pp = usePastPerformance();
  const sled = useSledRegistrations();
  const hub = useKnowledgeHub();
  const stay = useStayReady();
  const sessions = useMentorSessions();
  const fields = (tab: ProfileTab): SectionStatus => {
    const { done, total } = essentialsFor(tab, overrides);
    return done === total ? "complete" : "needs-input";
  };
  const urgent = stay.some((i) => {
    const s = computeStatus(i);
    return s === "urgent" || s === "overdue";
  });
  return {
    positioning: fields("positioning"),
    identity: fields("identity"),
    capabilities: fields("capabilities"),
    certifications: fields("certifications"),
    digital: fields("digital"),
    sled: sled.every((r) => r.status === "registered") ? "complete" : "needs-input",
    "bidder-profile": fields("bidder-profile"),
    "past-performance":
      pp.length >= 3 && pp.every((e) => e.status === "attested") ? "complete" : "needs-input",
    knowledge: hub.files.length > 0 && hub.conflicts.length === 0 ? "complete" : "needs-input",
    "stay-ready": urgent ? "needs-input" : "complete",
    "mentor-history": sessions.every((s) => Boolean(s.takeaway)) ? "complete" : "needs-input",
  };
}

export const PRIORITY_SECTIONS = new Set<TabSlug>(["past-performance"]);

export function TabNavigation() {
  const search = useSearch({ from: "/business-profile" }) as { tab: TabSlug };
  const active = search.tab;
  const completeness = useSectionCompleteness();

  return (
    <nav className="bp-section-nav" role="tablist" aria-label="Business Profile sections">
      {SECTION_GROUPS.map((group) => (
        <div className="bp-nav-group" key={group.label}>
          <div className="bp-nav-group-label">{group.label}</div>
          {group.slugs.map((slug) => {
            const status = completeness[slug];
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
