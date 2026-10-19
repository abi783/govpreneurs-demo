// Shared helpers for Ava's screens: the views a finding can send the member to,
// and the prototype controls. The controls are hidden: Shift+Alt+A shows them
// (AvaControls.ts), so a presenter can jump a bid to another state.

import { dueLine, questionsWhen } from "../../lib/ava/pages";
import { pendingAddenda, PRICE_YOURSELF_KEY } from "../../lib/ava/derive";
import { NO_GRANT_KEY } from "../../lib/ava/grant";
import { REPLY_SIMPLE_KEY } from "../../lib/ava/scope";
import { resetGrantFacts } from "../../demo/ava/grantFacts";
import { STORY_BID_IDS } from "../../demo/ava/opportunity";
import { ava, avaDemo, type BidState } from "../../lib/ava/store";
import { CASES } from "../../lib/ava/cases";
import type { AvaBid } from "../../lib/ava/types";
import { useNavigate } from "@tanstack/react-router";
import type { AvaContext } from "./useAva";
import type { AvaView } from "./views";

export { dueLine, questionsWhen };

// ─── Where a finding can send the member ───

/** Until the member confirms the brief, only the brief is open: Ava builds
 *  nothing and asks for nothing before they say it is right. */
export function viewsFor(bid: AvaBid, s: BidState): AvaView[] {
  if (!s.briefConfirmed) return ["brief"];
  const v: AvaView[] = ["brief", "list"];
  if (bid.sections.length > 0) v.push("writing");
  v.push("price", "forms", "check", "addenda", "submit", "requirements");
  return v;
}

// ─── Prototype controls ───

/** PROTOTYPE ONLY. Members never see these. "Screens from the design" opens
 *  this bid (or another sample) at any screen of docs/ava/ava-two-phase.html
 *  by playing it forward (lib/ava/cases.ts); the switches show states a
 *  sample's own files never reach. Addenda arrive on their own in the
 *  product; the prototype has no clock that moves, so a control delivers them. */
export function DemoBar({ ctx }: { ctx: AvaContext }) {
  const navigate = useNavigate();
  const pending = pendingAddenda(ctx.fixture, ctx.s);
  const { fixture, id } = ctx;
  const yours = !!ctx.s.fixes[PRICE_YOURSELF_KEY];
  const noGrant = !!ctx.s.fixes[NO_GRANT_KEY];
  // DEMO: only the screens of the member on stage's own bids (the design's
  // screens are all the caterer's).
  const cases = CASES.filter((c) => STORY_BID_IDS.includes(c.noticeId));
  return (
    <aside className="ava-demo ava-demo--float" aria-label="Prototype controls">
      <span className="ava-demo__label">Prototype controls</span>
      {cases.length > 0 ? (
        <label className="ava-demo__note">
          Screens from the design:{" "}
          <select
            className="ava-demo__select"
            value=""
            onChange={(e) => {
              const c = cases.find((x) => x.id === e.target.value);
              if (c)
                void navigate({
                  to: "/ava/$noticeId",
                  params: { noticeId: c.noticeId },
                  search: { case: c.id },
                });
            }}
          >
            <option value="">Choose a screen</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          resetGrantFacts(id);
          avaDemo.reset(id);
          void navigate({ to: "/ava/$noticeId", params: { noticeId: id }, search: {} });
        }}
      >
        Start the sample bid again
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => (noGrant ? ava.unfix(id, NO_GRANT_KEY) : ava.fix(id, NO_GRANT_KEY))}
      >
        {noGrant ? "Show Grant's read again" : "Show as not read by Grant"}
      </button>
      {fixture.kind === "reply" ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => ava.fix(id, REPLY_SIMPLE_KEY)}
        >
          Show the simpler version, with no drafting
        </button>
      ) : null}
      {fixture.price ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() =>
            yours ? ava.unfix(id, PRICE_YOURSELF_KEY) : ava.fix(id, PRICE_YOURSELF_KEY)
          }
        >
          {yours ? "Show the price Ava builds again" : "Show as a price Ava can't build yet"}
        </button>
      ) : null}
      {fixture.submission.method === "typed-portal" ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => ava.setPortalUnseen(id, !ctx.s.portalUnseen)}
        >
          {ctx.s.portalUnseen
            ? "Show the portal's questions again"
            : "Show as portal questions not in the files"}
        </button>
      ) : null}
      {pending.map((a) => (
        <button
          key={a.id}
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => ava.receiveAddendum(ctx.id, a.id)}
        >
          Post Addendum {a.number} now
        </button>
      ))}
      {/* An addendum she added: in the product Ava reads it and shows what
          changed. The prototype cannot read a file, so a control finishes it. */}
      {ctx.s.addendumUploads.map((u, i) =>
        ctx.s.fixes[`upload-compared:${i}`] ? null : (
          <button
            key={`${i}:${u.fileName}`}
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => ava.fix(id, `upload-compared:${i}`)}
          >
            Ava finishes comparing {u.fileName}
          </button>
        ),
      )}
      <span className="ava-demo__note">Shift+Alt+A hides this bar.</span>
    </aside>
  );
}
