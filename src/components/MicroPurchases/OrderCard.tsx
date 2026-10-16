// One order in the list. Six lines, and everything else is on the order page.
//
// Deliberately NOT a table row. DIBBS Navigator shows twelve columns and DIBBS
// itself shows eight plus five icon vocabularies; both are correct for an analyst
// with a wide monitor and wrong for a first-time seller holding a phone.
//
// What the card carries, in the order she reads it:
//   what it is · how many · what DLA paid · where she has got to on it ·
//   when it closes · who may sell it · does it repeat
//
// What it deliberately does NOT carry: stock number, solicitation number, supply
// class, agency, place of performance, freight terms, acquisition code. Showing
// too much is the default failure mode.
//
// SET-ASIDE USED TO BE ON THAT SECOND LIST and was moved to the first on
// 20 August 2026. The argument is at the render site in the card foot, not
// here, because that is where the next person to reopen it will be standing.
// In short: everything still on the second list is metadata that does not
// change what she may do, and set-aside was filed with it back when nothing on
// the board mentioned set-aside. hunterSummary() now counts it in the headline
// above these cards, so omitting it leaves a stated count with no row to
// attach it to.
import {
  RotateCw,
  Zap,
  Check,
  Users,
  CalendarDays,
  ChevronRight,
  Truck,
  AlertTriangle,
} from "lucide-react";
import type { MicroOrder } from "../../lib/microPurchases/order";
import { Figure } from "./Figure";
import { CategoryIcon } from "./CategoryIcon";
import {
  shortDate,
  orderValue,
  usd,
  priceAdvice,
  pricePoint,
} from "../../lib/microPurchases/pricing";
import { quantityLine, unitNoun } from "../../lib/microPurchases/units";
// The one owner of "who may sell this one", shared with the order page verdict,
// the board headline and the held-back list rather than re-derived from
// `o.setAside` here (D-E4). `ourGap` comes from the same owner and answers the
// other half: which of OUR two shortcomings stopped us ruling on this order.
import {
  bidCell,
  mayBid,
  ourGap,
  overCapNote,
  setAsideNote,
} from "../../lib/microPurchases/relevance";
// Her own record of this order. Read, never written — the card has no controls.
import { quoteFor } from "../../lib/state/microPurchases";

/**
 * A title slot never shouts.
 *
 * When A1 has no plain rewrite for an item, `plainName` is DLA's own
 * nomenclature and DLA writes it in capitals: MANIFOLD ASSEMBLY, TRANSISTOR,
 * GASKET. Passed through to a heading that breaks sentence case and the type
 * rhythm of the whole list, and reads as a raised voice to someone already
 * unsure she belongs here.
 *
 * Only touches a string with no lowercase letter in it at all, so a real
 * rewrite ("Loop clamp") is never re-cased. It does NOT un-invert DLA's comma
 * form — "WASHER, FLAT" becomes "Washer, flat", not "Flat washer". That is a
 * rewrite, and rewriting is A1's job, not the card's.
 */
