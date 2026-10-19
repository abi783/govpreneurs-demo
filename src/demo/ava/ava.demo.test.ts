// The demo's side of Ava: the story adapters, Grant's read, the mentor reviews
// and the wallet charge, and the state that survives a reload.

import { describe, expect, test } from "vitest";
import { clearDemoState, readDemoState } from "../runtime/store";
import { OPPORTUNITIES } from "../story/opportunities";
import { MENTOR } from "../story/persona";
import { getWalletBalance } from "../state/wallet";
import { WALLET } from "../story/workspace";
import { ava, getBidState, isUntouched } from "../../lib/ava/store";
import { grantFacts, resetAllGrantFacts, tellGrant, tellGrantCantMeet } from "./grantFacts";
import { grantRead, realDeadlineFor, sampleFor } from "./grantRead";
import { grantHandoff } from "../../lib/ava/handoff";
import {
  createReview,
  getReviewByOpportunity,
  MENTOR as ADAPTER_MENTOR,
  sendCheck,
} from "./mentorReviews";
import { daysToClose, findOpportunity, OPPS, STORY_BID_IDS } from "./opportunity";
import { daysFromToday } from "../../lib/ava/dates";
import { getAvaStory, STORY_BIDS } from "./story";
import { MEMBER } from "../member";
import { HERO_IDS as AGENCY_IDS } from "../members/agency/opportunities";

const MACKALL = "SP4701-26-Q-0021";
const FAYETTEVILLE = "FAYNC-2026-R-08";
const CUMBERLAND = "CUMCO-2026-014";
const REPLY = "W912EE-27-S-0004";
/** DEMO: the agency's hero bid, the one Ava bid in its story. */
const AGENCY_HERO = AGENCY_IDS.hero;
const CATERER = MEMBER === "caterer";

describe("the story, as Ava reads it", () => {
  test("every opportunity in the story is one Ava can open", () => {
    expect(OPPS).toHaveLength(OPPORTUNITIES.length);
    for (const o of OPPS) {
      expect(o.title.length).toBeGreaterThan(5);
      expect(o.agency.length).toBeGreaterThan(2);
      expect(["fed", "sled"]).toContain(o.scope);
    }
  });

  test("the due day is the story's closing day, counted in calendar days", () => {
    for (const o of OPPS) {
      expect(daysToClose(o)).toBe(o.closesInDays);
      // Midnight at the start of the day: never a clock time that a clock change moves.
      const due = new Date(o.closesAt);
      expect([due.getHours(), due.getMinutes(), due.getSeconds()]).toEqual([0, 0, 0]);
    }
  });

  test("a day count across the November clock change is still a whole number of calendar days", () => {
    // Midnight on 16 October plus 17 days is 2 November, not 1 November at 23:00.
    const base = new Date(2026, 9, 16, 0, 0, 0);
    const due = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 17, 0, 0, 0);
    expect([due.getMonth(), due.getDate()]).toEqual([10, 2]);
  });

  test("an unknown number is not an opportunity", () => {
    expect(findOpportunity("NOT-A-BID-123")).toBeUndefined();
  });

  test.runIf(MEMBER === "agency")("the agency's one bid is its hero, with 3 questions waiting", () => {
    expect(STORY_BID_IDS).toEqual([AGENCY_HERO]);
    expect(STORY_BIDS[0].statusLine).toBe(
      "Ava has 3 questions for you about your team, the videos and the app line.",
    );
    expect(STORY_BIDS[0].value).toBe("$190K–$240K a year");
  });

  test.runIf(CATERER)("the four bids are the story's four, soonest due first", () => {
    expect(STORY_BID_IDS).toEqual([FAYETTEVILLE, CUMBERLAND, MACKALL, REPLY]);
    expect(STORY_BIDS.map((b) => b.statusLine)).toEqual([
      "Sarah Mitchell reviewed your proposal. Read her notes, then send it.",
      "Paused: the county asks for a food-handler certificate for every cook. You have 3 of 5.",
      "Ava has 3 questions for you about delivery times and staff.",
      "Your reply is ready. Read it, then send it by email.",
    ]);
  });

  test("the list shows a value for a bid, and none for a reply with no price", () => {
    expect(getAvaStory(MACKALL)?.value).toBe("$540K–$780K");
    expect(getAvaStory(FAYETTEVILLE)?.value).toBe("$185K–$235K a year");
    expect(getAvaStory(REPLY)?.value).toBeNull();
  });
});

