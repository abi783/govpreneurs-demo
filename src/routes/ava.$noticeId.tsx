// Ava's workspace for one bid, in two phases (docs/ava/build-handoff-two-phase.md,
// the design in docs/ava/ava-two-phase.html).
//
//   · Phase 1, "Build your bid together": a conversation. Ava reads the
//     buyer's files, checks she can bid, asks one question at a time, then
//     checks the whole bid for mistakes on her own.
//   · Phase 2, "Read it and send it": the whole bid in the middle, her own
//     read, an optional mentor review, then she downloads and sends it.
//
// Reached from Grant's read of an opportunity. Pressing "Build this bid with
// Ava" there is her go. Against Grant's No Bid she gives a reason first
// (StartView). Grant decides, Ava builds: a rule she cannot meet pauses the
// bid, with Grant's read and her mentor one tap away (lib/ava/grant.ts).
//
// DEMO: four bids are fully built (src/lib/ava/fixtures). Any other
// opportunity in the story shows the handoff: Ava is reading the buyer's files.
// A number that is not in the story shows a friendly "not found".

import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import "../components/Ava/ava.css";
import "../components/ds/ds.css";
import { usePageMeta } from "../components/Layout/page-meta";
import { findOpportunity } from "../demo/ava/opportunity";
import { avaScope } from "../lib/ava/scope";
import { passToGrant } from "../lib/ava/grant";
import { ava } from "../lib/ava/store";
import { getGrantSummary } from "../demo/ava/grantSummary";
import { applyCase } from "../lib/ava/cases";
import { useAva, useAvaState } from "../components/Ava/useAva";
import { DemoBar } from "../components/Ava/AvaChrome";
import { useAvaControls } from "../components/Ava/AvaControls";
import { OutOfScopeView, ReplyNextStepView, StartView } from "../components/Ava/StartView";
import { HandoffView } from "../components/Ava/HandoffView";
import { WalkedAwayView } from "../components/Ava/DecisionView";
import { AddendaView } from "../components/Ava/AddendaView";
import { Workspace2, type WorkspaceNav } from "../components/Ava/Workspace2";
import { ensureSamplePapers } from "../components/Ava/samplePapers";
import { REPLY_SIMPLE_KEY } from "../lib/ava/scope";

interface AvaSearch {
  /** The question shown in the chat: a tapped hole or checklist row. */
  q?: string;
  /** Phase 2: the part of the bid shown. */
  tab?: string;
  /** Phase 2: the sentence she tapped. */
  sel?: string;
  /** The change report for an addendum. */
  page?: "changes";
  /** Prototype controls: open the bid at one of the design's screens
   *  (docs/ava/ava-two-phase.html, "?case=<id>"). lib/ava/cases.ts. */
  case?: string;
  /** With a case: open "Why?" on the question shown. */
  why?: string;
  /** With a case: open a dialog ("price", "mentor", "risk"). */
  dlg?: string;
}

