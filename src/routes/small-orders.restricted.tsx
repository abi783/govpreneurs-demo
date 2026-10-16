// The ones she cannot bid yet — a destination, not a hidden filter.
//
// If "you can bid everything on this list" is the promise the main list makes,
// a toggle that quietly breaks it is worse than a separate place. This route
// also has a different job: explaining WHY, and what it would take.
//
// The two reasons are not the same and must not be shown the same way:
//   restricted suffix  → a Source Approval Request could fix it
//   method 3, 4 or 5   → one supplier is available, and no form changes that
// Telling her to file a request she cannot win would be worse than saying nothing.
//
// GROUPED BY REASON, not listed by part. This page was ten near-identical cards
// over 2,375px of scroll, seven of them repeating the same three sentences word
// for word, every one wearing a LOCKED chip on a page already titled "Not open
// to you". Four screens to learn one fact that applied to seven rows, on a page
// she reaches after she has already been told no. The reason is stated ONCE per
// group; each row carries only what is different about it — its name and its
// code.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileSearch, Users, HelpCircle } from "lucide-react";
import { useGhlUser } from "../lib/ghlUser";
import { openMentorsPage } from "../lib/ghlNav";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import { usePageMeta } from "../components/Layout/page-meta";
import { AgentAvatar } from "../components/Companion/AgentAvatar";
import { plainTitle } from "../components/MicroPurchases/OrderCard";
import { CategoryIcon } from "../components/MicroPurchases/CategoryIcon";
import { restrictionOf, type CensusRow, type Restriction } from "../lib/microPurchases/relevance";
import { type MicroOrder } from "../lib/microPurchases/order";
import { ASK_MENTOR_FIRST } from "../lib/microPurchases/mentor";
// The FEED owns the day this surface is read for, and hands it over with the
// orders. This route used to import the board's `AS_OF` — a day derived from
// the fixture's `TODAY` — which was the right instinct (one derivation, not
// two) applied to the wrong owner: neither page has any business deriving a day
// the server already sent (D2).
import {
  fetchCodeCensus,
  fetchSmallOrdersFeed,
  type SmallOrdersNextPage,
} from "../lib/microPurchases/api";
import { reasonGroupsFromCensus, routeRank } from "../lib/microPurchases/restrictedGroups";
import type { MicroCategory } from "../lib/microPurchases/categories";
import { getMicroState, hydrateMicroState } from "../lib/state/microPurchases";
import { useLiveSlice } from "../lib/eventBus";

export const Route = createFileRoute("/small-orders/restricted")({
  component: RestrictedPage,
});

/**
 * The plural of each restriction headline, for the heading over its group.
 *
 * `restrictionOf` writes its headlines about ONE order — "Only one supplier can
 * fill this one." — which is wrong over a list of seven. Keyed on the
 * singular so a headline reworded in relevance.ts shows up here as a missing
 * key rather than as a heading that quietly says the wrong thing. The fallback
 * below uses the singular verbatim, so a missing key leaves the page truthful
 * and slightly off rather than wrong.
 *
 * A GATE HOLDS THIS IN BOTH DIRECTIONS. `small-orders.restricted.test.ts`
 * takes the pairs this page can hold from `queryOrders()`, groups two of each,
 * and fails when a headline the page renders has no plural here. A second case
 * fails when an entry here has no PRODUCER, which is how the three headings
 * for the tiers DH-34 moved onto the board were found. Every entry below is
 * ALSO named in a case of its own with its exact words, so deleting one fails a
 * test that says which.
 * `liveCorpus.heldBackLedger.test.ts` runs `groupByReason()` over the live
 * corpus and checks which orders land in which group. It does not check the
 * plurals.
 */