describe("Grant's read", () => {
  test("the call and the reason are the story's", () => {
    for (const id of [MACKALL, FAYETTEVILLE, CUMBERLAND, REPLY]) {
      const o = findOpportunity(id)!;
      const read = grantRead(o, {});
      expect(read.call).toBe("Bid");
      expect(read.gist.length).toBeGreaterThan(10);
    }
  });

  test("the warnings are the ones in Grant's hand-written brief", () => {
    const read = grantRead(findOpportunity(MACKALL)!, {});
    expect(read.warnings.join(" ")).toContain("Food-handler certificates");
    expect(read.warnings.join(" ")).not.toContain("subcontractor. Here you would");
  });

  test("an answer settles its row; a hard bar answered no ends the bid", () => {
    const o = findOpportunity(MACKALL)!;
    expect(
      grantRead(o, { "mk-wosb-cert": "Yes" }).rows.find((r) => r.id === "gm-setaside")?.status,
    ).toBe("have");
    const no = grantRead(o, { "mk-wosb-cert": "No" });
    expect(no.call).toBe("No Bid");
    expect(no.rows.find((r) => r.id === "gm-setaside")?.status).toBe("missing");
  });

  test("a rule she cannot meet makes Grant say No Bid, and taking it back undoes it", () => {
    const o = findOpportunity(CUMBERLAND)!;
    tellGrantCantMeet(CUMBERLAND, "Food-handler certificate for every cook");
    expect(grantRead(o, grantFacts(CUMBERLAND)).call).toBe("No Bid");
    tellGrantCantMeet(CUMBERLAND, null);
    expect(grantRead(o, grantFacts(CUMBERLAND)).call).toBe("Bid");
    resetAllGrantFacts();
  });

  test("the camp Mackall bid starts with her certification answered", () => {
    expect(grantFacts(MACKALL)).toEqual({ "mk-wosb-cert": "Yes" });
  });

  test("facts she tells Grant are kept per opportunity, with a stable object", () => {
    tellGrant("TEST-OPP", "a", "Yes");
    const first = grantFacts("TEST-OPP");
    expect(first).toEqual({ a: "Yes" });
    tellGrant("TEST-OPP", "a", "Yes");
    expect(grantFacts("TEST-OPP")).toBe(first);
    resetAllGrantFacts();
  });

  test("the real deadline: the due date less what a compliant bid needs", () => {
    for (const id of [MACKALL, FAYETTEVILLE, CUMBERLAND, REPLY]) {
      const o = findOpportunity(id)!;
      const d = realDeadlineFor(o, sampleFor(o).deadline);
      expect(daysFromToday(d.realDeadline)).toBeLessThanOrEqual(o.closesInDays);
      expect(["ok", "tight", "blocked"]).toContain(d.status);
    }
  });

  test("an opportunity Ava has not read gets a handoff made of Grant's own words", () => {
    const o = findOpportunity("W912PM-26-Q-0017")!;
    const h = grantHandoff(o);
    expect(h.call).toBe("Bid");
    expect(h.rationale).toBe(o.grantLine);
    expect(h.requirements.length).toBeGreaterThan(0);
    // A federal registration is not a requirement of a county or school buyer.
    const sled = grantHandoff(findOpportunity("RCSC-2026-09")!);
    expect(sled.requirements.map((r) => r.text).join(" ")).not.toMatch(/federal registration/i);
  });
});

describe("the mentor reviews", () => {
  test.runIf(CATERER)(
    "Sarah's review of the Fayetteville proposal is a finished review of her bid",
    () => {
      const r = getReviewByOpportunity(FAYETTEVILLE, "bid");
      expect(r?.id).toBe("rev-fayetteville-proposal");
      expect(r?.status).toBe("responded");
      expect(r?.mentorName).toBe(MENTOR.name);
      expect(r?.messages.at(-1)?.from).toBe("mentor");
      expect(getReviewByOpportunity(FAYETTEVILLE, "bid")).toBe(r);
    },
  );

  test.runIf(CATERER)(
    "Sarah's read of the Camp Mackall opportunity says Pursue, and is not a review of her bid",
    () => {
      const r = getReviewByOpportunity(MACKALL);
      expect(r?.id).toBe("rev-mackall-pursue");
      expect(r?.verdict).toBe("pursue");
      expect(getReviewByOpportunity(MACKALL, "bid")).toBeNull();
    },
  );

  test("the mentor is Sarah Mitchell", () => {
    expect(ADAPTER_MENTOR.name).toBe("Sarah Mitchell");
  });

  test("sending her bid charges the wallet once, and a second send finds the first", () => {
    // DEMO: the member on stage's hero bid. Dana's has no mentor read yet.
    const hero = CATERER ? MACKALL : AGENCY_HERO;
    const read = CATERER ? "rev-mackall-pursue" : undefined;
    const before = getWalletBalance();
    expect(before).toBe(WALLET.balance);
    expect(sendCheck()).toMatchObject({ cost: 97, enough: true });
    const r = createReview({
      opportunityId: hero,
      opportunityTitle: "Field Feeding Support",
      note: "Please read my bid.",
      subject: "bid",
    });
    expect(r.status).toBe("pending");
    expect(r.subject).toBe("bid");
    expect(getWalletBalance()).toBe(before - 97);
    const again = createReview({
      opportunityId: hero,
      opportunityTitle: "Field Feeding Support",
      note: "Again.",
      subject: "bid",
    });
    expect(again.id).toBe(r.id);
    expect(getWalletBalance()).toBe(before - 97);
    // It never replaces Sarah's read of the opportunity.
    expect(getReviewByOpportunity(hero)?.id).toBe(read);
  });
});

describe("a bid keeps what she did", () => {
  test("a bid nobody changed is untouched, and any answer touches it", () => {
    clearDemoState("ava.states");
    expect(isUntouched(REPLY)).toBe(true);
    expect(getBidState(REPLY)).toBe(getBidState(REPLY));
    ava.sendBid(REPLY);
    expect(isUntouched(REPLY)).toBe(false);
    const saved = readDemoState<Record<string, { sentAt?: string | null }>>("ava.states", {});
    expect(saved[REPLY]?.sentAt).toBeTruthy();
    ava.unsendBid(REPLY);
    expect(getBidState(REPLY).sentAt).toBeNull();
    clearDemoState("ava.states");
  });
});
