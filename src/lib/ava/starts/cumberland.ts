// Where the cumberland bid starts in the demo. See src/lib/ava/start.ts.
//
// The story: Ava paused this bid at "check you can bid". The county asks for
// a food-handler certificate for every cook, and only some of her cooks have
// one (persona.ts: foodHandlerCertified of employeesW2). She told Ava "I don't
// have all of them". Her way out is to upload the certificates: the answer to
// the same question becomes "done", the pause lifts, and Ava goes on with a
// short list (see `LEFT_FOR_HER`).
//
// The state holds only answers the product accepts. Each answer below is one
// the bid asks for, in the shape the screen stores it. The proof is a script:
// it plays the bid from this state to "ready" and counts the questions.
//
// This file does not import play.ts or testLab.ts. Both import the fixtures
// index, and the index imports this file, so the import would be a cycle.

import { MEMBER_EIN, REFERENCE_CONTACTS } from "../../../demo/ava/contacts";
import { cumberlandBid } from "../fixtures/cumberland";
import { ISO } from "../fixtures/when";
import type { AskAnswer, BidState } from "../store";

/** The questions Ava still asks after the upload, in the order she asks them:
 *  two papers from her surety, a contact for the Womack reference, the staffing
 *  plan, her contingency and profit (only she decides them), and her price. */
export const LEFT_FOR_HER = [
  "ask:ask-bid-bond",
  "ask:ask-perf-letter",
  "ask:ask-ref-3",
  "staffing",
  "ask:ask-contingency",
  "ask:ask-profit",
  "price",
] as const;

/** What she pays and what her kitchen costs, in her own numbers. */
const PAY = { "pay-cook": 14.5, "pay-lead": 19, "pay-driver": 14.5 };
const FOOD = { "food-regular": 1.02, "food-diet": 1.55 };
const VEHICLE_PER_YEAR = 9_800;

/** The numbers a document holds, as the screen stores them once she approves. */
function extracted(askId: string): Record<string, number> {
  const ask = cumberlandBid.asks.find((a) => a.id === askId);
  const spec = ask?.answer;
  if (spec?.type !== "upload") return {};
  return Object.fromEntries((spec.extracts ?? []).map((x) => [x.fieldId, x.value]));
}

export function cumberlandStart(): Partial<BidState> {
  const now = Date.now();
  // Yesterday afternoon, a few minutes apart. The order she answered in is
  // the `trail`, not these stamps.
  let minute = 0;
  const stamp = () => ISO(-1, 14, minute++);
  const done = (extra: Partial<AskAnswer> = {}): AskAnswer => ({
    status: "done",
    at: stamp(),
    addenda: [],
    ...extra,
  });

  // The rules first. She settled six at once, then met the seventh.
  const mustHave: BidState["mustHave"] = {
    "req-bid-bond": { says: "getting", at: stamp(), addenda: [] },
    "req-perf-bond": { says: "getting", at: stamp(), addenda: [] },
    "req-refs": { says: "have", at: stamp(), addenda: [] },
    "req-permit": { says: "have", at: stamp(), addenda: [] },
    "req-cfpm": { says: "have", at: stamp(), addenda: [] },
  };
  const prebid = done({ choiceId: "prebid-yes" });
  const handlers: AskAnswer = {
    status: "dont-have",
    at: stamp(),
    optionId: "dh-handlers-missing",
    addenda: [],
  };

  // Everything else a person can answer at once. None of it is in the trail:
  // the chat shows the rules, and the pause comes straight after them.
  const answers: BidState["answers"] = {
    "ask-prebid": prebid,
    "ask-food-handlers": handlers,
    "ask-ref-1": done(),
    "ask-ref-2": done(),
    "ask-ref-contacts": done({
      values: {
        "janet-phone": REFERENCE_CONTACTS.janetReyes.phone,
        "janet-email": REFERENCE_CONTACTS.janetReyes.email,
        "mike-phone": REFERENCE_CONTACTS.mikeSutton.phone,
        "mike-email": REFERENCE_CONTACTS.mikeSutton.email,
      },
    }),
    "ask-permit": done({ fileName: "Food establishment permit.pdf" }),
    "ask-cfpm": done({ fileName: "Food protection manager certificate.pdf" }),
    "ask-ein": done({ values: { ein: MEMBER_EIN } }),
    "ask-background": done({ choiceId: "bg-drivers" }),
    "ask-pay": done({ values: PAY }),
    "ask-food": done({ values: FOOD }),
    "ask-payroll": done({
      fileName: "Payroll report, last quarter.pdf",
      values: extracted("ask-payroll"),
    }),
    "ask-overhead": done({
      fileName: "Profit and loss statement.pdf",
      values: extracted("ask-overhead"),
    }),
    "ask-sales-tax": done({ values: { "sales-tax": 0 } }),
    "ask-other-costs": done({ values: { "vehicle-cost": VEHICLE_PER_YEAR } }),
    // The insurance certificate is due at award. Her agent has the request.
    "ask-insurance": {
      status: "forwarded",
      at: stamp(),
      forwardedTo: "your insurance agent",
      addenda: [],
    },
  };

  // She approved every promise Ava drafted from the county's files.
  const commitments: BidState["commitments"] = Object.fromEntries(
    cumberlandBid.commitments
      .filter((c) => c.needsApproval)
      .map((c) => [c.id, { at: stamp(), text: c.text }]),
  );

  return {
    started: true,
    briefConfirmed: true,
    read: { startedAt: now - 180_000, doneAt: now },
    mustHave,
    answers,
    commitments,
    // The question about the trays went to the county. Addendum 1 answers it.
    clarifications: { "clar-trays": { sentAt: stamp() } },
    trail: [
      "must:req-bid-bond",
      "must:req-perf-bond",
      "ask:ask-prebid",
      "must:req-refs",
      "must:req-permit",
      "must:req-cfpm",
      "ask:ask-food-handlers",
    ],
  };
}