export const GROUP_HEAD: Record<string, string> = {
  "Only approved sellers can quote this one.": "Only approved sellers can quote these",
  // THE LIMITED-COMPETITION TIER, AND IT IS NOT THE LINE ABOVE IT. That one is
  // the Source Approval Request tier, where a form exists. This one is DLA
  // competing each order among the sellers it already holds, with no form named
  // in the paragraph. "for these", not "for this one": one set of sellers per
  // part, not one set over the whole group.
  "DLA is only asking the sellers it already has for this one.":
    "DLA is only asking the sellers it already has for these",
  // THE QUALIFIED-PRODUCTS-LIST TIER, AND IT IS NEITHER LINE ABOVE IT. "lists",
  // plural: DLA keeps a qualified products list PER PART, so a group of thirty
  // stands over thirty lists, not one. The verb stays "quote" — it is the word
  // the Source Approval line uses for the same kind of limit, and one
  // vocabulary is what lets her compare two verdicts at a glance.
  "Only sellers on DLA's qualified list can quote this one.":
    "Only sellers on DLA's qualified lists can quote these",
  "DLA is not taking new sellers for this one.": "DLA is not taking new sellers for these",
  // THE TWO DEAD ENDS THE BUYING METHOD CLOSES, and both say "each" because
  // DLA's code says one supplier is available for ONE part. Over a group that
  // is one supplier per row, not one supplier for the whole group, and the
  // shorter wording claims a single company we have no evidence for.
  "DLA is buying this commercial part from one supplier.":
    "DLA is buying these commercial items from one supplier each",
  "Only one supplier can fill this one.": "Only one supplier can fill each of these",
};

/**
 * The plural of each restriction BODY, on exactly the mechanism above.
 *
 * The heading was pluralised and the sentence under it was not, so the page
 * shipped "I am not sure who may sell these (2)" directly over "Ask your mentor
 * before you spend time on this one." — the same defect the map above exists to
 * prevent, one line lower, on the sentence carrying the next step. Keyed on the
 * singular for the same reason: a body reworded in relevance.ts or mentor.ts
 * shows up here as a missing key and falls back to the singular verbatim, which
 * is truthful if slightly off, rather than as a sentence that quietly says the
 * wrong thing.
 *
 * THE GATE ON THIS MAP IS PER ENTRY, and it has to be. A map of HEADINGS can be
 * gated in one sweep, because every headline is written about one order and a
 * group of two must therefore change it. A body cannot: a body may repeat a
 * noun the sweep cannot know about, so "every body must change" would be a
 * false rule. So each entry below is named in its own case in
 * `small-orders.restricted.test.ts`, with its exact words. Deleting one fails a
 * test that says which. That was written after a mutation test found two
 * entries — the Source Approval sentence and the no-code sentence — that could
 * be deleted with nothing going red, while this docblock claimed the sweep
 * covered them. The same file also fails when an entry here has no producer.
 *
 * EVERY BODY THE PAGE CAN RENDER IS LISTED. The three sentences behind "DLA is
 * not taking new sellers for these" were the open case for one feature: each
 * said "this part" over a group that can hold thirty rows, and DH-32 pinned
 * that absence as a test rather than fill it in passing. DH-35 took the copy
 * decision and wrote the three plurals, so the word "this part" is now on the
 * test's singular-word list beside "this one" and "this order". A dead-end
 * sentence added here without a plural fails that sweep as well as its own
 * case.
 */
