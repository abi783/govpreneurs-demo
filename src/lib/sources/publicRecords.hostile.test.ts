// Adversarial probes for the fourth geometry. Every payload here is something
// the wire can actually deliver: the register rows are vendor data reshaped by
// our own pipeline, the tally figures are computed, and `resolveSource` runs
// during RENDER inside the canvas — so a throw is an unmounted opportunity page,
// and a bad string is a trust claim we can't stand behind.
//
// These assert the CORRECT behaviour, not the current one.

import { resolveSource, chipVariant } from "./resolve";
import { resolvePublic } from "./publicRecords";

const AWARD = {
  awardId: "W912PM-19-C-0043",
  title: null,
  description: "Barracks roofing",
  awardeeName: "Sterling Roofing Systems",
  agencyName: "Department of Agriculture",
  naicsCode: "238160",
  naicsDescription: "Roofing Contractors",
  value: 4_180_000,
  offers: 4,
  fiscalYear: 2024,
  actionDate: "2024-03-11",
  setAside: null,
  extentCompeted: null,
  popState: "NC",
  solicitationId: null,
  sourceUrl: null,
  asOf: "2026-07-20T11:42:23.602Z",
};

const TALLY = {
  kind: "comparable-awards" as const,
  figure: 1_200_000,
  low: 790_000,
  high: 3_590_000,
  countedOver: 14,
  matchedOn: "NAICS 238160",
  yearsCovered: "FY2019–FY2024",
  sample: [AWARD],
  asOf: "2026-07-20T11:42:23.602Z",
};

const entry = (award: unknown, ref = "award:X1#winner") =>
  resolveSource({ label: "x", provenance: { type: "public", ref, award } } as never);
const tal = (over: unknown, ref = "tally:comparable-awards") =>
  resolveSource({
    label: "x",
    provenance: { type: "public", ref, tally: { ...TALLY, ...(over as object) } },
  } as never);

/** Everything a member could read off the sheet, as one string. */
const rendered = (v: unknown) => JSON.stringify(v);

describe("hostile · numbers that are not numbers", () => {
  test.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
    ["negative", -5000],
  ])("a %s figure never renders as a figure", (_name, figure) => {
    const v = tal({ figure });
    const out = rendered(v);
    expect(out).not.toMatch(/NaN/);
    expect(out).not.toMatch(/Infinity/);
    expect(out).not.toMatch(/\$-/);
  });

  test("a NaN or Infinity range end never reaches the basis", () => {
    for (const [low, high] of [
      [NaN, 10],
      [1, Infinity],
      [-Infinity, Infinity],
    ]) {
      const out = rendered(tal({ low, high }));
      expect(out).not.toMatch(/NaN|Infinity/);
    }
  });

  test("a NaN award value renders as absent, not as a number", () => {
    const out = rendered(entry({ ...AWARD, value: NaN }));
    expect(out).not.toMatch(/NaN/);
  });
});

describe("hostile · the sample must never out-count the population", () => {
  test("a sample longer than countedOver never claims more than it has", () => {
    const v = tal({ countedOver: 0, sample: [AWARD, AWARD, AWARD] });
    if (v.kind !== "tally") return;
    // "Showing 3 of 0 awards" is worse than no basis at all.
    expect(v.tally.sampleOf).toBeGreaterThanOrEqual(v.tally.sample.length);
  });

  test("a negative or absurd countedOver is not printed", () => {
    for (const countedOver of [-1, NaN, Infinity]) {
      const v = tal({ countedOver });
      if (v.kind !== "tally") continue;
      // Scoped to the numbers this test is about: a blanket /-\d/ over the whole
      // view matches the hyphens in a real award id (W912PM-19-C-0043).
      const counted = v.tally.basis.find((b) => b.label === "Awards counted");
      expect(counted).toBeUndefined(); // unusable ⇒ the row is omitted, not faked
      expect(Number.isFinite(v.tally.sampleOf)).toBe(true);
      expect(v.tally.sampleOf).toBeGreaterThanOrEqual(0);
      expect(v.provLine).not.toMatch(/NaN|Infinity/);
    }
  });
});

