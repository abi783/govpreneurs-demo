import raw from "./industries.json";

export interface IndustryCode {
  code: string;
  title: string;
  desc: string;
  primary: boolean;
}

export interface Industry {
  name: string;
  sub: string;
  codes: IndustryCode[];
}

// Curated editorial content — 18 plain-English industries mapped to NAICS
// codes, ported from the old GHL funnel's "Browse by industry" entry. `icon`
// (funnel-specific tabler class) and `tag` (hand-written) are dropped here:
// the component maps its own lucide icon per industry, and the tag is
// replaced by real counted figures from the stats API.
export const industries: Industry[] = (
  raw as { name: string; sub: string; codes: IndustryCode[] }[]
).map(({ name, sub, codes }) => ({
  name,
  sub,
  codes: codes.map(({ code, title, desc, primary }) => ({ code, title, desc, primary })),
}));

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function findIndustryBySlug(slug: string): Industry | undefined {
  return industries.find((i) => slugify(i.name) === slug);
}
