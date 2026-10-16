// The department forecast site is vetted before the page links to it: https only, never
// the vendor's host, and never a name that names the vendor.
import { describe, expect, it } from "vitest";
import { publisherSiteLink } from "./publisherSite";

const DHS = { name: "Department of Homeland Security", url: "https://apfs-cloud.dhs.gov/" };

describe("publisherSiteLink", () => {
  it("keeps a checked https site, with its name trimmed", () => {
    expect(publisherSiteLink({ ...DHS, name: "  Department of Homeland Security " })).toEqual(DHS);
  });

  it("is null when there is no site", () => {
    expect(publisherSiteLink(null)).toBeNull();
    expect(publisherSiteLink(undefined)).toBeNull();
  });

  it.each([
    ["the vendor's host", { ...DHS, url: "https://www.highergov.com/agency/468/" }],
    ["plain http", { ...DHS, url: "http://apfs-cloud.dhs.gov/" }],
    ["a script URL", { ...DHS, url: "javascript:alert(1)" }],
    ["a relative path", { ...DHS, url: "/forecasts" }],
    ["a name that names the vendor", { ...DHS, name: "HigherGov agencies" }],
    ["a blank name", { ...DHS, name: "  " }],
  ])("refuses %s", (_what, site) => {
    expect(publisherSiteLink(site)).toBeNull();
  });
});
