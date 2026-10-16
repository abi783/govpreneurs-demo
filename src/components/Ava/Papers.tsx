// Certificates and the other papers she sends (ava-two-phase.html 6.3): each
// paper as a picture, the way the buyer will see it, with what Ava checked
// and the rule it answers. A paper still missing is a hole, ringed in blue,
// saying what it needs. Never red.
//
// Ava says a paper meets the rule only from what she read on it (review
// panel, 7 October 2026). The values she can read today are numbers (an added
// cost); none of them is the insured, the limits or the expiry. So a paper
// that answers a rule reads "You said it meets the rule", with the buyer's
// own terms to check it against, and what Ava did read beside it.

import { Hole, StatusMark } from "../ds/AgentWorkspace";
import { askResolved, askStatus } from "../../lib/ava/derive";
import { usd } from "../../lib/ava/price";
import { buyerWord, ruleOfAsk } from "../../lib/ava/flow";
import { requirementStatus } from "../../lib/ava/checks";
import type { Piece } from "../../lib/ava/package";
import { OWNER_WORDS } from "../../lib/ava/thread";
import { SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";

export function Papers({
  ctx,
  piece,
  holeOn,
  onHole,
}: {
  ctx: AvaContext;
  piece: Piece;
  holeOn?: string | null;
  onHole: (key: string) => void;
}) {
  const { bid, s } = ctx;
  const asks = (piece.papers ?? [])
    .map((p) => bid.asks.find((a) => a.id === p.askId))
    .filter((a): a is NonNullable<typeof a> => !!a);
  return (
    <div className="ava2-papers">
      {asks.map((ask) => {
        const key = `ask:${ask.id}`;
        const a = s.answers[ask.id];
        // A step toward the paper (a quote for coverage) is not the paper: it
        // stays a hole until the paper itself comes (round 2).
        const option =
          a?.status === "dont-have" ? ask.dontHave?.find((o) => o.id === a.optionId) : undefined;
        const step = !!option && !option.satisfies;
        const done = askResolved(bid, s, ask.id) && !step;
        const rule = ruleOfAsk(bid, ask.id);
        if (!done) {
          const forwarded = askStatus(bid, s, ask) === "forwarded";
          const called = !!a?.forwardedTo?.startsWith("a call to ");
          return (
            <Hole
              key={ask.id}
              title={`${ask.title}: not here yet`}
              line={
                step
                  ? `You chose: ${option!.label.replace(/\.$/, "")}. The paper itself is not here yet. Add it when it comes.`
                  : forwarded
                    ? called
                      ? `You said you will call ${OWNER_WORDS[ask.owner]}. Add it when it comes.`
                      : `You asked ${OWNER_WORDS[ask.owner]} for it. Add it when it comes.`
                    : ask.why
              }
              act={forwarded || step ? "Add it now" : "Add your copy"}
              on={holeOn === key}
              onOpen={() => onHole(key)}
            />
          );
        }
        const v = rule ? requirementStatus(bid, s, rule) : null;
        // What Ava read on the file, with its unit. Only numbers today.
        const read =
          ask.answer.type === "upload"
            ? (ask.answer.extracts ?? []).flatMap((x) => {
                const val = a?.values?.[x.fieldId];
                if (typeof val !== "number") return [];
                return [
                  `${x.label}: ${x.unit === "usd" ? usd(val) : x.unit === "percent" ? `${val}%` : val}`,
                ];
              })
            : [];
        const terms = rule?.source.quote ?? ask.source.quote;
        return (
          <div key={ask.id} className="ava2-paper">
            <div className="ava2-paper__img" aria-hidden>
              <div className="ava2-photo__paper">
                <i className="t" />
                <i />
                <i className="s" />
                <i />
                <i className="s" />
              </div>
            </div>
            <div className="ava2-paper__b">
              <b>{ask.title}</b>
              <span className="ava2-list__sub mono">{a?.fileName ?? "Your file"}</span>
              <ul className="ava2-paper__checks">
                {read.length > 0 ? (
                  <li>
                    <StatusMark kind="done" small />
                    <span>I read from it: {read.join(" · ")}</span>
                  </li>
                ) : null}
                {rule ? (
                  <li>
                    <StatusMark kind="need" small />
                    <span>
                      The rule: {rule.label}{" "}
                      <SourcePin bid={bid} source={rule.source} claim={rule.label} />.{" "}
                      {v?.status === "meets"
                        ? "You said your paper meets it. I could not read the details it needs."
                        : "Not checked against it yet."}
                      {terms ? (
                        <span className="ava2-paper__terms">
                          Check your paper against the {buyerWord(bid)}'s words: “{terms}”
                        </span>
                      ) : null}
                    </span>
                  </li>
                ) : (
                  <li>
                    <StatusMark kind="done" small />
                    <span>
                      In your bid <SourcePin bid={bid} source={ask.source} claim={ask.title} />
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
