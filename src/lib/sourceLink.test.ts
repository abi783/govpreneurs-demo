import { agencySource, externalSourceUrl, internalRouteTarget } from "./sourceLink";

describe("externalSourceUrl", () => {
  it("returns a real government source URL unchanged", () => {
    expect(externalSourceUrl("https://sam.gov/opp/abc/view")).toBe(
      "https://sam.gov/opp/abc/view",
    );
    expect(externalSourceUrl("https://www.grants.gov/web/grants/view.html")).toBe(
      "https://www.grants.gov/web/grants/view.html",
    );
  });

  it("never surfaces HigherGov (our data vendor)", () => {
    expect(externalSourceUrl("https://www.highergov.com/opportunity/xyz")).toBeNull();
    expect(externalSourceUrl("https://highergov.com/opportunity/xyz")).toBeNull();
    expect(externalSourceUrl("https://api.highergov.com/x")).toBeNull();
    // case-insensitive host match
    expect(externalSourceUrl("https://WWW.HigherGov.COM/opp")).toBeNull();
  });

  it("rejects a lookalike host that is not really HigherGov", () => {
    // must not be fooled by 'highergov.com' appearing as a non-host substring
    expect(externalSourceUrl("https://highergov.com.evil.example/x")).toBe(
      "https://highergov.com.evil.example/x",
    );
    expect(externalSourceUrl("https://nothighergov.com/x")).toBe(
      "https://nothighergov.com/x",
    );
  });

  it("returns null for empty, relative, or non-URL refs", () => {
    expect(externalSourceUrl(null)).toBeNull();
    expect(externalSourceUrl(undefined)).toBeNull();
    expect(externalSourceUrl("")).toBeNull();
    expect(externalSourceUrl("§L.3.2")).toBeNull();
    expect(externalSourceUrl("FPDS W912PM-19-C-0043")).toBeNull();
    expect(externalSourceUrl("/opportunities/123")).toBeNull();
  });

  it("rejects any scheme other than http(s) — a ref reaches window.open", () => {
    expect(externalSourceUrl("javascript:alert(1)")).toBeNull();
    expect(externalSourceUrl("JavaScript:alert(1)")).toBeNull();
    expect(externalSourceUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(externalSourceUrl("file:///etc/passwd")).toBeNull();
    expect(externalSourceUrl("vbscript:msgbox(1)")).toBeNull();
  });
});

describe("internalRouteTarget", () => {
  it("allows a same-origin path, with query and fragment", () => {
    expect(internalRouteTarget("/partners")).toBe("/partners");
    expect(internalRouteTarget("/opportunities/abc?tab=docs")).toBe(
      "/opportunities/abc?tab=docs",
    );
    expect(internalRouteTarget("  /pipeline  ")).toBe("/pipeline");
  });

  it("rejects a javascript: or data: target", () => {
    expect(internalRouteTarget("javascript:window.x=1")).toBeNull();
    expect(internalRouteTarget("JAVASCRIPT:window.x=1")).toBeNull();
    expect(internalRouteTarget("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects anything that leaves this origin", () => {
    expect(internalRouteTarget("https://evil.example.com/steal")).toBeNull();
    expect(internalRouteTarget("//evil.example.com/steal")).toBeNull(); // protocol-relative
    expect(internalRouteTarget("http://localhost:3000/x")).toBeNull();
  });

  it("rejects a non-path, empty, or whitespace-smuggled target", () => {
    expect(internalRouteTarget(null)).toBeNull();
    expect(internalRouteTarget(undefined)).toBeNull();
    expect(internalRouteTarget("")).toBeNull();
    expect(internalRouteTarget("partners")).toBeNull();
    expect(internalRouteTarget("/part ners")).toBeNull();
    expect(internalRouteTarget("/java\nscript:alert(1)")).toBeNull();
  });
});

describe("agencySource — the issuing agency's posting, never the vendor", () => {
  it("names the well-known posting hosts the way a member would say them", () => {
    expect(agencySource("https://sam.gov/opp/abc/view")).toEqual({
      url: "https://sam.gov/opp/abc/view",
      host: "SAM.gov",
      label: "View on SAM.gov",
    });
    expect(agencySource("https://www.dibbs.bsm.dla.mil/RFQ/RFQNav.aspx?category=issue")?.label).toBe(
      "View on DLA DIBBS",
    );
    expect(agencySource("https://www.grants.gov/web/grants/view.html")?.label).toBe(
      "View on Grants.gov",
    );
  });

  // The live corpus spans dozens of state/local portals; a host we don't have a
  // name for is still a true one. Stripping "www." is the only cosmetic liberty.
  it("falls back to the bare hostname rather than guessing a prettier name", () => {
    expect(agencySource("https://scbo.sc.gov/bid/12")?.host).toBe("scbo.sc.gov");
    expect(agencySource("https://www.ms.gov/dfa/contract_bid_search/Bid/Details/45733")?.host).toBe(
      "ms.gov",
    );
    expect(
      agencySource("https://nevadaepro.com/bso/external/bidDetail.sdo?docId=44DOC-S3878")?.label,
    ).toBe("View on nevadaepro.com");
  });

  // The whole point: HigherGov is where we GOT the record, never what we cite.
  it("never surfaces HigherGov, whatever the subdomain or casing", () => {
    expect(agencySource("https://www.highergov.com/opportunity/xyz")).toBeNull();
    expect(agencySource("https://highergov.com/opportunity/xyz")).toBeNull();
    expect(agencySource("https://api.highergov.com/x")).toBeNull();
    expect(agencySource("https://WWW.HigherGov.COM/opp")).toBeNull();
  });

  // Every one of these is a real shape in the live opportunities collection.
  it("returns null for a posting we cannot vet — and null means render nothing", () => {
    expect(agencySource(null)).toBeNull(); // ~1.6% of opportunities carry no sourcePath
    expect(agencySource(undefined)).toBeNull();
    expect(agencySource("")).toBeNull();
    // A real row: a custom app scheme is not a link we may hand a browser.
    expect(agencySource("actransit://ocean.bonfirehub.com/opportunities/195517")).toBeNull();
    expect(agencySource("javascript:alert(1)")).toBeNull();
    expect(agencySource("/opportunities/123")).toBeNull();
    expect(agencySource("not a url")).toBeNull();
  });

  it("does not let a lookalike host impersonate HigherGov's exclusion", () => {
    expect(agencySource("https://highergov.com.evil.example/x")?.host).toBe(
      "highergov.com.evil.example",
    );
    expect(agencySource("https://nothighergov.com/x")?.host).toBe("nothighergov.com");
  });
});