export function plainTitle(name: string): string {
  if (/[a-z]/.test(name)) return name;
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * The one chip in the card foot that answers "when", and the one place on the
 * board that may tell her to act.
 *
 * WHAT IS TRUE OF HER, BEFORE WHAT IS TRUE OF THE ORDER.
 * recordQuote() now pushes the order into `savedOrderIds` so a sent quote
 * outlives the closing date and she has a route back to it — and the card that
 * carries her back was never told. The board rendered "DLA can buy this at any
 * time. Quote today." under "Ones you kept", on an order she had already
 * quoted: an invitation to do the thing she has done, on the one row where the
 * product knows better. "Ones you kept" now heads two different things and the
 * row has to say which.
 * READ FROM STATE, NOT FROM A PROP. `attested` arrives as a prop, but the board
 * is not in this lane and a fact the card can read for itself does not need a
 * fifth prop to reach it. The parent subscribes through useLiveSlice, so this
 * re-reads on every commit that could change it.
 * One sentence for all three quote outcomes — pending, won and lost — because
 * all three make "Quote today" false and none of them is resolved on a list row.
 *
 * THE RAIL IS CHIPS NOW, 30 August 2026. This read "DLA can buy this at any
 * time. Quote today." — a two-clause sentence in a 168px column, which is four
 * lines of the tallest thing on the row. The clause that was cut is the
 * EXPLANATION, not the instruction, and it is not lost: the order page prints
 * it in full, one tap away, in the block that decides whether she quotes. What
 * survives here is the half she acts on, which is the half a list row is for.
 * The order page's string still opens with these exact words. NO GATE HOLDS
 * THAT — no spec in this repo compares the two strings — so keep the shared
 * opening by hand, and never make the two identical.
 *
 * AND IT STANDS DOWN ON AN ORDER WE COULD NOT RULE ON, 10 September 2026.
 * DH-34 widened the board: a row carrying `ourGap()` is on the main list now,
 * with `gapNote().card` in its why-line — "No acquisition code available at
 * source." An inch under that sentence this chip printed "Quote today" on 3
 * of the 8 gap rows of the live-mapper board. An instruction to act, under a
 * sentence saying we cannot tell who may sell the part.
 * It is the stand-down `sendable` already makes on the order page, and it is
 * the same shape: the verdict decides whether an imperative may be printed.
 * `ourGap()` is READ here and nothing about it is decided here — `mayBid()`
 * owns the verdict and gains nothing from this file.
 * THE FACT SURVIVES, THE INSTRUCTION DOES NOT. A fast-award order really can be
 * awarded before its listed date, and an order with a real closing date has a
 * real deadline she may still want to meet. So the timing fact keeps its slot
 * and takes the neutral chip beside it: `.mp-card__urgent` is the treatment for
 * a row we are asking her to act on today, which this is not.
 * `OrderCard.gap.test.tsx` renders every row of the live-mapper board and
 * asserts no gap row carries the imperative. It also asserts a fast-award row
 * we DID rule on still carries it, because a foot that went quiet everywhere
 * would pass the first assertion and lose the four rows the board is for.
 */
function DeadlineChip({ order: o }: { order: MicroOrder }) {
  if (quoteFor(o.id) != null) {
    return <span className="mp-card__closes">You sent a price on this one.</span>;
  }
  const cannotRule = ourGap(o) != null;
  // On a fast-award order the closing date is not the deadline, so it does not
  // get to sit here pretending to be one. The words on the gap arm are the
  // words the order page's key facts print for the same flag.
  if (o.fastAward) {
    return cannotRule ? (
      <span className="mp-card__closes">DLA can buy at any time.</span>
    ) : (
      <span className="mp-card__urgent">
        <Zap size={13} aria-hidden />
        Quote today
      </span>
    );
  }
  // A missing closing date is not "no rush" — it means we cannot tell her how
  // long she has, so the honest reading is urgency. On a row we could not rule
  // on, the honest reading is the missing date and nothing more.
  if (o.closesOn == null) {
    return cannotRule ? (
      <span className="mp-card__closes">No closing date.</span>
    ) : (
      <span className="mp-card__urgent">
        <Zap size={13} aria-hidden />
        No closing date. Quote today
      </span>
    );
  }
  return (
    <span className="mp-card__closes">
      <CalendarDays size={13} aria-hidden /> Closes {shortDate(o.closesOn)}
    </span>
  );
}

export function OrderCard({
  order: o,
  why,
  seen,
  attested,
  now,
  onOpen,
}: {
  order: MicroOrder;
  why: string;
  seen: boolean;
  attested: "yes" | "no" | null;
  /** The day the board was served for. Both money figures on this card age an
   *  award against it, and the board judges every other date on it too — a card
   *  reading its own clock is a second clock on one screen. See `corpusNow()`. */
  now: Date | null;
  onOpen: () => void;
}) {
  const value = orderValue(o, now);
  const advice = priceAdvice(o, now);
  const priceSource = pricePoint(o)?.source ?? null;
  const setAside = setAsideNote(o);
  // ONE READER OF A THREE-STATE FACT, for both places on this card that state it.
  // The money caption below and the pill in the foot were two independent reads
  // of the order's repeat flag, and the seeded mutation that flips that field to
  // false changed only the first: the card then rendered "The order paper does
  // not say if it is a year of orders" over a pill reading "A year of orders" —
  // the caption she sorts by contradicting the row an inch beneath it, with
  // 1021 assertions green (scripts/mutate.ts, [render]). Two readers of one
  // field is how they drift; this is the reader. Three states, never two, and
  // the field is not named again below this line — both render sites read the
  // value, so neither can hold an opinion the other does not.
  //
  // NOTHING ABOVE THIS LINE MAY NAME THE FIELD IN CODE FORM. mutate.ts does a
  // first-occurrence string replace, so a mention in a comment above the read
  // would absorb the mutation and report the hole as closed while leaving it
  // open — the same shape of lie the pristine control exists to prevent.
  const yearOfOrders: "yes" | "no" | "unsaid" =
    o.repeats === true ? "yes" : o.repeats === false ? "no" : "unsaid";

  return (
    // Whole-card click-through (design system: `.is-clickable-card`). The card is
    // the target, not just its title. There are no controls inside it at all —
    // saving happens on the order page, once she has actually seen the thing —
    // so there is nothing to stopPropagation on.
    <article
      className={`mp-card mp-card--offer is-clickable-card${seen ? " is-seen" : ""}`}
      role="link"
      tabIndex={0}
      // Release focus before opening — see the design-system note on clickable cards.
      onClick={(e) => {
        e.currentTarget.blur();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.blur();
          onOpen();
        }
      }}
    >
      {/* THE MARK · WHAT IT IS · WHAT IT IS WORTH · WHAT TO DO ABOUT IT — four
          columns on a wide screen, one on a phone. The stack this replaced
          spent its whole width on every line, so the sentence she acts on
          ("Quote today.") sat below the caption she only reads once, and the
          row's height was set by the longest sentence on it rather than by the
          figure she scans.
          Nothing has been added to the row and nothing cut: the same seven
          facts in the same reading order, folded so the two she SORTS by — the
          money and the deadline — are level with each other, and level with the
          same two on every other row.
          The mark is decoration and says so (`aria-hidden`, category art, not
          the item), so it is outside `.mp-card__main` and outside the reading
          order both. */}
      <CategoryIcon category={o.category} />
      <div className="mp-card__main">
        {/* THE CHIP SAYS THE THING. It read "Yours", one word whose only
          explanation was a `title` attribute — "You said you can get this one" —
          and a title attribute fires on nothing this member holds. Read alone,
          which is how a chip IS read, "Yours" could mean you own it, you won it,
          you kept it or you supply it, and the copy gate could not see it
          either: looksLikeCopy() skips any string with no whitespace, so the one
          word on the card no reader could resolve was also the one word no gate
          could check. Now it is her sentence, short enough for the slot.
          It is not a duplicate of the why-line below: whyThisOrder() spends that
          line on a declined, won or supplied answer when it has one, so this is
          the only place several cards state it at all. */}
        <div className="mp-card__head">
          <span className="mp-card__title">{plainTitle(o.plainName)}</span>
          {attested === "yes" && (
            <span className="mp-card__mine">
              <Check size={13} aria-hidden /> You can get this
            </span>
          )}
        </div>

        {/* WHO IS BUYING, beside how many. `buyer` is on this file's own list of
            things the card deliberately does not carry, and that entry is
            overturned here rather than ignored. It was filed with the stock
            number and the freight terms as analyst metadata — true of a card
            that showed one order at a time. On a list it is the fastest way to
            tell two rows apart when their names are near-identical, which on
            DLA nomenclature is most of them, and it is the only field on the
            row that says which part of DLA she would be dealing with. */}
        <p className="mp-card__qty">
          {quantityLine(o.quantity, o.unitOfIssue)}
          {o.buyer ? <span className="mp-card__buyer"> · {o.buyer}</span> : null}
        </p>

        {/* THE UNIT WARNING LIVES ON THE ORDER PAGE, NOT ON THE ROW (20 Aug 2026).
          It is the 100x guard and it is not being weakened: `unitWarning()` is
          unchanged and every one of its six sentences still renders verbatim on
          the order page — verified on mp-006, mp-097 and mp-098.

          What changed is WHERE. On the board it was the loudest element on the
          page: a bordered warning block on the cards that carry the LEAST usable
          information, since the same odd units that trigger it are why we cannot
          price those orders at all. Half the board was orders she cannot price,
          rendered taller and louder than the four she can act on.

          A warning earns its place at the moment it changes a decision. She
          cannot set a price from this row — there is no send control here — so
          the decision it guards is made one tap away, on the page that carries
          it. Keeping it here made the board harder to scan to protect a price
          she is not yet typing. */}

        {/* ONE FACT, ONE OWNER, ON ONE CARD (D-E4). The pill above already says
          "A year of orders" and `whyThisOrder()` returns "You give one price and
          it lasts all year." for the same records — the same fact twice, forty
          pixels apart, on the row she scans. The pill is the better owner: it is
          a mark she can catch without reading, and it sits with the other marks.
          So the why-line stands down where the pill has already said it, and
          keeps every other reason it gives. */}
        {!(yearOfOrders === "yes" && /lasts all year/.test(why)) && (
          <p className="mp-card__why">{why}</p>
        )}
      </div>

      {/* WHAT THE ORDER ASKS OF HER, between what it is and what it is worth.
          Two facts that decide whether she reads any further and that were
          reachable only by opening the order: how long she has to deliver, and
          whether she is allowed to bid at all. Delivery was on no board surface
          at all — `deliveryDays` is 95% covered with a live median of 86 days,
          and a member who can only turn work around in a fortnight was being
          asked to open eight pages to find that out.
          The set-aside MOVED here from the foot rather than being added: it
          answers "may I", which is this column's question, and the foot is
          about when to act. It keeps its neutral treatment for the reason it
          always had — set-asides are ~50.5% of live orders and four in five are
          SBA, which for a five-person company is favourable news, so this
          states the division and does not judge it. */}
      <div className="mp-card__terms">
        {/* THE CAP IS A MARK, NOT A DELETION (owner, 2026-09-16). An order worth
            more than the micro-purchase limit used to be dropped from the board
            while the count above went on counting it. It is a fact about the
            order and it sits with the other two facts that decide whether she
            reads on. It states the fact and gives no instruction: the limit is
            a rule about the BUYING METHOD, not a refusal by DLA, and the order
            page carries what she does about it. `overCapNote()` owns the words
            and the ruling; nothing here reads a price. */}
        {overCapNote(o, now) != null && (
          <span className="mp-card__over">
            <AlertTriangle size={13} aria-hidden /> {overCapNote(o, now)}
          </span>
        )}
        {o.deliveryDays != null && (
          <span className="mp-card__deliver">
            <Truck size={13} aria-hidden /> Deliver within {o.deliveryDays} days
          </span>
        )}
        {/* ONE FACT, ONE MEANING, ON BOTH SCREENS. This read "Not open to every
            seller" for ANY set-aside — including the SBA small-business kind,
            where `needsCertificate` is false and the order page's own sentence
            is "Any small company can bid this one." Same fact, opposite
            meanings, and the discouraging one sat on the screen where she
            decides whether to tap. The note it should have been reading was
            already there and already correct (D-E4).
            The no-set-aside case is stated rather than left blank: silence on
            "may I bid" is the question the whole restricted list exists
            because members cannot answer. */}
        <span className="mp-card__who">
          <Users size={13} aria-hidden />{" "}
          {/* Never "Anyone can bid" over an order whose acquisition code is
              missing or has no ruling: the row's own line says it is not clear. */}
          {ourGap(o) != null
            ? "Not clear who can bid"
            : /* A RULED REFUSAL SAYS SO. Without this line every order DLA's
                 codes refuse read "Anyone can bid" here whenever it carried no
                 set-aside — the acquisition pair was not consulted at all. The
                 words come from `bidCell()`, the one owner of the verdict the
                 order page prints, so the row she taps from and the page she
                 lands on cannot disagree (D-E4). */
              !mayBid(o)
              ? bidCell(o).verdict
              : setAside == null
                ? "Anyone can bid"
                : setAside.who == null
                  ? "Not open to everyone"
                  : setAside.needsCertificate
                    ? `Only for ${setAside.who}`
                    : "For small companies"}
        </span>
      </div>

      {/* THE MONEY IS ITS OWN COLUMN NOW, not the third line of the words.
          It was stacked under the name and the count, so the figure she scans
          the list WITH sat at a different height on every row — the caption
          above it is one line on a priced order and three on an unpriced one,
          and a column of numbers that does not line up is a column she has to
          read instead of scan. Lifted out, the figures sit level and the
          hairline beside them says where the words stop and the money starts.
          Same element, same caption, same required-caption rule: `Figure` is
          untouched and nothing here can print a naked number.
          On a phone there is no room for a fourth column, so it drops back
          under the words — see the base grid in styles.css. */}
      <div className="mp-card__money">
        {/* The one number that decides whether this is worth opening — and the rule
          that it can never appear without saying what it means. */}
        {value == null ? (
          <Figure
            words
            // The honest answer to "what will DLA pay" when we will not stand
            // behind a total. One sentence for BOTH reasons we get here — no
            // past price, and a price too old to derive a total from — because
            // the action is identical and the caption below is what differs.
            //
            // "Too old to price from." used to sit here on the stale branch, and
            // it was wrong three ways. It occupied the figure slot with a verdict
            // instead of the evidence, so a stale card showed no figure at all
            // while the order page one tap later quoted "$9.50 for each piece, in
            // November 2023" — the card and the page telling different stories
            // about the same record (`D-E4`). Its caption read "too old to GO BY",
            // a phrasal verb the copy gate's idiom list does not carry, in the
            // exact slot where "No price to go on" was removed for being one. And
            // `stale` fired on `kind === "stale"`, which pricing.ts also returns
            // for a price carrying NO DATE — so "too old" was an age claim on a
            // record whose age we do not hold, which is the one thing that branch
            // of pricing.ts exists to refuse (PRD 15 B4: the NSN object has no
            // date field, so live that is the default case, not an edge).
            value="Price it yourself."
            // Word for word what the order page's Hunter block says about this
            // same record — it IS that string, not a second copy of it. Every
            // branch of it is true without an age claim we cannot support: "I do
            // not know what this one sells for.", "DLA paid $9.50 for each piece,
            // but that was in November 2023.", "DLA paid $604 for each piece."
            caption={advice.headline}
          />
        ) : (
          <Figure
            value={usd(value)}
            // The estimate sweep reached priceAdvice, the item-count caption and
            // the cash question, and stopped one surface short of the one she
            // SCANS and SORTS by (`D-F5`). On a repeat contract the quantity is an
            // annual estimate DLA may buy none of.
            // THREE STATES, BECAUSE THE FACT HAS THREE. `repeats` is
            // `boolean | null` and this tested truthiness, so "the order paper did
            // not say" rendered the settled one-time claim — the same collapse on
            // the same field that the win record and the capability statement
            // carried, and the only one of the four on the surface she SORTS by.
            // Live `repeats` is true about 95% of the time and never false, so an
            // unknown is MORE LIKELY THAN NOT a year of orders whose quantity DLA
            // may never buy: guessing "one-time buy" is guessing the wrong way
            // (D-B1, D-A7). The unknown names itself, the treatment
            // `needsDrawings` got, rather than being hedged without a reason —
            // a caution with no cause is the wallpaper the drawings note was moved
            // out of the verdict to avoid.
            // SHORTENED WITH THE COLUMN, 30 August 2026, and the two moved
            // together for one reason: the caption is now 168px wide, not 600.
            // These were full sentences written for a caption that had the whole
            // card to lie across — "What the first year is worth, if DLA buys the
            // whole estimate." At column width that sentence set five lines under
            // a two-line figure and made a 72px row 250px tall, which cost the
            // list the one thing the columns were built to give it: five money
            // figures she can compare without scrolling. A caption that destroys
            // the scan it labels is not carrying its own weight.
            // NOTHING IS HEDGED AWAY. "No naked numbers" is intact — the figure
            // still cannot render without saying what it is — and the fact stays
            // THREE-STATE, which is the whole reason the middle arm exists. The
            // unknown is still the only arm that spends words, because it is the
            // only one making a claim about the record rather than naming the
            // number: guessing "one-time buy" on a field the paper left blank is
            // guessing the wrong way (D-B1, D-A7), and live `repeats` is true
            // ~95% of the time and never false.
            // A list price is not a price DLA paid, so the caption names it.
            caption={
              yearOfOrders === "yes"
                ? "First year estimate"
                : yearOfOrders === "no"
                  ? priceSource === "list"
                    ? "At DLA's list price"
                    : "Price paid last time"
                  : priceSource === "list"
                    ? "At DLA's list price. The order paper does not say if it repeats."
                    : "Price paid last time. The order paper does not say if it repeats."
            }
            // THE PER-UNIT PRICE IS BACK, 31 August 2026, and this reverses a
            // decision made on 20 August. What it read then was "That is $8.40
            // for each piece." — a full sentence, at caption weight, under
            // every priced card in a single-column stack, where it was a second
            // money figure competing with the first for the same eye. The
            // objection was to the SHAPE, and the shape has changed: the figure
            // now has a `note` slot, one step quieter than the caption, in a
            // column beside two others rather than in a stack.
            // It earns the slot because the total above it is a MULTIPLE. On a
            // year-of-orders row that total is an annual estimate DLA may buy
            // none of, so the only number on the row she can actually price
            // against is the unit one — and without it the two rows reading
            // "$2,520" and "$12,600" say nothing about whether either is work
            // she can do.
            // `pricePoint`, not `lastPricePerUnit`: it is the one reader that
            // refuses a price we will not stand behind, and `unitNoun` keeps it
            // off "each" on the 9% of records whose unit of issue is not EA —
            // the same 100x trap the unit warning on the order page guards.
            note={(() => {
              const point = pricePoint(o);
              const noun = unitNoun(o.unitOfIssue);
              if (point == null || noun == null) return undefined;
              return point.source === "list"
                ? `Listed at ${usd(point.amount)} for each ${noun}`
                : `Last paid ${usd(point.amount)} for each ${noun}`;
            })()}
          />
        )}
      </div>

      <div className="mp-card__foot">
        <DeadlineChip order={o} />
        {/* THE COUNT ON THE BOARD NOW HAS A ROW TO POINT AT.
            hunterSummary() says "3 orders today are open to any seller. 1 more
            has rules about who can bid." and not one card carried the mark, so
            the only way to find the one was to open all four — with the
            restricted row FIRST and four times the value of anything else.
            This file's own header lists "set-aside" among what the card
            deliberately does not carry, and that decision is overturned here
            rather than ignored. The rest of that list — stock number,
            solicitation number, supply class, agency, place of performance,
            freight terms, acquisition code — is analyst metadata that does not
            change what she may do, and set-aside was filed with it when NOTHING
            on the board mentioned set-aside. The premise is gone: once the
            board states the fact in aggregate, a card that omits it is not
            restraint, it is a claim with no referent, and "showing too much"
            was never an argument for a count she cannot resolve.
            A FACT, NOT A WARNING. Set-asides are 50.5% of live DIBBS orders and
            four in five are SBA, which for a small company is favourable news —
            DLA kept it away from the primes. So this takes the neutral pill the
            foot already uses, no colour and no alert icon, and states the
            division rather than judging it. Both tiers are marked, because the
            headline counts both; which tier it is, and whether she needs a
            certificate, is the order page's sentence and stays there.
            Worded off "open to any seller" — the headline's own words, and the
            noun both halves of the board share — so it survives the bid/sell
            verb standardisation without drifting away from the count it
            explains. */}
        {/* ONE FACT, ONE MEANING, ON BOTH SCREENS.
            This read "Not open to every seller" for ANY set-aside — including
            the SBA small-business kind, where `needsCertificate` is false and
            the order page's own sentence is "Any small company can bid this
            one." Same fact, opposite meanings, and the discouraging one sat on
            the card, which is the screen where she decides whether to tap.
            Set-asides are ~50.5% of live DIBBS orders and most are the SBA
            kind, so this mislabelled about half the real board in the direction
            that stops a five-person business acting — on exactly the half most
            winnable by one. The note it should have been reading was already
            there and already correct (D-E4). */}
        {/* THE SET-ASIDE IS NOT IN THIS FOOT ANY MORE. It moved up into
            `.mp-card__terms`, which is the column that answers "may I bid".
            The foot answers "when", and the two were sharing a rail because the
            row had no third column when the mark was added on 20 August 2026.
            The count on the board still has a row to point at: hunterSummary()
            says "3 orders today are open to any seller. 1 more has rules about
            who may bid.", and every row now states which of the two it is —
            including the ones with no set-aside at all, which used to say
            nothing and left the count with only half its referents. */}
        {yearOfOrders === "yes" && (
          <span className="mp-card__repeat">
            <RotateCw size={12} aria-hidden /> A year of orders
          </span>
        )}
      </div>

      {/* THE ROW SAYS IT OPENS SOMETHING. The whole card has been a link
          since the day it shipped and nothing on it said so: the only
          affordance was a hover lift, which a phone does not have, and a
          `role="link"` no sighted member reads. On a list of five rows that
          are all links, the tax is not "can I tap this" but "is there
          anything behind this at all". Decoration, so `aria-hidden` — the
          role is what carries it to a screen reader, and a second link
          announcement inside the link would be one target twice. */}
      <ChevronRight className="mp-card__go" size={18} aria-hidden />
    </article>
  );
}
