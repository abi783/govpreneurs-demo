// DEMO: builds a Business Profile tab from the field list in
// src/demo/profile/fields.tsx. Fields appear in their tiers; a tab can swap a
// field for its own row (`replace`) or add rows after the list (`extra`).

import type { ReactNode } from "react";
import { Section } from "./Section";
import { ProfileField, essentialsText } from "./ProfileField";
import { essentialsFor, fieldsOnTab, type ProfileTab } from "../../demo/profile/fields";
import { useFieldOverrides } from "../../demo/profile/store";

export function ProfileTabSection({
  tab,
  unlocks,
  title,
  replace = {},
  extra = {},
  progress,
}: {
  tab: ProfileTab;
  unlocks: string;
  title?: string;
  replace?: Record<string, ReactNode>;
  extra?: Partial<Record<"T1" | "T2" | "T3", ReactNode[]>>;
  /** Overrides the "X of N essentials complete" line. */
  progress?: string;
}) {
  const overrides = useFieldOverrides();
  const { done, total } = essentialsFor(tab, overrides);
  const defs = fieldsOnTab(tab);
  const rows = (tier: "T1" | "T2" | "T3"): ReactNode[] => [
    ...defs
      .filter((d) => d.tier === tier)
      .map((d) => replace[d.id] ?? <ProfileField key={d.id} id={d.id} />),
    ...(extra[tier] ?? []),
  ];
  return (
    <Section
      title={title}
      t1Fields={rows("T1")}
      t2Fields={rows("T2")}
      t3Fields={rows("T3")}
      footerProgressText={progress ?? essentialsText(done, total)}
      footerUnlocksText={unlocks}
    />
  );
}
