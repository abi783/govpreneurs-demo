// Page 3 for a typed portal (the page 3 mock, version B). The buyer receives no
// proposal file: she types the answers into its portal, one screen at a time.
// So the middle is a copy of each portal screen, in the portal's own words and
// order, with Ava's plain line under each item and the spots that still need
// her. Sending is step by step in the portal's order, with a Copy button for
// each value, because Ava cannot see the portal. When the portal's questions
// are not in the buyer's files, Ava says so and asks to see the portal first.

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, ExternalLink, ImagePlus, Send } from "lucide-react";
import { priceAskIds, questionsWhen } from "../../lib/ava/pages";
import { dayFromNow, weekdayDate } from "../../lib/ava/dates";
import { linePrices, sheetTotal, usd } from "../../lib/ava/price";
import { ava } from "../../lib/ava/store";
import type { AvaBid, PortalField, PortalScreen } from "../../lib/ava/types";
import type { BidModel, Part, Piece, Spot } from "../../lib/ava/package";
import { HourlyCard, SheetCard } from "./PriceBuild";
import { Money, qtyText } from "./PriceParts";
import { openOutside } from "./outside";
import { SourcePin } from "./primitives";
import { Certifying, Receipt } from "./SubmitView";
import { progress } from "../../lib/ava/status";
import type { AvaContext } from "./useAva";
import type { ViewProps } from "./views";

/** "city" for a city, "county" for a county, else "buyer". */
/** What a portal screen is shown with: the bid, the screen, and its spots. */
export interface DeskProps {
  ctx: AvaContext;
  part: Part;
  piece: Piece;
  spots: Spot[];
  numbers: Map<string, number>;
  selected: string | null;
  onSelect: (key: string) => void;
  onPiece: (pieceId: string) => void;
  go: ViewProps["go"];
  /** The whole page's model, for a desk that points at another piece. */
  m?: BidModel;
}

/** A spot's number on the page, or a tick once it is done. */
export function Sn({ n, done }: { n?: number; done?: boolean }) {
  if (done) {
    return (
      <span className="ava-p3b-sn ava-p3b-sn--ok" aria-hidden>
        <Check size={10} strokeWidth={3} />
      </span>
    );
  }
  return n ? (
    <span className="ava-p3b-sn mono" aria-hidden>
      {n}
    </span>
  ) : null;
}

export function buyerWord(bid: AvaBid): string {
  if (/^city\b/i.test(bid.buyer)) return "city";
  if (/county/i.test(bid.buyer)) return "county";
  return "buyer";
}

/** "OpenGov" from "OpenGov, the City of Aurora's portal". */
function portalName(bid: AvaBid): string {
  return bid.submission.where.split(",")[0].trim();
}

function screenOf(bid: AvaBid, id?: string): PortalScreen | undefined {
  return bid.submission.portalScreens?.find((x) => x.id === id);
}

function priceScreen(bid: AvaBid): PortalScreen | undefined {
  return bid.submission.portalScreens?.find((x) => x.kind === "price");
}

/** The spots a portal item waits on, by key. */
function linkedKeys(f: PortalField): string[] {
  return [
    ...(f.answeredBy?.asks ?? []).map((id) => `ask:${id}`),
    ...(f.answeredBy?.commitmentIds ?? []).map((id) => `promise:${id}`),
  ];
}

function spotOf(spots: Spot[], key: string): Spot | undefined {
  return spots.find((x) => x.key === key);
}

function openIn(m: BidModel | undefined, pieceId: string): number {
  return (m?.spots[pieceId] ?? []).filter((x) => x.open).length;
}

/** The file she uploads for a section, by its package name. */
function fileFor(bid: AvaBid, sectionId?: string): string | null {
  const f = bid.submission.files.find((x) =>
    x.contains.some((c) => c.kind === "section" && c.id === sectionId),
  );
  return f?.name ?? null;
}

// ─── The city's words: long ones open on request ───

