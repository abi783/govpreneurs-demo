// One order. Five questions, in the order she actually asks them, verdict first.
//
//   1 may I bid it      · verdict from the acquisition pair AND the drawings flag
//   2 what to charge    · Hunter turns price history into one instruction
//   3 what it says      · the record facts, each with an explainer
//   4 can I get it      · the sourcing panel — the guard against the one mistake
//                         she cannot undo
//   5 what do I send    · two numbers, and what happens next
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  RotateCw,
  Bookmark,
  BookmarkCheck,
  Send,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { paperHref, paperSize } from "../lib/microPurchases/paperHref";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import { AgentAvatar } from "../components/Companion/AgentAvatar";
import { Figure } from "../components/MicroPurchases/Figure";
import { AwardHistory } from "../components/MicroPurchases/AwardHistory";
import { plainTitle } from "../components/MicroPurchases/OrderCard";
import { SourcingPanel } from "../components/MicroPurchases/SourcingPanel";
import { SendToDla } from "../components/MicroPurchases/SendToDla";
import { type MicroOrder } from "../lib/microPurchases/order";
import { loadFeed, useSmallOrdersFeed, type BoardFeed } from "../lib/microPurchases/feed";
import {
  fetchAcquisitionCodes,
  fetchSmallOrder,
  type AcquisitionCodeMeaning,
  type SmallOrderResult,
} from "../lib/microPurchases/api";
import { hydrateMicroState } from "../lib/state/microPurchases";
import {
  bidCell,
  codesKnown,
  gapNote,
  mayBid,
  restrictionOf,
  setAsideNote,
  openVerdict,
  SKIP_THIS_ONE,
} from "../lib/microPurchases/relevance";
import { ORDER_MENTOR_SENT } from "../components/MicroPurchases/SendOrderToMentorModal";
import { OrderMentor, OrderMentorNotice } from "../components/MicroPurchases/OrderMentor";
import { useOrderMentorSent } from "../lib/microPurchases/mentorSent";
import {
  corpusNow,
  fullDate,
  orderValue,
  priceAdvice,
  pricePoint,
  usd,
} from "../lib/microPurchases/pricing";
import { quantityLine, quantityParts, unitWarning, unitsTotal } from "../lib/microPurchases/units";
import { getMicroState, setCashCeiling } from "../lib/state/microPurchases";
import {
  loadSavedOrders,
  toggleSavedOrder,
  useSavedOrderIds,
} from "../lib/microPurchases/savedOrders";
import { useLiveSlice } from "../lib/eventBus";

export const Route = createFileRoute("/small-orders/$orderId")({
  component: OrderPage,
});

