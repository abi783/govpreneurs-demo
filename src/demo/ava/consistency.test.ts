// The people and the numbers in Ava's papers agree with the rest of the demo.
//
// A buyer on a call can open the opportunity page and Ava's page for one bid. They
// must name the same contracting officer. The same three references must have one
// phone number and one email in every bid, and one tax ID must be on every W-9.

import { describe, expect, test } from "vitest";
import { contactFor } from "../grant/facts";
import { getOpportunity } from "../story/opportunities";
import { getAvaBid } from "../../lib/ava/fixtures";
import { cumberlandStart } from "../../lib/ava/starts/cumberland";
import { fayettevilleStart } from "../../lib/ava/starts/fayetteville";
import { MEMBER_EIN, REFERENCE_CONTACTS, buyerPeople } from "./contacts";
import { parseNumber, fieldProblem, fieldNeeds } from "../../components/Ava/Asking";
import { readerReply, buildReply } from "../../components/Ava/chatReplies";

const IDS = ["SP4701-26-Q-0021", "FAYNC-2026-R-08", "CUMCO-2026-014", "W912EE-27-S-0004"];

describe("the buyer's contact", () => {
  test("each bid names the person the opportunity page names", () => {
    for (const id of IDS) {
      const bid = getAvaBid(id)!;
      const page = contactFor(getOpportunity(id)!);
      expect(bid.overview?.contact?.name, id).toBe(page.name);
      expect(bid.overview?.contact?.email, id).toBe(page.email);
    }
  });

  test("the buyer's two people are the page's primary and secondary contacts", () => {
    const p = buyerPeople("W912EE-27-S-0004");
    const o = getOpportunity("W912EE-27-S-0004")!;
    expect(p.primary).toEqual(contactFor(o));
    expect(p.second).toEqual(contactFor(o, true));
    const reply = JSON.stringify(getAvaBid("W912EE-27-S-0004"));
    expect(reply).toContain(p.primary.email);
    expect(reply).toContain(p.second.email);
  });
});

describe("the member's references and tax ID", () => {
  const typed = (s: Partial<{ answers: Record<string, { values?: Record<string, unknown> }> }>) =>
    s.answers ?? {};

  test("Janet Reyes and Mike Sutton have one phone and one email in every bid", () => {
    const fay = typed(fayettevilleStart() as never)["ask-ref-contacts"]?.values ?? {};
    const cum = typed(cumberlandStart() as never)["ask-ref-contacts"]?.values ?? {};
    expect(fay["ref1-phone"]).toBe(REFERENCE_CONTACTS.janetReyes.phone);
    expect(cum["janet-phone"]).toBe(REFERENCE_CONTACTS.janetReyes.phone);
    expect(fay["ref1-email"]).toBe(cum["janet-email"]);
    expect(fay["ref2-phone"]).toBe(cum["mike-phone"]);
    expect(fay["ref2-email"]).toBe(cum["mike-email"]);
  });

  test("one tax ID on every W-9", () => {
    const cum = typed(cumberlandStart() as never)["ask-ein"]?.values ?? {};
    const fay = typed(fayettevilleStart() as never)["ask-city-vendor"]?.values ?? {};
    expect(cum.ein).toBe(MEMBER_EIN);
    expect(fay["tax-id"]).toBe(MEMBER_EIN);
  });
});

describe("what a box takes", () => {
  const f = (unit: "percent" | "usd" | "usd-hour" | "count" | "text" | "phone" | "email") => ({
    id: "x",
    label: "Contingency",
    unit,
  });

  test("a number box takes a plain number and refuses the rest", () => {
    for (const ok of ["5", "5%", "$18.50", "1,200", " 7 ", ".5", "0"])
      expect(parseNumber(ok, "usd"), ok).not.toBeNull();
    for (const bad of ["abc", "-5", "1e9", "5.5.5", "🙂", "", "5,5", "$", "five"])
      expect(parseNumber(bad, "usd"), bad).toBeNull();
  });

  test("a percent is out of 100 and a count is whole", () => {
    expect(parseNumber("100", "percent")).toBe(100);
    expect(parseNumber("101", "percent")).toBeNull();
    expect(parseNumber("400", "count")).toBe(400);
    expect(parseNumber("4.5", "count")).toBeNull();
    expect(parseNumber("99999999999999999999", "usd")).toBeNull();
  });

  test("a phone box needs seven digits and an email box needs an @", () => {
    expect(fieldProblem(f("phone"), "12")).toMatch(/phone number/);
    expect(fieldProblem(f("phone"), "(910) 555-0100")).toBeNull();
    expect(fieldProblem(f("email"), "12")).toMatch(/email address/);
    expect(fieldProblem(f("email"), "a@b.co")).toBeNull();
    expect(fieldProblem(f("text"), "12")).toBeNull();
    expect(fieldProblem(f("percent"), "")).toBeNull();
    expect(fieldNeeds(f("percent"))).toBe("“Contingency” needs a number, like 5.");
  });
});

describe("what Ava answers to a question she was not asked", () => {
  test("none of her answers promises a win or says she sends", () => {
    const bid = getAvaBid("FAYNC-2026-R-08")!;
    for (const t of ["will I win?", "when is it due", "how do I send it", "price", "hello", "?!"]) {
      const said = [readerReply(t, bid, null), buildReply(t, bid, null) ?? ""].join(" ");
      expect(said, t).not.toMatch(/\bwill win\b|guarantee|I (will )?send (it|your)/i);
    }
  });

  test("a reply has no price, and says reply", () => {
    const reply = getAvaBid("W912EE-27-S-0004")!;
    expect(readerReply("what will it cost", reply, null)).toMatch(/no price/);
    expect(readerReply("how do I send it", reply, null)).toMatch(/your reply/);
  });

  test("a bid with a review points at the review", () => {
    const bid = getAvaBid("FAYNC-2026-R-08")!;
    const review = { mentorName: "Diana Potts" } as never;
    expect(readerReply("can I talk to Diana", bid, review)).toMatch(/Diana's review/);
    expect(readerReply("can I talk to Diana", bid, null)).toMatch(/mentor button/);
  });

  test("the answer about the win never promises", () => {
    const bid = getAvaBid("SP4701-26-Q-0021")!;
    expect(buildReply("will I win this", bid, null)).toMatch(/cannot tell you/);
  });
});
