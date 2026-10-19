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
import { KEY_PARTNER, PERSONA, PAST_PERFORMANCE } from "@/demo/story/persona";
import { byMember, MEMBER } from "@/demo/member";
import { getOpportunity, HERO_IDS } from "@/demo/story/opportunities";
import { VEHICLES } from "@/lib/mock/vehicles";
import { COMPARABLE_FOOD_AWARDS, LCAT_RATES, PREVAILING_WAGES_CUMBERLAND_NC } from "@/lib/mock/laborRates";

// DEMO: Marcus Hale is the agency's partner contact, so only the caterer bans "Marcus" (an old sample
// member). The agency bans the caterer's trade words (demo-storyboard/tools/scan-member.mjs).
const BANNED = byMember({
  caterer: /sodexo|aramark|compass group|eurest|highergov|\broof(ing|er|s)?\b|\bmarcus\b|williams construction|238160|amira's kitchen|diana potts|DEMO-[A-Z]+-\d+/i,
  pack: /sodexo|aramark|compass group|eurest|highergov|\broof(ing|er|s)?\b|williams construction|238160|DEMO-[A-Z]+-\d+|\b(cater\w*|meals?|kitchen|food|cooks?|dining|menus?|ServSafe|Haddad|Amira|722310|Camp Mackall|Womack|Carolina Dining)\b/i,
});
const caterer = MEMBER === "caterer";
const agency = MEMBER === "agency";

describe("partners", () => {
  it("puts the team-up partner first", () => {
    const feed = feedWithout([]);
    expect(feed[0].awardeeKey).toBe(CAROLINA_DINING.key);
    expect(feed[0].name).toBe(CAROLINA_DINING.name);
    expect(feed.length).toBe(ALL_FIRMS.length);
  });

  it.runIf(caterer)("says the 2024 subcontract truthfully", () => {
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

  it.runIf(caterer)("builds a market strip from NC, VA and SC food service wins", () => {
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
  it.runIf(caterer)("holds the two story awards", () => {
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

  it.runIf(caterer)("has unique ids and 25 to 40 records", () => {
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

  it.runIf(caterer)("agrees with the lost lodging breakfast job in the story", () => {
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

  it.runIf(caterer)("names the story buyers", () => {
    const names = BUYER_SEED.map((b) => b.name).join(" | ");
    for (const want of ["Fort Bragg", "Womack", "Pope Army Airfield", "VA Network Contracting Office 6", "Cumberland County", "National Guard", "Lejeune", "Seymour Johnson"]) {
      expect(names).toContain(want);
    }
  });

  it.runIf(caterer)("links vehicle and wage examples to records that exist", () => {
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
      l: agency ? LCAT_RATES : [],
      w: agency ? PREVAILING_WAGES_CUMBERLAND_NC : [],
      persona: PERSONA.businessName,
    });
    expect(text).not.toMatch(BANNED);
  });
});

describe.runIf(agency)("the agency's market pages", () => {
  it("puts Bluestone first, with the person who wrote to Dana", () => {
    const top = rankedPartners()[0];
    expect(top.name).toBe("Bluestone Veteran Media Group");
    expect(top.name).toBe(KEY_PARTNER.name);
    const contact = top.flags.find((f) => f.id === "your_contact")!;
    expect(contact.text).toContain(KEY_PARTNER.contact);
    expect(top.reasons[0].text).toMatch(/VA's national hiring campaign/);
    const due = top.flags.find((f) => f.id === "recompete_due")!;
    expect(due.text).toContain(`${getOpportunity(HERO_IDS.teamUp)!.closesInDays} days`);
    // Two more top partners, then competitors.
    expect(rankedPartners().slice(0, 3).every((p) => p.tier === "strong" && p.verdict === "partner_play")).toBe(true);
    expect(rankedPartners().some((p) => p.verdict === "competitor")).toBe(true);
  });

  it("holds Dana's NC Guard award and Bluestone's VA campaign", () => {
    const mine = findAwardRecord("W91242-25-P-A118")!;
    expect(mine.winner.awardeeKey).toBe(AMIRA_FIRM.key);
    expect(mine.winner.name).toBe(PERSONA.businessName);
    expect(mine.obligated).toBe(86_400);
    expect(mine.obligated).toBe(PAST_PERFORMANCE.find((p) => p.id === "pp-ncng-recruiting")!.totalValue);

    const va = findAwardRecord("36C77623C0298")!;
    expect(va.winner.awardeeKey).toBe(CAROLINA_DINING.key);
    expect(va.recency.recompeteAt).toBe("2027-09-24");
    expect(va.recency.openNowNote).toContain(`${getOpportunity(HERO_IDS.teamUp)!.closesInDays} days`);
    expect(va.setAside).toMatch(/Service-Disabled Veteran/);
  });

  it("has 15 to 25 awards, all in her trade's codes or close to them", () => {
    const all = allAwardRecords();
    expect(all.length).toBeGreaterThanOrEqual(15);
    expect(all.length).toBeLessThanOrEqual(25);
    expect(new Set(all.map((a) => a.awardId)).size).toBe(all.length);
    for (const a of all) expect(a.naicsCode).toMatch(/^(5418|5416|5414|5121)/);
  });

  it("builds a market strip whose yearly total covers the last year's wins", () => {
    const m = marketSummary();
    expect(m.state).toBe("ok");
    expect(m.events.length).toBeGreaterThanOrEqual(8);
    const lastYear = m.events
      .filter((e) => (findAwardRecord(e.awardId)!.recency.daysSinceAward ?? 9999) <= 365)
      .reduce((s, e) => s + (e.obligated ?? 0), 0);
    expect(m.totalAwardedUsd12mo).toBeGreaterThan(lastYear);
  });

  it("names the agency's buyers, with no contact who shares Dana's surname", () => {
    const names = BUYER_SEED.map((b) => b.name).join(" | ");
    for (const want of ["MICC", "National Guard", "PCAC", "Network Contracting Office 6", "Health and Human Services", "Highway Safety", "City of Fayetteville", "Cumberland County", "MWR"]) {
      expect(names).toContain(want);
    }
    const surname = PERSONA.ownerName.split(" ").pop()!;
    for (const b of BUYER_SEED) for (const o of b.officers) expect(o.name).not.toContain(surname);
  });

  it("lists real vehicles, with Dana not on a GSA schedule yet", () => {
    const mas = VEHICLES.find((v) => v.type === "GSA MAS")!;
    expect(mas.scope).toContain("541810");
    expect(mas.fitReason).toMatch(/not on it yet/);
    expect(VEHICLES.filter((v) => v.fitsFood).length).toBeGreaterThanOrEqual(3);
  });

  it("links labor examples to awards that exist, with sourced rates", () => {
    for (const c of COMPARABLE_FOOD_AWARDS) expect(findAwardRecord(c.awardId), c.awardId).not.toBeNull();
    expect(PREVAILING_WAGES_CUMBERLAND_NC.length).toBeGreaterThanOrEqual(6);
    for (const r of LCAT_RATES) expect(r.low < r.median && r.median < r.high).toBe(true);
  });
});