export const Route = createFileRoute("/ava/$noticeId")({
  head: () => ({
    meta: [
      { title: "Ava — your bid · GovPreneurs" },
      {
        name: "description",
        content:
          "Ava builds the whole bid with you: the forms, the price and the writing. You read it and send it.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AvaSearch => {
    const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    return {
      q: str(search.q),
      tab: str(search.tab),
      sel: str(search.sel),
      // Old links: "changes" still opens the change report; the list and the
      // final build are the two phases now, which her state decides.
      page: search.page === "changes" ? "changes" : undefined,
      case: str(search.case),
      why: str(search.why),
      dlg: str(search.dlg),
    };
  },
  component: AvaWorkspace,
});

function NotFound({ noticeId }: { noticeId: string }) {
  return (
    <div className="ava-page">
      <div className="ava-head__top">
        <Link to="/ava" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} aria-hidden /> Bids Ava is building
        </Link>
      </div>
      <section className="ava-card ava-notfound">
        <h1 className="ava-empty__h">Ava cannot find this bid</h1>
        <p className="ava-empty__p">
          No opportunity has the number <span className="mono">{noticeId}</span>. It may have
          closed, or the number may have a typing mistake.
        </p>
        <div className="ava-actions">
          <Link to="/ava" className="btn btn-primary">
            See the bids Ava is building
          </Link>
          <Link to="/opportunities" className="btn btn-secondary">
            Open your opportunities
          </Link>
        </div>
      </section>
    </div>
  );
}

function AvaWorkspace() {
  const { noticeId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  usePageMeta({ layout: "wide" });
  const controls = useAvaControls();

  const opp = findOpportunity(noticeId);
  const ctx = useAva(noticeId);
  const s = useAvaState(noticeId);

  // Prototype controls: a screen from the design, applied once per case id.
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (!search.case || applied.current === search.case) return;
    applied.current = search.case;
    const extra = applyCase(search.case);
    if (extra)
      void navigate({ search: (prev: AvaSearch) => ({ ...prev, ...extra }), replace: true });
  }, [search.case, navigate]);

  // A paper she sent before a reload is known by name only. The demo makes a
  // small stand-in file for each one, so her download always carries her
  // papers and she is never asked to send one twice.
  useEffect(() => {
    if (ctx) void ensureSamplePapers(ctx.id, ctx.bid, ctx.s);
  }, [ctx]);

  // Proof, answers and a rule she cannot meet go on to Grant, so his read
  // stays current. Grant weighs them; Ava decides nothing.
  useEffect(() => {
    if (ctx && s.started) passToGrant(ctx.id, ctx.bid, ctx.s);
  }, [ctx, s.started]);

  // Arriving from "Build this bid with Ava" is her go. Against Grant's No
  // Bid, StartView asks for a reason first, and starts only when she gives one.
  const grantSaysNo = opp ? getGrantSummary(opp).call === "No Bid" : false;
  useEffect(() => {
    if (!ctx || search.case) return;
    if (!s.started && !s.walkedAway && !grantSaysNo) ava.start(noticeId);
    if (s.started && !s.briefConfirmed) ava.confirmBrief(noticeId);
  }, [ctx, grantSaysNo, noticeId, s.started, s.walkedAway, s.briefConfirmed, search.case]);

  // A tap inside her bid keeps her place: on a phone the page scrolls as one,
  // and a jump to the top loses what she opened (PRD RS-02; review panel,
  // round 2).
  const set = (next: Partial<AvaSearch>) =>
    void navigate({
      search: (prev: AvaSearch) => ({ ...prev, ...next }),
      replace: true,
      resetScroll: false,
    });

  if (!opp) return <NotFound noticeId={noticeId} />;

  const scope = avaScope(opp);
  if (!scope.ok) return <OutOfScopeView opp={opp} title={scope.title} reason={scope.reason} />;
  // Against Grant's No Bid she gives a reason first, even for a bid Ava has
  // not read yet; the handoff follows once she decides.
  if (!s.started && grantSaysNo) return <StartView opp={opp} bid={ctx?.fixture ?? null} />;
  if (!ctx) return <HandoffView opp={opp} />;
  if (!s.started) return <div className="ava-page" />;
  if (s.walkedAway) return <WalkedAwayView ctx={ctx} />;
  if (ctx.bid.kind === "reply" && ctx.s.fixes[REPLY_SIMPLE_KEY])
    return <ReplyNextStepView opp={opp} bid={ctx.bid} />;

  if (search.page === "changes") {
    return (
      <div className="ava-page">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => set({ page: undefined })}
        >
          <ArrowLeft size={14} aria-hidden /> Back to your bid
        </button>
        {/* Each "Back to you" opens its question in her bid's chat, where it
            is asked again (review panel, 7 October 2026). */}
        <AddendaView
          ctx={ctx}
          go={(view, focus) =>
            set({
              page: undefined,
              q: view === "price" ? "price" : focus?.ask ? `ask:${focus.ask}` : undefined,
            })
          }
          ask={(key) => set({ page: undefined, q: key })}
          focus={{}}
        />
        {controls ? <DemoBar ctx={ctx} /> : null}
      </div>
    );
  }

  const nav: WorkspaceNav = {
    focus: search.q ?? null,
    setFocus: (key) => set({ q: key ?? undefined }),
    tab: search.tab ?? null,
    setTab: (partId) => set({ tab: partId ?? undefined, sel: undefined }),
    sel: search.sel ?? null,
    setSel: (key) => set({ sel: key ?? undefined }),
    open: (partId, key) => set({ tab: partId ?? undefined, sel: key ?? undefined }),
    onChanges: () => set({ page: "changes" }),
    why: search.why === "1",
    dlg: search.dlg ?? null,
  };

  return (
    <>
      <Workspace2 ctx={ctx} nav={nav} />
      {controls ? <DemoBar ctx={ctx} /> : null}
    </>
  );
}
