// Small orders — the list.
//
// The government posts about 476,000 requests for quote a year, 98.95% of
// everything on DIBBS, the majority under $10,000, and 85% are awarded by a
// computer that does not care that she is new. This page finds the handful she
// is allowed to bid and can actually fill.
//
// A TRIAGE surface, not a search tool. Every product in this market — DIBBS,
// HigherGov, DIBBS Navigator, SamSearch — treats it as a search problem and
// improves the search. She does not arrive with a query. She arrives with a
// thing she can supply.
//
// Research: docs/micro-purchases/research/micro-purchases-design-2026-08-17.md
// Spec:     docs/micro-purchases/micro-purchases-prd.md
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Bookmark,
  FileText,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { TabBar } from "../components/TabBar";
import { usePageMeta } from "../components/Layout/page-meta";
import { AgentAvatar } from "../components/Companion/AgentAvatar";
import { OrderCard } from "../components/MicroPurchases/OrderCard";
import { PrereqLine } from "../components/MicroPurchases/PrereqLine";
import { NarrowSheet } from "../components/MicroPurchases/NarrowSheet";
import {
  whyThisOrder,
  hunterSummary,
  forYouSummary,
  filterSummary,
  narrowedSummary,
  filtersActive,
  type MicroFilters,
  type SizeAnswer,
  type DeliveryAnswer,
  type MicroMemberContext,
  type MicroResult,
} from "../lib/microPurchases/relevance";
import { useLiveSlice } from "../lib/eventBus";
import { corpusNow, orderValue } from "../lib/microPurchases/pricing";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import { CATEGORY_LABEL, type MicroCategory } from "../lib/microPurchases/categories";
import type { SmallOrdersNextPage } from "../lib/microPurchases/api";
// The corpus is a REQUEST now, not a module, and so is the day it is read for.
// One owner, three states — see lib/microPurchases/feed.ts for why the null
// matters and why nothing here derives a day of its own.
import {
  loadCodeCensus,
  loadFeed,
  loadMoreFeed,
  findFeedOrder,
  getWalkView,
  queryBoard,
  useSmallOrdersFeed,
  useFeedNextPage,
  useLoadingMore,
  walkFeedFor,
  type BoardFeed,
} from "../lib/microPurchases/feed";
import { reasonGroupsFromCensus } from "../lib/microPurchases/restrictedGroups";
import { hydrateMicroState, microStateHydrated } from "../lib/state/microPurchases";
import {
  loadSavedOrderRecords,
  loadSavedOrders,
  useSavedOrderIds,
  useSavedOrderRecords,
} from "../lib/microPurchases/savedOrders";
import {
  BOARD_VIEWS,
  DEFAULT_BOARD_VIEW,
  isBoardView,
  landingView,
  type BoardView,
} from "../lib/microPurchases/boardView";
import { loadMatchScores, loadProfileFit, useProfileFit } from "../lib/microPurchases/profileFit";
import { useGhlUser } from "../lib/ghlUser";
import {
  getMicroState,
  setCategories,
  setRegistration,
  markSeen,
  attestationFor,
} from "../lib/state/microPurchases";
// The member record this surface is rendered inside. Every other feature route
// reads it; these four read nothing at all — see the seeding effect below.
import { useCurrentMember } from "../lib/mock/currentMember";

/** Every tab ranks the same way: by her record and her profile fit. */
const BOARD_SORT = "best" as const;

export interface MicroSearch {
  /** The tab she is on. Absent is "For you". */
  view?: BoardView;
  size?: SizeAnswer;
  del?: DeliveryAnswer;
}

/**
 * THE FEED SEAM. The day this board is read for is the FEED'S day (D2).
 *
 * `queryOrders` takes the corpus and the date it is judged against, and both
 * used to be defaults nobody passed — so hunterSummary's empty-feed sentence
 * ("I could not get today's orders from DLA") was written, tested and
 * unreachable, and the sample banner named no day at all while silently
 * dropping every solicitation that closed before one.
 *
 * This file then exported an `AS_OF` derived from the fixture's `TODAY` and
 * passed THAT in, which put a second clock on the client: the server cuts the
 * corpus against the newest posting date it holds, and the board cut the answer
 * again against a day the server knows nothing about. On a corpus a month stale
 * the second cut removes all of it, and a stale board reads as a broken one.
 * There is one clock now and it arrives with the orders — `feed.asOf`, through
 * `queryBoard()`, which is the only thing this surface, the narrow sheet and
 * the restricted list call.
 */
/** The card marker shows only a settled yes/no. "Unsure" is a recorded answer,
 *  but it is not a claim about whether she can get the part, so it must not
 *  render as one on the card. */
function toCardMark(a: "yes" | "no" | "unsure" | null): "yes" | "no" | null {
  return a === "yes" || a === "no" ? a : null;
}

export const Route = createFileRoute("/small-orders/")({
  validateSearch: (input: Record<string, unknown>): MicroSearch => {
    const out: MicroSearch = {};
    if (isBoardView(input.view)) out.view = input.view;
    if (input.size === "under1k" || input.size === "1kTo5k" || input.size === "over5k") {
      out.size = input.size;
    }
    if (input.del === "days30" || input.del === "days60") out.del = input.del;
    return out;
  },
  component: MicroPurchasesIndex,
});

