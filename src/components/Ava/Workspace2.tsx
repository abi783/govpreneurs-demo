// Ava's workspace for one bid, in two phases (docs/ava/build-handoff-two-phase.md):
// the checklist on the left, Ava's header across the rest, and her workspace
// under it — a conversation while she builds, the whole bid once it is ready.

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { lastWholeDownload } from "../../lib/ava/flow";
import { ava } from "../../lib/ava/store";
import { addendumPostedDay, daysLeft, receivedAddenda } from "../../lib/ava/derive";
import { fullDate } from "../../lib/ava/dates";
import { unseenAddenda } from "../../lib/ava/status";
import { findOpportunity } from "../../demo/ava/opportunity";
import { AvaHead, BidTop, Checklist, useRailOpen, useSideOpen } from "./Frame2";
import { Reader } from "./Reader";
import { Talk } from "./Talk";
import { useFlow } from "./useFlow";
import type { AvaContext } from "./useAva";

export interface WorkspaceNav {
  /** The question shown in the chat: a tapped hole or checklist row. */
  focus: string | null;
  setFocus: (key: string | null) => void;
  /** Phase 2: the part of the bid shown, and the sentence she tapped. */
  tab: string | null;
  setTab: (partId: string | null) => void;
  sel: string | null;
  setSel: (key: string | null) => void;
  /** Phase 2: open a part and select a sentence in it, in one step. */
  open: (partId: string | null, sel: string | null) => void;
  onChanges: () => void;
  /** PROTOTYPE ONLY: a case opens with "Why?" or a dialog already open. */
  why: boolean;
  dlg: string | null;
}

export function Workspace2({ ctx, nav }: { ctx: AvaContext; nav: WorkspaceNav }) {
  const view = useFlow(ctx, nav.focus);
  const [railOpen, toggleRail] = useRailOpen();
  const side = useSideOpen();
  const phase2 = view.flow.stage === "read";
  // The header's mentor button opens the mentor dialog of whichever phase is
  // on screen (Shyam, 8 October 2026).
  const [mentorAsk, setMentorAsk] = useState(0);
  // Phase 2: tapping a part of her bid or a sentence asks about it in the
  // chat on the right. A folded chat opens, so no tap ever looks dead.
  useEffect(() => {
    if (phase2 && (nav.focus || nav.sel)) side.show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase2, nav.focus, nav.sel]);

  const openRow = (key: string) => {
    if (!phase2) return nav.setFocus(key);
    // Phase 2: a row opens its part of the bid, and its question in the chat.
    const f = view.flow;
    const q = [
      ...f.queue,
      ...f.holes,
      ...f.holds.flatMap((h) => (h.question ? [h.question] : [])),
    ].find((h) => h.key === key);
    const part = f.parts.find((p) => p.pieces.some((pc) => q?.pieces.some((x) => x.id === pc.id)));
    if (part) nav.setTab(part.id);
    nav.setFocus(key);
  };

  // The steps and the deadline notice sit over the left column only, so the
  // right column runs to the top.
  const top = (
    <>
      <AvaHead view={view} />
      <DueNotice ctx={ctx} />
    </>
  );

  return (
    <div className="ava2">
      <BidTop
        ctx={ctx}
        av={view.head.av}
        view={view}
        phase2={phase2}
        onMentor={() => setMentorAsk((n) => n + 1)}
      />
      <ChangeBanner ctx={ctx} onOpen={nav.onChanges} />
      <div className={`ava2-panes${railOpen ? " is-open" : ""}`}>
        <Checklist ctx={ctx} view={view} open={railOpen} onToggle={toggleRail} onOpen={openRow} />
        <section className="ava2-work" aria-label="Ava's workspace">
          {phase2 ? (
            <Reader ctx={ctx} view={view} nav={nav} top={top} side={side} mentorAsk={mentorAsk} />
          ) : (
            <Talk
              ctx={ctx}
              view={view}
              onFocus={nav.setFocus}
              why={nav.why}
              dlg={nav.dlg}
              top={top}
              side={side}
              mentorAsk={mentorAsk}
            />
          )}
        </section>
      </div>
    </div>
  );
}

/** The latest addendum, until she reads the change report. On a federal bid
 *  Ava finds it on the notice. On a state or local bid addenda go only to the
 *  bidders the buyer knows about, so the only way one reaches Ava is that she
 *  adds it (PRD §9.2): the banner never says Ava found it (review panel, 7
 *  October 2026). */
function ChangeBanner({ ctx, onOpen }: { ctx: AvaContext; onOpen: () => void }) {
  const { fixture, s, id } = ctx;
  const got = receivedAddenda(fixture, s);
  const last = got[got.length - 1];
  if (!last) return null;
  if (!unseenAddenda(fixture, s).some((a) => a.id === last.id)) return null;
  const touched = last.changes.filter((c) => c.effect !== "no-effect").length;
  const reopened = last.changes.filter((c) => c.effect === "reopened").length;
  const day = fullDate(addendumPostedDay(last));
  const federal = findOpportunity(id)?.scope === "fed";
  return (
    <div className="ava-banner is-new" role="status">
      <TriangleAlert size={15} strokeWidth={2} aria-hidden />
      <p className="ava-banner__text">
        <strong>
          {federal
            ? `Addendum ${last.number} was posted on ${day}.`
            : `You added Addendum ${last.number} on ${day}.`}
        </strong>{" "}
        {touched === 0
          ? "None of its changes touch your bid."
          : `${touched} ${touched === 1 ? "change touches" : "changes touch"} your bid${
              reopened > 0
                ? `, and ${reopened} ${reopened === 1 ? "needs" : "need"} your answer again`
                : ""
            }.`}
      </p>
      <button type="button" className="btn btn-sm btn-primary" onClick={onOpen}>
        See what changed
      </button>
    </div>
  );
}

/** The deadline passed (8.7): she can stop working on the bid, unless she
 *  downloaded it. */
function DueNotice({ ctx }: { ctx: AvaContext }) {
  const { bid, s, id } = ctx;
  // The header says the deadline passed; this adds only the way out.
  if (daysLeft(bid) >= 0 || lastWholeDownload(s)) return null;
  return (
    <p className="ava2-banner" role="status">
      <span>You did not download this bid. You can stop working on it.</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => ava.walkAway(id)}>
        Stop working on this bid
      </button>
    </p>
  );
}
