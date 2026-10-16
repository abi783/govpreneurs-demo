// What you send DLA — three numbers, and what happens after the button.
//
// NO INPUT FIELDS on the path. Her deepest fear is filling a government form in
// wrong; a form on our page that submits nowhere would manufacture exactly that
// fear for no benefit. We tell, we do not ask.
//
// The four-step preview is not decoration. Our own research describes what is on
// the other side of that button — "a confusing layout, an overwhelming
// presentation of information, and frequent technical errors", "archaic and
// super buggy". Dropping her there unprepared after seven calm screens is the
// cruellest thing this design could do. "It looks nothing like this one" is the
// most important sentence on the page.
//
// We never submit for her. A DIBBS account is individual, and the quotation is
// HER representation of price, delivery and capability to the government.
//
// This used to say "a quote is a legally binding offer". It is not: FAR 13.004(a)
// says a quotation is not an offer and cannot be accepted by the Government to
// form a binding contract — the award is the offer. The conclusion never needed
// that premise and is stronger without it. She is the one DLA holds to the price
// and the delivery date, and those are not ours to state in her name.
import { useId, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { Copy, Check, MessageSquare, AlertTriangle } from "lucide-react";
import { type MicroOrder } from "../../lib/microPurchases/order";
import { isoDay, wallClockDay } from "../../lib/microPurchases/wallClock";
import { findFeedOrder } from "../../lib/microPurchases/feed";
import { unitNoun, isKnownUnit } from "../../lib/microPurchases/units";
import { orderValue, priceAdvice, usd, fullDate } from "../../lib/microPurchases/pricing";
import { mentorDecision } from "../../lib/microPurchases/mentor";
import { ORDER_MENTOR_SENT } from "./SendOrderToMentorModal";
import { OrderMentor, OrderMentorNotice } from "./OrderMentor";
import { useOrderMentorSent } from "../../lib/microPurchases/mentorSent";
import { acceptsQuotesNow, statusIsUnknown } from "../../lib/microPurchases/relevance";
import {
  getMicroState,
  quoteFor,
  recordQuote,
  recordWin,
  recordQuotedPrice,
  recordStillWaiting,
  recordDelivery,
  winFor,
  recordOutcome,
  undoOutcome,
  deleteQuote,
  attestationFor,
  registrationsComplete,
  samStatus,
  SAM_EXPIRED,
} from "../../lib/state/microPurchases";

/** DLA awards lag by around ninety days. ONE owner for the sentence: it used to
 *  live only in the snoozed branch, so a first-timer who heard nothing for six
 *  weeks reached "Did you win it?" with no idea that silence is normal and
 *  wrote a false loss over the record this whole feature exists to produce. */
const AWARD_LAG = "DLA can take two months or more to decide.";

/**
 * What she sends DLA, and what happens after the button.
 *
 * TWO CLOCKS MEET HERE, AND EACH ANSWERS ONE KIND OF QUESTION.
 *
 * THE WALL CLOCK answers both DATE decisions, because both read a record the
 * MEMBER wrote: the day she asked us to wait, and the day she promised DLA a
 * delivery. Neither is a fact about the order, so neither is measured against
 * the corpus's day. This component took the corpus's day for both, which was
 * right while the store stamped those records with it too. The store reads the
 * real day now, so a record written on one clock was read on another — and
 * both decisions arrived as late as the ingest is behind.
 *
 * THE CORPUS'S DAY answers the price, and it arrives as `now`. What DLA last
 * paid, and whether that price is still one we will stand behind, is a fact
 * about the ORDER: `pricing.ts` ages the award against the day the board was
 * served for. The order page holds that day and passes it. This component
 * reads no clock of its own for it, and a wall clock here would age every
 * award by however far the ingest is behind.
 *
 * See src/lib/microPurchases/wallClock.ts for which clock owns which question.
 */
/**
 * The "here is what to type" block, closed until she can act on it.
 *
 * `ready` is `registrationsComplete()`. When it is true this renders its
 * children bare — the panel is exactly what it was before this existed, with no
 * disclosure and no summary.
 *
 * When it is false the same children go inside a closed `<details>`. Not
 * removed: a member weighing whether registering is worth the afternoon is owed
 * a look at what she would be doing. Not open: the sentence above it says she
 * cannot send a price yet, and four numbered steps she cannot follow are the
 * loudest thing on the panel if they stay open under it.
 *
 * `<details>` and not a state hook on purpose. It is keyboard-reachable and
 * screen-reader-announced with no work from us, and this component owns no
 * state that could disagree with `ready`.
 */
function SendStepsWhenReady({ ready, children }: { ready: boolean; children: ReactNode }) {
  if (ready) return <>{children}</>;
  return (
    <details className="mp-send__ahead">
      <summary className="mp-send__aheadsum">What you will send, once you can</summary>
      {children}
    </details>
  );
}

export function SendToDla({ order: o, now }: { order: MicroOrder; now: Date | null }) {
  const [copied, setCopied] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  // Nothing saves until she confirms (§3.5). The write used to happen on the
  // first tap of a button labelled with a display verb.
  const [confirming, setConfirming] = useState(false);
  // Undefined ONLY when this component is rendered outside a RouterProvider,
  // which is `SendToDla.clock.test.tsx` and `orderPrice.clock.test.tsx` — both
  // render this component bare — and never the app. The browser and the server
  // render both have one. The control
  // below is a real anchor either way; the router just keeps it from being a
  // full page load.
  const router = useRouter({ warn: false });
  const sendCeiling = priceAdvice(o, now).ceiling;
  // Never a bare "each" beside money: on a unit of PR the price is per PAIR.
  // Null on an unknown code, so the question just drops the clause.
  const priceNoun = isKnownUnit(o.unitOfIssue) ? unitNoun(o.unitOfIssue) : null;
  const ms = getMicroState();
  const advice = priceAdvice(o, now);
  const existing = quoteFor(o.id);
  // DLA has posted it but is not taking prices yet. Never a send control, and
  // never a QuoteRecord — a preview shares no write path with the real action.
  const notYetOpen = !acceptsQuotesNow(o);
  // Snoozed only until the date passes. "I won it" must never be unreachable.
  const snoozeUntil = existing?.askAgainOn ?? null;
  const snoozed = snoozeUntil != null && isoDay(snoozeUntil) > wallClockDay();
  const ready = registrationsComplete();

  // The largest order VALUE she has quoted, in dollars. This was
  // `ms.quotes.length` — a COUNT fed into a field compared against dollars
  // (`v > largestOrderSoFar * 2`), so after one quote the threshold was $2 and
  // every order fired "much bigger than your usual order", including ones four
  // times smaller. Both are `number`, so nothing complained.
  //
  // An unresolvable id is DROPPED, never replaced with `o`. Once the feed
  // rotates, a past quote's order leaves the corpus — and `?? o` then compared
  // this order against itself, so "much bigger than your usual order" could
  // never fire on the returning member it exists for. Math.max already has a 0
  // seed, so an empty list is fine.
  //
  // THE LOOKUP IS THE FEED'S, not the fixture's. `getMicroOrder()` reads the 25
  // bundled records, so a quote on a live order could never find its own order
  // and every past quote dropped out of this figure. `findFeedOrder()` is the
  // live replacement and it answers about the corpus the board was served.
  const largest = Math.max(
    0,
    ...ms.quotes.flatMap((q) => {
      const past = findFeedOrder(q.orderId);
      return past ? [orderValue(past, now) ?? 0] : [];
    }),
  );

  // ── After she has sent one: close the loop ──────────────────────────────
  if (existing) {
    // HER contract value, never orderValue(). orderValue() is DLA's last award
    // unit price times quantity — what the GOVERNMENT paid someone else last
    // time. This page tells her to quote UNDER that price, so writing it into
    // the past-performance record overstated every winning quote by
    // construction (on mp-092: $3,000 recorded against a $2,280 contract, 31%
    // high). A contracting officer checking the claim against the award finds
    // a figure that does not match, and on a first win that is the only
    // reference she has. Null when she did not remember her price — the record
    // then simply does not claim a value.
    const wonValue =
      existing.quotedPricePerUnit != null && o.quantity != null
        ? existing.quotedPricePerUnit * o.quantity
        : null;
    // The unit-of-issue catch — the rule mentor.ts says pays for the feature:
    // she reads "500", prices per item against a unit of hundreds, and quotes a
    // fifth of what the part costs. It could never fire, because mentorDecision
    // was handed `pricePerUnit: null` unconditionally and nothing in src/ ever
    // passed her number. Pre-send is impossible — she types the price on DLA's
    // site, not ours — but her price is captured two blocks up, and pre-award is
    // still in time to correct it on DIBBS.
    // Only this trigger. The others (repeats, unit, bigger, drawings) are advice
    // about whether to quote, and she has quoted.
    const check =
      existing.outcome === "pending" && existing.quotedPricePerUnit != null
        ? // A PRICE WARNING, NOT A MENTOR OFFER — which is why it survived the
          // consolidation. It renders as a headline and a body with no control:
          // after she has quoted, it tells her the number she typed is far under
          // what DLA last paid, while there is still time to correct it on DIBBS.
          // `reviewsThisWeek: 0` because the weekly cap is retired and only the
          // trigger's WORDS are read here; the mode this returns is discarded on
          // the next line.
          mentorDecision(
            o,
            { pricePerUnit: existing.quotedPricePerUnit, deliveryDays: o.deliveryDays },
            { hasQuotedBefore: true, largestOrderValueSoFar: largest, reviewsThisWeek: 0 },
            now,
          )
        : { mode: "none" as const };
    const priceLow =
      check.mode !== "none" && check.trigger.id === "price-low" ? check.trigger : null;
    return (
      <section className="mp-send">
        <h2 className="mp-h2">Your quote</h2>
        {/* The snooze EXPIRES. It used to be `hidden={askAgainOn != null}` with
            nothing ever comparing it to today, so one tap on "Still waiting"
            permanently removed her only route to record a win — the
            PastPerformanceRecord this whole feature exists to produce. */}
        {existing.outcome === "pending" && !existing.quotedPriceAsked ? (
          /* ONE question at a time. Her price is the only record of what she
             actually charged, and it is the number every pricing measure rests
             on — so we ask her for it rather than filling it in with DLA's.
             She can always say she does not remember; a blank is honest and a
             fabricated number is not. PRD 7.2 QuoteRecord. */
          <>
            <p className="mp-send__sent">
              <Check size={16} aria-hidden className="mp-ic-ok" />
              You sent a price on this one.
            </p>
            <label className="mp-send__q" htmlFor="quoted-price">
              What price did you send{priceNoun ? ` for each ${priceNoun}` : ""}?
            </label>
            <div className="mp-send__price">
              <input
                id="quoted-price"
                className="mp-send__priceinput"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const v = Number.parseFloat(priceInput);
                  recordQuotedPrice(o.id, Number.isFinite(v) && v > 0 ? v : null);
                }}
              >
                Save
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => recordQuotedPrice(o.id, null)}
            >
              I do not remember
            </button>
          </>
        ) : existing.outcome === "pending" ? (
          <>
            <p className="mp-send__sent">
              <Check size={16} aria-hidden className="mp-ic-ok" />
              You sent a price on this one.
            </p>
            {/* No control: a mentor cannot read a price that has already gone,
                and the fix is hers to make on the DLA website. The sentence
                names what to check. */}
            {priceLow && (
              <div className="mp-mentor mp-mentor--warn-only">
                <p className="mp-mentor__head">
                  <MessageSquare size={15} aria-hidden />
                  {priceLow.headline}
                </p>
                <p className="mp-mentor__body">{priceLow.body}</p>
              </div>
            )}
            {snoozed ? (
              <p className="mp-send__waiting">
                We will ask you again on {fullDate(snoozeUntil!)}. {AWARD_LAG} Tell us sooner if you
                hear back.
              </p>
            ) : (
              <>
                <p className="mp-send__waiting">{AWARD_LAG} Answer when you hear.</p>
                <p className="mp-send__q">Did you win it?</p>
              </>
            )}
            {/* D-D3, twice now. "Still waiting" was given a real state and then
                made a dead end: `snoozed` compared askAgainOn against the frozen
                fixture day, and recordStillWaiting set it to that same constant
                plus fourteen days — so the comparison could never flip and one
                tap removed her only route to record a win, permanently. Both
                halves read the wall clock now: she is asked again fourteen days
                after she tapped it. The first
                fix hid the controls instead of disabling them, which is the same
                dead end wearing a different attribute (the tap audit only looks
                for `disabled`).
                A state she can enter has a way out, and the way out is not
                allowed to depend on a clock that does not move. The buttons
                stay. The snooze line changes what it SAYS, not what she can do. */}
            <div className="mp-send__btns">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  recordOutcome(o.id, "won");
                  recordWin(o, wonValue);
                }}
              >
                I won it
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => recordOutcome(o.id, "lost")}
              >
                I did not
              </button>
              {/* Replace, never disable — and never a dead control. DLA awards
                  lag by around 90 days, so this is the honest answer for most
                  of the life of a quote.
                  It is DROPPED once she has given it, the same way "Not yet"
                  goes from the delivery question below: while the snooze is
                  running, a second tap writes the same date it already holds
                  and nothing on screen moves. A control that visibly does
                  nothing is the other half of D-D3. Her route out is the two
                  answers beside it, which stay. */}
              {!snoozed && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => recordStillWaiting(o.id)}
                >
                  Still waiting
                </button>
              )}
            </div>
          </>
        ) : existing.outcome === "won" ? (
          <WonChecklist
            order={o}
            valueUsd={wonValue}
            now={now}
            // A win is the one answer on this surface that WRITES a second
            // record — PastPerformanceRecord, plus the NSN as proven supply —
            // and it had no inverse at all. undoOutcome() takes both back out;
            // recordOutcome(o.id, "pending") on its own would have left them
            // standing and read to her like an undo, which is worse.
            onNotWon={() => {
              undoOutcome(o.id);
              recordOutcome(o.id, "lost");
            }}
          />
        ) : (
          <>
            <p className="mp-send__sent">You did not win this one.</p>
            <p className="mp-send__body">
              That is normal. Most quotes do not win. What you learned about the price is worth
              keeping.
            </p>
            {/* D-D3, the third instance and the one the sweep found: this state
                had NO controls at all. One tap on "I did not" ended the order
                for good, and if the tap was wrong it took with it the only
                route to the past-performance record this whole feature exists
                to produce. Same "Change this" the delivery answer already
                offers, for the same reason: no answer she gives here is final. */}
            <div className="mp-send__btns">
              <button type="button" className="btn btn-ghost" onClick={() => undoOutcome(o.id)}>
                Change this
              </button>
            </div>
          </>
        )}
        {/* The inverse of "Yes, I sent it". That one tap replaced this whole
            block — the two numbers, the order number she has to copy, the four
            steps — with "You sent a price on this one.", permanently. A member
            who taps it before she has opened the DLA website loses the
            instructions for the thing she has not done yet, and every route
            back with them. */}
        {existing.outcome === "pending" && (
          <button type="button" className="btn btn-ghost" onClick={() => deleteQuote(o.id)}>
            I did not send it
          </button>
        )}
      </section>
    );
  }

  // ── DLA has posted it but is not taking prices ──────────────────────────
  // `notYetOpen` was computed and never read. The board filtered these out;
  // this page did not, so four biddable orders (mp-001, mp-002, mp-006,
  // mp-009 — Pending is ~12% of mature postings and the majority of fresh
  // ones) rendered the whole block: two numbers to type, the solicitation to
  // copy, four steps telling her to go and quote, and a control that wrote
  // "You sent a price on this one." She goes, finds no quote box, and
  // concludes she did it wrong. No numbers here, no Copy, no steps, no control
  // and no write path.
  //
  // Two reasons reach this branch and they are not the same fact. "Pending" is
  // a status DLA gave us; a missing status is a record we never got. Saying
  // "they are not taking prices yet" about the second one asserts something we
  // do not know, so each gets its own sentence.
  if (notYetOpen) {
    return (
      <section className="mp-send">
        <h2 className="mp-h2">What you send DLA</h2>
        {statusIsUnknown(o) ? (
          <p className="mp-send__body">
            The order paper does not say if DLA is taking prices yet. Open the DLA website and look
            before you price it.
          </p>
        ) : o.dibbsStatus!.trim().toLowerCase() === "pending" ? (
          <p className="mp-send__body">
            DLA has posted this order. They are not taking prices yet. Look at it again in a few
            days.
          </p>
        ) : (
          // Awarded, Removed, Cancelled — the corpus header lists these as live
          // values and an order can move to one between board and open. "Not
          // taking prices YET" would be false about a finished one, so the
          // third branch says only what is true of all of them.
          <p className="mp-send__body">DLA is not taking prices on this order now.</p>
        )}
      </section>
    );
  }

  return (
    <section className="mp-send">
      <h2 className="mp-h2">What you send DLA</h2>
      {/* She has already told the sourcing question she cannot get this part,
          and this block went on telling her what to type as if she had not —
          her answer recorded and then ignored by the rest of the page she is
          standing on. It changes what the page SAYS, not what she can do:
          ranking-not-hiding is right for the board, and gating her out of a
          block she may still want is the dead end this component keeps
          shipping. */}
      {attestationFor(o.nsn) === "no" && (
        <p className="mp-send__body">
          You said you cannot get this one. This is here if that changes.
        </p>
      )}
      {/* The certificate-gated set-aside does NOT get a sentence here. This
          whole component stands down on that order — micro-purchases.$orderId
          renders it behind the same `openVerdict()` fact — so a branch for it
          in this file would be a state nothing can reach (D-B3). */}

      {/* THE ONE COST THIS PAGE CANNOT UNDO, above the control that commits
          her to it. Every other caution on the order is about getting the
          quote RIGHT — the unit trap, the drawings, the origin rules. This one
          is about whether to quote at all, and it is the only consequence on
          the surface that outlives the order: a terminated contract is past
          performance, and past performance is what a contracting officer
          checks before the next award.
          IT MOVED HERE FROM THE HEADER ROW, where it sat level with Hunter's
          price. The price creates the temptation, but the price is not the
          commitment — the button under this warning is. A member reads the
          header once on the way past and acts several hundred pixels later, so
          a warning printed beside the number reached her before she had a
          decision to make. This position puts it at the moment she does.
          IT NOW RENDERS ONLY WHERE THIS COMPONENT DOES, and this component
          stands down on an order she may not bid (`sendable`, in the route
          that renders it). That is the rule the save control already follows:
          a page that has told her she may not bid this order must not then
          coach her on how to quote it.
          ONE POSITION SERVES BOTH BRANCHES. Below this, a member who has not
          registered meets "Get registered to sell" and a member who has meets
          the four steps. Both are the same moment in her path, so the warning
          sits above the branch rather than inside either arm of it — inside
          the unregistered arm it would hide from the only members who can
          actually send a price.
          --urg-*, and this is the one place on the feature that earns it. The
          board's list-level caution is --warn-* because nothing there is
          committed; here she is one control from sending a price she is bound
          by, and the family reserved for destructive confirmations is the
          honest one. */}
      <aside className="mp-fulfil">
        <AlertTriangle size={18} aria-hidden />
        <div className="mp-fulfil__text">
          <p className="mp-fulfil__head">Do not quote unless you can deliver it.</p>
          <p className="mp-fulfil__body">
            If you win and cannot deliver, DLA can end the contract. That stays on your record.
          </p>
        </div>
      </aside>

      {/* ── Can she send at all? VERDICT FIRST (always-on pattern 1) ────────
          This block used to be the LAST thing in the section, about 700px
          below the heading: the whole recipe first — including step 2, "Sign in
          with your DLA account", which is registration three of four and the
          one she does not have — and only then, in the final sentence, that she
          cannot use any of it yet. She would open the DLA website, fail to sign
          in, and not know why. The branch ORDER was fixed last round
          (registrations read before the mentor gate) and the comment said
          "Registrations first", which was true of the code and false of the
          screen. Reading order is the only order she has.
          The recipe still renders underneath, on purpose — she should be able
          to see what the job looks like before she has done the paperwork. What
          moves is the answer, not the lesson.
          Pattern 11: replace, never disable, and the replacement carries the
          step's own button.
          ONE NAME FOR ONE THING (D-E4). "your four registrations" is a word the
          product uses nowhere else: the board's disclosure calls them "N things
          to do before you can sell", and of the four steps only one is titled
          as a registration. Two vocabularies for one fact, on the two screens
          she must move between. The board owns the name; this borrows it.
          AND IT BORROWS THE NAME WITHOUT THE COUNT. "the four things" is right
          only on a member who has done none: PrereqLine prints the number still
          OUTSTANDING ("2 things to do before you can sell"), so a fixed four
          here swaps one mismatch for another the first time she ticks a box.
          The count has one owner and it is PrereqLine — restating it here from
          `registrations` would be a second derivation of one number, which is
          the D-A4 this feature has already paid for twice. So: the phrase, not
          the figure. */}
      {!ready &&
        (samStatus() === "expired" ? (
          <>
            <p className="mp-send__blocked">
              {SAM_EXPIRED.title} {SAM_EXPIRED.body}
            </p>
            <div className="mp-send__btns">
              <a
                className="btn btn-primary"
                href={SAM_EXPIRED.href}
                target="_blank"
                rel="noreferrer"
              >
                {SAM_EXPIRED.cta}
              </a>
            </div>
          </>
        ) : (
          <>
            {/* NAME THE THING, AND SEND HER WHERE THE WORK ACTUALLY LIVES.
                This read "First finish the things to do before you can sell."
                over a button reading "Go to the things to do", and pointed at
                /micro-purchases. Three faults in one control:

                1. "the things to do" names nothing. Every word is Grade 3 and a
                   member still cannot say what is on the other side — the exact
                   failure SKILL.md §5 describes and nothing checked until now.
                   `check-plain-english.ts` now fails on a navigation verb whose
                   object is an empty noun.
                2. It pointed at the board, where the checklist is a COLLAPSED
                   disclosure — a button that names a destination and delivers a
                   page.
                3. Worse, on a member who has not answered the category question
                   the board renders the category gate and the checklist is not
                   on that page AT ALL. The one control naming her blocker
                   landed her somewhere the blocker does not appear.

                The roadmap already owns this work — `p1-federal-registration`
                carries entity validation, UEI, SAM and CAGE as a guided path.
                The micro-purchases checklist was a second owner of a fact the
                roadmap holds, and the roadmap is the one with the steps. */}
            <p className="mp-send__blocked">
              You cannot send a price yet. First you have to register to sell to the government.
            </p>
            <div className="mp-send__btns">
              <a
                className="btn btn-primary"
                href="/home"
                onClick={(e) => {
                  // Client navigation on purpose: a full page load would wipe
                  // the registrations she came here to finish, since this
                  // surface holds them in memory.
                  if (!router) return;
                  e.preventDefault();
                  void router.navigate({ to: "/home" });
                }}
              >
                Get registered to sell
              </a>
            </div>
          </>
        ))}
      {/* GATED ON REGISTRATION, 9 September 2026.
          Everything below tells her what to type into DIBBS and how to send it.
          A member who is not registered cannot do ANY of it, and this rendered
          in full underneath the sentence saying so — roughly 400px of procedure
          for later, wrapped around the one control she can actually use.
          It is not hidden, because a member deciding whether registering is
          worth it is owed a look at what she is registering FOR. It is closed,
          so the blocker above it is the thing she meets first. Once she is
          registered this renders exactly as it did before, with no disclosure
          around it at all. */}
      <SendStepsWhenReady ready={ready}>
        {/* THREE, AND IT WAS ALWAYS THREE. This said "two things" and then, four
          steps and two paragraphs later — AFTER "Send it." — gave her a third
          number: how long her price stays good for. That third number is the
          disqualifier the block exists to prevent, and a member who follows a
          numbered list in order has already sent by the time she reads it. It
          is now a field in the table with the other two. */}
        <p className="mp-send__body">DLA asks for three things. Here is what to type.</p>

        <div className="mp-send__pair">
          <div className="mp-send__field">
            {/* NEVER a bare "each": on a unit of PR this price is per PAIR.
              And the ceiling comes from priceAdvice(), so when the ladder has
              withdrawn the instruction — too old, no date, unit we cannot name
              — this block shows no figure either. It used to restate DLA's
              price as "keep it under" regardless of any of that. */}
            <span className="mp-send__flabel">
              {/* NOT "for each one": on a unit of PR or HD that is the per-item
                framing the whole unit-of-issue guard exists to prevent. When we
                cannot name the unit we say nothing about what it is per. */}
              {sendCeiling ? `Price for each ${sendCeiling.noun}` : "Price"}
            </span>
            {/* The label was repeated as the value — "Your price / Your price" —
              under a lede promising "here is what to type". When we have no
              ceiling we owe her the reason, not the label twice. */}
            <span className="mp-send__fvalue mono">
              {sendCeiling
                ? `Keep it under ${usd(sendCeiling.amount)}`
                : // "Work it out" is a phrasal verb, and the same sweep that
                  // caught "no price to go on" reaches this slot. OrderCard
                  // already words this absence without one.
                  "Price it from your own cost"}
            </span>
          </div>
          <div className="mp-send__field">
            <span className="mp-send__flabel">Days to deliver</span>
            {/* A null here rendered as a naked " or fewer" with no number, on the
              one block that tells her what to type into a government form.
              Then it rendered "The order paper says" IN THE VALUE SLOT — a
              sentence fragment under a lede promising "here is what to type",
              which reads as an instruction to type those four words. The
              absence states elsewhere on this page already have the right
              shape: "Not stated" as the value, the sentence as a hint. */}
            <span className="mp-send__fvalue mono">
              {o.deliveryDays != null ? `${o.deliveryDays} or fewer` : "Not stated"}
            </span>
            {o.deliveryDays == null && (
              <span className="mp-fact__hint">Read the order paper and type what it says.</span>
            )}
          </div>
          {/* THE THIRD NUMBER, and it sits HERE rather than under "Send it."
            because it is the one field on the DLA form that disqualifies her
            silently. DIBBS usually defaults it; a member who changes it never
            finds out why she stopped winning.
            THE LABEL IS THE FIX FOR THE COLLISION TOO. "Days to deliver — 90 or
            fewer" is a maximum she must stay under; this is a minimum she must
            reach, and on an order with 90 delivery days the old wording put two
            bare 90s fifteen lines apart, both about days, pointing opposite
            ways. Different noun, adjacent rows, so the two cannot be read as
            one field.
            NOT "rejected". DLA lists a validity period under 90 days as making
            a quotation ineligible for AUTOMATED award — a contracting officer
            can still evaluate it. The day she quotes 60 and wins anyway is the
            day she learns the app overstates, and this block gets the same
            distinction right everywhere else. */}
          <div className="mp-send__field">
            <span className="mp-send__flabel">How long your price is good for</span>
            <span className="mp-send__fvalue mono">90 days</span>
            <span className="mp-fact__hint">
              A shorter number stops DLA picking your price automatically.
            </span>
            {/* WHAT DLA'S OWN FORM CALLS THIS FIELD. Our label is the plain
              sentence; "Validity period" is the words she will actually read on
              DIBBS, and without it she hunts for a field that is not there.
              IT USED TO RENDER AS THE BARE WORDS, in `mp-prereq__term` — a
              class belonging to `PrereqLine`, used exactly once outside it. In
              that component the term sits inside a numbered step, so its role
              is obvious from where it is. Here it trailed a hint as a lone
              fragment and read as debris left behind by an edit. The prefix is
              the whole fix: it says why the word is on the page.
              THE OTHER THREE FIELDS HAVE THE SAME MISMATCH and deliberately
              carry nothing, because DLA's exact labels for them are not
              sourced. A guessed field name sends her looking for a field that
              does not exist, which is worse than our own plain label. */}
            <span className="mp-send__term">On the form: Validity period</span>
          </div>
          <div className="mp-send__field">
            <span className="mp-send__flabel">Order number</span>
            <span className="mp-send__fvalue mono">{o.solicitation}</span>
            <button
              type="button"
              className="mp-copy"
              onClick={async () => {
                // "Copied" only if it copied. Fired unawaited and uncaught, with
                // the label set unconditionally, this told her the order number
                // was on her clipboard whenever the write rejected — and this is
                // the number she has to paste into the DLA website. Same fix and
                // same shape as the wins page and Buyers/DraftIntroModal.
                try {
                  await navigator.clipboard.writeText(o.solicitation);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  /* no clipboard, no claim — the number is on screen beside it */
                }
              }}
            >
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── The mentor gate ────────────────────────────────────────────────
          Only once she can actually send. Two lanes wrote two opposite truths
          onto one screen about 150px apart: the mentor block's fast-award
          headline reads "You can send this one now." and the send slot four
          steps later reads "You cannot send a price until your four
          registrations are done." She cannot resolve that without asking
          someone, and the reader who is slowest in English acts on the first.
          The registration blocker owns the can/cannot sentence — it is the
          harder gate and the earlier one. The mentor conversation is about
          whether to send this one YET, which is not a question she has until
      {/* THE FREE MENTOR BLOCK IS GONE (Karthik, 24 Aug 2026).
          It rendered here on a set of risk triggers, offered a review capped at
          three a week, and on `mode === "required"` it BLOCKED the send until
          she took one. One mentor model now runs the whole product: the $⁠97
          wallet review, on the order page above, available on every order
          rather than only where a trigger fired.

          What that removed, stated rather than buried: nothing stops her before
          a first federal quote any more. The triggers existed because that is
          the moment a new seller most often loses money — an unfamiliar unit of
          issue, a price under what DLA last paid, an order far larger than
          anything she has done. She now decides for herself whether that is
          worth $⁠97, which is the same deal every other surface offers.

          The one control is on the order page, not here, because two mentor
          buttons on one page is the duplication (`D-E4`) this consolidation
          exists to remove. */}

        {/* The steps come BEFORE the control now. The control is the thing she
          taps when she comes BACK from the DLA website, so it cannot sit above
          the instructions it depends on — and the old heading, "What happens
          when you tap this", described a journey the button did not start. */}
        <div className="mp-send__steps">
          <span className="mp-send__stepshead">How to send your price</span>
          <ol>
            <li>Open the DLA website yourself. It looks nothing like this one.</li>
            <li>Sign in with your DLA account.</li>
            {/* All three boxes are named, because the third one is the one she
              cannot find and the one that disqualifies her. */}
            <li>Find three boxes: price, days to deliver, and how long your price is good for.</li>
            {/* D-E4 — this step has to know what the two fields above actually
              rendered. It said "the two numbers above" unconditionally, and on
              an order where the price ladder withdrew or the order paper gives
              no delivery days the fields above read "Price it from your own
              cost" and "Not stated" — so she was told to type two numbers that
              are not on the screen, into a government form. That is the exact
              fear KNOWLEDGE_PERSONA.md names as the thing to design against.
              The second wording is true in every state, and the fields above
              already carry the hint for whichever one is missing. */}
            <li>
              {sendCeiling && o.deliveryDays != null
                ? "Type the three numbers above. Send it."
                : "Type your price, your delivery days, and 90 days. Send it."}
            </li>
          </ol>
          <p className="mp-send__cannot">
            We cannot send it for you. DLA only takes quotes on their own website.
          </p>
        </div>
      </SendStepsWhenReady>

      {/* ── The write ───────────────────────────────────────────────────────
          There is NO preview handler. The two numbers and the four steps above
          render for every member, so the old "See what you would send" control
          had nothing to reveal and did nothing at all when tapped — a full
          width primary button that was a no-op in every reachable state.
          Its ready-state twin was worse: same button, same handler, separated
          only by `if (ready)` and a label swap to "Show me what to send", and
          one tap wrote a QuoteRecord and replaced this block with "You sent a
          price on this one." — before she had opened DIBBS, signed in or typed
          a number. D-D4's rule is that a preview shares no write path with the
          real action and the label changing is not the guard.
          So: one control, named for what it records, placed after the steps it
          depends on, and behind a question. recordQuote() is reachable from
          exactly one handler on this surface. */}
      {/* The blocked sentence and its button moved to the TOP of this section —
          see the comment there. Nothing renders here when she is not ready:
          two copies of one answer, 700px apart, is the D-E4 this round is for.
          The expired-SAM words and destination come from SAM_EXPIRED in the lib
          layer, so PrereqLine and this file cannot state the renewal rule
          differently. */}
      {/* `blocked` is gone with the free mentor: nothing gates the send on a
          review any more. `ready` — her four registrations — is the only
          precondition left, and it is the one the law actually imposes. */}
      {!ready ? null : confirming ? (
        <>
          <p className="mp-send__q">Did you send your price on the DLA website?</p>
          <div className="mp-send__btns">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => recordQuote(o.id, o.nsn, o.deliveryDays)}
            >
              Yes, I sent it
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Not yet
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-lg mp-send__cta"
          onClick={() => setConfirming(true)}
        >
          I sent this to DLA
        </button>
      )}

      {advice.kind === "stale" && (
        <p className="mp-send__body">
          Remember the old price is only a guide here. Work from your own cost.
        </p>
      )}
      {advice.kind === "list" && (
        <p className="mp-send__body">
          Remember DLA's list price is only a guide here. Work from your own cost.
        </p>
      )}
    </section>
  );
}