function Words({ bid, f }: { bid: AvaBid; f: PortalField }) {
  const [open, setOpen] = useState(false);
  const quote = f.source.quote ?? "";
  const long = quote.length > 240;
  const shown = long && !open ? `${quote.slice(0, 200).replace(/\s+\S*$/, "")} …` : quote;
  const who = buyerWord(bid);
  return (
    <div className="ava-p3b-pq__words">
      {f.count ? <p className="ava-p3b-pq__count">{f.count}</p> : null}
      <blockquote>
        {shown} <SourcePin bid={bid} source={f.source} claim={f.plain} />
      </blockquote>
      {long ? (
        <button
          type="button"
          className="ava-p3b-pq__more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown size={14} className={open ? "is-open" : ""} aria-hidden />{" "}
          {open ? "Show less" : `Show the ${who}'s full words`}
        </button>
      ) : null}
    </div>
  );
}

// ─── A questions screen ───

export function PortalDesk({
  ctx,
  piece,
  spots,
  numbers,
  selected,
  onSelect,
  onPiece,
  m,
}: DeskProps) {
  const { bid } = ctx;
  const scr = screenOf(bid, piece.screenId);
  if (!scr) return null;
  const who = buyerWord(bid);
  return (
    <div className="ava-p3b-desk">
      <div className="ava-p3b-desk__in">
        <div className="ava-p3b-portal">
          <PortalBar bid={bid} scr={scr} />
          <ol className="ava-p3b-pqs">
            {scr.fields.map((f) => (
              <PortalItem
                key={f.id}
                bid={bid}
                f={f}
                spots={spots}
                numbers={numbers}
                selected={selected}
                onSelect={onSelect}
                onPiece={onPiece}
                m={m}
              />
            ))}
          </ol>
        </div>
      </div>
      <p className="ava-p3b-deskfoot">
        The plain lines are Ava&apos;s. The {who}&apos;s words are the ones you certify.
      </p>
    </div>
  );
}

function PortalBar({ bid, scr }: { bid: AvaBid; scr: PortalScreen }) {
  const name = scr.name.replace(/^\d+\.\s*/, "");
  return (
    <div className="ava-p3b-portal__bar">
      <span>{bid.buyer} · the portal</span>
      <span className="mono">
        {bid.bidNumber} · {name}
      </span>
    </div>
  );
}