function MicroPurchasesIndex() {
  usePageMeta({});
  const navigate = useNavigate();
  const s = Route.useSearch();
  const view: BoardView = s.view ?? DEFAULT_BOARD_VIEW;

  const [folded, setFolded] = useState(false);
  const [narrowSheet, setNarrowSheet] = useState(false);

  // useSyncExternalStore, not a hand-rolled listener plus a counter. The old
  // pair read getMicroState() during render and re-rendered from an effect,
  // which is the React 18/19 tearing hazard this hook exists to close — and it
  // is the pattern savedAwards, capStatement and the wins route already use.
  // getMicroState() returns the same object between commits and a new one
  // after each, so it is a valid snapshot and the [ms] memos below still fire
  // exactly when the state changes.
  const ms = useLiveSlice("microPurchases", getMicroState);
  // Her saved orders are the workspace's list, not the member state's — the
  // same list the pipeline reads.
  const savedIds = useSavedOrderIds();
  // Fit from her profile: her matching-engine scores for the orders on screen,
  // and her NAICS codes as the fallback and the source of category suggestions.
  const { session } = useGhlUser();
  const fit = useProfileFit();
  useEffect(() => {
    if (session?.locationId) void loadProfileFit(session.locationId);
  }, [session?.locationId]);
  /** Flips false -> true when the first load settles, so the SAM effect below
   *  runs once her real record is in the store and never against defaults. */
  const hydratedTick = useLiveSlice("microPurchases", microStateHydrated);
  const feed = useSmallOrdersFeed();
  // DH-28 — the board arrives 50 at a time and she asks for the next 50. Both
  // come off the feed store, which is the only thing that issues a request.
  const nextPage = useFeedNextPage();
  const loadingMore = useLoadingMore();

  // Both are idempotent and both are mounted by all four surfaces, so whichever
  // she lands on first does the work. Fired from an effect rather than a route
  // loader deliberately: nothing on this page blocks on either, and a loader
  // would hold the board behind a request the design has no waiting state for.
  useEffect(() => {
    void hydrateMicroState();
    void loadSavedOrders();
  }, []);
  // The tab decides the walk. "For you" and "All orders" are server walks, and
  // switching between them starts a new one. "Saved" keeps whatever walk is
  // loaded, for the checklist and the order pages, and reads its own orders.
  //
  // Her categories are part of the walk: the server narrows to them, so a page
  // of 50 is 50 orders in her categories. Keyed on the joined list so a new
  // state object with the same categories does not start a walk.
  const categoriesKey = ms.categories.join(",");
  useEffect(() => {
    if (view === "saved") void loadFeed();
    else void walkFeedFor(view, categoriesKey ? (categoriesKey.split(",") as MicroCategory[]) : []);
  }, [view, categoriesKey]);
  // PORT NOTE — the prototype read this from `lib/memberState`, which does not
  // exist here and whose 529 lines pull in the partners pipeline. This app owns
  // the same fact under a different name: `CurrentMember.samStatus`, with the
  // identical "active" branch the seeding below turns on. One fact, one owner —
  // the owner is just this app's, not the prototype's.
  const { samStatus } = useCurrentMember();

  // ONE FACT, ONE OWNER — settled invariant 7, and this surface was the one
  // place in the app that broke it. Nothing under src/components/MicroPurchases
  // or src/routes/micro-purchases* read the member record at all, while awards,
  // roadmap, partners, home, opportunities and cap-statement all do. So the
  // default member — SAM active, UEI held, company name rendered in the sidebar
  // of this very page — opened Small orders and was told "4 things to do before
  // you can sell", and every send block then refused her until she re-attested
  // two facts the platform already holds verified. The competitive frame names
  // the pattern we are supposed to be: "Gusto DERIVES which registrations you
  // need instead of asking you."
  //
  // SEEDED, not merely displayed. registrationsComplete() in the store is what
  // the send block reads, so a derivation that stopped at this checklist would
  // show her two steps, let her finish them, and refuse her anyway — a wall
  // with no control in front of it. One writer, and every reader follows.
  //
  // SAM settles CAGE. The panel's own step 2 says so — "Your seller number
  // comes with that registration. You do not apply for it separately." DIBBS
  // and PIEE are separate accounts the profile genuinely does not hold, and she
  // is still asked for those two.
  //
  // Mount-only and only false -> true, so her own Undo stands. The date is
  // deliberately not passed: we hold a status, not an expiry, and inventing one
  // is the defect on the other side of this same field.
  useEffect(() => {
    if (samStatus !== "active") return;
    // NOT UNTIL HER RECORD HAS ARRIVED.
    //
    // This read `getMicroState()` on mount, which at that moment holds the
    // DEFAULTS — every registration false, no quotes, no wins. Ticking `sam`
    // there committed a default document and the store's debounced write sent
    // it. Measured 2026-09-10, `GET /small-orders/state` took 24 seconds
    // against staging, so that PUT landed about 23 seconds BEFORE her real
    // record came back, and overwrote it. She ticked DIBBS, reloaded, and it
    // was gone — along with anything else the document held.
    //
    // The store now defers writes until the load settles, which stops the
    // overwrite. This gate stops the wrong READ that caused it: seeding from
    // defaults would still tick `sam` on a member who had deliberately undone
    // it, because "not set" and "not loaded yet" look identical from here.
    if (!microStateHydrated()) return;
    const r = getMicroState().registrations;
    if (!r.sam) setRegistration("sam", true);
    if (!r.cage) setRegistration("cage", true);
    // The disable directive that used to sit here is gone with the dependency
    // that needed it: the prototype closed over a `sam` object, this reads a
    // primitive, and the dep list is now exhaustive on its own.
    // `hydratedTick` re-runs this once the load settles; without it the
    // effect would fire only on a `samStatus` change and never seed at all.
  }, [samStatus, hydratedTick]);
  const fromProfile = samStatus === "active" ? (["sam", "cage"] as const) : ([] as const);
  // Memoised on the raw params — a fresh object every render would re-run the
  // query on every unrelated state change.
  const filters: MicroFilters = useMemo(
    () => ({
      size: s.size ?? "any",
      delivery: s.del ?? "any",
    }),
    [s.size, s.del],
  );

  const member: MicroMemberContext = useMemo(
    () => ({
      categories: ms.categories,
      cashCeiling: ms.cashCeiling,
      suppliedNsns: ms.suppliedNsns,
      wonQuotes: ms.quotes
        .filter((q) => q.outcome === "won")
        .map((q) => ({ nsn: q.nsn, pricePerUnit: q.quotedPricePerUnit, wonOn: q.sentAt })),
      attestedNsns: ms.attestedNsns,
      declinedNsns: ms.declinedNsns,
      matchScores: fit.matchScores,
      profileNaics: fit.profileNaics,
      alliedNaics: fit.alliedNaics,
    }),
    [ms, fit],
  );

  // Ask the engine for her score on each order as its page arrives. The store
  // asks once per id, so a re-render or a re-sort costs nothing.
  const loadedOrderIds = useMemo(() => (feed?.orders ?? []).map((o) => o.id), [feed]);
  useEffect(() => {
    if (loadedOrderIds.length > 0) void loadMatchScores(loadedOrderIds);
  }, [loadedOrderIds]);

  // The feed and the day it is read for travel together, in one object, through
  // one function. See queryBoard().
  //
  // `feed` is `BoardFeed | null` and the null is load-bearing: it is what makes
  // "Today's orders from DLA did not load" render instead of "There are no
  // orders today." See lib/microPurchases/feed.ts.
  // "For you" holds only the orders she may bid by acquisition code. The walk
  // is narrowed on the server; `eligibleOnly` holds it for a row still in hand.
  const result = useMemo(
    () => queryBoard({ filters, sort: BOARD_SORT, eligibleOnly: view === "for-you" }, member, feed),
    [filters, member, feed, view],
  );

  // "For you" holds back nothing in hand, because its walk carries no order she
  // may not bid. So there the "Ones not open to you" row asks the census, which
  // counts the whole board, whether any reason group has orders behind it.
  const [boardHoldsBack, setBoardHoldsBack] = useState(false);
  useEffect(() => {
    if (view !== "for-you") return;
    void loadCodeCensus().then((c) =>
      setBoardHoldsBack(c != null && reasonGroupsFromCensus(c.rows).length > 0),
    );
  }, [view]);

  // The same day, for the cards. `queryBoard()` judges the rows on the served
  // day; a card that aged its own award against a different one would put a
  // money figure on the board the board itself would not stand behind.
  const now = corpusNow(feed?.asOf);

  // The Saved tab reads her saved orders by id, not out of the walk: most of
  // them are not in the loaded pages, and some have closed. Her filters do not
  // apply there, because she chose each of those orders herself.
  const savedOrders = useSavedOrderRecords();
  useEffect(() => {
    if (view === "saved") void loadSavedOrderRecords();
  }, [view, savedIds]);
  const rows = view === "saved" ? savedOrders.orders : result.rows;

  // NO MATCHES OPENS ALL ORDERS. If she arrives with no `?view=` and the For
  // you walk answers with no matches, the board opens on All orders. The board
  // holds its loading state until that first answer, so she never sees an empty
  // For you before the switch. The switch replaces the address, so Back does
  // not return her to the empty tab. A failed walk keeps For you. The decision
  // is made once: a later walk with no matches does not move her.
  const [landed, setLanded] = useState(s.view != null);
  const forYouAnswer = getWalkView() === "for-you" ? feed : undefined;
  const landing = landingView({ explicitView: s.view, forYou: forYouAnswer });
  const settling = !landed && s.view == null && (forYouAnswer === undefined || landing !== view);
  useEffect(() => {
    if (landed) return;
    // She named a tab, or the switch below did.
    if (s.view != null) return setLanded(true);
    if (forYouAnswer === undefined) return;
    if (landing === view) return setLanded(true);
    navigate({
      search: (prev: MicroSearch) => ({ ...prev, view: landing }),
      replace: true,
    } as never);
  }, [landed, s.view, landing, view, forYouAnswer, navigate]);

  function patch(p: Partial<MicroSearch>) {
    navigate({ search: (prev: MicroSearch) => ({ ...prev, ...p }) } as never);
  }

  /** "Show all": clears the filters in the address and her saved categories. */
  function clearNarrowing() {
    patch({ size: undefined, del: undefined });
    if (ms.categories.length > 0) setCategories([]);
  }

  const openOrder = (id: string) => {
    markSeen(id);
    navigate({ to: "/small-orders/$orderId", params: { orderId: id } } as never);
  };

  // ── NO WALL BEFORE THE BOARD ───────────────────────────────────────────
  //
  // This used to `return` a first-run screen: one Hunter line, one button, and
  // NO ORDERS. She could not see a single thing the product was for until she
  // had answered a question about her business.
  //
  // The comment defending it said "four onboarding questions before any value
  // is a wall; one is an invitation", and it was right about four versus one
  // and never asked whether ZERO beats one. It does, for three reasons:
  //
  //  1. She cannot judge an offer she cannot see. The first screen's job is to
  //     show what is in the box; this showed an empty box and asked a question.
  //  2. It raised the stakes of the answer. Her named fear is answering wrong
  //     on something government-adjacent, and she had no way to check whether
  //     she had answered well, having never seen the board.
  //  3. It hid the one fact that disqualifies most people. THIS BOARD IS PARTS.
  //     A caterer needs that in two seconds. As built she learned it only by
  //     opening twelve categories, finding no food, and concluding she had
  //     answered wrong — the round-6 Amira walk graded that serious.
  //
  // The escape existed and was inside the thing it escaped: "Pick nothing and
  // Hunter shows you every order" lives INSIDE the sheet, so she had to enter
  // the question to find the way around the question.
  //
  // Nothing new is built here. The no-category board was already the right
  // screen — `queryOrders` returns everything on an empty category list, and
  // `hunterSummary` already opens it with "This board only has parts DLA buys.
  // If you sell something else, it will not be here yet." The wall was the only
  // thing between her and it. The question survives as the improvement it
  // always was: the chip below invites her to rank the board, it does not gate
  // it.

  // Pattern 11 — never a dead chip. Three sort buttons that reorder nothing and
  // a sentence explaining an ordering that does not exist are the same defect as
  // a disabled control: they cost a read and answer nothing. This is the exact
  // condition under which <EmptyState/> renders instead of a list, and the empty
  // state carries the one action that moves her on.
  const hasRows = rows.length > 0;

  // "Everything" is what she chose when she opened the sheet and picked nothing.
  // It is NOT what is true before she has been asked, and rendering it there
  // would put words in her mouth on the one question this surface asks.
  const catLabel =
    ms.categories.length === 0
      ? ms.onboarded
        ? "Everything"
        : "You have not said yet"
      : ms.categories.length === 1
        ? CATEGORY_LABEL[ms.categories[0] as MicroCategory]
        : `${CATEGORY_LABEL[ms.categories[0] as MicroCategory]}, and ${ms.categories.length - 1} more`;

  // Her checklist is member state, not board state, so it says the same thing
  // whether or not the feed has landed. Held in a const so the loading branch
  // below can show it without a second copy of its five props.
  const prereq = (
    <PrereqLine
      registrations={ms.registrations}
      onToggle={setRegistration}
      fromProfile={fromProfile}
    />
  );

  // STILL ASKING. Everything below describes a board and we do not have one
  // yet, so the page shows only what it already knows — the header and her
  // checklist — with a spinner where the orders will be.
  //
  // It must not fall through to the board. `queryBoard()` collapses "still
  // asking" to "no feed", which sets `feedArrived: false`, and Hunter's verdict
  // reads that as an outage: she would be told the fetch failed while it is
  // still open. That is the same class of defect as the bundled corpus this
  // replaced — a true-sounding sentence about a board nobody has yet.
  //
  // The tabs stay on screen while a walk loads, so switching tabs never hides
  // the way back. The Saved tab does not wait for the walk at all.
  // The feed in hand can belong to the other walked tab for one render, before
  // the effect above starts this tab's walk. Its rows are not this tab's.
  if ((feed === undefined || settling || getWalkView() !== view) && view !== "saved") {
    return (
      <div className="mp-page">
        <Header showTerm />
        {prereq}
        <div className="mp-controls">
          <BoardTabs view={view} onChange={(next) => patch({ view: next })} />
        </div>
        <FeedLoadingState label="Getting today's orders from DLA" />
      </div>
    );
  }

  return (
    <div className="mp-page">
      <Header showTerm />

      {prereq}

      {/* ONE FOCAL MESSAGE PER STATE. On an empty board this block and the
          empty state below it stacked two different explanations of the same
          nothing, ~200px apart, pointing opposite ways: "This board only has
          parts DLA buys. If you sell something else, it will not be here yet."
          (your trade may not be covered at all) over "Nothing today for safety
          gear and clothing. That is normal. New orders arrive every weekday."
          (quiet day, come back tomorrow). She had picked a category the wizard
          itself offers, so the first is the wrong one to show her and it
          undermines the second — and the only control on screen answers
          neither. Where she has named her trade the empty state owns the
          message AND the next step, so the verdict stands down. Where she has
          named nothing the coverage sentence is the point of the board and it
          stays: that member is the one it was written for.
          The sentence itself is hunterSummary()'s and its `n === 0` branch
          appends the coverage line whether or not her category is a real one —
          that half is escalated to the lane that owns relevance.ts. */}

      {/* ONE PANEL AROUND THE LIST, and the panel says what the list is.
          The board was a flat stack: a sort row, a hint, a heading, five
          free-floating cards and two tail buttons, all at the same level, so
          nothing on the page said where the orders started or what made them a
          set. The three questions this surface exists to answer — what am I
          looking at, is this all of it, what do I do next — were answered by
          three separate blocks with no container joining them.
          The count is derived HERE, off the two arrays this panel actually
          renders, and is not a second copy of any number Hunter states above.
          hunterSummary() counts a different pool (it includes the orders no
          seller of hers may bid); this counts rows on screen. A count taken off
          the thing it labels cannot drift from it — which is the failure the
          board tail was stripped of a count for. */}
      <section className="mp-panel">
        {/* HUNTER IS THE HEAD OF THIS PANEL NOW, not a card above it.
            He was a separate amber block, then a white panel began underneath
            with its own icon, its own title and its own count — two headers for
            one thing, and the one doing the talking was outside the thing it
            was talking about. Read top to bottom it said: here is what Hunter
            thinks; separately, here are some orders. They are the same orders.
            Folded together, the count sits beside his name because it is HIS
            count, and every sentence under his avatar is about the list
            directly beneath it. Nothing was cut — same summary, same
            attribution, same warning, same rows.
            The amber stays and is doing its normal job: `.ai-surface` marks
            AI-authored output, and the summary, the plain names and the price
            sentences are all his. The panel around it is neutral, so the board
            itself is not being claimed as machine-written. */}
        {/* `|| !result.feedArrived` is ours, and it is the whole reason this
            gate is not the prototype's. Over a live backend the fetch can
            fail; over a static corpus it cannot. Without this clause a scoped
            member with a failed fetch falls through to <EmptyState/> and is
            told "Nothing today for fasteners. That is normal." over an
            outage — the one distinction relevance.ts carries `feedArrived`
            for, lost on the last hop. */}
        {view !== "saved" && hunterRides(hasRows, ms.categories.length > 0, result.feedArrived) && (
          <div className="ai-surface mp-hunter mp-hunter--head">
            {/* THE FACE COMES OUT OF THE CHIP. `.ai-attr` is a 11.5px inline
                row — right for a byline on an order page, wrong for the one
                block on this board that is a person addressing her. At 40px
                inside that row the portrait was a favicon beside a label. It
                is now its own element, sized to the band and spanning both of
                its rows, with the name and the count beside it at a weight
                that matches. The chip keeps its class and its job: `.ai-attr`
                is what the amber-attribution gates look for, and what still
                says out loud that the sentences under it are machine-written. */}
            <AgentAvatar agent="hunter" size={48} className="mp-hunter__face" />
            <div className="ai-attr">
              <span>Hunter</span>
              {/* THE CORPUS, NOT THE PAGE. This summed the two row arrays, which
                  was the whole board until DH-28 made it arrive 50 at a time.
                  After that the chip counted what had loaded and called it
                  "open", so a member with 13,418 open orders read "50 open" and
                  had no way to tell the difference. `feed.total` is the
                  server's own measurement of the corpus and is never edited on
                  this side. The row sum is kept as the fallback for the first
                  paint, where the bundled sample is on screen and no server
                  total has arrived — there the rows ARE everything we have. */}
              <span className="mp-panel__count">
                {(feed?.total ?? rows.length).toLocaleString("en-US")} open
              </span>
            </div>
            {!folded && (
              <div className="mp-hunter__say">
                <p className="mp-hunter__line">
                  {view === "for-you" && feed && feed.boardTotal != null
                    ? forYouSummary(feed.boardTotal, feed.total)
                    : hunterSummary(result, member, undefined, feed?.total ?? null)}
                </p>
                {(() => {
                  const shown = rows;
                  const names = shown.some((o) => o.plainName !== o.officialName);
                  const prices = shown.some((o) => orderValue(o, now) == null);
                  if (!names && !prices) return null;
                  return (
                    <p className="mp-hunter__note">
                      {names && prices
                        ? "Some of these names are in plain words, and the prices are estimates. The official name is on each order page."
                        : names
                          ? "Some of these names are in plain words. The official name is on each order page."
                          : "Price guidance is an estimate. Always check the order paper."}
                    </p>
                  );
                })()}
              </div>
            )}
            {/* IT FOLDS WHAT HUNTER SAID, NEVER THE ORDERS. A caret at the top
                right of a card usually shuts the card, and shutting this one
                would hide the list on a triage board — the one thing she came
                for, behind a control whose only job is to get chrome out of the
                way. So it takes the preamble and leaves the board: his summary,
                his attribution and the warning go; the count, the sorts and
                every row stay. */}
            <button
              type="button"
              className="mp-hunter__fold"
              aria-expanded={!folded}
              aria-label={folded ? "Show what Hunter said" : "Hide what Hunter said"}
              onClick={() => setFolded(!folded)}
            >
              <ChevronDown size={18} aria-hidden />
            </button>
          </div>
        )}

        {/* THE ONE THING THAT COSTS HER MORE THAN LOSING. Every other warning on
            this feature was moved OFF the board on 20 August 2026, and the note
            in OrderCard.tsx that moved them gives the test: a warning earns its
            place at the moment it changes a decision. That test is why this one
            is here and the unit warning is not. The unit warning guards a PRICE,
            and she cannot set a price from this screen. This one guards whether
            she quotes AT ALL, and that decision is made here, on the row, before
            she taps — which is the only screen where it can still be made for
            free.
            Once per list, not once per row: it is true of every order under it,
            and a sentence repeated on five rows is wallpaper by the third.
            NOT --urg-*: that family is errors and destructive confirmations,
            and nothing has gone wrong. This is the cautionary register. */}
        {hasRows && !folded && (
          <p className="mp-panel__warn">
            <AlertTriangle size={15} aria-hidden />
            <span>
              Only quote if you can deliver exactly what the order asks for, on time. If you win and
              do not deliver, DLA can stop buying from you.
            </span>
          </p>
        )}

        {/* THE TABS ALWAYS RENDER. An empty "For you" must still show the way to
            "All orders", and an empty "Saved" the way back. The filter button
            works on the walked tabs only: her saved orders are ones she chose. */}
        <div className="mp-controls">
          <BoardTabs view={view} onChange={(next) => patch({ view: next })} />
          {/* Not gated on rows: her categories live in this menu, and an empty
              board is where she most needs to change them. */}
          {view !== "saved" && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNarrowSheet(true)}
            >
              <SlidersHorizontal size={16} aria-hidden />
              Narrow this down
            </button>
          )}
        </div>

        {/* THE CONTROL SAYS WHAT IT IS, IN WORDS, ON ITS OWN LINE.
            It was a bare 44x44 sliders glyph whose only text was an aria-label —
            invisible to the member this surface is designed for, who has never
            used a dashboard — and it sat inside the sort row at the same height
            and border weight as the three text pills, so its position said
            "fourth sort option" while its behaviour opened a modal on a different
            axis. Pattern 10's own warning is about exactly this control shape.
            The label is the string the sheet already titles itself with, so the
            button and the thing it opens are named the same. `aria-label` is gone
            with it: a label that duplicates visible text is one more string to
            drift. The blue `is-on` state went too — `.mp-active` directly below
            says in words which filter is on and carries its own undo, which is
            the half of this control that was already right. */}

        {/* The explanation sits WITH the control, not somewhere she has already
            scrolled past — and disappears under the other sorts, where it is not true. */}
        {hasRows && view !== "saved" && !filtersActive(filters) && (
          <SortHint
            hasCategories={ms.categories.length > 0}
            hasProfileFit={fit.profileNaics.length > 0 || Object.keys(fit.matchScores).length > 0}
          />
        )}

        {/* Says in words what she is looking at, and carries its own undo. A count
            badge on a gear icon cannot answer "am I seeing everything?" */}
        {view !== "saved" && (filtersActive(filters) || ms.categories.length > 0) && (
          <div className="mp-active">
            <span>{narrowedSummary(ms.categories, filters)}</span>
            <button type="button" className="mp-linkbtn" onClick={clearNarrowing}>
              Show all
            </button>
          </div>
        )}

        {hasRows ? (
          <div className="mp-list">
            {rows.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                why={whyThisOrder(o, member)}
                seen={ms.seenOrderIds.includes(o.id)}
                attested={toCardMark(attestationFor(o.nsn))}
                now={now}
                onOpen={() => openOrder(o.id)}
              />
            ))}
          </div>
        ) : view === "saved" ? (
          <SavedEmpty
            state={savedOrders.state}
            onRetry={() => void loadSavedOrderRecords()}
            onSeeAll={() => patch({ view: "all" })}
          />
        ) : view === "for-you" && !filtersActive(filters) ? (
          <ForYouEmpty feedArrived={result.feedArrived} onSeeAll={() => patch({ view: "all" })} />
        ) : (
          <EmptyState
            feedArrived={result.feedArrived}
            hasFilters={filtersActive(filters)}
            categoryLabel={catLabel}
            scoped={ms.categories.length > 0}
            onClear={clearNarrowing}
            onChangeCategory={() => setNarrowSheet(true)}
          />
        )}

        {view !== "saved" && rows.length > 0 && rows.length <= 3 && (
          <p className="mp-thin">Not many today. New orders arrive every weekday.</p>
        )}

        {view !== "saved" && (
          <LoadMore next={nextPage} loading={loadingMore} onLoad={() => void loadMoreFeed()} />
        )}
      </section>

      {/* The honest tail. Hiding the exclusion silently would be its own thinking
          tax — "am I seeing everything?" — and it turns a hard no into the only
          growth path this market offers.
          It carries NO count. Hunter's held-back ledger that sat above it was
          removed at the owner's call on 2026-09-15, and a count here would be
          the only number on the page about orders she was not shown.
          It no longer says "yet" either — the page it opens tells four of those
          orders that there is no form that changes that. */}
      {/* Gated on BOTH pools. The page now holds two groups — orders whose code
          refuses her, and orders whose code never arrived — and the control that
          leads there was gated on only the first. No board reaches that gap on
          today's corpus (all twelve categories swept), which makes it a fixture
          accident rather than a guarantee: a board with only unreadable-code
          orders held back would count them in the ledger and offer no way to
          see them. The count and its destination move together. */}
      {(result.restricted.length + result.unreadable.length > 0 ||
        (view === "for-you" && boardHoldsBack)) && (
        <button
          type="button"
          className="mp-tail"
          onClick={() => navigate({ to: "/small-orders/restricted" } as never)}
        >
          <AgentAvatar agent="hunter" size={40} className="mp-tail__mark" />
          {/* NO COUNT ON THIS ROW. It carried `notOpenToYou(result)`, and the
              argument for it was that a control with no number asks her to tap
              to find out whether anything is behind it. That argument assumed
              the number was true. Since the board pages at 50, every count on
              this surface counts the rows IN HAND and not the corpus, so the
              row promised a total it could not know. A wrong number is worse
              than no number: she cannot tell it is wrong, and it sits on the
              one control that claims to summarise what she has not seen.
              The row still renders only when something IS behind it — the gate
              above tests the two arrays — so the tap is never wasted. */}
          <span className="mp-tail__text">
            <b>Ones not open to you</b>
            <em>See what Hunter found and did not show you.</em>
          </span>
          <ChevronRight size={16} aria-hidden />
        </button>
      )}

      {/* ONE FEED, ONE DAY (D-B7, D-F5) — and now literally one value. The
          third caller of queryOrders was not swept when the other two were: the
          live count on this sheet's confirm button was computed against
          queryOrders' own local-time default while the board it applies to was
          computed against a different day, so the sheet could promise a count
          the board would not deliver. It was then swept by passing the pair
          separately, which left the same defect one edit away. The sheet takes
          the FEED — the same object this board reads — and calls the same
          queryBoard(); there is no second argument left to disagree about. */}
      {narrowSheet && (
        <NarrowSheet
          selected={filters}
          categories={ms.categories}
          // Proposed from her NAICS codes only until she has answered once.
          suggested={ms.onboarded ? [] : fit.suggestedCategories}
          member={member}
          sort={BOARD_SORT}
          feed={feed}
          onApply={(next, categories) => {
            patch({
              size: next.size === "any" ? undefined : next.size,
              del: next.delivery === "any" ? undefined : next.delivery,
            });
            // Saved with her answers, so the next visit walks the same parts.
            // Written only on a change, so applying a size alone does not mark
            // a proposal from her profile as her answer.
            if (categories.join(",") !== ms.categories.join(",")) setCategories(categories);
            setNarrowSheet(false);
          }}
          onClose={() => setNarrowSheet(false)}
        />
      )}
    </div>
  );
}

