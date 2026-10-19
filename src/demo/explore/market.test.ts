// Checks that the Partners, Awards and Buyers sample data agree with each other
// and with the story, and that no real company or old sample member leaks in.

import { describe, expect, it } from "vitest";
import { awardsWonBy, allAwardRecords, findAwardRecord } from "./awardsData";
import { BUYER_SEED } from "./buyersData";
import { ALL_FIRMS, AMIRA_FIRM, CAROLINA_DINING, OTHER_WINNERS } from "./firms";
import {
  awardWinnerKeys,
  companyByKey,
  feedWithout,
  initialPartnerPipeline,
  marketSummary,
  rankedPartners,
} from "./partnersData";
import { PERSONA, PAST_PERFORMANCE } from "@/demo/story/persona";
import { VEHICLES } from "@/lib/mock/vehicles";
import { COMPARABLE_FOOD_AWARDS, PREVAILING_WAGES_CUMBERLAND_NC } from "@/lib/mock/laborRates";

const BANNED = /sodexo|aramark|compass group|eurest|highergov|\broof(ing|er|s)?\b|\bmarcus\b|williams construction|238160|amira's kitchen|diana potts|DEMO-[A-Z]+-\d+/i;

describe("partners", () => {
  it("puts Carolina Dining Group first", () => {
    const feed = feedWithout([]);
    expect(feed[0].awardeeKey).toBe(CAROLINA_DINING.key);
    expect(feed[0].name).toBe(CAROLINA_DINING.name);
    expect(feed.length).toBe(ALL_FIRMS.length);
  });

  it("says the 2024 subcontract truthfully", () => {
    const cdg = rankedPartners()[0];
    const past = PAST_PERFORMANCE.find((p) => p.id === "pp-cdg-sub")!;
    const reason = cdg.reasons.find((r) => r.signal === "W1")!;
    expect(reason.text).toContain("2024");
    expect(reason.text).toContain("30%");
    expect(reason.evidence).toContain(`$${Math.round(past.totalValue / 1000)}K`);
  });

  it("opens every award winner, and every ranked company", () => {
    for (const key of awardWinnerKeys()) {
      const hit = companyByKey(key);
      expect(hit, `company ${key}`).not.toBeNull();
    }
    for (const f of ALL_FIRMS) expect(companyByKey(f.key)?.inMatches).toBe(true);
    for (const f of OTHER_WINNERS) {
      const hit = companyByKey(f.key)!;
      expect(hit.inMatches).toBe(false);
      expect(hit.company.isCandidate).toBe(false);
      expect(hit.company.gateFailureReasons!.length).toBeGreaterThan(0);
    }
    expect(companyByKey(AMIRA_FIRM.key)?.company.isCandidate).toBe(false);
    expect(companyByKey(999_999)).toBeNull();
  });

  it("drops a hidden company and fixes the next-company line", () => {
    const feed = feedWithout([CAROLINA_DINING.key]);
    expect(feed.some((c) => c.awardeeKey === CAROLINA_DINING.key)).toBe(false);
    expect(feed[feed.length - 1].whyAboveNext).toBeNull();
  });

  it("starts the pipeline with companies that exist", () => {
    for (const e of initialPartnerPipeline()) expect(ALL_FIRMS.some((f) => f.key === e.awardeeKey)).toBe(true);
  });

  it("builds a market strip from NC, VA and SC food service wins", () => {
    const m = marketSummary();
    expect(m.state).toBe("ok");
    expect(m.events.length).toBeGreaterThanOrEqual(8);
    const sum = m.events.reduce((s, e) => s + (e.obligated ?? 0), 0);
    expect(m.totalAwardedUsd12mo).toBeGreaterThan(sum);
    for (const e of m.events) expect(e.winner.awardeeKey).not.toBeNull();
  });

  it("keeps money and counts in step with the award record", () => {
    for (const p of rankedPartners()) {
      const wins = awardsWonBy(p.awardeeKey);
      expect(p.economics.awardCount).toBe(wins.length);
      expect(p.economics.maxAwardUsd).toBe(Math.max(...wins.map((a) => a.obligated ?? 0)));
    }
  });
});

describe("awards", () => {
  it("holds the two story awards", () => {
    const cdg = findAwardRecord("W91247-19-C-0021")!;
    expect(cdg.winner.awardeeKey).toBe(CAROLINA_DINING.key);
    expect(cdg.naicsCode).toBe("722310");
    expect(cdg.recency.awardedAt).toBe("2019-10-01");
    expect(cdg.recency.comingUpAgain).toBe(true);

    const womack = findAwardRecord("W81K04-24-P-0187")!;
    expect(womack.winner.awardeeKey).toBe(AMIRA_FIRM.key);
    expect(womack.obligated).toBe(126_000);
    expect(womack.solicitationId).toBe("W81K04-24-Q-0187");
  });

  it("has unique ids and 25 to 40 records", () => {
    const ids = allAwardRecords().map((a) => a.awardId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(25);
    expect(ids.length).toBeLessThanOrEqual(40);
  });

  it("has just-awarded and up-for-bid-again records", () => {
    const all = allAwardRecords();
    expect(all.filter((a) => a.recency.justAwarded).length).toBeGreaterThanOrEqual(2);
    expect(all.filter((a) => a.recency.comingUpAgain).length).toBeGreaterThanOrEqual(5);
  });

  it("agrees with the lost lodging breakfast job in the story", () => {
    const a = findAwardRecord("FA4800-26-P-0007")!;
    expect(a.obligated).toBeLessThan(188_000);
    expect(188_000 / a.obligated!).toBeCloseTo(1.04, 1);
    expect(a.winner.name).toBe("Falling Creek Dining Group");
  });
});

describe("buyers, vehicles and wages", () => {
  it("has unique buyer ids and keys, and a contact to start with", () => {
    expect(new Set(BUYER_SEED.map((b) => b.id)).size).toBe(BUYER_SEED.length);
    expect(new Set(BUYER_SEED.map((b) => b.agencyKey)).size).toBe(BUYER_SEED.length);
    for (const b of BUYER_SEED) expect(b.officers.some((o) => o.recommendedFirstContact)).toBe(true);
  });

  it("names the story buyers", () => {
    const names = BUYER_SEED.map((b) => b.name).join(" | ");
    for (const want of ["Fort Bragg", "Womack", "Pope Army Airfield", "VA Network Contracting Office 6", "Cumberland County", "National Guard", "Lejeune", "Seymour Johnson"]) {
      expect(names).toContain(want);
    }
  });

  it("links vehicle and wage examples to records that exist", () => {
    for (const c of COMPARABLE_FOOD_AWARDS) expect(findAwardRecord(c.awardId), c.awardId).not.toBeNull();
    expect(VEHICLES.filter((v) => v.fitsFood).length).toBeGreaterThanOrEqual(5);
    expect(PREVAILING_WAGES_CUMBERLAND_NC.length).toBeGreaterThanOrEqual(6);
  });

  it("never names a real company, HigherGov or the old sample member", () => {
    const text = JSON.stringify({
      p: rankedPartners(),
      a: allAwardRecords(),
      b: BUYER_SEED,
      v: VEHICLES,
      c: COMPARABLE_FOOD_AWARDS,
      persona: PERSONA.businessName,
    });
    expect(text).not.toMatch(BANNED);
  });
});
