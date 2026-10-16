// PROTOTYPE ONLY — open a bid at one of the design's screens
// (docs/ava/ava-two-phase.html: each figure's "?case=<id>"), so the build can
// be checked against its picture one for one. The product has no such path:
// members reach every state by answering.
//
// A case is reached the way she would reach it: the bid is played forward,
// question by question, answering each with a plain sample answer
// (testLab.sampleAnswer), until the case's stopping point. So a case can only
// show a state the product can really get into.
//
// Not built, by decision (Shyam, 7 October 2026): 4.3 "Her mentor's notes are
// back, beside her bid" and 4.4 "Ava makes a mentor's note" — mentors edit her
// bid directly from Command Center v2. Their edits show marked in her bid
// (case tp-mentor-done).

import { bus } from "../eventBus";
import { demoMentor, MENTOR, type MentorReview } from "../../demo/ava/mentorReviews";
import { DEMO } from "./derive";
import { getAvaBid } from "./fixtures";
import { checkSig, type Flow } from "./flow";
import {
  at,
  checkedNow,
  downloaded,
  gettingInsurance,
  leaving,
  look,
  play,
  ready,
  reading,
  stage,
  started,
} from "./play";
import { PRICE_YOURSELF_KEY } from "./price";
import { REPLY_SIMPLE_KEY } from "./scope";
import { avaDemo, emptyState, type BidState } from "./store";
import { sentencesOf } from "./thread";
import { nowIso } from "./dates";

const FAY = "FAYNC-2026-R-08";
const CUM = "CUMCO-2026-014";
const MAC = "SP4701-26-Q-0021";
const FBR = "W912EE-27-S-0004";

export interface Case {
  id: string;
  /** The design's figure: "2.4 Building in front of her". */
  title: string;
  noticeId: string;
  build: () => BidState;
  /** Search params the screen needs: a tapped hole, a tab, a sentence. */
  search?: Record<string, string>;
  /** The mentor's review, as her dashboard leaves it. */
  mentor?: (id: string) => MentorReview | null;
}

function review(
  id: string,
  subject: "opportunity" | "bid",
  status: MentorReview["status"],
  opts: { verdict?: "pursue" | "dont-pursue"; note?: string; ask?: string },
): MentorReview {
  const sentAt = new Date(Date.now() - 2 * 86_400_000).toISOString();
  return {
    id: `rev_demo_${subject}_${id}`,
    opportunityId: id,
    opportunityTitle: getAvaBid(id)?.officialTitle ?? id,
    status,
    sentAt,
    subject,
    verdict: opts.verdict,
    memberNote: opts.ask,
    mentorName: MENTOR.name,
    mentorCredential: MENTOR.credential,
    grantVerdictSnapshot: { verdict: "Bid", rationale: "" },
    messages: [
      {
        id: "m1",
        from: "member",
        authorName: demoMentor.member,
        body: opts.ask ?? "Should I bid this one?",
        sentAt,
      },
      ...(opts.note
        ? [demoMentor.message(opts.note, new Date(Date.now() - 86_400_000).toISOString())]
        : []),
    ],
  };
}

const PURSUE =
  "Your cafe and event work fits this well. The price is scored by formula, so keep it lean. Go to the site visit yourself.";
const DONT =
  "Two services a day plus city events is a lot for a five-person kitchen. In its first year, it is too much. Let's find you one that fits.";
const ASK = "Is my staffing plan strong enough to score well?";

/** Two sentences her mentor rewrote from the mentor dashboard. */
function mentorEdits(s: BidState): BidState {
  const { bid } = look(FAY, s);
  const sents = sentencesOf(bid, s, "sec-operations").flat();
  const pick = sents.filter((x) => x.text.length > 40).slice(0, 2);
  const edits = { ...s.edits };
  for (const x of pick) {
    edits[x.key] = {
      sectionId: x.sectionId,
      paragraph: x.paragraph,
      was: x.text,
      now: x.text.replace(/\.$/, ", every day of the contract."),
      by: "mentor",
      at: nowIso(),
    };
  }
  // Ava checks a mentor's changes like any other (flow.ts checkSig). The
  // screen shows the bid after that check.
  return checkedNow({ ...s, edits });
}

