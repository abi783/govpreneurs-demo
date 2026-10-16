// A form from the buyer, filled in (docs/ava/ava-two-phase.html, 6.2): the
// form as the buyer printed it, with her facts typed in. Facts from her
// records are plain text; a box still waiting on her is a blue dashed hole
// that says what it needs; signature boxes read "You sign here, at the end";
// a notary box says a notary fills it in.

import { PenLine, Stamp } from "lucide-react";
import { InlineHole } from "../ds/AgentWorkspace";
import { askResolved, visibleAsks } from "../../lib/ava/derive";
import { packageParts, piecesOfAsk } from "../../lib/ava/package";
import { usd } from "../../lib/ava/price";
import type { BidState } from "../../lib/ava/store";
import type { Ask, AvaBid, BidForm } from "../../lib/ava/types";
import type { AvaContext } from "./useAva";

/** What a government form does for the member, in one plain line, read from
 *  its official name (the acronym rule: say what it is before its name).
 *  Null when Ava has no plain line for it; the official name then stands alone. */
const PURPOSE: Array<[RegExp, string]> = [
  [/non-collusion/i, "Says you did not agree on prices with other bidders"],
  [/iran divestment/i, "Says your company is not on the state's Iran divestment list"],
  [/e-verify/i, "Says you follow the state's E-Verify law"],
  [/\bw-9\b/i, "Gives the buyer your tax number so they can pay you"],
  [
    /acknowledg|sf 30|amendment of solicitation/i,
    "Says you received this change to the buyer's files",
  ],
  [/sf 1449/i, "Your signed offer. If the buyer accepts it, it becomes the contract."],
  [
    /representations and certifications/i,
    "Your standard statements to the government about your company",
  ],
  [/bid bond/i, "Your surety pays the buyer if you win but do not sign the contract"],
  [/performance bond|surety letter/i, "Says your surety will guarantee your work if you win"],
  [/certificate of insurance/i, "Shows the buyer you have the insurance it asks for"],
  [/reference/i, "Names past customers the buyer may call about your work"],
  [/cover sheet/i, "The first page of your proposal, with your company details"],
  [/price schedule|price sheet|bid form/i, "The buyer's sheet where your prices go"],
];

export function purposeOf(f: BidForm): string | null {
  return PURPOSE.find(([re]) => re.test(f.name))?.[1] ?? null;
}

/** What a box on a form says once she answered: the value she typed, the
 *  choice she picked, the words she approved (or her correction), or the
 *  file she sent. Null while it is still open. One reader for the screen and
 *  the file she downloads, so an approved answer never prints as a blank
 *  (review panel, 7 October 2026). */
export function answerOnForm(bid: AvaBid, s: BidState, ask: Ask, fieldId: string): string | null {
  if (!askResolved(bid, s, ask.id)) return null;
  const a = s.answers[ask.id];
  const v = a?.values?.[fieldId];
  if (ask.answer.type === "enter" && v !== undefined && v !== "") {
    const f = ask.answer.fields.find((x) => x.id === fieldId);
    if (typeof v === "number" && f?.unit === "usd") return usd(v);
    if (typeof v === "number" && f?.unit === "usd-hour") return `${usd(v)} an hour`;
    if (typeof v === "number" && f?.unit === "percent") return `${v}%`;
    return String(v);
  }
  if (ask.answer.type === "answer")
    return ask.answer.choices.find((c) => c.id === a?.choiceId)?.label ?? null;
  if (ask.answer.type === "approve") {
    // Her correction, else the fact she approved, as stored. Never words
    // pulled from the question Ava asked (review panel, round 2; PRD A15).
    const fix = a?.values?.correction;
    if (typeof fix === "string" && fix) return fix;
    return ask.answer.value ?? ask.title;
  }
  if (ask.answer.type === "upload") return a?.fileName ?? null;
  return v !== undefined ? String(v) : null;
}

/** The asks whose answers land on this form, in the form's order. */
export function formAsks(ctx: AvaContext, form: BidForm) {
  const { bid, s } = ctx;
  const parts = packageParts(bid);
  return visibleAsks(bid, s).filter((a) =>
    piecesOfAsk(bid, s, parts, a.id).some((pc) => pc.formId === form.id),
  );
}

export function FormPaper({
  ctx,
  form,
  holeOn,
  onHole,
  small,
}: {
  ctx: AvaContext;
  form: BidForm;
  holeOn?: string | null;
  onHole: (key: string) => void;
  small?: boolean;
}) {
  const { bid, s } = ctx;
  const facts = form.handling.includes("ava-fills")
    ? bid.knownFacts.filter((k) =>
        /^(legal name|address|unique entity id|business type|woman-owned)/i.test(k.label),
      )
    : [];
  const asks = formAsks(ctx, form);
  return (
    <div className={`ava2-form${small ? " ava2-form--small" : ""}`}>
      <div className="ava2-form__h">
        <b>{form.name.toUpperCase()}</b>
        <span className="mono">{bid.bidNumber}</span>
      </div>
      {purposeOf(form) ? <p className="ava2-form__purpose">{purposeOf(form)}.</p> : null}
      <div className="ava2-form__grid">
        {facts.map((k) => (
          <div key={k.label} className="ava2-fld">
            <span className="ava2-fld__l">{k.label.toUpperCase()}</span>
            <span className="ava2-fld__v">{k.value}</span>
          </div>
        ))}
        {asks.flatMap((ask) => {
          const done = askResolved(bid, s, ask.id);
          const rows =
            ask.answer.type === "enter"
              ? ask.answer.fields.map((f) => ({ id: f.id, label: f.label }))
              : [{ id: ask.id, label: ask.title }];
          return rows.map((r) => {
            const given = answerOnForm(bid, s, ask, r.id) ?? undefined;
            return (
              <div key={`${ask.id}:${r.id}`} className="ava2-fld">
                <span className="ava2-fld__l">{r.label.toUpperCase()}</span>
                {done && given ? (
                  <span className="ava2-fld__v ava2-fld__v--yours">{given}</span>
                ) : (
                  <span className="ava2-fld__v">
                    <InlineHole
                      on={holeOn === `ask:${ask.id}`}
                      label={`Needs you: ${r.label}`}
                      onOpen={() => onHole(`ask:${ask.id}`)}
                    >
                      Needs you
                    </InlineHole>
                  </span>
                )}
              </div>
            );
          });
        })}
      </div>
      {form.handling.includes("you-sign") ? (
        <div className="ava2-form__sign">
          <PenLine size={14} aria-hidden /> You sign here, at the end
          {form.signer ? <span className="ava2-list__sub">{form.signer}</span> : null}
        </div>
      ) : null}
      {form.handling.includes("notary") ? (
        <div className="ava2-form__sign ava2-form__sign--notary">
          <Stamp size={14} aria-hidden /> A notary fills this box in, when you sign
        </div>
      ) : null}
      {form.filledFrom ? (
        <p className="ava2-form__from">Ava fills it from: {form.filledFrom}.</p>
      ) : null}
    </div>
  );
}
