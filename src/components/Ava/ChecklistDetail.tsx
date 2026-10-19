// The checklist, opened: V1's detailed list inside the two-phase rail (7
// October 2026 review: "it gives confidence that Ava hasn't forgotten
// anything"). Folded, the rail is a strip and one count; opened, it shows
// everything the buyer asks for, the way the V1 list did: by kind (all,
// knock-out, required, scored), grouped by what she does, each with its date,
// its status, and on a tap why it matters, the buyer's own words and where it
// goes. What needs her right now stays on top. The data is pages.ts, the same
// model the V1 list read; nothing here works anything out again.

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StatusMark, type MarkKind } from "../ds/AgentWorkspace";
import { dayMonth, fullDate } from "../../lib/ava/dates";
import { buyerWord, railGroups } from "../../lib/ava/flow";
import {
  byDecideDate,
  complianceItems,
  ITEM_ACTIONS,
  itemAction,
  KIND_MEANS,
  KIND_WORD,
  OPEN_STATUSES,
  sectionSummary,
  STATUS_WORD,
  type ComplianceItem,
  type ItemKind,
} from "../../lib/ava/pages";
import { SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";
import type { FlowView } from "./useFlow";

type Tab = "all" | Exclude<ItemKind, "after-award">;

const TABS: Tab[] = ["all", "knock-out", "required", "scored"];

/** How many of "Needs you now" show before "Show all". */
const NEEDS_SHOWN = 3;

function markOf(i: ComplianceItem): MarkKind {
  if (i.status === "have" || i.status === "na") return "done";
  if (i.status === "sign-later" || i.status === "with-buyer" || i.kind === "after-award")
    return "next";
  return "need";
}

/** The question in the chat that answers an item, if it has one. */
function questionKey(i: ComplianceItem): string | null {
  if (i.commitmentId) return `promise:${i.commitmentId}`;
  if (i.id === "price") return "price";
  if (i.clarificationId) return `clar:${i.clarificationId}`;
  if (i.askId) return `ask:${i.askId}`;
  if (i.requirementId) return `must:${i.requirementId}`;
  return null;
}

export function ChecklistDetail({
  ctx,
  view,
  onOpen,
}: {
  ctx: AvaContext;
  view: FlowView;
  /** Open an item's question in the chat, or its part of the bid. */
  onOpen: (key: string) => void;
}) {
  const { bid, s } = ctx;
  const items = useMemo(() => complianceItems(bid, s), [bid, s]);
  const needs = railGroups(bid, s, view.flow).find((g) => g.needs);
  const [tab, setTab] = useState<Tab>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [item, setItem] = useState<string | null>(null);
  const [allNeeds, setAllNeeds] = useState(false);

  const shown = tab === "all" ? items : items.filter((i) => i.kind === tab);
  const groups = ITEM_ACTIONS.map((a) => ({
    ...a,
    rows: shown.filter((i) => itemAction(bid, i) === a.id).sort(byDecideDate),
  })).filter((g) => g.rows.length > 0);
  // A group with something that needs her starts open; the rest start closed.
  const isOpen = (id: string, needYou: number) => open[id] ?? needYou > 0;
  const allOpen = groups.every((g) => isOpen(g.id, sectionSummary(g.rows).needYou));

  return (
    <div className="ava2-cl">
      {needs && needs.rows.length > 0 ? (
        <section className="ava2-cl__now" aria-label="Needs you now">
          <h3 className="ava2-cl__h">
            Needs you now <span className="mono">{needs.rows.length}</span>
          </h3>
          {(allNeeds ? needs.rows : needs.rows.slice(0, NEEDS_SHOWN)).map((r) => (
            <button
              key={r.key}
              type="button"
              className="ava2-cl__nowrow"
              onClick={() => onOpen(r.key)}
            >
              <StatusMark kind="need" small />
              <b>{r.title}</b>
              {r.act ? <span className="ava2-cl__act">{r.act}</span> : null}
            </button>
          ))}
          {/* The first few, so the full list below shows at once. */}
          {needs.rows.length > NEEDS_SHOWN ? (
            <button type="button" className="ava2-cl__all" onClick={() => setAllNeeds((v) => !v)}>
              {allNeeds ? "Show fewer" : `Show all ${needs.rows.length}`}
            </button>
          ) : null}
        </section>
      ) : null}

      <div className="ava2-cl__tabs" role="tablist" aria-label="Which items to show">
        {TABS.map((t) => {
          const n = t === "all" ? items.length : items.filter((i) => i.kind === t).length;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`ava2-cl__tab${tab === t ? " is-on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "all" ? "All items" : KIND_WORD[t]}
              <span className="mono">{n}</span>
            </button>
          );
        })}
      </div>
      <p className="ava2-cl__means">
        {tab === "all" ? `Everything the ${buyerWord(bid)}'s files ask for.` : KIND_MEANS[tab]}
      </p>

      {groups.length > 0 ? (
        <button
          type="button"
          className="ava2-cl__all"
          onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.id, !allOpen])))}
        >
          {allOpen ? "Close all" : "Open all"}
        </button>
      ) : (
        <p className="ava2-cl__means">Nothing of this kind in this bid.</p>
      )}

      {groups.map((g) => {
        const sum = sectionSummary(g.rows);
        const on = isOpen(g.id, sum.needYou);
        const when =
          g.id === "sign" && sum.signBy
            ? `By ${dayMonth(sum.signBy)}`
            : sum.firstDate
              ? `First by ${dayMonth(sum.firstDate)}`
              : (sum.firstLabel ?? null);
        return (
          <section key={g.id} className="ava2-cl__grp">
            <button
              type="button"
              className="ava2-cl__gh"
              aria-expanded={on}
              onClick={() => setOpen((o) => ({ ...o, [g.id]: !on }))}
            >
              {on ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
              <span className="ava2-cl__gt">{g.label}</span>
              {when ? <span className="ava2-cl__when">{when}</span> : null}
              <span className="ava2-cl__n">
                <span className="mono">{g.rows.length}</span>{" "}
                {g.rows.length === 1 ? "item" : "items"}
              </span>
            </button>
            {on ? (
              <ul className="ava2-cl__rows">
                {g.rows.map((i) => {
                  const expanded = item === i.id;
                  const ask = i.askId ? bid.asks.find((a) => a.id === i.askId) : undefined;
                  const q = OPEN_STATUSES.has(i.status) ? questionKey(i) : null;
                  return (
                    <li key={i.id} className={`ava2-cl__item${expanded ? " is-on" : ""}`}>
                      <button
                        type="button"
                        className="ava2-cl__row"
                        aria-expanded={expanded}
                        onClick={() => setItem(expanded ? null : i.id)}
                      >
                        <StatusMark kind={markOf(i)} small />
                        <span className="ava2-cl__t">
                          {i.title}
                          <span className="ava2-cl__st">
                            {STATUS_WORD[i.status]}
                            {i.note ? ` · ${i.note}` : ""}
                          </span>
                        </span>
                      </button>
                      {expanded ? (
                        <div className="ava2-cl__more">
                          {ask?.why ? (
                            <div className="ai-surface ava2-cl__why">
                              <span className="ava2-cl__by">Ava · why it matters</span>
                              {ask.why}
                            </div>
                          ) : null}
                          <p className="ava2-cl__src">
                            The {buyerWord(bid)}&apos;s words{" "}
                            <SourcePin bid={bid} source={i.source} claim={i.title} />
                          </p>
                          {i.endsUp.length > 0 ? (
                            <p className="ava2-cl__fact">Goes into {i.endsUp.join(", ")}.</p>
                          ) : null}
                          {i.decideBy ? (
                            <p className="ava2-cl__fact">
                              {i.fixedDate ? "On" : "By"} {fullDate(i.decideBy)}.
                            </p>
                          ) : i.decideLabel ? (
                            <p className="ava2-cl__fact">{i.decideLabel}.</p>
                          ) : null}
                          {q ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpen(q)}
                            >
                              Answer it in the chat
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
