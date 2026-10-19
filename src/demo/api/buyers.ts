// DEMO API area: Government buyers.
// Owns: /buyers*.
//
// The Government Buyers page reads its directory straight from the sample data
// (src/lib/mock/governmentBuyers.ts). These two calls serve the same buyers in the
// shape of the live buyer API, for any caller that asks by name or by key.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { calendarDay } from "../explore/dates";
import { GOV_BUYERS, type GovBuyer } from "@/lib/mock/governmentBuyers";
import type { BuyerDetail, OfficeSummary } from "@/lib/buyers";

const isDefense = (b: GovBuyer): boolean =>
  b.type === "federal" && /Army|Navy|Air Force|Womack|Pope|Lejeune|NAVFAC|Seymour|Cherry Point|Fort|Naval/i.test(b.name);

function summary(b: GovBuyer): OfficeSummary {
  return {
    agencyKey: b.agencyKey,
    name: b.name,
    abbreviation: b.abbreviation,
    agencyType: b.type === "federal" ? "Federal" : "State and local",
    isDefense: isDefense(b),
  };
}

function detail(b: GovBuyer): BuyerDetail {
  const a = b.analysis;
  const years = a?.annualSpendByYear ?? [];
  const spendRows = years.map((r) => ({ fiscalYear: r.year, total: r.trade, awards: Math.max(3, Math.round(r.trade / 600_000)) }));
  const awardsExamined = spendRows.reduce((s, r) => s + r.awards, 0);
  const setAside = Math.round((awardsExamined * (a?.smallBizPct ?? 40)) / 100);
  const range = years.length ? `FY${years[0].year}–FY${years[years.length - 1].year}` : null;
  return {
    buyer: {
      agencyKey: b.agencyKey,
      name: b.name,
      abbreviation: b.abbreviation,
      agencyType: b.type === "federal" ? "Federal" : "State and local",
      isDefense: isDefense(b),
      parents: [],
      buys: [{ code: "722310", description: "Food Service Contractors", awards: awardsExamined }],
      awardsExamined,
      setAsideAwards: setAside,
      officers: b.officers.length,
      asOf: calendarDay(-1),
    },
    figures: {
      spendByYear: a
        ? {
            value: spendRows,
            basis: { countedOver: awardsExamined, filter: "Food service awards by this office", yearsCovered: range },
          }
        : null,
      topAwardees: a
        ? {
            value: a.topAwardees.map((w) => ({ name: w.company, awards: w.awardsCount, total: w.totalDollars })),
            basis: { countedOver: awardsExamined, filter: "Food service awards by this office", yearsCovered: range },
          }
        : null,
      setAsideAwards: a
        ? {
            value: { withSetAside: setAside, examined: awardsExamined },
            basis: { countedOver: awardsExamined, filter: "Food service awards by this office", yearsCovered: range },
          }
        : null,
    },
  };
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/buyers",
    handler: ({ query }) => {
      const q = (query.get("q") ?? "").trim().toLowerCase();
      const hits = q
        ? GOV_BUYERS.filter((b) => `${b.name} ${b.abbreviation ?? ""} ${b.location}`.toLowerCase().includes(q))
        : [];
      return { buyers: hits.map(summary) };
    },
  },
  {
    method: "GET",
    path: "/buyers/:agencyKey",
    handler: ({ params }) => {
      const b = GOV_BUYERS.find((x) => String(x.agencyKey) === params.agencyKey);
      return b ? detail(b) : demoResponse(404, { message: "No office on file for that key." });
    },
  },
];
