// The department forecast site behind a federal forecast's publisher, vetted before the
// page links to it. The backend owns the table (`agency-forecast-sites.ts`); this file
// only refuses what the page must never render: a non-https URL, a vendor host, or a
// name that names the vendor.

import { externalSourceUrl, mentionsVendor } from "../sourceLink";
import type { PublisherSite } from "./records";

/** The site to link, or null when there is none the page may show. */
export function publisherSiteLink(site: PublisherSite | null | undefined): PublisherSite | null {
  if (!site || typeof site.name !== "string" || typeof site.url !== "string") return null;
  const name = site.name.trim();
  if (!name || mentionsVendor(name)) return null;
  const url = externalSourceUrl(site.url);
  if (!url || !url.startsWith("https://")) return null;
  return { name, url };
}
