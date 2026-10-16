// Back with Grant. The member cannot meet a pass-or-fail rule, so the bid goes
// back to Grant: whether to bid is his call, not Ava's (docs/ava/README.md,
// "Grant decides, Ava builds"). Ava pauses, passes the fact on
// (lib/ava/grant.ts) and shows his call. The member can change the answer,
// ask a Mentor, or stop working on the bid. Ava does not leave an ask open forever.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GrantAttr } from "./GrantPrimitives";
import { untellGrant } from "../../demo/ava/grantFacts";
import { bidDecision } from "../../lib/ava/derive";
import { ava } from "../../lib/ava/store";
import { MentorAsk } from "./MentorAsk";
import { AvaCard, ConfirmDialog, SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";
import type { AvaView, Focus } from "./views";

export function BackWithGrant({
  ctx,
  go,
}: {
  ctx: AvaContext;
  go: (v: AvaView, f?: Focus) => void;
}) {
  const { bid, s, id, grant } = ctx;
  const d = bidDecision(bid, s);
  const [walk, setWalk] = useState(false);
  if (!d) return null;
  const fromAsk = d.fromAskId ? bid.asks.find((a) => a.id === d.fromAskId) : undefined;

  const undo = () => {
    ava.keepGoing(id);
    if (bid.failedAtStart) ava.fix(id, "failed-at-start");
    if (!fromAsk) return;
    ava.reopenAsk(id, fromAsk.id);
    if (fromAsk.grantQuestion) untellGrant(id, fromAsk.grantQuestion);
    go("list", { ask: fromAsk.id });
  };

  return (
    <AvaCard label="Back with Grant" className="ava-decision" id="ava-decision">
      <p className="ava-decision__h" tabIndex={-1}>
        You cannot meet a pass-or-fail rule.
      </p>
      <p className="ava-decision__why">
        {d.reason} {d.source ? <SourcePin bid={bid} source={d.source} claim={d.reason} /> : null}
      </p>
      {grant ? (
        <div className="ai-surface ava-why__grant">
          <GrantAttr subtitle="the bid call, with your answer" />
          <p className="ava-why__call">Grant says {grant.call}</p>
          <p className="ava-says">{grant.gist}</p>
        </div>
      ) : null}
      <p className="ava-muted">
        {grant
          ? "Ava has paused. Whether to go on is Grant's call, not Ava's. Your answers stay saved."
          : "Grant has not read this bid yet. Ava has paused until he does. Your answers stay saved."}
      </p>
      <div className="ava-decision__options">
        <div className="ava-decision__opt">
          <p className="ava-decision__optlabel">See Grant&apos;s read</p>
          <p className="ava-muted">His full read of the bid, with your answer in it.</p>
          <Link
            to="/opportunities/$noticeId"
            params={{ noticeId: id }}
            className="btn btn-primary btn-sm ava-btn-wrap"
          >
            Open Grant&apos;s read of this bid
          </Link>
        </div>
        <div className="ava-decision__opt">
          <p className="ava-decision__optlabel">You can meet it after all</p>
          <p className="ava-muted">
            {fromAsk ? "Change your answer, and Ava goes on." : "Take it back, and Ava goes on."}
          </p>
          <button type="button" className="btn btn-secondary btn-sm ava-btn-wrap" onClick={undo}>
            {fromAsk ? `Change my answer on: ${fromAsk.title}` : "I can meet it after all"}
          </button>
        </div>
        <div className="ava-decision__opt">
          <p className="ava-decision__optlabel">Ask a Mentor</p>
          <p className="ava-muted">A Mentor can help you weigh it. Ava does not wait for them.</p>
          <MentorAsk
            ctx={ctx}
            itemKey="decision"
            label="Ask your Mentor about this"
            message={`My bid for ${bid.officialTitle} is back with Grant. ${d.reason} Can you help me decide?`}
            quiet
          />
        </div>
        <div className="ava-decision__opt">
          <p className="ava-decision__optlabel">Stop working on it</p>
          <p className="ava-muted">Ava keeps what you approved for your next bid.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setWalk(true)}>
            Stop working on this bid
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={walk}
        onOpenChange={setWalk}
        title="Stop working on this bid?"
        lines={[
          "Ava stops work on this bid.",
          "Your answers and approvals stay saved for your next bid.",
          "You can undo this later.",
        ]}
        agreement="I do not want to bid on this one."
        confirmLabel="Stop working on it"
        onConfirm={() => ava.walkAway(id)}
      />
    </AvaCard>
  );
}

export function WalkedAwayView({ ctx }: { ctx: AvaContext }) {
  const { bid, s, id } = ctx;
  const d = bidDecision(bid, s);
  return (
    <div className="ava-page">
      <div className="ava-head__top">
        <Link to="/opportunities" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} aria-hidden /> Find another bid
        </Link>
      </div>
      <section className="ava-card">
        <h1 className="ava-empty__h">You stopped working on this bid</h1>
        <p className="ava-empty__p">{bid.officialTitle}</p>
        {d ? <p className="ava-empty__p">The reason: {d.reason}</p> : null}
        <p className="ava-empty__p">Ava keeps your answers and approvals for your next bid.</p>
        <div className="ava-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => ava.undoWalkAway(id)}
          >
            Undo: go back to this bid
          </button>
        </div>
      </section>
    </div>
  );
}