function Header({ showTerm }: { showTerm: boolean }) {
  return (
    <header className="mp-header">
      <h1 className="t-display-lg">Small orders</h1>
      {/* "The lowest price that arrives on time wins" was the one sentence she
          would remember, and it was incomplete: ~85% of DLA solicitations are
          decided by a computer comparing COMPLIANT quotes, and this page then
          spends several hundred pixels correcting the hero — buy new not
          surplus, packing costs money, acknowledge amendments. Quoting lowest
          and losing on compliance is the most demoralising possible first
          experience, so the rules go in the promise, not only in the fine
          print.

          AND THE RULE ITSELF WAS WRONG. This read "The lowest price wins, if it
          arrives on time and follows the rules" — which frames delivery as a
          pass/fail threshold and price as the only thing compared. The sourced
          rule is that DLA compares compliant quotes ON PRICE AND DELIVERY
          TOGETHER and awards without a contracting officer (DLA Master
          Solicitation Rev-94 Part I §2(a); micro-purchases-design-2026-08-17.md
          :279-281), which is what every order page already says: "A faster date
          can beat a lower price."

          It is money advice on the sentence she is most likely to read and
          least likely to re-read. Acting on the old one she shaves her margin
          to the bone believing only price is compared, and loses to a higher
          quote with a faster date — the outcome our own order page warns about,
          three screens down. One rule, one owner, and the owner is the sourced
          version. */}
      <p className="t-body-sm mp-header__lede">
        These orders come from the part of the military that buys supplies. Everyone calls it DLA.
        They buy small things every day. Say your price and how fast you can deliver. DLA compares
        both, and the quote has to follow the rules.
      </p>
      {/* Acronym rule: the plain sentence is the headline, the official term is
          the small footnote underneath. Never the reverse.
          Hidden on cold start: there it was the ONLY other text on the screen
          and nothing on that screen glosses either term.
          DIBBS IS GONE FROM IT (D-E1/D-E2). The other two terms are each
          glossed by a plain sentence directly above — "Small orders" for the
          first, "Everyone calls it DLA" for the second — and DIBBS was glossed
          nowhere she can see. The note that used to justify it said the
          prerequisite list "directly above it spells out DIBBS": that list
          renders BELOW this line, ships COLLAPSED, and PrereqLine returns null
          once all four registrations are done, so for a registered member the
          word had no antecedent anywhere on the surface. It is earned in the
          registrations panel, where it arrives with a sentence. */}
      {/* THE ACRONYM RULE, applied to the most repeated word on the surface.
          "DLA" appears about forty times — on the money caption, on the
          verdict, on the send steps — and was expanded nowhere. The only
          official form was this footnote, which is the rule run backwards: the
          term with no plain sentence above it. Now the plain sentence is the
          larger line and the official name is the small one beneath, and the
          acronym is tied to it once so every later use has a referent.

          MOVED ABOVE THE AWARD-RULE SENTENCE, 20 Aug 2026, and it is a real
          defect rather than a tidy-up. Round 6 rewrote the lede above this one
          to "DLA compares both, and the quote has to follow the rules" — which
          introduced the acronym one sentence BEFORE the sentence that explains
          it. The rule is the plain words at FIRST mention, not the sentence
          after. She now meets "the part of the military that buys supplies",
          then the name, and every later use on the surface has a referent. */}
      {showTerm && <p className="mp-header__term">Micro purchases · Defense Logistics Agency</p>}
    </header>
  );
}