export const GROUP_BODY: Record<string, string> = {
  "The form is called a Source Approval Request. DLA only approves sellers who have made or supplied this part before. The full drawings also work.":
    "The form is called a Source Approval Request. DLA only approves sellers who have made or supplied these items before. The full drawings also work.",
  // THE LIMITED-COMPETITION SENTENCE. Every noun goes plural and no claim
  // widens: DLA asks more than one seller PER PART, and the data and the rights
  // are missing part by part. "There is no form for them." keeps the fact that
  // tells this tier apart from the Source Approval Request tier above.
  "DLA is asking more than one seller for a price on this part. The government does not have the data or the rights another seller would need. So it cannot add a seller to this order. There is no form for this one.":
    "DLA is asking more than one seller for a price on each of these items. The government does not have the data or the rights another seller would need. So it cannot add a seller to these orders. There is no form for them.",
  // THE QUALIFIED-PRODUCTS-LIST SENTENCE. Every noun goes plural and no claim
  // widens: DLA keeps a list PER PART, and a seller qualifies one part at a
  // time. The route survives the plural intact, because it is the same route
  // over one order or thirty, and so does the honest limit on it.
  //
  // THE KEY IS BUILT, NOT TYPED. `relevance.ts` ends this body with
  // `ASK_MENTOR_FIRST`, and `mentor.ts` owns that sentence. Writing the words
  // here as a literal would be a third copy of a constant two files already
  // keep in one place, and it would go stale silently — the map falls back to
  // the singular on a key that no longer matches. The plural VALUE still writes
  // the mentor sentence out, because a plural of it is a copy decision this
  // page takes and the constant holds only the singular.
  [`A qualified products list names the sellers DLA may buy this part from. DLA buys only from a seller on that list, or from one qualified for listing by the time it awards. A seller gets on the list by qualifying the part with the government first. That takes longer than this order allows, so it is a step toward later orders. ${ASK_MENTOR_FIRST}`]:
    "A qualified products list names the sellers DLA may buy a part from. DLA buys only from a seller on that list, or from one qualified for listing by the time it awards. A seller gets on the list by qualifying the part with the government first. That takes longer than these orders allow, so it is a step toward later ones. Ask your mentor before you spend time on these.",
  // THE THREE SENTENCES BEHIND "DLA is not taking new sellers for these", and
  // there are three because DLA gives three different reasons for the same
  // refusal. Each states a fact about ONE part's drawings, so every noun goes
  // plural and no claim widens: the drawings name their companies part by part,
  // and the rights are missing part by part. "So it cannot add new sellers." is
  // true in both numbers and is left exactly as it stands.
  "The drawing for this part names the companies that may make it. The government does not have the information to add another company. It cannot accept a different part in its place either.":
    "The drawings for these items name the companies that may make them. The government does not have the information to add another company. It cannot accept another part in place of any of these either.",
  "The government cannot get the information another company would need to make this part. It cannot write a good enough description of the part either. So it cannot add new sellers.":
    "The government cannot get the information another company would need to make these items. It cannot write a good enough description of them either. So it cannot add new sellers.",
  // ONE ENTRY FOR TWO LETTERS, because relevance.ts gives them one sentence.
  // They are two different facts about the drawings — one code says the
  // government holds the data but not the rights to it, the other says it holds
  // neither — and both end her afternoon the same way, which is why one
  // sentence was right for her and one plural is too. Writing the plural twice
  // is how a shared sentence drifts apart.
  "The government does not own the rights to the drawings for this part. It cannot buy those rights at a fair price. So it cannot add new sellers.":
    "The government does not own the rights to the drawings for these items. It cannot buy those rights at a fair price. So it cannot add new sellers.",
  // "for each order", and "those suppliers". DLA's code says one supplier is
  // available for ONE part, so a group of thirty is thirty suppliers we cannot
  // name — not one company selling every part on the list.
  "This part is sold as a commercial product. But DLA's code says one supplier is available for this order, so DLA is buying from that supplier. It is not asking other sellers for a price.":
    "These items are sold as commercial products. But DLA's codes say one supplier is available for each order, so DLA is buying from those suppliers. It is not asking other sellers for a price.",
  "DLA's code says one supplier is available for this part. DLA is buying from that supplier and is not asking other sellers for a price.":
    "DLA's codes say one supplier is available for each of these items. DLA is buying from those suppliers and is not asking other sellers for a price.",
};

type Group = {
  head: string;
  body: string;
  fixable: boolean;
  route: Restriction["route"];
  rows: MicroOrder[];
};

