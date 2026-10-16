// Grant's take as rows of How to win it (B8). Every figure carries its basis and a
// source that resolves through the public-record pattern; a fact that was not checked
// adds nothing; the one derived comparison is marked Our read with its inputs.

import { describe, expect, it } from "vitest";
import type { ScoredForecast } from "./engine";
import { SCORED_FORECASTS } from "./__fixtures__/scored";
import type { WinRow } from "./grant";
import { SOURCE_NAME, TAKE_COPY } from "./grantCopy";
import { takeSources, takeWinRows } from "./take";
import { AWARD, NOT_CHECKED, emptyTakeFixture, takeFixture, tallyFact } from "./take.fixture";

const FORBIDDEN = /deadline|due|closes|higher\s*gov/i;

const federal = SCORED_FORECASTS.find(
  (f) => f.lane === "federal" && f.record.valLow != null && f.record.valHigh != null,
) as ScoredForecast;
const local = SCORED_FORECASTS.find((f) => f.lane === "sled") as ScoredForecast;

const row = (rows: WinRow[], key: WinRow["key"]) => rows.find((r) => r.key === key);
const text = (rows: WinRow[]) =>
  JSON.stringify(rows.map((r) => [r.body, r.why, r.sources, r.counted?.map((c) => c.basis)]));