/**
 * Does Hunter's block ride?
 *
 * Two of these three clauses are the prototype's. The third is ours, and it is
 * why this is a named function rather than an expression inside the JSX: over a
 * live backend the fetch can FAIL, and over a static corpus it cannot, so the
 * prototype's gate has no case for it.
 *
 * `hunterSummary()`'s first branch is "Today's orders from DLA did not load",
 * the only place that sentence exists on this surface. Without the third clause
 * a member who has named her trade and got a failed fetch falls past this gate
 * to <EmptyState/> and is told "Nothing today for fasteners. That is normal."
 * over an outage — the one distinction relevance.ts carries `feedArrived` for,
 * lost on the last hop.
 */
export function hunterRides(
  hasRows: boolean,
  hasCategories: boolean,
  feedArrived: boolean,
): boolean {
  return hasRows || !hasCategories || !feedArrived;
}

/**
 * What puts an order at the top of "For you" and "All orders", said under the
 * tabs. It said "Best lifts…" while "Best first" was a sort button; the tabs
 * replaced the sorts, and every walked tab ranks the same way.
 *
 * IT SAID "BEST MEANS ORDERS YOU CAN BID TODAY", and that was the last
 * permission claim on this surface after DH-36 corrected the heading. DH-36
 * left it because it speaks about the RANKING rather than about membership, so
 * DH-38 decided it against the sort. The sort says it is false.
 *
 * `queryOrders()` takes the list from `mayBid(o) || ourGap(o) != null` and
 * orders it on `relevanceScore()`, which holds no permission term. It reads her
 * record with the exact stock number — won +2000, supplied +1000, said-she-can-
 * get +400 — then how easy the order is to quote, and it demotes an order we
 * could not rule on by 300. A demotion is a position, not a boundary. Measured
 * on the live-mapper board, 10 September 2026: one tap on the sourcing panel
 * puts a gap row FIRST, over all four rows she may bid.
 *
 * SO THE SENTENCE NAMES THE TOP KEY AND STOPS THERE. It does not say gap rows
 * sink, because the same measurement shows one that does not. "Lifts" is the
 * verb the score supports: a win raises the score, and her latest answer still
 * wins — a part she says she cannot get is forced last by `queryOrders()`,
 * under a card line that says so.
 *
 * The second clause is a claim about a fact she may not have given us, and it
 * is unchanged. Removing the wall in front of this board means the very first
 * screen can now be a board with no categories on it, and there "ones that fit
 * what you sell" describes an input that does not exist — the same abstain rule
 * `whyThisOrder` already follows on this path. Say only the half that is true,
 * and let the chip above offer the other half.
 */