/** One group's orders as the server has served them so far. */
type GroupPage = {
  rows: MicroOrder[];
  /** The server's count of the group's open orders; null if the read failed. */
  total: number | null;
  next: SmallOrdersNextPage | null;
  loadingMore: boolean;
  failed?: boolean;
};

/** One group per distinct reason, the ones with a way in first. */
/** How many rows of a group show before "+N more". */
const GROUP_PREVIEW = 3;

export function groupByReason(rows: MicroOrder[]): Group[] {
  const groups: Group[] = [];
  for (const o of rows) {
    // `restrictionOf()` ALONE. It used to fall back to `NO_CODE_REASON` for a
    // row whose codes never reached us, because `queryOrders()` sent those rows
    // here and nowhere else. It sends them to the BOARD now, so the fallback
    // spoke for a group this page cannot form.
    const r = restrictionOf(o);
    if (!r) continue;
    const found = groups.find((g) => g.body === r.body);
    if (found) found.rows.push(o);
    else
      groups.push({
        // Singular for now. A heading is written over the group it actually
        // heads, and how many rows that is is not known until the loop ends.
        head: r.headline,
        body: r.body,
        fixable: r.fixable,
        route: r.route,
        rows: [o],
      });
  }
  // Pluralise only what is plural. "Only approved sellers can quote these (1)"
  // over a single card is the same defect as the singular over thirty, pointing
  // the other way, and a group of one is ordinary here — a letter can be the
  // only one of its kind on her board. GROUP_HEAD is keyed on the singular, so
  // the head still holds its own key at this point.
  // The full stop goes too. `restrictionOf` writes its headlines as sentences
  // and the plurals above are written as headings, so borrowing the singular
  // put a terminator mid-heading: "Only one supplier can fill this one. (1)".
  // The body takes the plural from the SAME count, in the same pass. Two rules
  // reading one number is the only way the heading and the sentence under it
  // cannot disagree again. No full stop is stripped here — the body is written
  // as prose and keeps its terminator.
  for (const g of groups) {
    const plural = g.rows.length > 1;
    g.head = (plural ? (GROUP_HEAD[g.head] ?? g.head) : g.head).replace(/\.$/, "");
    if (plural) g.body = GROUP_BODY[g.body] ?? g.body;
  }
  // Verdict before the data: a page that opens with the dead ends teaches her to
  // close it before she reaches the ones she could actually work toward. The
  // group with a form comes first; the dead ends follow in the order they were
  // built. The middle rank is for the `unknown` route, which reached this page
  // until DH-34 moved both of its tiers onto the board — it ranks a route with a
  // real next step above the orders nothing can fix, which is what sorting on
  // `fixable` alone failed to do.
  return groups.sort((a, b) => routeRank(a.route) - routeRank(b.route));
}