describe("the take's B8 rows", () => {
  it("has the forecasts these cases need", () => {
    expect(federal).toBeDefined();
    expect(local).toBeDefined();
  });

  it("adds no row with no take", () => {
    expect(takeWinRows(null, federal)).toEqual([]);
  });

  it("adds no row when no fact was checked, so the box never shows a zero", () => {
    expect(takeWinRows(emptyTakeFixture(federal.id), federal)).toEqual([]);
  });

  it("shows each counted figure with its basis and a resolved public source", () => {
    const rows = takeWinRows(takeFixture(federal.id), federal);
    expect(rows.map((r) => r.key)).toEqual(["won", "paid", "office"]);

    const won = row(rows, "won");
    expect(won?.body).toContain("**31 firms** have won comparable awards.");
    expect(won?.body).toContain("Acme Catering (12), Beta Food Group (9), Gamma Kitchens (5)");
    expect(won?.body).not.toContain("Delta Meals");
    expect(won?.body).toContain("a median of 4 offers");
    expect(won?.counted?.map((c) => c.basis)).toEqual([
      "31 firms counted. Matched on: NAICS 722310 · Food Service Contractors. Award years: FY2019–FY2024.",
      "120 awards counted. Matched on: NAICS 722310 · Food Service Contractors. Award years: FY2019–FY2024.",
    ]);
    expect(won?.counted?.[0].source).toMatch(/^Source: Federal award records, /);
    expect(won?.counted?.[0].record.provenance.ref).toBe("tally:market-winners");

    const paid = row(rows, "paid");
    expect(paid?.body).toContain("median value of **$170K**");
    expect(paid?.body).toContain("The middle half ran from $90K to $400K.");
    expect(paid?.counted?.[0].basis).toContain("186 awards counted.");

    const office = row(rows, "office");
    expect(office?.body).toContain(
      "**22 of 40** awards on record for this office carried a set-aside.",
    );
    expect(office?.body).not.toContain("the last");
    expect(office?.body).toContain("This office has 3 other active forecasts in NAICS 722310.");
    expect(office?.counted?.map((c) => c.source.split(",")[0])).toEqual([
      "Source: Contracting office award history",
      "Source: Agency forecast",
    ]);
  });

  it("says, per row, what its counts are over, and that none is about this forecast", () => {
    const rows = takeWinRows(takeFixture(federal.id), federal);
    expect(row(rows, "won")?.countsNote).toBe(TAKE_COPY.note.awards);
    expect(row(rows, "paid")?.countsNote).toBe(TAKE_COPY.note.awards);
    expect(TAKE_COPY.note.awards).toBe(
      "These counts are over past award records, not over this forecast.",
    );
    expect(row(rows, "office")?.countsNote).toBe(
      `${TAKE_COPY.note.setAside} ${TAKE_COPY.note.forecasts}`,
    );
    expect(TAKE_COPY.note.setAside).toContain("past awards");
    expect(TAKE_COPY.note.forecasts).toContain("other active forecasts");
    expect(TAKE_COPY.note.forecasts).not.toContain("past");
  });

  it("names only the counts an office row shows in its note", () => {
    const onlyForecasts = row(
      takeWinRows(takeFixture(federal.id, { buyer: NOT_CHECKED }), federal),
      "office",
    );
    expect(onlyForecasts?.countsNote).toBe(TAKE_COPY.note.forecasts);
    const onlySetAside = row(
      takeWinRows(takeFixture(federal.id, { upcoming: NOT_CHECKED }), federal),
      "office",
    );
    expect(onlySetAside?.countsNote).toBe(TAKE_COPY.note.setAside);
  });

  it("reads 'at least' on the set-aside count when the award scan hit its cap", () => {
    const capped = takeFixture(federal.id);
    const buyer = capped.counted.buyer;
    if (buyer.state !== "counted") throw new Error("fixture");
    capped.counted.buyer = {
      ...buyer,
      figure: 120,
      basis: { ...buyer.basis, countedOver: 300, atLeast: true },
    };
    const office = row(takeWinRows(capped, federal), "office");
    expect(office?.body).toContain(
      "**120 of 300** awards read for this office carried a set-aside. The office has at least 300 awards on record.",
    );
    expect(office?.body).not.toContain("awards on record for this office carried");
    // The count was taken over the 300 awards read, so its basis names 300, not "at least".
    expect(office?.counted?.[0].basis).toMatch(/^300 awards counted\./);
  });

  it("marks the one derived comparison Our read, with both inputs", () => {
    const paid = row(takeWinRows(takeFixture(federal.id), federal), "paid");
    expect(paid?.ourRead).toBe(true);
    expect(paid?.body).toMatch(/The buyer's estimate (is below|is inside|is above|overlaps|spans)/);
    expect(paid?.why).toContain("the middle half of 186 comparable awards, $90K to $400K");
    expect(paid?.why).toContain("Neither is a price paid.");
  });

  it("places the estimate against the band by where the two ranges sit", () => {
    const at = (low: number, high: number) =>
      row(
        takeWinRows(
          takeFixture(federal.id, {
            comparableAwards: tallyFact("comparable-awards", {
              figure: 170000,
              low,
              high,
              countedOver: 10,
            }),
          }),
          federal,
        ),
        "paid",
      )?.body;
    const low = federal.record.valLow as number;
    const high = federal.record.valHigh as number;
    const mid = Math.round((low + high) / 2);
    expect(low).toBeGreaterThan(2);
    expect(high - low).toBeGreaterThan(4);
    // Wholly on one side.
    expect(at(high + 1, high + 2)).toContain(TAKE_COPY.compare.below);
    expect(at(1, low - 1)).toContain(TAKE_COPY.compare.above);
    // Wholly inside, including an exact match.
    expect(at(low, high)).toContain(TAKE_COPY.compare.inside);
    expect(at(low - 1, high + 1)).toContain(TAKE_COPY.compare.inside);
    // Partly inside, on either side: never "inside".
    expect(at(low - 1, mid)).toContain(TAKE_COPY.compare.overlaps);
    expect(at(mid, high + 1)).toContain(TAKE_COPY.compare.overlaps);
    // The estimate is wider than the whole band.
    expect(at(low + 1, high - 1)).toContain(TAKE_COPY.compare.spans);
    for (const body of [at(low - 1, mid), at(mid, high + 1), at(low + 1, high - 1)])
      expect(body).not.toContain(TAKE_COPY.compare.inside);
  });

  it("keeps the Our read inputs on every placement", () => {
    const paid = row(
      takeWinRows(
        takeFixture(federal.id, {
          comparableAwards: tallyFact("comparable-awards", {
            figure: 170000,
            low: (federal.record.valLow as number) + 1,
            high: (federal.record.valHigh as number) - 1,
            countedOver: 10,
          }),
        }),
        federal,
      ),
      "paid",
    );
    expect(paid?.ourRead).toBe(true);
    expect(paid?.why).toMatch(
      /^Compares the buyer's estimate, \$[\d.]+[KMB]? to \$[\d.]+[KMB]?, with the middle half of 10 comparable awards/,
    );
  });

  it("names a register's lag on the figure's source line", () => {
    const take = takeFixture(federal.id, {
      comparableAwards: tallyFact("comparable-awards", {
        figure: 170000,
        countedOver: 10,
        sample: [{ ...AWARD, agencyName: "Department of the Army" }],
      }),
    });
    const buyer = take.counted.buyer;
    if (buyer.state !== "counted" || !buyer.source.provenance.buyer) throw new Error("fixture");
    buyer.source.provenance.buyer = { ...buyer.source.provenance.buyer, isDefense: true };
    const rows = takeWinRows(take, federal);
    expect(row(rows, "paid")?.counted?.[0].source).toContain("about 90 days behind");
    expect(row(rows, "office")?.counted?.[0].source).toContain("about 90 days behind");
    expect(row(rows, "won")?.counted?.[0].source).not.toContain("behind");
  });

  it("prints no lag on the forecast count's source line: agency forecasts carry none", () => {
    const office = row(takeWinRows(takeFixture(federal.id), federal), "office");
    const upcoming = office?.counted?.[1].source ?? "";
    expect(upcoming).toMatch(/^Source: Agency forecast, [^.]+\.$/);
    expect(upcoming).not.toContain("your trade");
  });

  it("makes no comparison on a local forecast, whose value is a budget line", () => {
    const paid = row(takeWinRows(takeFixture(local.id), local), "paid");
    expect(paid?.ourRead).toBeUndefined();
    expect(paid?.body).not.toContain("buyer's estimate");
  });

  it("makes no comparison without a valid middle half", () => {
    const paid = row(
      takeWinRows(
        takeFixture(federal.id, {
          comparableAwards: tallyFact("comparable-awards", {
            figure: 170000,
            low: 500000,
            high: 90000,
            countedOver: 10,
          }),
        }),
        federal,
      ),
      "paid",
    );
    expect(paid?.body).not.toContain("middle half");
    expect(paid?.ourRead).toBeUndefined();
  });

  it("hides a row whose lead fact was not checked, and keeps the others", () => {
    const rows = takeWinRows(
      takeFixture(federal.id, { marketWinners: NOT_CHECKED, buyer: NOT_CHECKED }),
      federal,
    );
    expect(rows.map((r) => r.key)).toEqual(["paid", "office"]);
    expect(row(rows, "office")?.body).toBe(
      "This office has **3** other active forecasts in NAICS 722310.",
    );
  });

  it.each([
    [1, "a median of 1 offer."],
    [1.5, "a median of 1.5 offers."],
    [2, "a median of 2 offers."],
    [2.25, "a median of 2.3 offers."],
  ])("prints a median of %s offers as the chat brief does", (figure, line) => {
    const fieldSize = tallyFact("field-size", { figure, countedOver: 120 });
    const won = row(takeWinRows(takeFixture(federal.id, { fieldSize }), federal), "won");
    expect(won?.body).toContain(line);
  });

  it("leaves out the offers line when field size was not checked", () => {
    const won = row(
      takeWinRows(takeFixture(federal.id, { fieldSize: NOT_CHECKED }), federal),
      "won",
    );
    expect(won?.body).not.toContain("offers");
    expect(won?.counted).toHaveLength(1);
  });

  it("hides a row whose source does not resolve to a public record", () => {
    const bare = tallyFact("comparable-awards", { figure: 170000, countedOver: 10 });
    const unresolved = {
      ...bare,
      source: {
        label: "x",
        provenance: { type: "public" as const, ref: "tally:comparable-awards" },
      },
    };
    const rows = takeWinRows(takeFixture(federal.id, { comparableAwards: unresolved }), federal);
    expect(row(rows, "paid")).toBeUndefined();
  });

  it("drops a vendor-named firm whole, and a fact whose basis names the vendor", () => {
    const rows = takeWinRows(
      takeFixture(federal.id, {
        marketWinners: tallyFact("market-winners", {
          figure: 2,
          countedOver: 2,
          firms: [
            { name: "Data via HigherGov", awards: 4, totalValue: null },
            { name: "Acme Catering", awards: 3, totalValue: null },
          ],
        }),
        comparableAwards: tallyFact("comparable-awards", {
          figure: 170000,
          countedOver: 10,
          matchedOn: "highergov NAICS",
        }),
      }),
      federal,
    );
    expect(row(rows, "won")?.body).toContain(
      "The firm with the most of these awards: Acme Catering (3).",
    );
    expect(row(rows, "paid")).toBeUndefined();
    expect(text(rows)).not.toMatch(/highergov/i);
  });

  it("reads 'at least' when the count reached its scan cap", () => {
    const capped = takeFixture(federal.id);
    const upcoming = capped.counted.upcoming;
    if (upcoming.state !== "counted") throw new Error("fixture");
    capped.counted.upcoming = {
      ...upcoming,
      figure: 50,
      basis: { ...upcoming.basis, countedOver: 50, atLeast: true },
    };
    const office = row(takeWinRows(capped, federal), "office");
    expect(office?.body).toContain("at least 50 other active forecasts");
    expect(office?.counted?.[1].basis).toMatch(/^at least 50 forecasts counted\./);
  });

  it("strips bold marks from a firm name, so a name cannot bold the row", () => {
    const won = row(
      takeWinRows(
        takeFixture(federal.id, {
          marketWinners: tallyFact("market-winners", {
            figure: 1,
            countedOver: 1,
            firms: [{ name: "**Loud** Co", awards: 1, totalValue: null }],
          }),
        }),
        federal,
      ),
      "won",
    );
    expect(won?.body).toContain("Loud Co (1)");
    expect(won?.body.match(/\*\*/g)).toHaveLength(2);
  });

  it("uses no deadline word and never names the vendor", () => {
    for (const f of [federal, local])
      expect(text(takeWinRows(takeFixture(f.id), f))).not.toMatch(FORBIDDEN);
  });

  it("names each row's source for the Sources line, once", () => {
    const rows = takeWinRows(takeFixture(federal.id), federal);
    expect(takeSources(rows)).toEqual([
      SOURCE_NAME.awardRecords,
      SOURCE_NAME.officeRecord,
      SOURCE_NAME.officeForecasts,
    ]);
    expect(
      takeSources([{ key: "rivals", body: "x", sources: [SOURCE_NAME.lastContract] }]),
    ).toEqual([]);
  });
});