describe("hostile · the vendor must not survive ANY field", () => {
  const VENDOR = "https://www.highergov.com/contract/abc/";

  test("a vendor string in the award id never reaches title or locator", () => {
    const out = rendered(entry({ ...AWARD, awardId: VENDOR }));
    expect(out).not.toMatch(/highergov/i);
  });

  test.each([
    "awardeeName",
    "agencyName",
    "description",
    "title",
    "naicsDescription",
  ])("a vendor string in %s never reaches the member", (field) => {
    const out = rendered(entry({ ...AWARD, [field]: VENDOR }));
    expect(out).not.toMatch(/highergov/i);
  });

  test("a vendor string in the tally basis or sample never reaches the member", () => {
    expect(rendered(tal({ matchedOn: VENDOR }))).not.toMatch(/highergov/i);
    expect(rendered(tal({ yearsCovered: VENDOR }))).not.toMatch(/highergov/i);
    expect(rendered(tal({ sample: [{ ...AWARD, awardeeName: VENDOR }] }))).not.toMatch(
      /highergov/i,
    );
  });

  test("a vendor sourceUrl is never handed over as a link", () => {
    const v = entry({ ...AWARD, sourceUrl: VENDOR });
    expect(v.href).toBeNull();
    expect(rendered(v)).not.toMatch(/highergov/i);
  });
});

describe("hostile · shapes the wire can deliver but the type forbids", () => {
  test("a sample that is not an array never throws through the lag check", () => {
    for (const sample of ["nope", 42, { some: 5 }, { some: "x" }, null, undefined]) {
      expect(() => tal({ sample })).not.toThrow();
      const v = tal({ sample });
      // Degrading to a body with no rows is fine; a wrong body is not.
      expect(v.kind).toBeTruthy();
    }
  });

  test("sample rows that are not objects are dropped, not rendered", () => {
    const v = tal({ sample: [null, "x", 42, [], AWARD] });
    if (v.kind !== "tally") return;
    expect(v.tally.sample.every((r) => typeof r.label === "string")).toBe(true);
    expect(rendered(v)).not.toMatch(/\[object Object\]/);
  });

  test("non-string field values never render as [object Object]", () => {
    const out = rendered(entry({ ...AWARD, awardeeName: { a: 1 }, agencyName: [1, 2] }));
    expect(out).not.toMatch(/\[object Object\]/);
  });

  test("a frozen or null-prototype payload still resolves", () => {
    expect(() => entry(Object.freeze({ ...AWARD }))).not.toThrow();
    expect(() => entry(Object.assign(Object.create(null), AWARD))).not.toThrow();
  });
});