export function SortHint({
  hasCategories,
  hasProfileFit = false,
}: {
  hasCategories: boolean;
  /** Fit is coming from her matching-engine scores or her NAICS codes. */
  hasProfileFit?: boolean;
}) {
  const lifts = "At the top: parts you have won or said you can get";
  const tail = hasCategories
    ? ", and ones that fit what you sell."
    : hasProfileFit
      ? ", and ones that fit your business profile."
      : ".";
  return <p className="mp-sorthint">{lifts + tail}</p>;
}

/** The icon on each tab: the opportunities feed's icons for its matching tabs. */
const BOARD_TAB_ICON: Record<BoardView, LucideIcon> = {
  "for-you": FileText,
  all: Layers,
  saved: Bookmark,
};

/**
 * The three tabs: "Orders for you", "All orders" and "Saved".
 *
 * The opportunities feed's tab bar, so the two pages look the same. Each tab is
 * a different set of orders with its own address (`?view=`). No tab has a
 * count badge (owner, 2026-09-16).
 */
export function BoardTabs({
  view,
  onChange,
}: {
  view: BoardView;
  onChange: (next: BoardView) => void;
}) {
  return (
    <TabBar
      active={view}
      onChange={onChange}
      tabs={BOARD_VIEWS.map((v) => ({ key: v.id, label: v.label, icon: BOARD_TAB_ICON[v.id] }))}
    />
  );
}