function PortalItem({
  bid,
  f,
  spots,
  numbers,
  selected,
  onSelect,
  onPiece,
  m,
}: {
  bid: AvaBid;
  f: PortalField;
  spots: Spot[];
  numbers: Map<string, number>;
  selected: string | null;
  onSelect: (key: string) => void;
  onPiece: (id: string) => void;
  m?: BidModel;
}) {
  const linked = linkedKeys(f)
    .map((k) => spotOf(spots, k))
    .filter((x): x is Spot => !!x);
  const open = linked.filter((x) => x.open);
  const secPiece = f.answeredBy?.sectionId ? `sec:${f.answeredBy.sectionId}` : null;
  const secOpen = secPiece ? openIn(m, secPiece) : 0;
  const unknown = f.responseType === "unknown";
  const needs = open.length > 0 || secOpen > 0 || unknown;
  return (
    <li className={`ava-p3b-pq${needs ? " is-need" : ""}`}>
      <p className="ava-p3b-pq__h">
        <b>{f.label}</b>
        {f.required ? <span className="ava-p3b-pq__req">*Response required</span> : null}
      </p>
      <Words bid={bid} f={f} />
      <p className="ava-p3b-pq__plain">
        <span className="ava-p3b-pq__by">Ava</span>
        <span>{f.plain}</span>
      </p>
      {linked.length > 0 || secPiece ? (
        <div className="ava-p3b-pq__spots">
          {linked.map((sp) =>
            sp.open ? (
              <button
                key={sp.key}
                type="button"
                className={`ava-p3b-m ava-p3b-m--need${selected === sp.key ? " is-on" : ""}`}
                onClick={() => onSelect(sp.key)}
              >
                {sp.title}
                <Sn n={numbers.get(sp.key)} />
              </button>
            ) : (
              <span key={sp.key} className="ava-p3b-pq__done">
                <Check size={13} strokeWidth={2.5} aria-hidden /> {sp.title}
              </span>
            ),
          )}
          {secPiece ? (
            <button type="button" className="ava-p3b-pq__file" onClick={() => onPiece(secPiece)}>
              {secOpen > 0
                ? `${secOpen} ${secOpen === 1 ? "spot" : "spots"} in the file to answer`
                : "Open the file Ava drafted"}
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="ava-p3b-pq__on">
        <span>
          On the portal: <b>{unknown ? "not shown in the files" : f.onPortal}</b>
        </span>
        <span className={`ava-p3b-pq__st${needs ? " is-need" : ""}`}>
          {needs ? "Needs you" : "Ready"}
        </span>
      </p>
    </li>
  );
}

// ─── The pricing screen ───

export function PortalPriceDesk({ ctx, spots, numbers, selected, onSelect, go }: DeskProps) {
  const { bid, s } = ctx;
  const [build, setBuild] = useState(false);
  const scr = priceScreen(bid);
  const prices = linePrices(bid, s);
  const total = sheetTotal(prices);
  const costs = priceAskIds(bid);
  const first = firstCost(spots, costs);
  return (
    <div className="ava-p3b-desk">
      <div className="ava-p3b-desk__in">
        <div className="ava-p3b-portal">
          {scr ? <PortalBar bid={bid} scr={scr} /> : null}
          <table className="ava-p3b-sheet">
            <thead>
              <tr>
                <th scope="col">Line item</th>
                <th scope="col">Description</th>
                <th scope="col" className="num">
                  Quantity
                </th>
                <th scope="col">Unit of measure</th>
                <th scope="col">Unit cost</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p, i) => (
                <tr key={p.line.id}>
                  <td>{i + 1}</td>
                  <td>{p.line.item}</td>
                  <td className="num">{qtyText(p.line.qty)}</td>
                  <td>{p.line.unit}</td>
                  <td>
                    {p.unitPrice === null ? (
                      <button
                        type="button"
                        className={`ava-p3b-cell${first && selected === first ? " is-on" : ""}`}
                        onClick={() => first && onSelect(first)}
                      >
                        your price
                        <Sn n={first ? numbers.get(first) : undefined} />
                      </button>
                    ) : (
                      <Money n={p.unitPrice} />
                    )}
                  </td>
                  <td>
                    {p.extended === null ? (
                      <span className="ava-p3b-cell ava-p3b-cell--quiet">same as unit cost</span>
                    ) : (
                      <Money n={p.extended} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {prices.length > 1 ? (
              <tfoot>
                <tr>
                  <td />
                  <td colSpan={4}>Total</td>
                  <td>{total === null ? null : <Money n={total} />}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
          <PriceRules bid={bid} />
        </div>
        <button
          type="button"
          className="ava-p3b-disclose"
          aria-expanded={build}
          onClick={() => setBuild((v) => !v)}
        >
          <ChevronDown size={15} className={build ? "is-open" : ""} aria-hidden /> See how Ava
          builds your price
        </button>
        {build ? (
          <div className="ava-p3b-build">
            <HourlyCard ctx={ctx} go={go} />
            <SheetCard ctx={ctx} go={go} />
          </div>
        ) : null}
      </div>
      <p className="ava-p3b-deskfoot">
        Empty until you answer. Ava never puts its own guess in your price.
      </p>
    </div>
  );
}

function firstCost(spots: Spot[], costs: Set<string>): string | null {
  const own = spots.find((x) => x.open && x.kind === "ask" && x.askId && costs.has(x.askId));
  return own?.key ?? spots.find((x) => x.open)?.key ?? null;
}

/** The buyer's rules that sit under the price: tax, delivery, what it brings. */
function PriceRules({ bid }: { bid: AvaBid }) {
  const tax = bid.screen.find((x) => x.topic === "tax" && x.found);
  const brings = bid.overview?.outOfScope ?? null;
  const who = buyerWord(bid);
  const rows: { h: string; text: string; source: NonNullable<typeof tax>["source"] }[] = [];
  if (tax?.source) rows.push({ h: "Taxes", text: tax.summary, source: tax.source });
  if (bid.price)
    rows.push({
      h: "Delivery",
      text: bid.price.contractType,
      source: bid.price.contractTypeSource,
    });
  if (brings) rows.push({ h: `The ${who} brings`, text: brings.text, source: brings.source });
  return (
    <dl className="ava-p3b-sheetnotes">
      {rows.map((r) => (
        <div key={r.h}>
          <dt>{r.h}</dt>
          <dd>
            {r.text} {r.source ? <SourcePin bid={bid} source={r.source} claim={r.text} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Sending: step by step, in the portal's order ───

interface PortalStep {
  id: string;
  title: string;
  detail: string;
  /** A value to copy onto the portal, or the words for what is not ready yet. */
  value?: { copy: string } | { slot: string };
  receipt?: boolean;
}

function confirmList(fields: PortalField[]): string {
  const nums = fields.map((f) => f.label.match(/^(\d+)\./)?.[1] ?? f.label);
  if (nums.length === 1) return `item ${nums[0]}`;
  return `items ${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}`;
}

/** "Before 2:00 PM on Tuesday 21 July." */
function beforeDue(bid: AvaBid): string {
  const d = bid.deadline;
  const day = weekdayDate(dayFromNow(d.dueDaysFromNow)).replace(/ \d{4}$/, "");
  return `Before ${d.time}${d.zone ? ` ${d.zone}` : ""} on ${day}.`;
}

function portalSteps(bid: AvaBid, approved: number | null, noReceipt = false): PortalStep[] {
  const steps: PortalStep[] = [
    {
      id: "signin",
      title: `Sign in to ${portalName(bid)}`,
      detail: `As ${bid.samLegalName}. Start a response to ${bid.bidNumber}.`,
    },
  ];
  for (const scr of bid.submission.portalScreens ?? []) {
    const confirms = scr.fields.filter((f) => f.responseType === "confirm");
    const others = scr.fields.filter((f) => f.responseType !== "confirm");
    if (confirms.length > 0) {
      steps.push({
        id: `${scr.id}:confirm`,
        title: `${scr.name}, ${confirmList(confirms)}`,
        detail: `${confirms[0].onPortal} on each. You checked each one with Ava.`,
      });
    }
    for (const f of others) {
      if (f.answeredBy?.price) {
        steps.push({
          id: f.id,
          title: `${scr.name}: ${f.label}`,
          detail: f.plain,
          value: approved === null ? { slot: "the total you approve" } : { copy: usd(approved) },
        });
      } else if (f.responseType === "upload") {
        steps.push({
          id: f.id,
          title: f.label,
          detail: `Upload ${fileFor(bid, f.answeredBy?.sectionId) ?? "the file Ava drafted"}.`,
        });
      } else if (f.responseType === "unknown") {
        steps.push({
          id: f.id,
          title: f.label,
          detail: "Answer it the way you told Ava the portal asks.",
        });
      } else {
        steps.push({ id: f.id, title: f.label, detail: f.plain });
      }
    }
  }
  steps.push({
    id: "submit",
    title: "Check the portal's summary, then submit",
    detail: noReceipt
      ? beforeDue(bid)
      : `${beforeDue(bid)} Then save the portal's confirmation here.`,
    receipt: !noReceipt,
  });
  return steps;
}

function doneCount(steps: PortalStep[], ticked?: Record<string, true>): number {
  return steps.filter((x) => ticked?.[x.id]).length;
}

export function PortalSendDesk({ ctx, noReceipt }: { ctx: AvaContext; noReceipt?: boolean }) {
  const { bid, s, fixture, id } = ctx;
  const approved = s.priceApproval?.total ?? null;
  // Two phases: there is no "I sent it" step, so no receipt (Shyam, 7 October 2026).
  const steps = portalSteps(bid, approved, noReceipt);
  const done = doneCount(steps, s.portalSteps);
  const p = progress(fixture, s);
  const url = bid.submission.portalUrl;
  const who = buyerWord(bid);
  return (
    <>
      <div className="ava-p3b-pkg">
        <div className="ava-p3b-pkg__h">
          <b>Enter it in this order</b>
          <span className="mono">
            {done} of {steps.length} done
          </span>
        </div>
        {url ? (
          <p className="ava-p3b-psteps__url">
            The {who}&apos;s portal:{" "}
            <button
              type="button"
              className="mono ava-linkbtn"
              onClick={() => openOutside(`The ${who}'s portal`)}
            >
              {url.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} aria-hidden />
            </button>
          </p>
        ) : null}
        <ol className="ava-p3b-psteps">
          {steps.map((st, i) => (
            <PortalStepRow
              key={st.id}
              n={i + 1}
              st={st}
              done={!!s.portalSteps?.[st.id]}
              onTick={(v) => ava.tickPortalStep(id, st.id, v)}
            >
              {st.receipt ? <Receipt ctx={ctx} remaining={p.remaining} /> : null}
            </PortalStepRow>
          ))}
        </ol>
      </div>

      <aside className="ava-p3b-panel" aria-label="Before you submit">
        <div className="ava-p3b-panel__h">
          <b>Before you submit</b>
        </div>
        <div className="ava-p3b-quiet">
          <p>Save as you go. Portals can sign you out while you work.</p>
        </div>
        {bid.deadline.zone === null ? (
          <div className="ava-p3b-quiet">
            <p>
              <b>Submit early.</b> The {who}&apos;s files give the time, but no time zone.
            </p>
            {questionsWhen(bid) ? (
              <p className="ava-p3b-quiet__more">
                Ask on the portal&apos;s question tab by{" "}
                {weekdayDate(dayFromNow(bid.deadline.questionsDueDaysFromNow!))}, or submit the day
                before.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="ava-p3b-quiet">
          <p>
            Ava cannot see the portal. Tick each step here as you finish it, so you both know where
            you are.
          </p>
        </div>
        <div className="ava-p3b-steps">
          <Certifying items={bid.submission.certifying} />
        </div>
      </aside>
    </>
  );
}

function PortalStepRow({
  n,
  st,
  done,
  onTick,
  children,
}: {
  n: number;
  st: PortalStep;
  done: boolean;
  onTick: (done: boolean) => void;
  children?: ReactNode;
}) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  // "Copied" only once the copy worked: a refused write says nothing false.
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <li className={`ava-p3b-pstep${done ? " is-done" : ""}`}>
      <span className="ava-p3b-sn mono" aria-hidden>
        {n}
      </span>
      <div className="ava-p3b-pstep__b">
        <p className="ava-p3b-pstep__t" id={id}>
          {st.title}
        </p>
        <p className="ava-p3b-pstep__d">{st.detail}</p>
        {st.value && "copy" in st.value ? (
          <p className="ava-p3b-pstep__v">
            <span className="mono">{st.value.copy}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void copy((st.value as { copy: string }).copy)}
            >
              <Copy size={13} aria-hidden /> {copied ? "Copied" : "Copy"}
            </button>
          </p>
        ) : st.value ? (
          <p className="ava-p3b-pstep__v">
            <span className="ava-p3b-cell ava-p3b-cell--quiet">{st.value.slot}</span>
          </p>
        ) : null}
        {children}
      </div>
      <label className="ava-p3b-pstep__tick">
        <input
          type="checkbox"
          checked={done}
          aria-labelledby={id}
          onChange={(e) => onTick(e.target.checked)}
        />
        <span>Done</span>
      </label>
    </li>
  );
}

// ─── When the portal's questions are not in the buyer's files ───

export function PortalUnseenPage({ ctx }: { ctx: AvaContext }) {
  const { bid, s, id } = ctx;
  const inputId = useId();
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");
  const shots = s.portalShots ?? [];
  const who = buyerWord(bid);
  const name = portalName(bid);
  const add = (files: FileList | null) => {
    for (const f of Array.from(files ?? [])) ava.addPortalShot(id, f.name);
  };
  const give = () => {
    if (!text.trim()) return;
    ava.addPortalShot(id, "Questions you pasted");
    setText("");
    setPaste(false);
  };
  return (
    <div className="ava-p3b">
      <section className="ava-p3b-top ava-p3b-top--build" aria-label="Where your bid stands">
        <span className="ava-p3b-top__icon" aria-hidden>
          <ImagePlus size={20} />
        </span>
        <div>
          <p className="ava-p3b-top__h">Ava needs to see the portal&apos;s questions</p>
          <p className="ava-p3b-top__p">
            They are not in the {who}&apos;s files. Ava builds your answers once it can see them.
          </p>
        </div>
        <div className="ava-p3b-top__act">
          <a href={`#${inputId}`} className="btn btn-primary">
            Show Ava the portal
          </a>
        </div>
      </section>
      <div className="ava-p3b-bid">
        <nav className="ava-p3b-rail" aria-label="What you send">
          <p className="ava-p3b-rail__h">In the {who}&apos;s portal</p>
          <p className="ava-p3b-ri">
            <span>Not known yet</span>
            <span className="ava-p3b-ri__n ava-p3b-ri__n--fix">Needs you</span>
          </p>
          <p className="ava-p3b-rail__h">Files you upload</p>
          <p className="ava-p3b-ri">
            <span>Not known yet</span>
          </p>
          <p className="ava-p3b-ri ava-p3b-ri--send">
            <Send size={15} aria-hidden />
            <span>Send it</span>
          </p>
        </nav>
        <div className="ava-p3b-desk">
          <div className="ava-p3b-desk__in">
            <div className="ava-p3b-paper">
              <h3>The portal&apos;s questions are behind its login: {name}</h3>
              <p className="ava-p3b-unseen__lead">
                Some portals show their questions only after you register. Ava cannot sign in, and
                it does not make up the fields.
              </p>
              <ol className="ava-p3b-psteps">
                <li className="ava-p3b-pstep">
                  <span className="ava-p3b-sn mono" aria-hidden>
                    1
                  </span>
                  <div className="ava-p3b-pstep__b">
                    <p className="ava-p3b-pstep__t">Register on {name} and start your response</p>
                    <p className="ava-p3b-pstep__d">
                      Use your company&apos;s legal name: {bid.samLegalName}.
                    </p>
                  </div>
                </li>
                <li className="ava-p3b-pstep">
                  <span className="ava-p3b-sn mono" aria-hidden>
                    2
                  </span>
                  <div className="ava-p3b-pstep__b">
                    <p className="ava-p3b-pstep__t">Take a picture of each screen</p>
                    <p className="ava-p3b-pstep__d">
                      Scroll so every question and every column shows.
                    </p>
                  </div>
                </li>
                <li className="ava-p3b-pstep">
                  <span className="ava-p3b-sn mono" aria-hidden>
                    3
                  </span>
                  <div className="ava-p3b-pstep__b">
                    <p className="ava-p3b-pstep__t">Add them here</p>
                    <p className="ava-p3b-pstep__d">
                      Ava reads each question and builds your answers, in the portal&apos;s order.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="ava-p3b-unseen__drop">
                <p>
                  <b>Add screenshots of the portal</b>
                </p>
                <p className="ava-p3b-quiet__more">
                  Or paste the questions as text. Ava does not guess the fields.
                </p>
                <div className="ava-p3b-unseen__acts">
                  <label className="btn btn-primary btn-sm" htmlFor={inputId}>
                    <ImagePlus size={14} aria-hidden /> Add screenshots
                  </label>
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="u-visually-hidden"
                    onChange={(e) => add(e.target.files)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-expanded={paste}
                    onClick={() => setPaste((v) => !v)}
                  >
                    Paste the questions
                  </button>
                </div>
                {paste ? (
                  <div className="ava-p3b-unseen__paste">
                    <textarea
                      className="input"
                      rows={5}
                      value={text}
                      aria-label="The portal's questions"
                      onChange={(e) => setText(e.target.value)}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={give}>
                      Give them to Ava
                    </button>
                  </div>
                ) : null}
                {shots.length > 0 ? <ShotsLine ctx={ctx} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotsLine({ ctx }: { ctx: AvaContext }) {
  const shots = ctx.s.portalShots ?? [];
  return (
    <div className="ava-p3b-unseen__got">
      <p>
        <Check size={14} strokeWidth={2.5} aria-hidden /> Ava has {shots.length}{" "}
        {shots.length === 1 ? "picture or list" : "pictures or lists"} of the portal.
      </p>
      <p className="ava-p3b-quiet__more">
        In the pilot, a GovPreneurs reviewer types the questions in for Ava.
      </p>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => ava.setPortalUnseen(ctx.id, false)}
      >
        Prototype: show the screens as Ava reads them
      </button>
    </div>
  );
}