export const CASES: Case[] = [
  // ── Part 1. Arriving from Grant ──
  {
    id: "tp-from-pursue",
    title: "1.1 From Grant, after her mentor said Pursue",
    noticeId: FAY,
    build: () => ({ ...started(), read: { startedAt: Date.now() - 3200, doneAt: null } }),
    mentor: (id) => review(id, "opportunity", "responded", { verdict: "pursue", note: PURSUE }),
  },
  {
    id: "tp-from-dontpursue",
    title: "1.2 Her mentor said Don't pursue",
    noticeId: FAY,
    build: () => started(),
    mentor: (id) => review(id, "opportunity", "responded", { verdict: "dont-pursue", note: DONT }),
  },
  // ── Part 2. Phase 1 ──
  {
    id: "tp-musthaves",
    title: "2.1 Must-haves first",
    noticeId: FAY,
    build: () => play(FAY, started(), stage("must")),
  },
  {
    id: "insurance-getting-mile",
    title: "2.14b The milestone, with her insurance on its way",
    noticeId: FAY,
    build: () => ready(FAY, started(), gettingInsurance),
  },
  {
    id: "insurance-getting",
    title: "3.1b Reading her bid, with her insurance on its way",
    noticeId: FAY,
    build: () => reading(ready(FAY, started(), gettingInsurance)),
    search: { q: "ask:ask-insurance" },
  },
  {
    id: "tp-gettable",
    title: "2.2 A rule she can meet in time",
    noticeId: FAY,
    build: () =>
      play(FAY, started(), stage("answer"), (q, s) =>
        q.key === "must:hr-insurance"
          ? {
              ...s,
              mustHave: { ...s.mustHave, "hr-insurance": { says: "getting", at: nowIso() } },
              trail: [...s.trail, q.key],
            }
          : null,
      ),
  },
  {
    id: "tp-cantmeet",
    title: "2.3 A rule she cannot meet",
    noticeId: FAY,
    build: () =>
      play(FAY, started(), stage("paused"), (q, s) =>
        q.key === "ask:ask-site-visit"
          ? {
              ...s,
              answers: {
                ...s.answers,
                "ask-site-visit": { status: "done", at: nowIso(), choiceId: "sv-none" },
              },
              trail: [...s.trail, q.key],
            }
          : null,
      ),
  },
  {
    id: "tp-build",
    title: "2.4 Building in front of her",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-permit")),
  },
  {
    id: "tp-upload",
    title: "2.5 She sends a photo",
    noticeId: FAY,
    build: () => {
      const s = play(FAY, started(), at("ask:ask-permit"));
      return {
        ...s,
        pending: {
          "ask:ask-permit": {
            fileName: "Photo of my food service permit.jpg",
            photo: true,
            at: nowIso(),
          },
        },
      };
    },
  },
  {
    id: "tp-hole-tap",
    title: "2.6 She taps a marked spot",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-permit")),
    search: { q: "ask:ask-backup-manager" },
  },
  {
    id: "tp-why",
    title: "2.7 Why?, only when she asks",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-permit")),
    search: { why: "1" },
  },
  {
    id: "tp-proof",
    title: "2.8 A copy, her word, or only if she wins",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-employees")),
  },
  {
    id: "tp-cantwrite",
    title: "2.9 A part Ava cannot write well",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-food-safety")),
  },
  {
    id: "tp-price",
    title: "2.10 Her price",
    noticeId: FAY,
    build: () => play(FAY, started(), at("price")),
  },
  {
    id: "tp-choice",
    title: "2.11 A choice only she can make",
    noticeId: FAY,
    build: () => play(FAY, started(), at("decision:sec-experience:dec-exp-lead")),
  },
  {
    id: "tp-check",
    title: "2.12 Check for mistakes",
    noticeId: FAY,
    build: () => {
      const s = play(FAY, started(), stage("checking"));
      return { ...s, check: { startedAt: Date.now() - 3300, doneAt: null, sig: checkSig(s) } };
    },
  },
  {
    id: "tp-check-found",
    title: "2.13 The check finds something",
    noticeId: FAY,
    build: () => play(FAY, started(), stage("found")),
  },
  { id: "tp-milestone", title: "2.14 The milestone", noticeId: FAY, build: () => ready(FAY) },
  {
    id: "tp-milestone-holes",
    title: "2.15 The milestone with holes left",
    noticeId: FAY,
    build: () =>
      ready(FAY, started(), leaving(["ask:ask-floorplan", "mentor:ask:ask-food-safety"])),
  },
  // ── Part 3. Phase 2 ──
  { id: "tp-read", title: "3.1 Read your bid", noticeId: FAY, build: () => reading(ready(FAY)) },
  {
    id: "tp-read-change",
    title: "3.2 She changes a sentence",
    noticeId: FAY,
    build: () => reading(ready(FAY)),
    search: { sel: "sec-cover:0:0" },
  },
  // ── Part 4. The mentor review ──
  {
    id: "tp-mentor-send",
    title: "4.1 Sending the bid to her mentor",
    noticeId: FAY,
    build: () => reading(ready(FAY)),
    search: { dlg: "mentor" },
  },
  {
    id: "tp-mentor-waiting",
    title: "4.2 With her mentor",
    noticeId: FAY,
    build: () => reading(ready(FAY)),
    mentor: (id) => review(id, "bid", "pending", { ask: ASK }),
    search: { tab: "pkg-proposal" },
  },
  {
    id: "tp-mentor-late",
    title: "4.5 Too close to the deadline",
    noticeId: FAY,
    build: () => reading(ready(FAY, started({ [DEMO.dueTomorrow]: true }))),
  },
  // ── Part 5. Ready to send ──
  {
    id: "tp-mentor-done",
    title: "5.1 Her mentor is done",
    noticeId: FAY,
    build: () => mentorEdits(reading(ready(FAY))),
    mentor: (id) =>
      review(id, "bid", "responded", {
        ask: ASK,
        note: "I read your whole bid. I made two sentences in your staffing plan stronger. They are marked with my name. It is ready to send.",
      }),
  },
  {
    id: "tp-holes-download",
    title: "5.2 Ready to download, with a hole",
    noticeId: FAY,
    build: () => reading(ready(FAY, started(), leaving(["ask:ask-food-safety"]))),
  },
  {
    id: "send-upload",
    title: "5.3 Upload on the buyer's portal",
    noticeId: FAY,
    build: () => downloaded(reading(ready(FAY))),
  },
  {
    id: "send-email",
    title: "5.4 Email to the buyer",
    noticeId: MAC,
    build: () => downloaded(reading(ready(MAC))),
  },
  {
    id: "send-paper",
    title: "5.5 A sealed paper bid",
    noticeId: CUM,
    build: () => downloaded(reading(ready(CUM))),
  },
  {
    id: "send-reply",
    title: "5.7 A reply, not a bid",
    noticeId: FBR,
    build: () => downloaded(reading(ready(FBR))),
  },
  {
    id: "reply-simple",
    title: "5.8 The simpler reply",
    noticeId: FBR,
    build: () => started({ [REPLY_SIMPLE_KEY]: true }),
  },
  // ── Part 6. Every kind of file and price ──
  {
    id: "excel",
    title: "6.1 The price sheet, as Excel",
    noticeId: FAY,
    build: () => downloaded(reading(ready(FAY))),
    search: { tab: "pkg-price" },
  },
  {
    id: "pdfform",
    title: "6.2 A form, filled in",
    noticeId: FAY,
    build: () => play(FAY, started(), at("ask:ask-ref-contacts")),
  },
  {
    id: "certs",
    title: "6.3 Certificates",
    noticeId: FAY,
    build: () => reading(ready(FAY)),
    search: { tab: "pkg-certificates" },
  },
  {
    id: "staffing",
    title: "6.5 Her staffing plan",
    noticeId: FAY,
    build: () => play(FAY, started(), at("staffing")),
  },
  {
    id: "price-approve",
    title: "6.6 Ava built the price",
    noticeId: FAY,
    build: () => play(FAY, started(), at("price")),
    search: { dlg: "price" },
  },
  {
    id: "decision",
    title: "6.7 Ava's decision",
    noticeId: FAY,
    build: () => play(FAY, started(), at("decision:sec-operations:dec-ops-badge")),
  },
  {
    id: "price-yourself",
    title: "6.8 Price it yourself",
    noticeId: FAY,
    build: () => play(FAY, started({ [PRICE_YOURSELF_KEY]: true }), at("ask:ask-your-prices")),
  },
  {
    id: "price-rates",
    title: "6.9 A price list with no quantities",
    noticeId: FAY,
    build: () => play(FAY, started({ [DEMO.rates]: true }), at("price")),
  },
  {
    id: "price-periods",
    title: "6.10 A base year and option periods",
    noticeId: MAC,
    build: () => play(MAC, started(), at("price")),
  },
  {
    id: "price-none",
    title: "6.11 A bid with no price",
    noticeId: FAY,
    build: () => reading(ready(FAY, started({ [DEMO.noPrice]: true }))),
  },
  // ── Part 7. Getting the buyer's files ──
  {
    id: "files-needed",
    title: "7.1 Ava needs the buyer's files",
    noticeId: "CCSC-2026-22",
    build: () => started(),
  },
  {
    id: "no-main",
    title: "7.2 No main document",
    noticeId: FAY,
    build: () => started({ [DEMO.noMain]: true }),
  },
  {
    // A scan is read, never a stop (PRD TD-03, PC-1, 7 October 2026): Ava
    // asks her to confirm the due date and the price lines first.
    id: "unreadable",
    title: "7.3 The main file is a scan",
    noticeId: FAY,
    build: () =>
      play(FAY, started({ [DEMO.scan]: true }), (f) => f.current?.key === "ask:ask-scan-due"),
  },
  {
    id: "notice-text",
    title: "7.4 The notice text is the source",
    noticeId: FBR,
    build: () => reading(ready(FBR)),
  },
  {
    id: "no-files",
    title: "7.5 No files and no notice text",
    noticeId: FBR,
    build: () => started({ [DEMO.noFiles]: true }),
  },
  // ── Part 8. When something stops or changes ──
  {
    id: "nobid",
    title: "8.1 Grant said No Bid",
    noticeId: "SP4701-26-R-0078",
    build: () => emptyState(),
  },
  {
    id: "critical",
    title: "8.2 Something that would get the bid rejected",
    noticeId: FAY,
    build: () => reading(ready(FAY, started(), leaving(["ask:ask-insurance"]))),
  },
  {
    // Built on a finding that is not a rule the city rejects a bid for: the
    // writing and the price give different hours. An unread addendum, a short
    // deposit or a wage under the floor can never go ahead at risk (PRD R11).
    id: "atrisk",
    title: "8.3 Going ahead at risk",
    noticeId: FAY,
    build: () =>
      reading(ready(FAY, started({ [DEMO.staffingDrift]: true }), leaving(["fix:staffing-price"]))),
    search: { dlg: "risk" },
  },
  {
    id: "addendum-upload",
    title: "8.3b An addendum she added, not compared yet",
    noticeId: FAY,
    build: () => ({
      ...reading(ready(FAY)),
      addendumUploads: [{ fileName: "Addendum_3.pdf", at: nowIso() }],
    }),
  },
  {
    id: "deposit-short",
    title: "8.2b A bid deposit under 5%",
    noticeId: CUM,
    build: () =>
      reading(
        ready(CUM, started(), (q, s, bid) => {
          if (q.key === "ask:ask-bid-bond") {
            const opt = bid.asks
              .find((a) => a.id === "ask-bid-bond")
              ?.dontHave?.find((o) => o.opensAskId === "ask-cert-check");
            return opt
              ? {
                  ...s,
                  answers: {
                    ...s.answers,
                    "ask-bid-bond": { status: "dont-have", at: nowIso(), optionId: opt.id },
                  },
                  trail: [...s.trail, q.key],
                }
              : null;
          }
          if (q.key === "ask:ask-cert-check")
            return {
              ...s,
              answers: {
                ...s.answers,
                "ask-cert-check": { status: "done", at: nowIso(), values: { "check-amount": 100 } },
              },
              trail: [...s.trail, q.key],
            };
          return null;
        }),
      ),
  },
  {
    id: "check-failed",
    title: "D39 Ava could not finish checking",
    noticeId: FAY,
    build: () => {
      const s = ready(FAY, started({ [DEMO.checkFails]: true }));
      return reading({ ...s, check: { ...s.check!, failed: true } });
    },
  },
  {
    id: "stale",
    title: "5.1b Her mentor changed it after she downloaded",
    noticeId: FAY,
    build: () => mentorEdits(downloaded(reading(ready(FAY)))),
    mentor: (id) => review(id, "bid", "responded", { note: "Two changes in part 3." }),
  },
  {
    id: "addendum",
    title: "8.4 An addendum arrived",
    noticeId: FAY,
    build: () => ({ ...reading(ready(FAY)), addendaReceived: ["add-2"], addendaSeen: {} }),
  },
  {
    id: "reopened",
    title: "8.6 Her registration ends before the award",
    noticeId: MAC,
    build: () => reading(ready(MAC, started({ [DEMO.samEnds]: true }))),
  },
  {
    id: "deadline",
    title: "8.7 The deadline passed",
    noticeId: FAY,
    build: () => reading(ready(FAY, started({ [DEMO.duePassed]: true }))),
  },
  {
    id: "walked",
    title: "8.8 She walked away",
    noticeId: FAY,
    build: () => ({ ...reading(ready(FAY)), walkedAway: true }),
  },
];

/** Apply a case: her state, and the mentor's review as the dashboard left it.
 *  Returns the search params the screen needs. */
export function applyCase(caseId: string): Record<string, string> | null {
  const c = CASES.find((x) => x.id === caseId);
  if (!c) return null;
  avaDemo.load(c.noticeId, c.build());
  demoMentor.clear(c.noticeId);
  const r = c.mentor?.(c.noticeId);
  if (r) demoMentor.set(r);
  bus.publish("ava");
  return c.search ?? null;
}