/**
 * An empty "For you". Hunter picks these orders from the industry codes
 * (NAICS) in her business profile, so the sentence says where to look, and the
 * button opens every order. It says nothing while a failed walk is on screen:
 * Hunter's verdict owns that sentence.
 */
export function ForYouEmpty({
  feedArrived,
  onSeeAll,
}: {
  feedArrived: boolean;
  onSeeAll: () => void;
}) {
  if (!feedArrived) return null;
  return (
    <div className="mp-empty">
      <p className="mp-empty__head">Nothing today fits your business profile.</p>
      <p className="mp-empty__body">
        Hunter picks these orders from the industry codes (NAICS) in your business profile. If your
        profile has none, add them there.
      </p>
      <button type="button" className="btn btn-secondary" onClick={onSeeAll}>
        See all orders
      </button>
    </div>
  );
}

/** An empty, loading or failed "Saved" tab. */
export function SavedEmpty({
  state,
  onRetry,
  onSeeAll,
}: {
  state: "ready" | "loading" | "failed";
  onRetry: () => void;
  onSeeAll: () => void;
}) {
  if (state === "loading") return <FeedLoadingState label="Getting your saved orders" />;
  if (state === "failed") {
    return (
      <div className="mp-empty">
        <p className="mp-empty__head">Your saved orders did not load.</p>
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className="mp-empty">
      <p className="mp-empty__head">You have not saved any orders yet.</p>
      <p className="mp-empty__body">
        Open an order and tap Save. It stays here, even after it closes.
      </p>
      <button type="button" className="btn btn-secondary" onClick={onSeeAll}>
        See all orders
      </button>
    </div>
  );
}

/**
 * What the board says instead of a list — and the one case where it says
 * nothing at all.
 */
export function EmptyState({
  feedArrived,
  hasFilters,
  categoryLabel,
  scoped,
  onClear,
  onChangeCategory,
}: {
  /** Did a feed reach us? Every sentence below is about a QUIET DAY, and not
   *  one of them is true of a fetch that failed: "Nothing today for fasteners.
   *  That is normal. New orders arrive every weekday." over an outage tells her
   *  the market is empty when what is empty is our answer. `feedArrived` is the
   *  field relevance.ts carries precisely so the two cannot be conflated, and
   *  the broken-feed sentence has its own speaker — Hunter's verdict, which
   *  renders in this exact case. This block stands down rather than restating
   *  it, because two explanations of one nothing is the defect that comment
   *  above hunterRides() already describes. */
  feedArrived: boolean;
  hasFilters: boolean;
  categoryLabel: string;
  /** Has she named a trade? Only then does `categoryLabel` name one — before
   *  that the chip reads "You have not said yet", which cannot be dropped into
   *  a sentence about what the board holds. */
  scoped: boolean;
  onClear: () => void;
  onChangeCategory: () => void;
}) {
  if (!feedArrived) return null;
  // Nothing here is red, and nothing here is her fault.
  if (hasFilters) {
    return (
      <div className="mp-empty">
        <p className="mp-empty__head">No orders match what you chose.</p>
        <button type="button" className="btn btn-secondary" onClick={onClear}>
          Clear what I chose
        </button>
      </div>
    );
  }
  return (
    <div className="mp-empty">
      {/* THE LABEL IS NOT ALWAYS A CATEGORY NAME. This interpolated
          `categoryLabel.toLowerCase()` into a sentence that assumes one, and the
          chip reads "You have not said yet" before she has answered — so an
          empty board rendered "Nothing today for you have not said yet."
          She has two different empty boards and they are not the same fact: one
          says nothing matched the trade she named, the other says the board is
          empty and she has named nothing. Only the first can name a trade. */}
      <p className="mp-empty__head">
        {scoped ? `Nothing today for ${categoryLabel.toLowerCase()}.` : "Nothing today."}
      </p>
      <p className="mp-empty__body">That is normal. New orders arrive every weekday.</p>
      <button type="button" className="btn btn-secondary" onClick={onChangeCategory}>
        Change the parts you picked
      </button>
    </div>
  );
}

/**
 * "Load more" — the control that asks for the next 50 orders (DH-28).
 *
 * ── WHY IT EXISTS ────────────────────────────────────────────────────────
 *
 * The member asked for it. The board served 500 orders in one request and took
 * 13 to 28 seconds to do it; 50 rows cost 1,045 ms of database work against
 * 4,928 ms, and 43 KB of payload against 422 KB. So the board loads 50 and asks
 * before loading more.
 *
 * ── THE BUTTON NAMES NO NUMBER ───────────────────────────────────────────
 *
 * It said "Load 50 more orders" and "Load the last 12 orders". A click loads 50
 * ORDERS from the server, but some of them go to "Ones not open to you" and her
 * own filters hide others, so the list can grow by fewer than 50. The button
 * therefore says "Load more" on every page (owner, 2026-09-16).
 *
 * The line under it still names how many orders the server holds past the next
 * page, and it is the SERVER's number. It is printed ONLY when more remains
 * after the next click.
 *
 * ── IT NEVER OFFERS A CLICK THAT LOADS NOTHING ───────────────────────────
 *
 * `next == null` renders nothing at all, and that is exact rather than guessed:
 * the server reads one document past the page to decide it. A rule that read
 * `orders.length === 50` instead could not tell a full last page from a page
 * with more behind it, and would have offered her a request returning zero.
 *
 * ── IT COUNTS ORDERS, NOT MATCHES ────────────────────────────────────────
 *
 * The list above it is ranked and filtered by `relevance.ts`, so loading 50 more
 * ORDERS may add two rows or none. The wording says orders for that reason. A
 * button promising "50 more" over a list that grew by two would be a small lie
 * repeated on every click.
 */
export function LoadMore({
  next,
  loading,
  onLoad,
}: {
  next: SmallOrdersNextPage | null;
  loading: boolean;
  onLoad: () => void;
}) {
  if (next === null) return null;
  const last = next.remaining <= next.loads;
  return (
    <div className="mp-more">
      <button type="button" className="btn btn-secondary" onClick={onLoad} disabled={loading}>
        {loading ? "Getting them from DLA…" : "Load more"}
      </button>
      {!last && (
        <p className="mp-more__left">
          {next.remaining.toLocaleString("en-US")} more orders are ready to load.
        </p>
      )}
    </div>
  );
}