function OrderPage() {
  usePageMeta({});
  const navigate = useNavigate();
  const { orderId } = Route.useParams();
  // Subscribed, not just read: she can land here directly on a shared link,
  // before the corpus has arrived. Without the subscription the page would
  // settle on "That order is not here any more." and never re-render when it
  // does arrive — a designed sentence rendered as a lie.
  const feed = useSmallOrdersFeed();
  // AND THE BOARD IS ONE PAGE NOW (DH-30). The subscription above fixed the
  // wait; it cannot fix a board that holds fifty rows of a corpus of thousands.
  // An order she bookmarked, or was sent, is missing from that page and is
  // perfectly alive, so the page asks the record route about it.
  const single = useSingleOrder(orderId, askRecordRoute(orderId, feed));
  const lookup = lookupOrder(orderId, feed, single);
  useEffect(() => {
    void loadFeed();
    void hydrateMicroState();
    void loadSavedOrders();
  }, []);
  // useSyncExternalStore, not a hand-rolled listener plus a counter. Reading
  // getMicroState() during render and re-rendering from an effect is the React
  // 18/19 tearing hazard this hook closes, and it is the pattern the board and
  // the wins route already use.
  const ms = useLiveSlice("microPurchases", getMicroState);
  // Above every bail-out, like the other hooks here. The saved list is the
  // workspace's, so the Save button reads it live.
  const savedIds = useSavedOrderIds();
  // HOISTED ABOVE THE EARLY RETURN, and porting this surface is what made it
  // matter. `useState` sat below the `if (!o)` bail-out, which react-hooks
  // flagged in the prototype too — but there it could not actually fire: the
  // corpus was a module, so `o` was resolved on the first render and never
  // changed. Here it is a REQUEST. `o` is undefined until the feed lands and
  // defined after, so the component really does render the bail-out first and
  // the full page second — a different number of hooks each time, which is the
  // crash this rule exists to prevent.
  // Read from the real Mentors list, so "Sent" survives leaving the page.
  const mentorSent = useOrderMentorSent(orderId);

  // HOISTED FOR THE SAME REASON, and it is the same mistake the note above
  // records. These three sat below the `if (lookup.state !== "found")` bail-out,
  // so the component ran three fewer hooks on the render before the order
  // arrived and three more after — the crash that rule exists to prevent. The
  // commit gate caught it; the note above did not, because a note is not a
  // check.
  //
  // The fetch needs nothing from the order, so hoisting costs nothing. The
  // LOOKUP does, and it reads `lookup.order` rather than `o` — `o` is only
  // bound after the bail-out, and a hook may not wait for it.
  const [codeTable, setCodeTable] = useState<AcquisitionCodeMeaning[] | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    void fetchAcquisitionCodes(abort.signal).then((t) => {
      if (!abort.signal.aborted) setCodeTable(t);
    });
    return () => abort.abort();
  }, []);
  /**
   * The regulation's own words for this order's codes, once they arrive.
   *
   * SEPARATE FROM THE VERDICT, deliberately. `mayBid()` already ruled and its
   * answer is at the top of the page; this is the text a member checks that
   * ruling AGAINST. It is empty until the table lands, and the page is complete
   * without it.
   */
  const orderForCodes = lookup.state === "found" ? lookup.order : null;
  const codeMeanings = useMemo(() => {
    if (codeTable == null || orderForCodes == null) return [];
    const wanted: { kind: "amc" | "amsc"; code: string | null }[] = [
      { kind: "amc", code: orderForCodes.amc },
      { kind: "amsc", code: orderForCodes.amsc },
    ];
    return wanted
      .map(({ kind, code }) =>
        code == null
          ? null
          : (codeTable.find((e) => e.kind === kind && e.code === code.trim().toUpperCase()) ??
            null),
      )
      .filter((e): e is AcquisitionCodeMeaning => e != null);
  }, [codeTable, orderForCodes]);

  // THERE IS NO PAGE HERE UNTIL SOMETHING RESOLVES THE ORDER. The three ways
  // that has not happened are three different sentences, and `lookup` carries
  // which one — see `MissingOrder`.
  if (lookup.state !== "found") {
    return (
      <div className="mp-page">
        <BackLink label="Small orders" onClick={() => navigate({ to: "/small-orders" } as never)} />
        <MissingOrder miss={lookup.state} />
      </div>
    );
  }

  const o = lookup.order;
  // THE DAY THIS PAGE JUDGES THE ORDER ON, taken off the feed the order came
  // with. Every fact about the order — when it closes, how old the last award
  // is, what it is worth — is measured against it, so the page cannot state one
  // fact on the served day and the next on another. It rides on the lookup, so
  // an order the record route served is judged on the SAME day as one off the
  // board — there is no second clock for a bookmarked order (DH-30). Records
  // SHE wrote read the real day instead; see src/lib/microPurchases/wallClock.ts.
  const now = corpusNow(lookup.asOf);
  const advice = priceAdvice(o, now);
  const value = orderValue(o, now);
  const restriction = restrictionOf(o);
  // WHICH OF OUR TWO GAPS STOPPED US RULING ON THIS ONE, or `null`. It is the
  // note under the verdict, and it is also what decides where the back control
  // goes: `relevance.ts` builds the board's rows with the same test.
  const gap = gapNote(o);
  const onBoard = mayBid(o) || gap != null;
  // We KNOW she cannot win this one. Not the same as "codes unreadable", where
  // the verdict says so honestly and the rest of the page stays useful.
  const cannotBid = codesKnown(o) && !mayBid(o);
  const paperUrl = paperHref(o);
  const paperKb = paperSize(o.paper?.fileSize ?? null);
  const setAside = setAsideNote(o);
  /**
   * ONE GATE, AND IT HAS TWO TESTS THAT DO NOT AGREE.
   *
   * The strip carried "Eligibility" and "Who may quote" as neighbours, and they
   * read as one question asked twice. They are not: `mayBid` reads DLA's
   * ACQUISITION method (`amc`/`amsc` — may a newcomer supply this part at all),
   * and `setAsideNote` reads the SMALL-BUSINESS set-aside (`setAside` — is it
   * reserved for WOSB, SDVOSB, HUBZone, 8(a)). An order can say "Anyone can
   * quote" beside "Not open to you", and the reverse, and nothing on the strip
   * said which cell was answering which question.
   *
   * So one cell answers "can you bid", and it fails on either test. The
   * acquisition pair is the harder no and is stated first; a set-aside is
   * stated in the words `setAsideNote` already chose, because that reader is
   * the one place this surface decides what a code means.
   */
  // One reader for the cell, so it cannot say yes where Hunter says "not clear".
  const { verdict: bidVerdict, openToHer, hint: bidHint } = bidCell(o);
  const open_ = openVerdict(o);
  /**
   * THE TWO HALVES OF HUNTER'S ANSWER, and the reason they now share a card.
   *
   * They were two stacked cards, each with its own Hunter chip in a different
   * treatment — a 24px bare name on the verdict, a 40px "Hunter's take" on the
   * price. On an order whose codes we cannot read BOTH rendered, so the page
   * showed the same speaker saying "I cannot tell if you can bid this one."
   * and then, in a second card, "I do not know what this one sells for." Two
   * cards, two bylines, one voice, one order.
   *
   * They are NOT the same fact and neither was dropped: may she bid it, and
   * what is it worth. They are one ANSWER, so they take one card and one
   * attribution.
   *
   * THE PRICE HALF HAS NO GATE ANY MORE (owner, 16 September 2026: "display
   * all info regardless of the acquisition code"). It read `!cannotBid`, so an
   * order DLA's codes refuse — and an order whose code carries no ruling —
   * rendered a verdict and no price at all. What DLA pays for a part is the
   * government's record. It is the same for every member, and who may supply
   * the part changes none of it.
   *
   * THE INSTRUCTION INSIDE IT STILL READS THE VERDICT. `advice.headline` is
   * "Quote less than $3,800 for each piece.", which is the page telling her to
   * act. So `priceCondition` below states the condition first, in the shape the
   * certificate refusal already used. Showing a fact is not permission.
   *
   * THE VERDICT HALF KEEPS ITS GATE. On an open order the strip above already
   * states eligibility, and a card repeating the line directly above it is the
   * reader checking whether she missed something.
   */
  const verdictShows = !mayBid(o) || restriction != null;
  const saved = savedIds.includes(o.id);
  const uWarn = unitWarning(o.quantity, o.unitOfIssue);
  /** The count and the caveat about it, kept apart so each renders in its own
   *  slot. See `quantityParts()` for why the joined form is wrong in a cell. */
  const qty = quantityParts(o.quantity, o.unitOfIssue);
  /**
   * The two sentences the count carries, and which one stands down.
   *
   * `unitWarning()` is the pack trap and it OUTRANKS the count note, because on
   * a record with no unit of issue the two state one fact and the warning is
   * the fuller of them — it carries the instruction as well as the absence.
   * On a pack unit they say different things and both render.
   */
  const unitHint = uWarn;
  const countNote = o.unitOfIssue == null ? null : qty.note;
  // WHAT A MENTOR WOULD BE LOOKING AT, in one line, taken from what the page
  // already says rather than written a second time. `advice.headline` is the
  // price instruction where we have one and the honest abstention where we do
  // not — "Quote less than $⁠3,800 for each piece." or "It's a new order! No
  // prior history to estimate a price from." Either is the right thing to put
  // in front of a human, and neither is a claim this snapshot invents (`D-E4`).
  const mentorSnapshot = advice.headline;
  // ONE FACT, TWO REGISTERS. The bar badge has room for a word; the sentence
  // that says where the answer arrives does not fit beside a title and two
  // controls at 390px. So the state lives here and renders as a compact
  // "Sent" in the bar and in full where the control used to be — not two
  // facts, one fact at two sizes, which is what the bar/verdict pair on
  // /opportunities/$noticeId already does.
  //
  // The declaration itself is hoisted above the early return — see the note
  // there. This comment stays with the fact it explains.
  //
  // She has told us she sent a price on this one. Read here for one reason: a
  // heading whose precondition has passed ("Before you quote") is a step she
  // starts hunting for.
  const quoted = ms.quotes.some((q) => q.orderId === o.id);
  // Whether the send block will render at all. Read in two places — the block
  // itself and the jump to it — because a jump to a block that is not there is
  // a dead control, and never a dead chip is a settled invariant.
  const sendable = mayBid(o) && !setAside?.needsCertificate;
  // THE PAGE MAY NOT INSTRUCT HER TO QUOTE AN ORDER IT HAS JUST REFUSED.
  // `sendable` is false on mp-006 because the SDVOSB certificate cannot be
  // self-certified into (13 CFR 128.400) — and the price block, four screens
  // above the send block that correctly stood down, still issued "Quote less
  // than $22.88 for each package." unconditionally. R4-CRIT-4 fixed this shape
  // on SendToDla and named only that component (`D-F5`). Every imperative on
  // this page now reads the same fact: the price instruction states its
  // condition, and the heading that presumes she is about to quote drops the
  // presumption.
  const certRefused = !sendable && setAside?.needsCertificate === true;
  /**
   * THE CONDITION THE PRICE INSTRUCTION DEPENDS ON, or `null` where there is
   * none. The price renders on every order now, and `advice.headline` is an
   * imperative — "Quote less than $22.88 for each package." A page that has
   * just refused her may state what DLA pays and may not tell her to quote it
   * unconditionally, which is the `certRefused` rule widened to the case that
   * made it matter: the acquisition code.
   *
   * ONE SENTENCE PER CAUSE. The certificate is the harder and more specific
   * no, so it is stated first; the code covers both a refusal and a code we
   * hold no ruling for, because in neither does the page know DLA would take
   * her quote.
   */
  const priceCondition = certRefused
    ? "Only if you hold that certificate:"
    : mayBid(o)
      ? null
      : "Only if DLA lets you supply this item:";
  // `repeats` is `boolean | null`, and live DIBBS returns true ~95%, null ~5%
  // and FALSE NEVER (22-order corpus: 11 true, 0 false, 11 null). So
  // `!o.repeats` — the spelling that gated the cash question and captioned the
  // item count — never meant "a settled one-time order". It meant "the order
  // paper did not say", which is the one state neither caption was written for,
  // and the cash question HARVESTS a persisted ceiling off the back of it that
  // then ranks every board she sees (`withinCash`, +40 in `relevanceScore`).
  // Four surfaces already carry the three-state read — priceAdvice(),
  // OrderCard, winValueText(), the wins figure — and these two were the fifth
  // and sixth, the only ones that WRITE (`D-B8`, `D-A7`, `D-F5`). Nothing in
  // this file tests `o.repeats` for truthiness any more: `=== true`,
  // `=== false`, else. One exported `isSettledOneTimeOrder()` in pricing.ts
  // would close all six at once and is escalated rather than reached across.
  // The cash question's own gate, named once and read twice — by the block and
  // by the attribution below, so the sentence claiming the figure cannot drift
  // from the figure. Withheld on `repeats === true`: DLA says the quantity on
  // an AIDC "may not be purchased", so a ceiling harvested from it is neither a
  // floor nor a ceiling (D-A2, D-A5).
  const cashRelevant = value != null && o.repeats !== true;
  const cashAnswered = ms.cashCeiling != null || ms.cashUnsure;
  const cashAsked = cashRelevant && !cashAnswered;
  // Attribution names what is ON THE PAGE, clause by clause. The money and the
  // item count are computed figures rendering OUTSIDE the page's one amber
  // surface, and this sentence used to scope itself to the verdict and the
  // name — an attribution that positively excluded the derived numbers beneath
  // it (`D-E5`). Each clause stays conditional on its own fact being on screen,
  // because an attribution that cannot be false is not attribution, and that
  // cuts both ways.
  // `uWarn != null && items != null` was the third clause here, and it named the
  // item-total Figure inside the unit warning box. That box is gone from the
  // card, so the clause described a number that is no longer on the page — an
  // attribution claiming a figure that does not render, which is `D-E5` in the
  // direction the note above warns about. The cash question is the only
  // computed number left below the amber surface.
  const numbersBelow = cashAsked;
  // What KIND of work each clause is. A lookup, never a second gate: `mine`
  // decides which rows exist, this only labels them.
  // `{ [k: string]: string }`, not `Record<string, string>`, and the reason is
  // the copy gate rather than taste. It reads JSX text as everything between a
  // `>` and a `<` with no brace in between, so a `Record<` opening right after a
  // run of arrow functions made forty lines of this component's setup look like
  // one 58-word sentence. An index signature opens with a brace and ends the run.
  const NOTE_FOR: { [k: string]: [string, string] } = {
    "Who may sell this one": ["Who may sell", "Hunter\u2019s reading of the code"],
    "the plain name": ["Plain name", "Hunter\u2019s wording"],
    "the numbers below": ["The numbers below", "Hunter\u2019s working"],
  };
  const mine = [
    "Who may sell this one",
    o.plainName === o.officialName ? null : "the plain name",
    numbersBelow ? "the numbers below" : null,
  ].filter((c): c is string => c != null);
  // `attribution` is gone with the prose sentence it built. What it said —
  // which lines on this page are Hunter's — is now the "Hunter notes" card in
  // the sidebar, where it is two labelled rows instead of one sentence inside a
  // card about eligibility. `mine` survives because that card is still gated on
  // it: an attribution that cannot be false is not attribution.

  return (
    <div className="mp-page mp-detail">
      {/* THE STICKY ACTION BAR IS GONE FROM THIS PAGE (31 Aug 2026), and what
          it was solving is not.
          It arrived on 24 August because three actions lived in three places —
          a bare back link at the top, Save about 3,800px down, and the mentor
          control inline in the middle of the flow — so none of them was
          reachable without scrolling. That was a real defect and the bar fixed
          it by pinning all three.
          The header now holds all three at the top of the page instead, which
          is the same fix without a strip of chrome riding over every screen of
          a 3,700px read. What is genuinely lost is reach-on-scroll: at the foot
          of the page the actions are a scroll away again. Named here rather
          than quietly dropped — if that turns out to matter, the answer is a bar
          that appears once the header leaves the viewport, not a bar that is
          always there. */}
      <header className="mp-detail__head">
        {/* WHERE SHE CAME FROM IS DERIVED, not remembered. No search param, no
            state to keep in step: the order itself says which list it belongs
            to. `onBoard` is the same test `queryOrders()` builds its rows with
            — she may bid it, or we could not rule on it — and the restricted
            page holds exactly the rest.
            IT USED TO READ `mayBid` ALONE, and DH-34 made that wrong rather
            than leaving it wrong: an order we could not rule on is on the main
            list now, so `mayBid` false sent her back to "Ones not open to you"
            from a row she had just tapped on the board. A back control that
            lands somewhere she has never been is the dead end `D-D2` names. */}
        <BackLink
          label={onBoard ? "Small orders" : "Ones not open to you"}
          onClick={() =>
            navigate({
              to: onBoard ? "/small-orders" : "/small-orders/restricted",
            } as never)
          }
        />

        {/* WHAT IT IS, AND THE TWO THINGS SHE CAN DO ABOUT IT, on one line.
            The actions sit level with the name rather than under the whole
            header block: they act on the ORDER, and the order is the h1. */}
        <div className="mp-detail__top">
          <div className="mp-detail__id">
            {/* Sentence case, like the board and the restricted list.
                `plainName` is DLA's nomenclature verbatim when Hunter has no
                rewrite for it, so it arrives SHOUTING: the same record read
                "Manifold assembly" on the card and "MANIFOLD ASSEMBLY" as an h1
                one tap later. The helper was written for the board and not
                swept to the page the board opens (`D-F5`). The official name
                still renders in full below. */}
            <h1 className="t-display-lg">{plainTitle(o.plainName)}</h1>
            <p className="t-body-sm">{o.buyer} is buying.</p>
            {/* The official name lives HERE, where the expensive mistake is
                made — not on every card, where it buys nothing at the
                open-or-skip decision. */}
            <p className="mp-detail__official">On the order paper: {o.officialName}</p>
          </div>

          <div className="mp-detail__acts">
            {/* TWO RULES TRAVELLED WITH THIS CONTROL and neither is relaxed by
                moving it out of the bar.
                1. NOT ON A REFUSED ORDER. `!cannotBid` — a page that has just
                   told her she may not bid this one must not then offer to keep
                   it; that is the page arguing with its own verdict.
                2. NOT UN-SAVEABLE ONCE QUOTED. On an order she has quoted the
                   control is REPLACED by the reason rather than offered,
                   because saving is the only route back to a sent
                   quote once the order leaves the live board — un-saving it
                   strands the quote and the record that depends on it
                   (pattern 11, `D-C1`/`D-D3`). */}
            {cannotBid ? null : quoted ? (
              <span className="mp-detail__kept">
                {/* The REASON, not just the state. Pattern 11 replaces a
                    control with a sentence naming why, and "Kept" alone is a
                    status word that leaves her to work it out. */}
                <BookmarkCheck size={14} aria-hidden /> Kept. You sent a price.
              </span>
            ) : (
              <button
                type="button"
                className={`btn btn-sm ${saved ? "btn-secondary" : "btn-ghost"} detail-actions__icon`}
                onClick={() => void toggleSavedOrder(o.id)}
                aria-pressed={saved}
              >
                {saved ? (
                  <BookmarkCheck size={14} aria-hidden />
                ) : (
                  <Bookmark size={14} aria-hidden />
                )}
                {saved ? "Saved" : "Save"}
              </button>
            )}
            <AskMentor order={o} whatSheIsSending={mentorSnapshot} sent={mentorSent} />
          </div>
        </div>

        {/* THE FOUR FACTS THAT DECIDE WHETHER SHE READS ON, in one strip.
            All four already render on this page — the verdict states
            eligibility, the set-aside block states who may quote, the contract
            block states the year, and the acquisition code sits inside the
            verdict's evidence line. What they did not have was a place to be
            read TOGETHER, above the fold, before three thousand pixels of
            detail. Each cell is the same fact as its section below, taken from
            the same reader, so neither can drift from the other.
            `dl`, not a row of divs: these are term-and-definition pairs and a
            screen reader gets that for free.
            The values never wrap — a compact label cut to fit is the wrong
            label — so the strip drops to two columns and then one rather than
            squeezing "1 year · AIDC" onto two lines. */}
        <dl className="mp-keyfacts">
          <div className="mp-keyfacts__cell">
            <dt>Can you bid this one?</dt>
            <dd className={openToHer ? "is-yes" : ""}>
              {openToHer ? <Check size={14} aria-hidden /> : null}
              {bidVerdict}
              {/* The raw pair, riding inside the value the way AIDC does on the
                  contract row. It was a cell of its own — a quarter of the
                  strip spent on two characters no newcomer can read. It is the
                  EVIDENCE for the verdict beside it, so it sits with it. */}
              {(o.amc != null || o.amsc != null) && (
                <span className="mp-keyfacts__term mono">{`${o.amc ?? ""}${o.amsc ?? ""}`}</span>
              )}
            </dd>
            {bidHint ? <p className="mp-keyfacts__hint">{bidHint}</p> : null}
          </div>
          {/* THE THREE FACTS THAT DECIDE WHETHER SHE READS ON, promoted out of
              the record below rather than copied from it. Each was two-thirds
              of the way down a seven-cell grid, under the one field this page
              can never fill.
              How many is first because unit of issue is the most expensive
              mistake on this surface: a price meant per item, quoted against a
              box of 100, wins at one hundredth of what she meant. */}
          <div className="mp-keyfacts__cell">
            <dt>How many</dt>
            {/* THE COUNT IS THE VALUE. THE CAVEAT IS NOT. This rendered
                `quantityLine()`, which joins both with an em dash, so an order
                with no unit of issue printed "223 — the order paper does not
                say how these are counted." in the same bold as "300 pieces" —
                a two-line paragraph under a label reading HOW MANY, on the one
                cell a member scans for a number. `quantityParts()` splits them
                and each half goes where it belongs. The words are still owned
                by `units.ts`; only the slot changed. */}
            <dd>{qty.value}</dd>
            {/* UP TO THREE NOTES, AND THEY SAY DIFFERENT THINGS. `unitWarning()`
                is the trap — "One box holds 100 items. Your price is for the
                whole box." — and it is the reason this cell is first in the
                strip: a price meant per item, quoted against a box of 100, wins
                at one hundredth of what she meant. `qty.note` is the
                arithmetic, and the AIDC line is what the estimate does not
                promise. Joined rather than one chosen, because dropping any of
                them loses a fact.
                THE COUNT NOTE STANDS DOWN WHERE THE WARNING ALREADY SAYS IT.
                With no unit of issue both read "the order paper does not say
                how these are counted", and `unitWarning()`'s version is the
                fuller one — it carries the instruction as well. Printing both
                is how this cell would repeat itself the way the card just
                did. */}
            {unitHint != null || countNote != null || o.repeats === true ? (
              <p className="mp-keyfacts__hint">
                {[unitHint, countNote, o.repeats === true ? "DLA may buy fewer, or none." : null]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            ) : null}
          </div>
          <div className="mp-keyfacts__cell">
            <dt>Deliver within</dt>
            <dd>{o.deliveryDays == null ? "Not stated" : `${o.deliveryDays} days`}</dd>
            {/* The mechanism, in one line rather than two. It said "DLA compares
                your price and your delivery days together. A faster date can
                beat a lower price." — the second sentence is the first one's
                consequence, and the consequence is the part she can act on. */}
            <p className="mp-keyfacts__hint">A faster date can beat a lower price.</p>
          </div>
          <div className="mp-keyfacts__cell">
            <dt>{o.fastAward === false ? "Closes" : "Listed closing date"}</dt>
            <dd>{o.closesOn == null ? "No date given" : fullDate(o.closesOn)}</dd>
            {/* `fastAward` is TRI-STATE and null is not false: DLA has not run
                its automatic evaluation, which is not the same as ruling it out.
                Trimmed, not dropped — the unknown still has to say it is one. */}
            <p className="mp-keyfacts__hint">
              {o.closesOn == null
                ? "Treat it as urgent."
                : o.fastAward === true
                  ? "DLA can buy at any time."
                  : o.fastAward === false
                    ? "This is the deadline."
                    : "DLA sometimes buys before this date."}
            </p>
          </div>
        </dl>
      </header>

      {/* ── 1 · Can you bid it ─────────────────────────────────────────── */}
      {/* Computed from the acquisition pair AND the drawings flag together. A
          part can be open to all bidders and still have drawings behind a
          certification; saying "you can bid this" and then "you need approval
          for the drawings" is a straight contradiction. */}
      {/* AMENDMENTS. DLA amends solicitations, and quoting a superseded version
          is a documented way to have a quote rejected. She can read an order on
          Monday and quote it on Thursday without ever knowing it changed —
          nothing in DIBBS tells her, and nothing here did either until now. */}
      {o.amendedOn && (
        <section className="mp-amend">
          <AlertTriangle size={16} aria-hidden />
          <span className="mp-amend__text">
            <b>DLA changed this order on {fullDate(o.amendedOn)}.</b>
            <em>
              Read it again before you send a price. A price against the old version can be thrown
              out.
            </em>
          </span>
          {/* No "Version" chip. `version` is the source's `source_id_version`
              and it holds the SOLICITATION number on all 19 corpus records
              (re-derived 19 Aug 2026: 19 of 19 identical), so the chip printed
              "Version SPE-…" in the warning banner while the facts list below
              printed the same string as "Order number" — two labels, one
              value, in the one banner whose whole job is telling her which
              version she is looking at. No real version token exists in the
              record, so the date carries the warning and we claim nothing. */}
        </section>
      )}

      {/* VERDICT FIRST — always-on pattern 1, and it was inverted here. The
          set-aside block used to render ABOVE this one, so on an order whose
          codes we cannot read she met a reassuring "there is no certificate to
          get" and only then the sentence saying we do not know. Evidence sits
          UNDER the verdict it supports. The amendment banner above is the one
          legitimate exception: it changes whether the whole page is current. */}
      {/* THE VERDICT CARD IS NOW THE REFUSAL CARD, and only that.
          Its open branch said "You can bid this one." / "DLA lets anyone quote
          this part." / "Acquisition code · 1Z" — three facts the strip directly
          above now states as ELIGIBILITY, WHO MAY QUOTE and ACQUISITION CODE, in
          that order, forty pixels higher. A card whose whole content is the line
          above it is not reassurance; it is the reader checking whether she
          missed something.
          It survives untouched where it is the only thing that can carry the
          answer: an order she may NOT bid, and an order whose codes we cannot
          read. On both of those the page IS the verdict — no strip cell can hold
          "We think the government does not own the drawings. If that is right,
          it cannot add new sellers." — and the branches, the headline, the term
          line and the Hunter chip are all still here, in source order, for the
          assertions that read this section's shape. */}
      <section className="ai-surface mp-verdict">
        {/* ONE ATTRIBUTION, AT THE TOP, IN THE STRONGER OF THE TWO SHAPES.
            The verdict carried a 24px chip reading "Hunter" at the FOOT of
            its card and the price block carried a 40px "Hunter's take" with
            an evidence line at the HEAD of its own. Same primitive, same
            page, two sizes and two positions — and the note beside the small
            one already recorded that it was the weaker rendering and that no
            surface should have to choose. It does not have to now.
            THE CARD IS AMBER, WHICH SETTLES AN OLDER COMPLAINT. The rule is
            that amber marks the machine-written claim. The verdict is
            machine-written and sat in neutral chrome while the amber sat on
            the block beside it, so a reader learned the tint marked the
            price rather than the computed claim. One card, one tint, and it
            is on everything Hunter says.
            THE EVIDENCE LINE NAMES ONLY WHAT IS ON THE PAGE. Past awards are
            evidence for a price, and a refused order renders no price, so
            claiming them there would be an attribution for something that is
            not there — the exact `D-E5` the old chip's own note guarded
            against. */}
        <div className="ai-attr">
          <AgentAvatar agent="hunter" size={40} />
          <span className="mp-price__by">
            <b>Hunter&rsquo;s take</b>
            {/* IT NAMES WHAT IS ON THE PAGE, and the price is on every page
                  now. The second arm read "Based on the order paper" for the
                  orders that rendered no price; there are none. */}
            <em>Based on the order paper and past DLA awards</em>
          </span>
        </div>
        {verdictShows && (
          <>
            {!mayBid(o) && restriction == null ? (
              // Codes unreadable. We do not know whether she may bid, and saying
              // either thing would be a confident guess on the one question that
              // matters most. Say what we do not know.
              //
              // The body used to read "DLA has not said who may quote it" — a
              // confident claim about a third party over a field WE do not hold.
              // Live coverage of amc/amsc is 100% (corpus header), so this branch
              // fires when our join or ingest dropped the code, never because DLA
              // withheld it: in production that sentence would be false essentially
              // every time it rendered. The board already had the honest wording for
              // the identical condition — heldBack() renders "N I could not read".
              // Same condition, same fact, and now the same owner of the gap.
              //
              // THE SET-ASIDE IS FOLDED IN HERE, exactly as openVerdict() folds it
              // into the branch below. It used to render as its own block ~60px
              // beneath this one, so on mp-005 the page said "I could not read who
              // may quote it." and then, in one glance at 390px, "DLA is keeping
              // this one for small companies." — the same question with two
              // opposite answers, the abstaining one on top. The fix landed on the
              // `open_` branch and was not swept to the honest-unknown branch,
              // which the corpus puts at 15.7% of live orders (`D-E4`, `D-F5`).
              // We name what we DO hold (the set-aside, and the certificate where
              // one is required — dropping that would be the silent
              // disqualification `D-C3` names) and then name precisely what we
              // could not read, which is the acquisition code, not the question.
              <>
                <p className="mp-verdict__head">
                  <AlertTriangle size={18} aria-hidden className="mp-ic-warn" />
                  Not clear if you can bid this one.
                </p>
                <p className="mp-verdict__body">
                  {[
                    setAside?.headline,
                    setAside?.needsCertificate ? setAside.body : null,
                    "No acquisition code available at source. That code says who may supply the item.",
                    "Read the order paper before you spend time on it.",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                {setAside && <p className="mp-verdict__term">Set-aside · {o.setAside}</p>}
              </>
            ) : !mayBid(o) ? (
              <>
                <p className="mp-verdict__head">
                  <AlertTriangle size={18} aria-hidden className="mp-ic-warn" />
                  {restriction?.headline}
                </p>
                <p className="mp-verdict__body">{restriction?.body}</p>
                <p className="mp-verdict__term">{restriction?.code}</p>
              </>
            ) : (
              // EVERY disqualifier folds through ONE verdict function. This branch
              // used to test `o.needsDrawings` alone, so a set-aside order printed a
              // green "You can bid this one. DLA lets anyone quote this part." with
              // the certificate she cannot obtain sitting in quieter grey beneath
              // it. On mp-006 (SDVOSBC) that sentence is false as a matter of law
              // under FAR 19.14, and set-asides are half of live DIBBS orders.
              // The drawings case was fixed here and set-aside was not swept
              // (`D-C3`, `D-F5`); openVerdict() now owns both, so a new
              // disqualifier is added in one place rather than three.
              <>
                <p className="mp-verdict__head">
                  {open_?.conditional ? (
                    <AlertTriangle size={18} aria-hidden className="mp-ic-warn" />
                  ) : (
                    <Check size={18} aria-hidden className="mp-ic-ok" />
                  )}
                  {open_?.headline}
                </p>
                <p className="mp-verdict__body">{open_?.body}</p>
                <p className="mp-verdict__term">{open_?.term}</p>
              </>
            )}

            {/* WHY IT IS ON HER BOARD AT ALL, AND WHY THAT IS NOT PERMISSION.
          The verdict above says what we could not do. This says whose
          shortcoming that is and what it does NOT mean, because the two are
          different questions and she is entitled to both: a missing
          acquisition code is evidence we did not fetch something, never
          evidence DLA refuses her.
          IT MUST NOT BECOME A VERDICT, and the last sentence of every note
          says so in words. `openVerdict()` still returns null on every order
          reaching here, `mayBid()` is still false on every one of them, and
          the send control is still stood down — this paragraph is the only
          thing that changed about what the page CLAIMS.
          It renders INSIDE the verdict card, under the branch it qualifies,
          so the two read as one answer and the Hunter chip below attributes
          both. A block of its own would put a second amber surface under the
          first saying something about the same order (`D-E4`). */}
            <OrderGapNote order={o} />
          </>
        )}
        {/* A RULE, NOT A SECOND CARD. The two halves answer different
            questions — may she bid it, and what is it worth — so the eye
            needs a break between them. It is not a second heading and not
            a second byline: one speaker, one answer. It renders only when
            both halves are on the page. */}
        {verdictShows && <hr className="mp-verdict__rule" />}
        {/* "READ THIS BEFORE YOU PRICE IT" IS GONE FROM THIS CARD, and
            its sentence is not lost — it moved onto the count it is
            about. The box arrived here when the warning was found
            stranded below the award record, and landing it beside the
            price exposed that it now said the same thing twice: the How
            many cell in the strip above already carries "unit not available
            at source", because `quantityParts()`
            puts that caveat on the number it qualifies.
            ATTACHED BEATS ADJACENT, which is the rule this page already
            applies to the AIDC estimate caveat: there is no reading order
            in which she meets the count without the caveat, and a second
            copy beside the price was a box she could skip.
            THE PACK-UNIT SENTENCE SURVIVES, and it is the one that
            matters — "One box holds 100 items. Your price is for the
            whole box." is the hundred-fold mistake this surface exists to
            prevent, and the count line never said it. The strip's hint
            now carries `unitWarning()` itself. */}
        {/* THE INSTRUCTION CANNOT OUTRUN THE VERDICT. On mp-006 the page
          refuses at the top on a certificate she cannot self-certify
          into, the send block correctly stands down — and this block
          still said "Quote less than $22.88 for each package." with no
          condition on it. One order, one page, two answers to "may I
          quote this?". The price stays (a certified member reads the same
          page) and states the condition it depends on, in her reading
          order: the condition first, then the number it governs. */}
        {priceCondition && <p className="mp-price__body">{priceCondition}</p>}
        <p className="mp-price__head">{advice.headline}</p>
        <p className="mp-price__body">{advice.body}</p>
        {/* NOT A `.src-chip`. This provenance mark is a `<p>` with no role,
          no tabIndex and no handler, and `.src-chip` is the source
          system's TAPPABLE disclosure affordance: it ships `cursor:
          pointer`, a hover state, a focus ring and — under the
          accessibility floor — a 44px touch target on a phone. So the
          most-read block on the order page carried a 44px target that
          lit up under the finger and did nothing, and it was this
          feature's only use of the pattern, teaching the member the
          opposite of what a chip means everywhere else in the app
          (`D-D2`; the system's own note on the neighbouring modifier
          reads "never a dead chip").
          `.mp-verdict__term` is this page's existing STATIC record
          label — mono, 11.5px, quiet — and it already carries
          "Set-aside · SBA · 1B" and "One-year contract · AIDC" three
          blocks up. Reusing it costs no CSS and tells no lie. The design
          system still has no non-interactive provenance primitive
          (`.src-chip--static`); that gap is escalated, since components.css
          is another lane's file. */}
        {"sourceDate" in advice && (
          <p className="mp-verdict__term mp-price__src">DLA award · {advice.sourceDate}</p>
        )}
        {/* THE ROUTE THROUGH THE PAGE. The output of all this is two
          numbers, and the page had nothing joining the price instruction
          to the place she types them — about 2,900px apart at 390px, four
          and a half phone screens. Every block between them earned its
          place, so the fix is not deletion; it is one way through.
          Rendered only where the send block itself renders — a jump to a
          block that stood down is a dead control. */}
        {sendable && (
          <button
            type="button"
            className="mp-linkbtn"
            onClick={() => document.querySelector(".mp-send")?.scrollIntoView({ block: "start" })}
          >
            See what to send DLA
          </button>
        )}
      </section>

      {/* WHERE THE ANSWER GOES. The bar badge has room for one word; this is the
          sentence it stands for, in the place the mentor control used to sit.
          Without it "Sent" is a status word with no because in it — the same
          thing that was wrong with "Kept" on the Save control beside it. */}
      {mentorSent && (
        <p className="mp-deadend">
          <Check size={14} aria-hidden className="mp-ic-ok" /> {ORDER_MENTOR_SENT}
        </p>
      )}

      {/* SET-ASIDE — the disqualification we would otherwise let her walk into.
          DLA reserves some orders for companies holding a particular
          certificate. We do not hold her certifications, so we cannot filter on
          this (PRD 11.3 parks the gate) — but the field is right there in the
          schema, and quoting a set-aside she is not certified for is a
          rejection she never sees coming. Parking the GATE is a scope call.
          Parking the WARNING would be a silent disqualification, which is the
          one thing this feature is not allowed to do.
          Acronym rule: plain sentence first, official term beneath.
          RENDERED UNDER THE VERDICT: it is a reason, not an answer.

          ONLY WHERE THE VERDICT DOES NOT ALREADY CARRY IT. Folding set-aside
          into openVerdict() fixed `D-C3` and left this block behind saying the
          same thing again: on mp-006 the page read "Only service-disabled
          veteran-owned small businesses can bid this one. / You need that
          certificate before you quote. / Set-aside · SDVOSBC · 1G" and then,
          immediately beneath, "DLA is keeping this one for service-disabled
          veteran-owned small businesses. You need that certificate before you
          quote. Check that you have it. Set-aside: SDVOSBC" — one sentence
          verbatim twice and the term twice, an inch apart. That is `D-E4`, and
          it is the class this feature has now shipped four times.
          `openVerdict()` returns null exactly where it does NOT speak — codes
          we cannot read, and orders the codes already refuse.

          AND THOSE ARE THE TWO STATES WHERE IT ARGUES WITH THE PAGE. The gate
          read `open_ == null`, which is `!mayBid(o)` and nothing else, so this
          block rendered ONLY under a refusal or an abstain — never once beside
          a verdict that agreed with it:
          · refused (mp-010) — "Only approved sellers can quote this one." and
            then, 120px below, "There is no certificate to get. Each order has
            its own size limit. You say you are under it when you quote." An
            instruction about what to say WHEN QUOTING, under a page whose whole
            job is to stop her spending a day on an order she cannot win. That
            is R4-CRIT-4 exactly, repaired on SendToDla and not swept here.
          · abstained (mp-005) — "I could not read who may quote it." and then
            "DLA is keeping this one for small companies." One question, two
            opposite answers, both visible in a single glance at 390px, the
            abstaining one on top.
          So the block is gone. The verdict owns the set-aside on every branch
          now: openVerdict() composes it where it speaks, and the unknown branch
          above folds it in where it does not. The certificate warning survives
          both — dropping it would be the silent disqualification `D-C3` names —
          and nothing on this page says the same thing twice any more. */}

      {/* EVERYTHING BELOW IS THE RECORD, AND IT RENDERS ON EVERY ORDER (owner,
          16 September 2026). It was wrapped in `!cannotBid` on the argument
          that help with pricing and sourcing argues with a refusal. Half of
          that was right and it took the wrong half with it: what DLA buys, how
          many, by when, what it paid before, who has supplied it and where the
          order paper is are FACTS about the government's record, and a member
          reads them to decide whether the refusal is worth working around.
          WHAT STAYS BEHIND THE VERDICT IS THE ACTIONS. `sendable` still holds
          the send block down, the Save control still stands down on a refusal,
          and the price instruction states its condition — see `priceCondition`.
          The page states the facts. It never states permission. */}
      {/* A page that ends in "no" needs somewhere to go — and it needs to know
          WHICH somewhere. This rendered on `cannotBid` alone, so an order whose
          code we cannot yet read said "ask your mentor before you spend time on
          this one" and then, directly beneath, "skip this one". Two opposite
          next steps, and neither carried a control (`D-D2`: an instruction with
          no destination is a lie about capability).
          Now the restriction names its own route. `none` is a genuine dead end
          and the honest next step is another order. `unknown` is not a refusal:
          a human who knows this looks first, and the control to reach one is
          right here rather than described. */}
      {/* The sentence lives in the verdict body above — `restrictionOf()` owns
          it, from `mentor.ts`. Repeating it here put the same sentence on screen
          twice an inch apart, which is `D-E4` and the class this feature has now
          shipped three times. What was missing was never the words; it was the
          control. So this block is the control only. */}
      {/* THREE routes reach the mentor now, and each was a dead end.
          · `unknown` — we read the code and cannot rule on it.
          · `sar` — we CAN rule, and the next step is a Source Approval Request.
            The page named the form and then offered nothing to press, so the
            route with a specific next step was the one route with no control
            while the vaguer one got the human. We invent no DLA URL: whether
            she has any realistic path to source approval is a judgement about
            her business, which is the best mentor question on this board.
          · codes we could not READ at all — the sentinel pair. `restrictionOf()`
            returns null there, so both gates below missed it and the page ended
            on "Save this one" under "I cannot tell if you can bid this one":
            the one verdict that admits we do not know was the one with no next
            step. Same condition the verdict's first branch tests. */}
      {/* ONLY where the restriction names no next step at all. This was gated on
          `route !== "unknown"`, which is the wrong fact: it made "skip this one"
          the else-branch of the mentor control rather than the branch of a dead
          end, so the SAR group — the one group that HAS a route — was told to
          skip roughly 40px under "The form is called a Source Approval
          Request." Two opposite instructions, one screen, and the skip won
          because it came last. `route` already holds the three states; the gate
          now reads the one it means. */}
      {cannotBid && restriction?.route === "none" && <p className="mp-deadend">{SKIP_THIS_ONE}</p>}

      {/* THE CONTRACT BLOCK STAYS ABOVE EVERY NUMBER ON THE PAGE.
          The design this is built from puts it in the right column under
          "Your quote". It cannot go there: on an AIDC the quantity is an
          ESTIMATE — DLA's own quote-form caution is "This is an estimated
          quantity and may not be purchased by the IDC" — so the total, the
          per-unit ceiling and the cash question below are all read THROUGH
          this block, and in one column on a phone the sidebar renders after
          all three. The design decisions carry that as a critical
          (D-A5) and no spec in this repo holds it; it is a claim about
          reading order, not about which
          column a card sits in. Escalated rather than moved: if it belongs
          in the sidebar the argument has to beat D-A5, not route around
          it. */}
      <div className="mp-detail__body">
        <div className="mp-detail__main">
          <section className="mp-facts">
            <h2 className="mp-h2">What the order says</h2>
            {/* The house container for a set of facts. `<dl>` because these are
            label/value pairs, which is what the grid was built for. */}
            <dl className="key-info-grid">
              {/* THE ESTIMATE CAVEAT IS ATTACHED TO THE NUMBER IT QUALIFIES.
              D-A5 required the year-contract block to render above every
              figure on the page, because on an AIDC the quantity is an
              estimate — DLA's own quote-form caution is "This is an
              estimated quantity and may not be purchased by the IDC". That
              block is now a sidebar card, which on one column renders after
              the numbers, so the caveat moves onto the fact it is about.
              Attached rather than adjacent is the stronger form: there is no
              reading order in which she meets the count without the caveat,
              which was the most that "above" could ever buy. */}
              {/* WHAT IS LEFT ONCE THE DECIDING FACTS MOVED UP.
                  How many, Deliver within and the closing date are in the
                  strip above the fold — they decide whether she reads on at
                  all, and they were two-thirds of the way down here.

                  THE FREIGHT FACT IS DELETED, not moved — the cell here,
                  and with it the warning that used to sit among the traps
                  below. `fobDestination` has three arms and only the "the
                  order paper does not say" one could ever render. Three
                  facts say so, and they are written down here so the next
                  reader does not re-derive them from the same absent data:
                    · `dibbsDeliveryFob` is NEVER STORED. It is a field that
                      does not exist on the opportunity document, not a
                      field holding `null`. An earlier note said "null on
                      all 16,606 records"; that was an aggregation grouping
                      on a missing field, which Mongo reports as null.
                    · No raw or original payload is retained on the
                      document, so the value cannot be recovered from what
                      we already hold.
                    · `HigherGovOpportunity` in `higher-gov.service.ts`
                      declares six `dibbs_*` fields and no FOB field under
                      any name, so the ingest never sees one either.

                  THE FIELD ITSELF STAYS. `small-orders.mapper.ts` writes
                  `null` and the type stays `boolean | null`, because an
                  absence is never collapsed to `false`. What is gone is the
                  claim about who pays the freight: this pipeline cannot
                  know it, and a page that cannot know a money fact says
                  nothing about it. */}
              {/* A HINT ON EVERY ARM. Only the year arm carried one, so the
                  two arms a member meets more often stated a term with no
                  consequence attached — and "The paper does not say" with
                  nothing under it reads as a page that has given up rather
                  than one that has looked. The unknown arm names the
                  document that settles it, which is the only honest
                  instruction we can give for it. */}
              <Fact
                label="Contract"
                value={
                  o.repeats === true
                    ? "1 year of orders"
                    : o.repeats === false
                      ? "One-time buy"
                      : "The paper does not say"
                }
                hint={
                  o.repeats === true
                    ? "You send one price. DLA can order again all year."
                    : o.repeats === false
                      ? "DLA buys this once. One order, one delivery."
                      : "The order paper says whether DLA can order again."
                }
              />
              <WhoIsBuyingFact buyer={o.buyer} contactName={o.buyerContact.name} />
              <Fact
                label="Order number"
                value={o.solicitation}
                mono
                hint="You will need this on the DLA website."
              />
              {/* THE HINT IS BACK. It was cut on the argument that the
                  label already says "Stock number" and the sourcing panel
                  below is where she uses it. That reads well to somebody
                  who knows what a stock number IS. A newcomer meets a
                  13-digit number under a label naming itself, and the one
                  thing she needs — that this is the government's handle for
                  the part, not ours and not the seller's — was the sentence
                  that got cut. Every other cell in this grid explains
                  itself; this one stopped. */}
              <Fact
                label="Stock number"
                value={o.nsn}
                mono
                hint="The government's number for this item. Every seller quotes against the same number."
              />
              {/* THE ACQUISITION CODE IS BACK, AS EVIDENCE AND NOT AS A
                  SECOND VERDICT. It was a cell here until the fact strip
                  was built, and it left with the reasoning that two
                  characters no newcomer can read did not earn a quarter of
                  that strip. That was an argument about the STRIP. This
                  grid is the record — it is where a member checks what we
                  say against the paper in front of her — and the one code
                  the whole verdict turns on was the one fact the record did
                  not carry.
                  IT DOES NOT RESTATE THE READING. Hunter's card above says
                  what the pair means for her, and saying it again here is
                  the duplication this page has already paid for more than
                  once. The value is the pair exactly as DLA prints it, so
                  she can find it on the order paper; the hint says what
                  kind of thing it is and points at the reading rather than
                  repeating it.
                  THE ABSENT ARM IS NOT "NONE". No code reaching us is a gap
                  on our side, not a fact about the order, and the hint says
                  so in those words — the same claim `ourGap()` makes and
                  the reason these orders are on her board at all. */}
              <Fact
                label="Acquisition code"
                value={
                  o.amc == null && o.amsc == null
                    ? "Not on the record"
                    : `${o.amc ?? ""}${o.amsc ?? ""}`
                }
                mono={o.amc != null || o.amsc != null}
                hint={
                  o.amc == null && o.amsc == null
                    ? "This code says who may supply the part. No acquisition code available at source."
                    : "DLA's code for who may supply the item. Hunter reads it at the top of this page."
                }
              />
            </dl>
            {/* Directly under the facts, because it is the same fact list
                seen at the source. The "Order number" hint two rows up
                already tells her she will need that number on the DLA
                website; this is the way there. It sits ABOVE the order
                paper and in the same card, so the two ways to reach this
                order at its source read as one pair. */}
            <OrderOnDlaLink url={o.dlaOrderUrl} />
            {/* THE ORDER PAPER, which this page tells her to read in four
                places and never showed. `paperHref` explains why the link
                points at our own redirect rather than the stored URL.
                The ABSENT state is the common one — we hold a paper for
                6,855 of 16,606 active orders — so it says we do not have it
                and sends her to DLA, rather than rendering nothing and
                leaving four instructions pointing at a document she has no
                way to reach. */}
            {paperUrl != null ? (
              <a className="mp-paper" href={paperUrl} target="_blank" rel="noreferrer">
                <span className="mp-paper__kind" aria-hidden>
                  PDF
                </span>
                <span className="mp-paper__text">
                  <b>Read the order paper</b>
                  <em>
                    {o.paper?.fileName}
                    {paperKb ? ` · ${paperKb}` : ""}
                  </em>
                </span>
                <span className="mp-paper__go" aria-hidden>
                  Open
                </span>
              </a>
            ) : (
              <p className="mp-paper mp-paper--none">
                <span className="mp-paper__kind" aria-hidden>
                  —
                </span>
                <span className="mp-paper__text">
                  <b>No order paper available for this one.</b>
                  <em>Open the order on DLA&apos;s site to read it there.</em>
                </span>
              </p>
            )}
          </section>
          {/* ── Can you get it, before what it is worth ─────────────────────
              Moved above the price evidence 9 September 2026. The order was
              facts → what DLA paid → can you get this part, which reads the
              two questions in the wrong order for a member who cannot source
              the part at all: she costed an order she can never fill, and
              found out four sections later.
              THIS DIVERGES FROM THE PROTOTYPE, deliberately and knowingly.
              The prototype renders AwardHistory first, and its model is
              coherent on its own terms — Hunter's price sits at the top of
              the page and everything under it is the evidence, so the price
              record follows its claim. What that model costs is the sourcing
              gate, which is cheaper to answer and disqualifies harder.
              If the prototype is re-synced, this is the hunk that will
              conflict. Revert this commit and the order returns. */}
          {/* PreviousWins is NOT rendered. Pending one live /nsn/ call — see the
      component header. We do not know what `nsn.suppliers` means, and the
      two candidate meanings point opposite ways: past award winners (market
      research, harmless) or the DLA APPROVED-SOURCE list (a restriction).
      Rendering the second under "who has won this before" would show her a
      disqualification as neutral colour. Abstain rather than guess.
      One line to restore once the meaning is confirmed. */}

          {/* The record behind the instruction above. Inside step 2, not a step of
      its own — it is the evidence for the price, and the page does not need
      another thing to read. */}
          <SourcingPanel order={o} now={now} />

          <AwardHistory order={o} now={now} />
          {/* THE UNIT WARNING MOVED UP, into Hunter's card, directly above
              the price it qualifies. It rendered here, after the award
              history, as a full-width amber band belonging to no card — and
              its own headline reads "Read this before you price it." while
              it sat BELOW the price and below the record. A warning printed
              after the number it qualifies is a warning read second, which
              is the rule this page already applies to the termination
              warning. */}

          {cashAsked && (
            <section className="mp-cash">
              <p className="mp-cash__head">You would pay for the items first.</p>
              {/* The order's own value — a record fact. We do NOT show a cost
          estimate here, because we do not know what it costs her to buy
          and will not invent a margin to look helpful. */}
              <Figure
                value={usd(value)}
                caption={
                  o.repeats === false
                    ? "What this order is worth."
                    : pricePoint(o)?.source === "list"
                      ? "What this is worth at DLA's list price. The order paper does not say if it is a year of orders."
                      : "What this is worth at the price DLA paid last time. The order paper does not say if it is a year of orders."
                }
                note="You buy the items, then DLA pays you after you deliver."
              />
              <div className="mp-cash__btns">
                <button
                  type="button"
                  className="btn btn-secondary"
                  /* She can handle this size. That sets no upper limit — it only
                 stops us asking again. */
                  onClick={() => setCashCeiling(null, true)}
                >
                  I can do that
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  /* This size is above what she can float. Recorded as her
                 ceiling and used to RANK — never to hide an order. */
                  onClick={() => setCashCeiling(value)}
                >
                  That is too much
                </button>
                {/* Same weight as its siblings. "I am not sure" was btn-ghost
                against two btn-secondary answers — the weakest of three
                equally valid answers, on the surface whose invariant is
                that "I don't know" is always a real answer. The sourcing
                question directly above already gets this right.
                HONEST NOTE, ESCALATED: this button and "I can do that"
                write the identical record — `setCashCeiling(null, true)` —
                so "I don't know" is stored as a yes. Separating them needs
                a third state in state/microPurchases.ts, which is another
                lane's file; the read below is written so it claims nothing
                the record does not hold. */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCashCeiling(null, true)}
                >
                  I am not sure
                </button>
              </div>
            </section>
          )}

          {/* REPLACE, NEVER VANISH — always-on pattern 11, on the most
          consequential thing she can tell us about her business here. She
          tapped "That is too much" on a $3,000 order and the whole block
          disappeared, replaced by nothing: no confirmation, no echo of what
          we heard, no way back from a mis-tap, on a money answer that then
          ranks every board she sees (`D-D3`). The sourcing question one
          block up already gets this right ("Saved. Hunter will put this one
          nearer the top for you.").
          It says only what the record actually holds, which is why the two
          states read differently: a ceiling is a number we can quote back
          to her, and the other two answers store no number at all. */}
          {cashRelevant && cashAnswered && (
            <section className="mp-cash">
              {/* Third person, because this is not Hunter's surface. Inside
              his own amber block the copy names no speaker; outside it the
              product
              narrates him by name, which is what the sourcing answer one
              block up already does ("Saved. Hunter will put this one nearer
              the top for you."). */}
              <p className="mp-cash__head">
                {ms.cashCeiling != null
                  ? `You said ${usd(ms.cashCeiling)} is too much to pay before DLA pays you.`
                  : "You have not set a limit on what you can pay before DLA pays you."}
              </p>
              <p className="mp-verdict__body">
                {ms.cashCeiling != null
                  ? "Hunter puts orders you can pay for nearer the top. He never hides an order."
                  : "We will not ask again."}
              </p>
              <div className="mp-cash__btns">
                {/* The way back. It clears both fields, so the question returns
                on this order at this order's own figure — which is also the
                per-order re-ask the comment above has always promised and
                the member-level gate never delivered. Re-asking on its own,
                on an order materially larger than the last one she
                answered, needs the answered value stored: escalated. */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCashCeiling(null, false)}
                >
                  {ms.cashCeiling != null ? "Change this" : "Set a limit"}
                </button>
              </div>
            </section>
          )}

          {/* ── Before you quote ───────────────────────────────────────────── */}
          <section className="mp-traps">
            {/* The heading's precondition passes. Once she has told us she sent
            a price, "Before you quote" renders directly above "You sent a
            price on this one." and asks her to wonder which step she
            missed. The content is still true afterwards — it is all
            check-the-paper — so only the timing word changes.
            THE SAME IS TRUE UNDER A REFUSAL. "Before you quote" presumes
            she is about to, on a page that has just told her she may not
            (mp-006) or that it cannot tell (mp-005). `sendable` is the one
            fact that decides whether this page is instructing her to quote,
            and every imperative on it now reads that fact. */}
            <h2 className="mp-h2">
              {quoted || !sendable ? "Check on the order paper" : "Before you quote"}
            </h2>
            {/* THE AMENDMENT, AT THE MOMENT THE MISTAKE IS MADE. The banner at
            the top of the page legitimately governs the whole page and
            stays there — but on mp-092 it sits 2,623px above the send
            block, about three screens, and the four send steps never
            mention the version. Quoting against a superseded solicitation
            is a documented DIBBS rejection. This is the same argument that
            put the surplus warning at the moment she goes shopping, and
            this block is the last thing she reads before the two numbers.
            Phrased as the action, not as a second copy of the banner's
            sentence: the banner says what happened, this says what to do
            about it now. */}
            {o.amendedOn && (
              <Trap
                warn
                head="Check you have the newest order paper."
                body={`DLA changed this one on ${fullDate(o.amendedOn)}. Send your price against the new version.`}
              />
            )}
            {o.deliveryDays == null ? (
              <Trap
                warn
                head="The order paper does not say how long you have."
                body="Read it before you promise a delivery date."
              />
            ) : o.deliveryDays <= 30 ? (
              <Trap
                warn
                head={`You have only ${o.deliveryDays} days to deliver.`}
                body="Only quote if you already keep these in stock."
              />
            ) : (
              <Trap
                head={`You have ${o.deliveryDays} days to deliver.`}
                body="That is enough time to order and ship."
              />
            )}
            {/* The gate now names its own route. We told her twice that she
            needed approval and never once what the approval was, where it
            came from, or how long it took — while rendering the price
            advice and the send block underneath (D-C5: a route we name
            must be walkable). The mechanism is the Joint Certification
            Program: a US or Canadian contractor files DD Form 2345 to
            receive militarily critical technical data. It is free and it
            takes weeks, which is the fact that changes whether she should
            start today. Written out in full, never as "JCP" — the acronym
            rule, plain words first and the official name after. */}
            {o.needsDrawings ? (
              <Trap
                warn
                head="You need approval to see the drawings."
                body="It is free. You send DLA one form and wait weeks. The form is DD Form 2345, for the Joint Certification Program."
              />
            ) : o.needsDrawings == null ? (
              /* THE UNKNOWN LANDS HERE, NOT IN THE VERDICT. `dibbs_tech_docs_flag`
                 is true on about a third of mature live records and absent on the
                 rest — it is never false — so a caveat in the verdict headline
                 would ride on nearly two thirds of open orders. A warning that
                 common is wallpaper: she learns to read past it, and then reads
                 past the third where drawings genuinely ARE required. The verdict
                 answers whether she may bid; this block is where every other
                 thing-to-check already lives, and it is where a reader comes
                 looking. Dropping the fact instead would be a silent
                 disqualification (`D-C5`), which is not available.
                 Read from the record — `needsDrawings == null` is the same
                 expression openVerdict() calls `gateUnknown`. */
              <Trap
                warn
                head="The order paper does not say if drawings are needed."
                body="Read it before you quote. If you need approval for the drawings, it takes weeks."
              />
            ) : null}
            {/* WHERE THE PART IS MADE. The Berry Amendment and the specialty
            metals clause bite squarely on two of the categories we offer —
            safety gear and clothing, and bolts, screws and fasteners — and
            nothing on this surface said so. We hold no per-order field for
            it, so this can only be a check-the-paper instruction and it must
            assert no legal fact of its own: the paper is the authority, and
            the sentence points at it. Same shape and same block as the
            packing warning below. Parking the GATE is a scope call; parking
            the WARNING would be the silent disqualification `D-C3` names. */}
            <p className="mp-traps__rest">
              Some orders only accept items made in the United States. The order paper says which.
            </p>
            <p className="mp-traps__rest">
              Everything else is in the order paper, including how it must be packed. Packing can
              cost more than the part.
            </p>
          </section>
        </div>

        <aside className="mp-detail__side">
          {/* THE DAY IS FOR THE PRICE, AND FOR NOTHING ELSE INSIDE. Every
              DATE decision in there reads a record SHE wrote, so it is
              measured against the real day. What DLA last paid is a fact
              about the ORDER, so the ladder that ages it takes the served
              day like every other fact on this page. */}
          {sendable && <SendToDla order={o} now={now} />}
          {/* "YOUR CONTRACT" IS GONE, on the member's instruction.
              It was a sidebar card on every `repeats === true` order,
              restating three things the page states elsewhere: the year,
              the fixed price and the right to refuse a small order. The
              year is in the fact strip above the fold as CONTRACT / 1 year
              of orders · AIDC, and again in "What the order says".
              THE ESTIMATE CAVEAT DID NOT LIVE HERE and is not lost with it.
              D-A5 once required this block to render above every figure on
              the page. That argument was already answered by moving the
              caveat onto the count it qualifies, so "DLA may buy fewer, or
              none." rides on the How many cell of the strip. Attached beats
              adjacent: no reading order reaches the number without it. */}
          {/* HUNTER NOTES — what on this page is his, in the shape of the
            page's other fact lists. It was one prose sentence inside the
            verdict card ("Who may sell this one and the plain name are my
            work. Always check the order paper."), which is the right claim
            in the wrong place: the attribution rule is about being able to
            tell, at a glance, which lines are machine-written, and a
            sentence buried in a card about eligibility is not a glance.
            Rendered only where there is something to attribute — an
            attribution that cannot be false is not attribution. */}
          {mine.length > 0 && (
            <section className="mp-notes">
              <h2 className="mp-h2">Hunter notes</h2>
              {/* ONE READER, STILL. `mine` is the single derivation of what
                  on this page is Hunter's, and every clause of it is
                  conditional on its own fact being on screen — a name clause
                  only where he rewrote the name, a numbers clause only where
                  numbers render. The card reads that array rather than
                  restating the conditions, so the rows cannot drift from the
                  sentence they replaced. NOTE_FOR only says what KIND of work
                  each one is; it never decides whether a row appears. */}
              <dl className="mp-notes__list">
                {mine.map((c) => (
                  <div key={c}>
                    <dt>{NOTE_FOR[c][0]}</dt>
                    <dd>{NOTE_FOR[c][1]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mp-notes__foot">
                All of that is Hunter&rsquo;s work. Always check the order paper.
              </p>
              {/* AND HERE IS WHAT HE READ, IN THE GOVERNMENT'S OWN WORDS.
                  The rows above say WHOSE work each line is; this is the
                  source that makes the "who may sell" row checkable instead
                  of asking her to take it on trust.
                  IT SITS BELOW THE ATTRIBUTION FOOTER ON PURPOSE. That
                  sentence reads "All of that is Hunter’s work", and this text is
                  not — it is DFARS PGI 217.75, transcribed verbatim,
                  including the government's own typos. Putting it above the
                  footer would sweep a federal regulation into a claim that
                  Hunter wrote it, which is `D-E5` pointing the wrong way.
                  Its own heading and its own citation keep the two apart.
                  Rendered only when the codes are on the record AND the
                  table has arrived — an empty panel explains nothing. */}
              {codeMeanings.length > 0 && (
                <div className="mp-notes__reg">
                  <p className="mp-notes__reghead">What DLA&rsquo;s code says</p>
                  <dl className="mp-notes__list">
                    {codeMeanings.map((e) => (
                      <div key={`${e.kind}-${e.code}`}>
                        <dt>
                          {e.kind === "amc" ? "How DLA buys it" : "What the data allows"} · {e.code}
                        </dt>
                        <dd>{e.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mp-notes__cite">
                    {codeMeanings[0].citation.document} {codeMeanings[0].citation.section},
                    effective {codeMeanings[0].citation.effectiveDate}. Not our words.
                  </p>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* NOT on an order the verdict has just refused. "Skip this one. Your
          time is better spent on the open orders." followed by a button reading
          "Save this one" is the page arguing with itself inside one screen, and
          the comment above already states the intent — the page ends at the
          verdict and its own next step. The dead-end sentence IS the next step;
          a control implying this one could still work out undoes it. */}
      {/* THE SAVE CONTROL MOVED TO THE ACTION BAR at the top of this page
          (24 Aug 2026). It sat here, at the foot, about 3,800px down — so the
          one action she can take on an order she is not ready to quote was the
          last thing on the page. `/opportunities/$noticeId` pins save to the
          top and this page now does the same.
          The rule travelled with it and is unchanged: on an order she has
          quoted the control is REPLACED by the reason rather than offered,
          because un-saving strands the quote. */}
    </div>
  );
}

/**
 * The mentor control — the same $⁠97 wallet review the opportunity page sends,
 * through the same wiring (`OrderMentor`). "Sent" comes from the real Mentors
 * list, so it stays after she leaves the order and comes back.
 */
function AskMentor({
  order: o,
  whatSheIsSending,
  sent,
}: {
  order: MicroOrder;
  whatSheIsSending: string;
  sent: boolean;
}) {
  if (sent) {
    return (
      <>
        <span className="mp-detail__kept">
          <Check size={14} aria-hidden className="mp-ic-ok" /> Sent
        </span>
        <OrderMentorNotice orderId={o.id} />
      </>
    );
  }
  // ONE LABEL, NOT A RESPONSIVE ONE. "Send to mentor" is grammatical, names the
  // action and the person, and measures 143px, which the row has.
  return (
    <OrderMentor
      order={o}
      whatSheIsSending={whatSheIsSending}
      label="Send to mentor"
      className="btn btn-sm btn-primary detail-actions__icon mp-sticky__mentor"
    />
  );
}

/**
 * Back to the list she came from, named.
 *
 * It said "Small orders" and went to the board on every order — including the
 * ones the board cannot show. An order she may not bid is reachable from one
 * place only, "Ones not open to you", so from there the control threw away her
 * position in a list of eleven and dropped her on a different page: the browser
 * back button was the only way back, on the one screen where the app's own
 * control was pointing the wrong way.
 *
 * The label moves with the destination. A back control that names somewhere
 * other than where it goes is worse than one that names nothing.
 */
function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="mp-back" onClick={onClick}>
      <ArrowLeft size={16} aria-hidden /> {label}
    </button>
  );
}

/**
 * One fact, in the house key-information grid.
 *
 * This used to be `.mp-fact` — a bespoke full-width row, one per line, each
 * followed by its hint. Eight of them ran to about 520px and made this page read
 * as a different product from `/opportunities/$noticeId`, which states nine
 * facts in a compact two-column grid in a third of the space (Karthik, 24 Aug
 * 2026: "bring those two closer together").
 *
 * It now renders `.key-info-grid`'s own markup — `key-info-row` / `key-info-label`
 * / `key-info-value`, with the `--mono` variant the house already has for
 * identifiers. Composing the existing primitive rather than keeping a parallel
 * one is the rule (`D-G3`); a second way to render a label and a value is how
 * two surfaces drift apart in the first place.
 *
 * WIDE IS NOT DECORATION. At 390px the grid is two forced columns, so a cell is
 * about 155px — fine for "11 pieces" or "DLA does", and not fine for "DLA
 * compares your price and your delivery days together. A faster date can beat a
 * lower price." Those hints are load-bearing under always-on pattern 3, so a
 * fact carrying one takes the full row and keeps it readable. The dense default
 * matches the house; the exception exists so density never costs meaning.
 */
function Fact({
  label,
  value,
  hint,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={`key-info-row${hint ? " key-info-row--wide" : ""}`}>
      <dt className="key-info-label">
        {Icon && <Icon size={12} aria-hidden />} {label}
      </dt>
      <dd className={`key-info-value${mono ? " key-info-value--mono" : ""}`}>{value}</dd>
      {hint && <dd className="key-info-hint">{hint}</dd>}
    </div>
  );
}

/** The corpus has not answered yet. First paint draws the bundled sample, and a
 *  live order is not in it. */
const FEED_IN_FLIGHT = "Getting this order from DLA.";

/** The fetch failed. The board says the same thing about the whole corpus. */
const FEED_FAILED = "This order from DLA did not load. Check again later.";

/** A server answered and this order was not in what it sent. */
const ORDER_GONE = "That order is not here any more.";

/**
 * What the page has resolved about the order in the URL.
 *
 * FOUR ANSWERS, BECAUSE THE PAGE HAS FOUR THINGS TO SAY. `found` renders the
 * order. The other three are sentences, and the whole point of the type is that
 * they cannot be collapsed: "we are still asking", "we could not ask" and "the
 * server holds no such order" are different facts, and DH-30 is what happened
 * the last time two of them shared a sentence.
 *
 * `asOf` rides with the order because every fact this page states is measured
 * against the corpus day, and an order that arrived singly must be judged on
 * the same one as an order off the board.
 */
export type OrderLookup =
  | { state: "asking" }
  | { state: "found"; order: MicroOrder; asOf: string }
  | { state: "gone" }
  | { state: "unreachable" };

/** The three answers that are a sentence rather than an order. */
export type OrderMiss = Exclude<OrderLookup["state"], "found">;

/** The order out of the page of the board we hold, or `undefined`. */
function feedOrder(orderId: string, feed: BoardFeed): MicroOrder | undefined {
  return feed.orders.find((x) => x.id === orderId);
}

/**
 * Whether to ask the record route about this order.
 *
 * ONE STATE ONLY: the board ANSWERED and this order was not in what it served.
 * That is DH-30's case — the board holds 50 rows of a corpus of thousands, so
 * an order beyond the loaded pages is missing from it and alive.
 *
 * IT DOES NOT ASK OVER A FAILED BOARD, and the reason is the corpus day. `asOf`
 * is the feed's, and every fact this page states — what the order is worth,
 * when it closes, how old the last award is — is measured against it. An order
 * with no day to judge it on is a page of numbers we cannot stand behind, so
 * the honest "This order from DLA did not load" stands, exactly as before.
 */
export function askRecordRoute(orderId: string, feed: BoardFeed | null | undefined): boolean {
  return feed != null && feedOrder(orderId, feed) === undefined;
}

/**
 * The order in the URL, out of the two places it can come from.
 *
 * **THIS IS WHERE "WE HAVE NOT FETCHED IT" AND "IT IS NOT THERE" ARE HELD
 * APART (DH-30).** The page used to read one page of the board and say "That
 * order is not here any more." about everything it did not find, which is a
 * shortcoming of ours stated as a fact about her order. It cost exactly the
 * member who did the right thing: saved a link, came back to it, or sent one to
 * a mentor.
 *
 * The order of the tests is the order of what we know:
 *
 *   · no board yet — we know nothing about any order, so we say nothing;
 *   · no board at all — see `askRecordRoute`;
 *   · the board served it — nothing to fetch, and this is every order she
 *     reached by scrolling;
 *   · the record route has not answered — STILL NOTHING TO SAY. Concluding
 *     here is the same defect on a shorter timescale;
 *   · the record route answered, and its answer decides between the order, the
 *     honest "not here any more", and "we could not ask".
 */
export function lookupOrder(
  orderId: string,
  feed: BoardFeed | null | undefined,
  single: SmallOrderResult | null,
): OrderLookup {
  if (feed === undefined) return { state: "asking" };
  if (feed === null) return { state: "unreachable" };
  const held = feedOrder(orderId, feed);
  if (held) return { state: "found", order: held, asOf: feed.asOf };
  if (single === null) return { state: "asking" };
  if (single.state === "order") return { state: "found", order: single.order, asOf: feed.asOf };
  return single.state === "absent" ? { state: "gone" } : { state: "unreachable" };
}

/**
 * Ask the record route for one order, once the board has answered without it.
 *
 * `null` until an answer arrives, which the page renders as the spinner it
 * already had. The answer is KEYED BY ID: a route parameter can change under a
 * mounted component, and the previous order's answer must not render under the
 * new order's URL.
 *
 * The cleanup drops a request whose answer arrived after the page moved on.
 */
function useSingleOrder(orderId: string, wanted: boolean): SmallOrderResult | null {
  const [answered, setAnswered] = useState<{ id: string; result: SmallOrderResult } | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    void fetchSmallOrder(orderId).then((result) => {
      if (live) setAnswered({ id: orderId, result });
    });
    return () => {
      live = false;
    };
  }, [orderId, wanted]);
  return answered !== null && answered.id === orderId ? answered.result : null;
}

/**
 * What the page says when it holds no order to render.
 *
 * THREE STATES, AND ONLY ONE OF THEM EARNS THE SENTENCE. `lookupOrder` names
 * them, and this reads all three rather than collapsing them into `!o`.
 *
 * The collapse was not theoretical, twice over. The feed endpoint answers in 13
 * to 21 seconds, and the bundled corpus used to render for the whole of that
 * wait, so a live order printed "That order is not here any more." on every
 * reload and every shared link for about twenty seconds before the order
 * appeared. Then DH-28 cut the board to one page of 50, and the same sentence
 * printed for good over every order beyond it.
 *
 * The wait shows a spinner carrying the sentence for a wait — the SAME one the
 * feed uses, for both requests, because there is one thing to say while we are
 * asking. A spinner is the one thing on this page that cannot be read as a
 * verdict about the order.
 */
export function MissingOrder({ miss }: { miss: OrderMiss }) {
  if (miss === "asking") return <FeedLoadingState label={FEED_IN_FLIGHT} />;
  if (miss === "unreachable") return <p className="mp-empty__head">{FEED_FAILED}</p>;
  return <p className="mp-empty__head">{ORDER_GONE}</p>;
}

/**
 * Why an order we could not rule on is on her board, and why that is not
 * permission to bid it.
 *
 * TWO SENTENCES THE VERDICT ABOVE DOES NOT SAY. The verdict says what we could
 * not do. This says WHOSE shortcoming that is — ours, both times — and then
 * says, in words, that it is not a claim she may bid. A missing acquisition
 * code is evidence we did not fetch something, never evidence DLA refuses her,
 * and an order withheld on it presented the second as if it were the first.
 *
 * **IT IS NOT A VERDICT AND IT MAY NEVER BECOME ONE.** `mayBid()` is false on
 * every order this renders for, `openVerdict()` returns `null` on every one of
 * them, and the send control stands down — none of that changed. The copy is
 * `relevance.ts`'s, so the sentence has one owner and this component chooses
 * nothing.
 *
 * `null` renders NOTHING, which is every order we could rule on either way.
 *
 * Exported for the same reason `WhoIsBuyingFact` and `OrderOnDlaLink` are: the
 * claim is about what reaches the DOM, and the page around it needs a router.
 */
export function OrderGapNote({ order }: { order: MicroOrder }) {
  const note = gapNote(order);
  if (note == null) return null;
  return <p className="mp-verdict__body mp-verdict__gap">{note.body}</p>;
}

/**
 * The link to this order on DLA's own site.
 *
 * She is reading our summary of an order paper she has to quote against, so she
 * must be able to open the paper itself. The URL is DLA's own DIBBS page, and
 * the backend has already refused everything that is not — see
 * `small-orders.dla-link.ts`, whose origin allow-list is what keeps our data
 * vendor's URLs, and the API key some of them carry, out of this `href`.
 *
 * `null` renders NOTHING. It arrives for two different reasons — the record
 * carries no URL, or it carries one we may not show — and the answer to both is
 * the same: a control that goes nowhere is worse than no control.
 */
export function OrderOnDlaLink({ url }: { url: string | null }) {
  if (!url) return null;
  const host = hostOf(url);
  return (
    <a className="mp-paper" href={url} target="_blank" rel="noopener noreferrer">
      <span className="mp-paper__kind" aria-hidden>
        WEB
      </span>
      <span className="mp-paper__text">
        <b>Open this on the DIBBS website</b>
        {host != null && <em>{host}</em>}
      </span>
      <span className="mp-paper__go" aria-hidden>
        Open
      </span>
    </a>
  );
}

/**
 * The site a link opens, for the line under its title — `null` when the URL
 * does not parse, so the card drops the line rather than print a broken one.
 */
function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** Printed only BETWEEN two parts that both exist. */
const BUYER_PART_SEPARATOR = " · ";

/**
 * "Who is buying" — the buying office, and the contracting officer printed on
 * the solicitation when the order paper names one.
 *
 * NOT A REFERENCE, and the label does not imply one: DIBBS awards a
 * micro-purchase with no human reading her quote, so this person can confirm
 * the ORDER and can never vouch for her work (the same claim
 * `WIN_CONTACT_LABEL` is careful to make on the wins page).
 *
 * THE PARTS DROP INDEPENDENTLY. `buyerContact.name` is `''` — not null — when
 * the solicitation names nobody, because `MicroOrder` types it non-nullable
 * `string` and that shape is frozen (D10); `buyer` is `''` the same way. The
 * fact used to interpolate both unconditionally, so an unnamed officer rendered
 * "DLA Troop Support · " and an unnamed office rendered " · A. Officer" — a
 * separator with nothing on one side of it, which is PRD §6.4's "a label never
 * renders with an empty value" broken on the page she works the order from.
 * With neither part there is nothing to label at all, so the row stands down
 * rather than printing an empty value.
 */
export function WhoIsBuyingFact({ buyer, contactName }: { buyer: string; contactName: string }) {
  const parts = [buyer, contactName].map((part) => part.trim()).filter((part) => part !== "");
  if (parts.length === 0) return null;
  // THE ONE CELL IN THE GRID THAT EXPLAINED NOTHING. Every other fact here
  // says what it means for her; this printed an office and a surname and left
  // her to guess what to do with them. The guess this hint exists to prevent is
  // the expensive one: that a named officer is somebody to call and impress.
  // The sentence therefore states the office's job and stops. It does NOT say
  // she may contact them — the docblock above records why we will not imply a
  // reference — and it does not say nobody reads her quote, which is true of an
  // automatic award and not a claim this cell can make for every order.
  return (
    <Fact
      label="Who is buying"
      value={parts.join(BUYER_PART_SEPARATOR)}
      hint="The DLA office that placed this order. The order paper names them."
    />
  );
}

function Trap({ head, body, warn }: { head: string; body: string; warn?: boolean }) {
  return (
    <div className="mp-trap">
      {warn ? (
        <AlertTriangle size={16} aria-hidden className="mp-ic-warn" />
      ) : (
        <Check size={16} aria-hidden className="mp-ic-ok" />
      )}
      <span>
        <b>{head}</b>
        <em>{body}</em>
      </span>
    </div>
  );
}