// The step every competitor skips. The money and the risk are both here, and so
// is the record that makes the whole feature worth doing.
function WonChecklist({
  order: o,
  valueUsd,
  now,
  onNotWon,
}: {
  order: MicroOrder;
  valueUsd: number | null;
  /** The served corpus's day — the note the mentor receives quotes the price
   *  block, and that block only names a figure the day says we stand behind. */
  now: Date | null;
  onNotWon: () => void;
}) {
  const askedMentor = useOrderMentorSent(o.id);
  // Undefined only in the assertion harness, which renders this component
  // outside a RouterProvider; the browser and the server render both have one.
  const wonRouter = useRouter({ warn: false });
  // She volunteered the delivery answer before we asked for it — or the wins
  // page sent her here to give it.
  //
  // THE INTENT TRAVELS WITH THE NAVIGATION. "Orders you won" tells her a record
  // is being held until she answers, and its control carries her to this order.
  // Without this she arrives at "We will ask you on 24 November" under a second
  // button reading the same three words she has just tapped — the same label
  // twice, which reads as a tap that did nothing. `?tell=1` is read off the raw
  // search string rather than the route's parsed search, because this route
  // declares no search schema and a param nothing validates would be dropped.
  const [telling, setTelling] = useState(
    /[?&]tell=1(&|$)/.test(wonRouter?.state.location.searchStr ?? ""),
  );
  const qId = useId();
  // A wrong tap here writes a failure into the one record that vetoes the
  // rollout, so no answer is final. D-D3 applies to the last state as much as
  // the first: "Change this" puts the question back.
  const [changing, setChanging] = useState(false);
  const win = winFor(o.id);
  // The day she promised DLA: the day she won it plus the days on the order
  // paper — the same number step 3 above tells her to deliver within, so the
  // two lines cannot contradict each other. `new Date(<string>)` is parsing,
  // not a clock; the wall clock is the only clock this component reads, and it
  // is the clock `wonOn` was written on.
  const dueOn =
    win != null && o.deliveryDays != null
      ? new Date(new Date(`${win.wonOn}T00:00:00Z`).getTime() + o.deliveryDays * 86400000)
          .toISOString()
          .slice(0, 10)
      : null;
  // Three reads, not two. We hold no delivery days on 9 of the 22 orders in the
  // corpus, and there we cannot name a day to ask on — so we say nothing about
  // one rather than invent it (D-B8). It does NOT mean the order paper is
  // silent: step 3 above tells her to deliver by the date on it.
  const noDueDate = dueOn == null;
  const dueHasPassed = !noDueDate && dueOn! <= wallClockDay();
  // Ask now if the day has come, if she asked to tell us, or if she is changing
  // an answer she already gave. Before any of those, we said we would wait —
  // including when we have no date, which is 39% of this corpus and where the
  // six-button screen would otherwise survive the fix.
  const askNow = dueHasPassed || telling || changing;
  return (
    <div className="mp-won">
      <p className="mp-won__head">
        <Check size={17} aria-hidden className="mp-ic-ok" />
        You won it. Here is what happens now.
      </p>
      <ol className="mp-won__steps">
        <li>Buy the parts.</li>
        <li>Pack them the way the order paper says.</li>
        {/* The same null guard as the send block 130 lines up, and the same
            one the order page applies three times. Missing it here rendered
            "Deliver within  days." on the one screen that lists what she is
            now contractually on the hook for — and a missed delivery date is
            the termination-for-cause the page warns her about. */}
        <li>
          {o.deliveryDays != null
            ? `Deliver within ${o.deliveryDays} days.`
            : "Deliver by the date on the order paper."}
        </li>
        <li>
          Send your bill through PIEE. <b>You cannot get paid any other way.</b>
        </li>
      </ol>
      {/* The claim must match the record. `valueUsd` is null whenever she said
          she did not remember her price, or the order has no quantity — and on
          those orders this sentence still promised "what it was worth". The
          rest of the feature abstains rather than guesses; this one line
          over-claimed. "ring" is Commonwealth English for telephone, on the
          payoff sentence of the whole feature. */}
      {/* "Buyers call that person before they give you work" made the subject
          and the antecedent the same word: buyers calling a buyer, with nothing
          saying they are two different people. Rewritten to name them, it
          became a second, larger claim: that the DLA contact we saved will be
          RUNG AND ASKED ABOUT HER WORK. DIBBS awards a micro-purchase without a
          human reading her quote, so the person on the solicitation has never
          heard of her; a contracting officer following that instruction reaches
          a DLA switchboard and is told nobody there knows the supplier. The
          record is real evidence and worth every word we give it — it is
          CHECKABLE, which is a different and truer promise than a referee. */}
      <p className="mp-won__record">
        {valueUsd != null
          ? "Hunter saved this order: what you sold, what it was worth, and who bought it."
          : "Hunter saved this order: what you sold, and who bought it."}{" "}
        The next government buyer can check with DLA that you really did this work.
      </p>
      {/* ── Did you deliver it? ──────────────────────────────────────────
          The PRD's counter-metric holds an absolute veto — "wins the member
          could not deliver", any non-zero value halts the rollout — and it
          reads PastPerformanceRecord.outcome. Nothing wrote that value and
          nothing ever asked the question, so the veto was armed over a field
          no code could set (D-G5). This is the only writer.

          It is not an accusation and it may never become one. She is telling
          us she was late, or that she could not finish — the hardest thing to
          say to a piece of software. So: no red, no warning icon, no
          exclamation, no "failed", and the same button weight on all three
          answers. The reason we ask is stated plainly, because the honest
          reason is one she benefits from.

          The buttons render in BOTH branches. Gating them on the delivery date
          would put the write path behind a clock that does not move, which is
          exactly how "Still waiting" became a dead end twice (D-D3). The line
          above them changes what it SAYS, not what she can do. */}
      {win != null && (win.outcome === "unknown" || changing) ? (
        askNow ? (
          <>
            <p className="mp-send__q" id={qId}>
              Did you deliver it?
            </p>
            <p className="mp-send__cannot">
              Only Hunter sees this. We do not tell DLA. A job you cannot finish is one we should
              not send you again.
            </p>
            {/* One question, and the four answers are grouped under it. They used
              to render whether or not the question was on screen, so a member
              scanning the buttons had nothing telling her what they answered.
              A visual rule under this group is the other half of the fix. */}
            <div className="mp-send__btns" role="group" aria-labelledby={qId}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  recordDelivery(o.id, "delivered");
                  setChanging(false);
                }}
              >
                Yes, I delivered it
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  recordDelivery(o.id, "late");
                  setChanging(false);
                }}
              >
                I delivered it late
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  recordDelivery(o.id, "not_delivered");
                  setChanging(false);
                }}
              >
                I could not deliver it
              </button>
              {/* "Not yet" is a real answer and it records one: deliveryAsked
                without an outcome. It is dropped once she has given it, rather
                than left on screen as the one button that now does nothing. */}
              {!win.deliveryAsked && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => recordDelivery(o.id, "unknown")}
                >
                  Not yet
                </button>
              )}
            </div>
          </>
        ) : (
          /* The minute she records her first federal win, this screen used to
             present six controls of identical weight and no primary — four of
             them answering a question about a delivery ninety days away, one
             undoing the win — directly under a sentence that had just told her
             we would ask her later. It said "we will ask you on 24 November"
             and then asked.
             Right after a win the focal action is none: she should read the
             four steps and go and buy the parts. The question waits for its
             own date, and one control lets her volunteer sooner. */
          <>
            <p className="mp-send__waiting">
              {win.deliveryAsked || noDueDate
                ? "Tell us when it is done."
                : `We will ask you on ${fullDate(dueOn!)} if you delivered it.`}
            </p>
            <div className="mp-send__btns">
              <button type="button" className="btn btn-secondary" onClick={() => setTelling(true)}>
                Tell us how it went
              </button>
            </div>
          </>
        )
      ) : win != null ? (
        <>
          <p className="mp-send__body">
            {win.outcome === "delivered"
              ? "You delivered it. Hunter saved that with the job."
              : win.outcome === "late"
                ? "You delivered it late. Hunter saved that with the job."
                : "Thank you for telling us. Hunter saved that with the job."}
          </p>
          {/* NOT "Change this". It sat directly above "I did not win it" — two
              undos on one screen, one of them named after nothing, and she
              cannot tell which answer "this" refers to. The win control was
              given its subject and the delivery control beside it was left
              generic; the rule is in the comment at the bottom of this file. */}
          <div className="mp-send__btns">
            <button type="button" className="btn btn-ghost" onClick={() => setChanging(true)}>
              Change what I said about delivery
            </button>
          </div>
        </>
      ) : null}
      <div className="mp-won__btns">
        {/* One control, and it goes somewhere. The capability-statement button
            that sat here was dead and contradicted the sentence above it —
            recordWin() has already saved the job, so "add this" was work she
            had no reason to do. */}
        {/* The capacity gate reached two of the three controls that spend it.
            This one — on an order she has already WON, where the ask is not a
            quote review at all — called askedForReview() directly and spent the
            same weekly capacity it was not subject to. Three taps here
            exhausted the cap, and the control on a code-unknown order, where
            the mentor IS the whole answer, then replaced itself with the cap
            sentence.
            The spend now runs through one helper that owns the cap, so a fourth
            caller cannot get past it, and this control says when the route
        {/* ONE MENTOR MODEL, HERE TOO (Karthik, 24 Aug 2026). This was the third
            caller of the free weekly cap, and the odd one out even then: the ask
            on an order she has already WON is not a quote review, and it spent
            the same three-a-week capacity as the control on a code-unknown
            order where a mentor was the whole answer. Three taps here exhausted
            it. Now it is the same $⁠97 wallet review as everywhere else, so a
            question about a won order cannot consume anything a question about
            a future one needs. */}
        {askedMentor ? (
          <>
            <p className="mp-won__asked">{ORDER_MENTOR_SENT}</p>
            <OrderMentorNotice orderId={o.id} />
          </>
        ) : (
          // A won order is past its closing day, so the 3-day deadline gate the
          // backend enforces always refuses it. The control hides rather than
          // sit there disabled for good.
          <OrderMentor
            order={o}
            whatSheIsSending={`You won this one. ${priceAdvice(o, now).headline}`}
            label="Send to a mentor"
            className="btn btn-secondary"
            hideWhenTooLate
          />
        )}
        {/* The win had no inverse. Every other answer on this surface can be
            taken back — the delivery answer says so in its own comment — and
            this was the one that could not, on the screen that writes the
            record everything downstream reads. Her words, not "Change this":
            the delivery question two blocks up already owns that label, and one
            screen must never carry the same label for two different subjects. */}
        <button type="button" className="btn btn-ghost" onClick={onNotWon}>
          I did not win it
        </button>
      </div>
    </div>
  );
}