function RestrictedPage() {
  usePageMeta({});
  const navigate = useNavigate();
  const { session } = useGhlUser();
  // This route read getMicroState() during render and never subscribed at all,
  // so nothing here re-ran when the slice changed. What decides this list is her
  // category scoping — `matchesCategory` runs before the permission split — so a
  // change to "what you sell" while this page is mounted left it rendering the
  // previous list, and reading a mutable module value during render is the React
  // 18/19 tearing hazard on top of that. The memo below already keys on `ms`;
  // useSyncExternalStore is what makes that key move — getMicroState() returns
  // the same object between commits and a new one after each.
  const ms = useLiveSlice("microPurchases", getMicroState);
  useEffect(() => {
    void hydrateMicroState();
  }, []);

  // THE WHOLE BOARD, NOT THE PAGES THE BOARD HAS LOADED. The census counts every
  // open order by its acquisition-code pair, so the groups, the counts and
  // "orders reviewed" describe today's board however far she scrolled it.
  // `undefined` while it is asked for, `null` if it did not load.
  const [census, setCensus] = useState<{ rows: CensusRow[]; total: number } | null | undefined>(
    undefined,
  );
  useEffect(() => {
    const abort = new AbortController();
    void fetchCodeCensus(abort.signal).then((c) => {
      if (!abort.signal.aborted) setCensus(c);
    });
    return () => abort.abort();
  }, []);
  const reasonGroups = useMemo(() => (census ? reasonGroupsFromCensus(census.rows) : []), [census]);

  // EACH GROUP'S ORDERS, read by code pair from the server and scoped to her
  // categories like the board. The server's `total` is the group's count; the
  // census estimate stands in until it arrives.
  const [pages, setPages] = useState<Record<string, GroupPage>>({});
  const categoriesKey = ms.categories.join(",");
  useEffect(() => {
    const abort = new AbortController();
    setPages({});
    const categories = categoriesKey ? (categoriesKey.split(",") as MicroCategory[]) : [];
    for (const g of reasonGroups) {
      void fetchSmallOrdersFeed(undefined, abort.signal, "all", categories, g.pairs).then(
        (feed) => {
          if (abort.signal.aborted) return;
          setPages((prev) => ({
            ...prev,
            [g.body]: feed
              ? { rows: feed.orders, total: feed.total, next: feed.more, loadingMore: false }
              : { rows: [], total: null, next: null, loadingMore: false, failed: true },
          }));
        },
      );
    }
    return () => abort.abort();
  }, [reasonGroups, categoriesKey]);

  /** The next page of one group's orders, appended. */
  const loadMoreFor = (key: string) => {
    const page = pages[key];
    if (!page?.next || page.loadingMore) return;
    setPages((prev) => ({ ...prev, [key]: { ...page, loadingMore: true } }));
    void fetchSmallOrdersFeed(page.next.cursor).then((feed) => {
      setPages((prev) => {
        const held = prev[key];
        if (!held) return prev;
        return {
          ...prev,
          [key]: feed
            ? { ...held, rows: [...held.rows, ...feed.orders], next: feed.more, loadingMore: false }
            : { ...held, loadingMore: false },
        };
      });
    });
  };

  const groups = useMemo(
    () =>
      reasonGroups
        .map((g) => {
          const page = pages[g.body];
          const count = page?.total ?? g.estimate;
          const plural = count !== 1;
          return {
            key: g.body,
            head: (plural ? (GROUP_HEAD[g.head] ?? g.head) : g.head).replace(/\.$/, ""),
            body: plural ? (GROUP_BODY[g.body] ?? g.body) : g.body,
            route: g.route,
            count,
            rows: page?.rows ?? [],
            next: page?.next ?? null,
            arrived: page != null,
            loadingMore: page?.loadingMore ?? false,
          };
        })
        .filter((g) => g.count > 0),
    [reasonGroups, pages],
  );
  const anyRewritten = groups.some((g) => g.rows.some((o) => o.plainName !== o.officialName));

  // Which groups have been opened past their first three rows, keyed by the
  // group's singular body.
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const openOrder = (id: string) =>
    navigate({ to: "/small-orders/$orderId", params: { orderId: id } } as never);

  const back = (
    <button
      type="button"
      className="mp-back"
      onClick={() => navigate({ to: "/small-orders" } as never)}
    >
      <ArrowLeft size={16} aria-hidden /> Small orders
    </button>
  );

  // STILL ASKING. This page is a list of the orders Hunter ruled her out of,
  // and an empty one reads as "there are none" — which we do not know yet. The
  // heading below states a verdict about a sweep that has not happened, so it
  // waits with the list.
  if (census === undefined) {
    return (
      <div className="mp-page">
        {back}
        <FeedLoadingState label="Getting today's orders from DLA" />
      </div>
    );
  }

  return (
    <div className="mp-page">
      {back}

      <header className="mp-header">
        {/* "Ones not open to you" — the same words the board's own control uses
            to get here. It read "Not open to you", which is the same fact with a
            different noun, and one name for one thing is cheaper than two. */}
        <h1 className="t-display-lg">Ones not open to you</h1>
        {/* Neither "yet" nor "what it would take" was true of the whole list.
            Two of these five say outright "there is no form that changes
            that", so the header promised a route over cards that have none. */}
        {/* "a way in" was a metaphor carrying the one distinction this page
            exists to draw — a form exists, or no form exists — to a reader at
            A2 for whom a way in is an entrance. "Each group says which" had no
            noun after it. Both are now the concrete fact. */}
        {/* THE CASES ARE THE GROUPS' JOB, not the lede's. This listed them — a
            form you can file, no form at all, a rule I could not read — which is
            three sentences spent previewing headings that are forty pixels below
            and state each case in full. What the lede does now is say that they
            are there, and that is why it did not have to move when DH-34 took
            the third case off this page: "a rule I could not read" heads a group
            on the board now. The two that remain are worded as they were. */}
        <p className="t-body-sm mp-header__lede">
          DLA decides who may sell each part. Below are the ones Hunter found but did not show you.
          Each group says why, and what you can do.
        </p>
      </header>

      {/* THE PERMISSION RULING IS HUNTER'S, AND IT SPEAKS IN THE FIRST PERSON.
          "Only one supplier can fill each of these" is an <h2> on this page; the
          only attribution here scoped itself to the NAMES, so the one sentence
          on the surface that says "I" had no speaker — the same shape as the
          board's bare price note, one route over (D-E5). The block is no longer
          conditional on a rewritten name either: the ruling is ours on every
          render, so the attribution has to be too. The names clause stays
          conditional, because an attribution that cannot be false is not
          attribution. Same two-string ternary the order page uses for the same
          pair of facts — see micro-purchases.$orderId.tsx, "Who may bid …".

          AN EXISTENTIAL GATE CANNOT CARRY A UNIVERSAL SENTENCE. `anyRewritten`
          is true when ONE row was renamed, and the sentence it opened said "the
          plain names are my work. The official name is under each one." Four of
          the eleven rows — Washer, flat · Transistor · Gasket · Machine bolt —
          have plainName === officialName, so the row correctly draws no second
          line, and on exactly those rows the name is DLA's wording, not
          Hunter's. The amber block was claiming a government record as a
          machine's work and promising a line that is not there on more than a
          third of the page. Both clauses are now scoped to where the rewriting
          actually happened, which is what the gate already tests. */}
      <div className="ai-surface mp-hunter mp-hunter--stats">
        <div className="mp-hunter__say">
          <AgentAvatar agent="hunter" size={48} className="mp-hunter__face" />
          <div>
            {/* `.ai-attr` stays on the name: the amber surface must carry the
                agent chip, and the chip is the name. */}
            <p className="ai-attr mp-hunter__who">Hunter</p>
            <p className="mp-hunter__note">
              {anyRewritten
                ? "Who may sell these is Hunter's reading of DLA's codes. Where a name is in plain words, the official one is under it."
                : "Who may sell these is Hunter's reading of DLA's codes. Always check the order paper."}
            </p>
          </div>
        </div>
        {/* WHAT THE SWEEP COST AND WHAT IT FOUND, as two figures rather than a
            sentence. "Am I seeing everything?" is the question this whole page
            answers, and the answer has two halves: how many orders Hunter read,
            and how many distinct reasons came back. Both are counts, so both are
            figures — as prose they were the two facts the page never stated at
            all.
            `considered` is relevance.ts's own count of the sweep, the same field
            the board's ledger reads. `groups.length` is the number of reason
            blocks rendered below, taken from the array that renders them, so the
            figure cannot claim a group that is not on the page. */}
        <dl className="mp-hunter__stats">
          <div>
            <dt>{census ? census.total.toLocaleString("en-US") : "—"}</dt>
            <dd>orders reviewed</dd>
          </div>
          <div>
            <dt>{groups.length}</dt>
            <dd>
              {groups.length === 1
                ? "reason it is not open to you"
                : "reasons they are not open to you"}
            </dd>
          </div>
        </dl>
        {/* WHOSE RULE IT IS. Everything above is Hunter reading DLA's codes, and
            the one thing a member cannot tell from a first-person sentence is
            whether the refusal is his opinion or the government's. It is the
            government's, on every row. */}
        <p className="mp-hunter__basis">
          <FileSearch size={18} aria-hidden />
          All based on DLA rules
        </p>
      </div>

      {census === null ? (
        <p className="mp-empty__head">Today's orders did not load. Check again later.</p>
      ) : groups.length === 0 ? (
        <p className="mp-empty__head">Nothing here right now.</p>
      ) : (
        <div className="mp-list">
          {groups.map((g, gi) => {
            const open = openGroups.includes(g.key);
            const shown = open ? g.rows : g.rows.slice(0, GROUP_PREVIEW);
            const hidden = g.count - shown.length;
            // Closed, the control opens the rows already loaded. Open, it loads
            // the group's next page from the server.
            const canShowMore =
              hidden > 0 &&
              (open ? g.next != null : g.rows.length > shown.length || g.next != null);
            return (
              <section key={g.key} className="mp-grp">
                <header className="mp-grp__head">
                  {/* THE GROUP'S NUMBER, and its colour is the ROUTE — blue where
                      a form exists, red where DLA is not taking new sellers at
                      all. Two marks for the two things that can be done about a
                      refusal, so the answer is readable before the heading is.
                      The amber mark is for the `unknown` route, and no group on
                      this page carries it since DH-34 moved those tiers onto the
                      board. The badge carries the colour and the
                      card does not: every box on this feature is white, which is
                      the rule the order page was just brought into line with, and
                      tinting four cards to say what a 28px badge can say would
                      have broken it here. */}
                  <span className={`mp-grp__n mp-grp__n--${g.route}`} aria-hidden>
                    {gi + 1}
                  </span>
                  <div className="mp-grp__id">
                    {/* `.mp-h2`, the shared box heading, rather than a treatment
                        of its own. These read as statements — "Only approved
                        sellers can quote these" — and I set them in sentence case
                        on that ground; overruled, and the consistency argument is
                        the better one: this is the heading of a card, every other
                        card on the feature marks its heading the same way, and a
                        reader meeting two heading styles has to work out whether
                        the difference means something. `groupByReason` already
                        strips the trailing full stop, so no sentence is shouted
                        with its punctuation intact. */}
                    <h2 className="mp-h2">{g.head}</h2>
                    {/* The count leaves the heading. It was "(3)" inside the
                        title, which made the heading a different length on every
                        group and put a number where a sentence was being read. */}
                    <span className="mp-grp__count">
                      {g.arrived
                        ? `${g.count.toLocaleString("en-US")} ${g.count === 1 ? "order" : "orders"}`
                        : "Counting…"}
                    </span>
                  </div>
                </header>
                <p className="mp-grp__body">{g.body}</p>
                <div className="mp-grp__rows">
                  {shown.map((o) => {
                    const r = restrictionOf(o)!;
                    return (
                      <article
                        key={o.id}
                        className="mp-card mp-card--locked is-clickable-card"
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          openOrder(o.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.currentTarget.blur();
                            openOrder(o.id);
                          }
                        }}
                      >
                        <CategoryIcon category={o.category} />
                        <div className="mp-card__main">
                          <div className="mp-card__head">
                            <span className="mp-card__title">{plainTitle(o.plainName)}</span>
                          </div>
                          {/* Only when it says something the title did not. Three
                              cards used to print TRANSISTOR as the heading and
                              TRANSISTOR again one line below it. */}
                          {o.plainName !== o.officialName && (
                            <p className="mp-card__qty">{o.officialName}</p>
                          )}
                          {/* Every row here HAS one. This was conditional for the
                              tier that arrived with no acquisition code, where
                              the chip would have read "· nullnull"; that tier is
                              on the board now and `NO_CODE_REASON` is the only
                              reason carrying an empty chip. The test asserts a
                              non-empty code on every reason this page can
                              render. */}
                          <p className="mp-verdict__term">{r.code}</p>
                        </div>
                      </article>
                    );
                  })}
                  {/* THE REST OF THE GROUP, not a link to somewhere else. Seven
                      near-identical rows under one reason is the shape this page
                      shipped with and the reason it read as a wall; three is
                      enough to see what kind of part is in the group, and the
                      count says exactly what is behind the control. It expands in
                      place — there is nowhere else for these to go. */}
                  {!g.arrived && <p className="mp-grp__body">Getting these orders…</p>}
                  {canShowMore && (
                    <button
                      type="button"
                      className="mp-grp__more"
                      disabled={g.loadingMore}
                      onClick={() =>
                        open ? loadMoreFor(g.key) : setOpenGroups([...openGroups, g.key])
                      }
                    >
                      {g.loadingMore ? "Getting more…" : `+${hidden.toLocaleString("en-US")} more`}
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* WHAT TO DO WITH A PAGE OF NOs. Every group above ends in a refusal, and
          a member who reads eleven of them in a row has learned only that she
          cannot bid — which is the half of this page that was already working
          and the half that makes people close the tab. The three questions here
          are the ones each group leaves behind, gathered once at the foot rather
          than repeated per group.
          Rendered only when there is something to be refused about: on an empty
          page the questions have no antecedent. */}
      {groups.length > 0 && (
        <section className="mp-next">
          <HelpCircle size={22} aria-hidden className="mp-next__mark" />
          <div className="mp-next__body">
            {/* Sentence case, like the group headings above it and for the same
                reason: it is a question, and the capitals treatment on this
                feature is for the short static labels that NAME a card. A
                shouted question is the one shape that rule exists to refuse. */}
            <h2 className="mp-h2">What can I do next?</h2>
            <div className="mp-next__cols">
              <div>
                <h2 className="mp-next__h">Need permission?</h2>
                <p>A Source Approval Request is the form DLA takes. It is not quick.</p>
              </div>
              <div>
                <h2 className="mp-next__h">Not sure what a code means?</h2>
                <p>Ask before you spend time on one of these.</p>
                {/* THE QUESTION IS HERS, NOT OURS, AND THAT IS WHY IT STAYS.
                  DH-34 moved both tiers carrying the `unknown` route onto the
                  board, so no group here is one we could not read — and the
                  earlier note defending this column said a mentor is the next
                  step "for a code nobody has read", which is that departed
                  route's reason and is false of this page now. The column
                  earns its place on a different fact: every row above prints
                  an acquisition code, the group above it explains the verdict
                  rather than the code, and a member who wants to know what
                  `1B` MEANS is asking something no sentence on this page
                  answers. `small-orders.restricted.test.ts` holds that fact —
                  "prints an acquisition code on every row it can show" fails
                  if a reason ever renders an empty chip. Removing a mentor is
                  a loss she pays for, so it needed a live reason, not the
                  absence of the old one.
                  THE ONE REAL DESTINATION ON THIS CARD, as well. The other two
                  questions want an external DLA page each, and neither URL is
                  anywhere in this codebase — a control pointing at a guess is
                  the dead end the rest of this feature is gated against, so
                  those two columns say the useful thing and stop. */}
                {/* A BUTTON TO THE MENTORS PAGE (owner's call, 2026-09-15). It was a
                    "Find a mentor" link; the per-group "Ask your mentor" buttons
                    were removed, so this is the one way to a mentor here. */}
                <button
                  type="button"
                  className="btn btn-sm btn-primary mp-next__ask"
                  onClick={() =>
                    openMentorsPage(session?.locationId, () =>
                      navigate({ to: "/mentors" } as never),
                    )
                  }
                >
                  <Users size={14} aria-hidden />
                  Ask your mentor
                </button>
              </div>
              <div>
                <h2 className="mp-next__h">Want to understand DLA rules?</h2>
                <p>Every group above names the code DLA used. The order paper has the rest.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