describe("hostile · the ref grammar", () => {
  test.each([
    ["", "empty"],
    ["#", "bare hash"],
    ["award:", "no id"],
    ["tally:", "no kind"],
    ["award:X1#", "trailing hash"],
    ["award:X1#,,,", "empty highlights"],
    ["::::", "colons"],
    ["__proto__:x", "prototype key"],
    ["constructor:x", "constructor key"],
    ["tally:__proto__", "prototype tally"],
  ])("ref %s (%s) resolves without throwing and leaks no key syntax", (ref) => {
    expect(() => entry(AWARD, ref)).not.toThrow();
    const v = entry(AWARD, ref);
    expect(v.kind).toBeTruthy();
    if (v.kind === "public") {
      expect(v.entry.title).not.toMatch(/__proto__|constructor/);
    }
  });

  test("prototype pollution through the highlight list does not take", () => {
    entry(AWARD, "award:X1#__proto__");
    expect(({} as Record<string, unknown>).__proto__).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  test("a huge highlight list does not become a huge pinned set", () => {
    const ref = `award:X1#${Array.from({ length: 5000 }, (_, i) => `f${i}`).join(",")}`;
    const v = entry(AWARD, ref);
    if (v.kind === "public") expect(v.entry.pinned.length).toBeLessThanOrEqual(64);
  });

  test("a ref that is not a string degrades rather than throwing", () => {
    for (const ref of [null, undefined, 42, {}, []]) {
      expect(() =>
        resolveSource({ label: "x", provenance: { type: "public", ref, award: AWARD } } as never),
      ).not.toThrow();
    }
  });
});

describe("hostile · unbounded text", () => {
  const HUGE = "A".repeat(200_000);
  const LONGWORD = "B".repeat(5_000);

  test("a giant description does not reach the sheet unclamped", () => {
    const v = entry({ ...AWARD, description: HUGE });
    if (v.kind !== "public") return;
    const work = v.entry.fields.find((f) => f.key === "workType")?.value ?? "";
    expect(work.length).toBeLessThanOrEqual(600);
  });

  test("a giant matchedOn does not reach the basis unclamped", () => {
    const v = tal({ matchedOn: HUGE });
    if (v.kind !== "tally") return;
    const m = v.tally.basis.find((b) => b.label === "Matched on")?.value ?? "";
    expect(m.length).toBeLessThanOrEqual(600);
  });

  test("an unbroken long word cannot be an unbounded title", () => {
    const v = entry({ ...AWARD, awardId: LONGWORD });
    if (v.kind === "public") expect(v.entry.title.length).toBeLessThanOrEqual(600);
  });
});

describe("hostile · dates and freshness", () => {
  test("a future sync stamp is not reported as 'checked today'", () => {
    const future = new Date(Date.now() + 5 * 365 * 86_400_000).toISOString();
    const v = entry({ ...AWARD, asOf: future });
    if (v.kind === "public") expect(v.entry.asOf).not.toMatch(/checked today|yesterday/);
  });

  test.each(["not-a-date", "", "0000-00-00", "9999-99-99", 42, {}, null])(
    "an unusable sync stamp (%s) never renders Invalid Date",
    (asOf) => {
      const out = rendered(entry({ ...AWARD, asOf }));
      expect(out).not.toMatch(/Invalid Date/);
    },
  );

  test("an unusable action date never renders Invalid Date", () => {
    for (const actionDate of ["not-a-date", "", 42, {}, null]) {
      expect(rendered(entry({ ...AWARD, actionDate }))).not.toMatch(/Invalid Date/);
    }
  });
});

describe("hostile · the invariant still holds", () => {
  test("every hostile payload still yields a renderable body and a chip", () => {
    const payloads: unknown[] = [
      null,
      undefined,
      "string",
      42,
      [],
      {},
      { awardId: null },
      Object.create(null),
    ];
    for (const p of payloads) {
      const v = entry(p);
      expect(["public", "tally", "unavailable"]).toContain(v.kind);
      expect(() => chipVariant({ label: "x", provenance: { type: "public", ref: "award:X1", award: p } } as never)).not.toThrow();
    }
  });

  test("resolvePublic itself never throws, whatever it is handed", () => {
    for (const ref of ["award:X1", "tally:comparable-awards", "", "junk"]) {
      for (const prov of [undefined, {}, { award: null }, { tally: "x" }, { tally: {} }]) {
        expect(() => resolvePublic(ref, prov as never)).not.toThrow();
      }
    }
  });
});

describe("rendering the record's own words", () => {
  test("a single offer reads 'offer', not '1 offers'", () => {
    const v = tal({ kind: "field-size", figure: 1, sample: [{ ...AWARD, offers: 1 }] });
    if (v.kind !== "tally") throw new Error("expected a tally");
    expect(v.tally.sample[0].value).toMatch(/^1 offer(?![s])/);
    expect(v.tally.sample[0].value).not.toMatch(/1 offers/);
  });

  test("more than one still reads 'offers'", () => {
    const v = tal({ kind: "field-size", figure: 4, sample: [{ ...AWARD, offers: 4 }] });
    if (v.kind !== "tally") throw new Error("expected a tally");
    expect(v.tally.sample[0].value).toMatch(/^4 offers/);
  });

  // Descriptions genuinely arrive with hard newlines mid-sentence; a field row
  // is one line, so a raw newline splits the value in two.
  test("embedded newlines and runs of spaces collapse onto one line", () => {
    const messy = ["(BPA) NUMBER: DJD-15HQ-S-0014", "COPIER LEASE   CONTRACT"].join(String.fromCharCode(10)) + String.fromCharCode(9)+String.fromCharCode(9) + "FOR UNIT MANAGEMENT";
    const v = entry({ ...AWARD, description: messy, title: null });
    if (v.kind !== "public") throw new Error("expected an entry");
    const work = v.entry.fields.find((f) => f.key === "workType")?.value ?? "";
    expect(work).not.toMatch(new RegExp(String.fromCharCode(10)+"|"+String.fromCharCode(9)));
    expect(work).not.toMatch(/  /);
    expect(work).toBe("(BPA) NUMBER: DJD-15HQ-S-0014 COPIER LEASE CONTRACT FOR UNIT MANAGEMENT");
  });

  // The register's own words are left alone. Casing a value that is 99.9%
  // uppercase in live data would mangle the part numbers and specs inside it.
  test("the record's casing and identifiers are never rewritten", () => {
    const raw = "ELECTRIC VACUUM CLEANER IAW MIL SPEC MILC52074B. DTD 12-22-71. IAW BPA 7FXP";
    const v = entry({ ...AWARD, description: raw, title: null });
    if (v.kind !== "public") throw new Error("expected an entry");
    expect(v.entry.fields.find((f) => f.key === "workType")?.value).toBe(raw);
  });
});
