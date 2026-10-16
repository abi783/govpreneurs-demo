// Where the Fort Bragg reply starts in the demo. See src/lib/ava/start.ts.
//
// The story says: "ready". Ava built the reply, nothing is left to ask, and
// Amira needs to read it and send it by email. This start plays the reply
// forward with her real answers until Ava has checked it. So the state is one
// the product can reach: the same answers, the same check, the same flow.
//
//   · All 11 questions are answered: staff (2 fields), sites (2 fields), and
//     the Army's 9 yes-or-no boxes on Part B.
//   · Ava read the files and checked the reply. The check matches the answers.
//   · She has not pressed "Read my bid" yet, and she has downloaded nothing.
//
// Every answer below is true of her record (src/demo/story/persona.ts). She
// has run two dining facilities only as a subcontractor, with 30% of the work,
// so she says No to a whole facility and No to every facility. She has no
// repair staff, so she says No to equipment repair. The boxes she ticks Yes
// are the work her cooks, her vans and her 2024 Fort Bragg job support.
//
// WHY THIS FILE DOES NOT CALL `play()` (play.ts): play.ts imports testLab.ts,
// and testLab.ts reads all sample bids when it loads. This file loads while
// fixtures/index.ts loads the sample bids, so an import of play.ts here makes
// testLab.ts read a list that does not exist yet. The loop below does what
// play() does for this bid, with the same product functions: ask the flow for
// the next question, answer it, and let Ava check the reply.

import { PERSONA } from "../../../demo/story/persona";
import { effectiveBid } from "../derive";
import { fortBraggReplyBid } from "../fixtures/fortBraggReply";
import { ISO } from "../fixtures/when";
import { checkFixes, checkSig, flowOf } from "../flow";
import { withGrantFor } from "../grant";
import { emptyState, type AskAnswer, type BidState } from "../store";

const NOTICE_ID = "W912EE-27-S-0004";

/** Her free-text answers, in her own words. Each answer is one sentence with no
 *  final period: the draft puts the period after it. */
const WORDS: Record<string, Record<string, string>> = {
  "fb-ask-staffing": {
    "fb-hire":
      "we ask people we trust for the names of good cooks, and every new cook works one paid trial shift",
    "fb-keep":
      "we give every cook a steady weekly schedule and pay on time, and each cook learns a second station",
  },
  "fb-ask-sites": {
    "fb-sites-lead": `a lead cook runs the kitchen at each dining facility, and our owner, ${PERSONA.ownerName}, manages both leads`,
    "fb-sites-supply": `local farms and produce suppliers near ${PERSONA.hqCity}, and one restaurant food wholesaler`,
  },
};

/** Her box on each Part B question: the number of the question, then her answer. */
const PART_B: Record<number, "yes" | "no"> = {
  1: "yes", // She did Army dining work at Fort Bragg in 2024.
  2: "no", // She worked in two dining facilities, not all of them.
  3: "no", // She did 30% of the work, as a subcontractor. She has never run a whole one.
  4: "no", // Cleaning only, with no cooking, is not her work.
  5: "yes", // Cooks for an Army kitchen: her cooks hold food-handler certificates.
  6: "yes", // A coffee bar or a grab-and-go counter: a caterer's work.
  7: "yes", // Meals for remote sites: her refrigerated vans carry meals every day.
  8: "no", // Her record lists no repair staff and no repair company.
  9: "no", // With no repair staff, she would not bid if repair is required.
};

/** Her answer to one question, or null when this file has none for it. */
function herAnswer(askId: string): AskAnswer | null {
  const at = ISO(-1);
  const words = WORDS[askId];
  if (words) return { status: "done", at, values: words };
  const box = /^fb-ask-q(\d)$/.exec(askId);
  if (box) {
    const n = Number(box[1]);
    return { status: "done", at, choiceId: `fb-q${n}-${PART_B[n]}` };
  }
  return null;
}

export function fortBraggStart(): Partial<BidState> {
  // The reading and the check take the device clock, as they do on screen.
  const t = Date.now();
  let s: BidState = {
    ...emptyState(),
    started: true,
    briefConfirmed: true,
    read: { startedAt: t - 180_000, doneAt: t },
  };
  for (let i = 0; i < 40; i++) {
    const g = withGrantFor(NOTICE_ID, fortBraggReplyBid, s, {});
    const bid = effectiveBid(g.fixture, g.s);
    const flow = flowOf(bid, g.s, { now: Date.now() });
    if (flow.stage === "ready") return s;
    if (flow.stage === "checking") {
      // Ava checks the reply and makes her own fixes, as she does on screen.
      const fixes = checkFixes(bid, s);
      s = {
        ...s,
        fixes: { ...s.fixes, ...Object.fromEntries(fixes.map((f) => [f.key, true as const])) },
        avaFixes: {
          ...s.avaFixes,
          ...Object.fromEntries(fixes.map((f) => [f.key, { text: f.text, at: ISO(-1) }])),
        },
        check: { startedAt: t - 40_000, doneAt: t, sig: "" },
      };
      s = { ...s, check: { ...s.check!, sig: checkSig(s) } };
      continue;
    }
    const q = flow.current;
    const answer = q?.kind === "ask" && q.ask ? herAnswer(q.ask.id) : null;
    if (!q || !q.ask || !answer)
      throw new Error(`The Fort Bragg start has no answer for "${q?.key ?? flow.stage}"`);
    s = {
      ...s,
      answers: { ...s.answers, [q.ask.id]: answer },
      trail: [...s.trail.filter((k) => k !== q.key), q.key],
    };
  }
  throw new Error("The Fort Bragg start did not reach the ready stage");
}
