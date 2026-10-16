// Page 3 — your bid, as the buyer will receive it (the page 3 mock, 1 Oct
// 2026). Pure model: the page reads everything from here.
//
//   · The page is the package. The parts are the files the buyer receives, in
//     the buyer's order (submission.files); a copy of an earlier file is not a
//     new part. Each part holds pieces: a section, the price sheet, a form, or
//     the papers she uploads.
//   · Every spot is an ask, a promise or a finding, placed where it lands. One
//     answer fills every place it lands, so a shared answer is a spot in each.
//   · One sentence and one button at the top: building, fixing, ready,
//     submitted or paused. The button goes to the next spot.
//   · Checks are notes on the spot they are about, not a list.
//   · A typed portal (Aurora): the parts are the portal's screens, in the
//     portal's order, then the files she uploads there. The pricing screen is
//     the price piece; every other screen is a portal piece.
//
// COUNTING: the top number while she builds is needsYouNow, the page 2 count.
// Each part counts the open spots that land in it, so a shared answer counts
// in each part it fills, and the parts can add up to more than the top number.
//
// DECISIONS (the final build's bar): what is hers to decide once her list is
// filled. Ava's decisions in the writing, the price, and the check's findings.
// Answers and promises are the list's, so they are not counted here.

import {
  blockingFindings,
  exactChecks,
  findingState,
  reviewerChecks,
  type Finding,
} from "./checks";
import { bidDecision, commitmentStatus, sectionParagraphs, visibleAsks } from "./derive";
import {
  byDecideDate,
  complianceItems,
  needsYouNow,
  priceAskIds,
  type ComplianceItem,
} from "./pages";
import { priceOf } from "./price";
import { MIRRORS_LIST, progress } from "./status";
import { decisionKey, type BidState } from "./store";
import type { AvaBid, PackageFile } from "./types";

export type PieceKind = "section" | "price" | "form" | "papers" | "portal";

/** One thing in a file: a section, the price sheet, a form, or the papers she uploads. */
export interface Piece {
  /** "sec:<id>", "price", "form:<id>", "papers:<fileId>". */
  id: string;
  kind: PieceKind;
  label: string;
  sectionId?: string;
  formId?: string;
  /** Papers: the upload asks, and forms someone else provides, in the file's order. */
  papers?: { kind: "upload" | "form"; id: string; askId: string }[];
  /** Portal: the screen of a typed portal. */
  screenId?: string;
}

/** One file the buyer receives. */
export interface Part {
  id: string;
  label: string;
  file: PackageFile;
  pieces: Piece[];
  /** A screen of a typed portal: she types it in, and uploads nothing. */
  onPortal?: boolean;
}

export type SpotKind = "ask" | "promise" | "price" | "finding" | "reviewer" | "decision";

/** A place on the page that needs her, or did. */
export interface Spot {
  /** "ask:<id>", "promise:<id>", "price", "finding:<id>", "review:<id>",
   *  "decision:<sectionId>:<id>". */
  key: string;
  kind: SpotKind;
  title: string;
  /** Needs her now. */
  open: boolean;
  /** A minor finding: advice she may leave. Never counted. */
  note: boolean;
  decideBy: Date | null;
  askId?: string;
  commitmentId?: string;
  finding?: Finding;
  /** The page 2 row behind an ask, promise or the price. */
  item?: ComplianceItem;
  /** One of Ava's decisions in the writing. */
  decision?: { sectionId: string; decisionId: string };
}

// ─── The parts ───

/** "1_Proposal_HaddadCatering.pdf" → "Proposal"; "Volume_II_Past_Performance_Haddad_Catering.pdf"
 *  → "Volume II past performance"; "Bid bond, placed with the original set" → "Bid bond". */
export function partLabel(bid: AvaBid, name: string): string {
  if (!/_/.test(name) && /,/.test(name)) return name.split(",")[0].trim();
  const company = new Set(
    bid.samLegalName
      .split(/[^A-Za-z]+/)
      .filter((w) => w.length > 2)
      .map((w) => w.toLowerCase()),
  );
  let parts = name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+_/, "")
    .split("_")
    .flatMap((w) => w.split(/(?<=[a-z])(?=[A-Z])/));
  // The company's name closes the file name; it is not part of the label.
  while (parts.length > 1 && company.has(parts[parts.length - 1].toLowerCase())) {
    parts = parts.slice(0, -1);
  }
  return parts
    .map((w, i) => {
      if (/^[IVX]+$/.test(w) || /^[A-Z0-9-]+$/.test(w)) return w;
      const low = w.toLowerCase();
      return i === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low;
    })
    .join(" ");
}

/** The files the buyer receives, as parts. A copy of an earlier file adds nothing. */
export function packageParts(bid: AvaBid): Part[] {
  const seen = new Set<string>();
  const out: Part[] = [];
  // A typed portal: its screens come first, in the portal's order.
  if (bid.submission.method === "typed-portal") {
    for (const scr of bid.submission.portalScreens ?? []) {
      const price = scr.kind === "price" && bid.price !== null;
      if (price) seen.add("price:price");
      out.push({
        id: `portal:${scr.id}`,
        label: scr.name,
        onPortal: true,
        file: {
          id: scr.id,
          name: scr.name,
          covers: scr.source.short,
          contains: price ? [{ kind: "price", id: "price" }] : [],
        },
        pieces: [
          price
            ? { id: "price", kind: "price", label: priceOf(bid).sheetName }
            : { id: `portal:${scr.id}`, kind: "portal", label: scr.name, screenId: scr.id },
        ],
      });
    }
  }
  for (const file of bid.submission.files) {
    const items = file.contains.filter(
      (c) =>
        (c.kind !== "form" || bid.forms.some((f) => f.id === c.id)) &&
        (c.kind !== "section" || bid.sections.some((x) => x.id === c.id)) &&
        // A bid the buyer allows no price for has no price piece to show.
        (c.kind !== "price" || bid.price !== null),
    );
    const keys = items.map((c) => `${c.kind}:${c.id}`);
    if (keys.length === 0 || keys.every((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));

    const pieces: Piece[] = [];
    const papers: NonNullable<Piece["papers"]> = [];
    for (const c of items) {
      if (c.kind === "section") {
        const sec = bid.sections.find((x) => x.id === c.id)!;
        pieces.push({ id: `sec:${sec.id}`, kind: "section", label: sec.title, sectionId: sec.id });
      } else if (c.kind === "price") {
        pieces.push({ id: "price", kind: "price", label: priceOf(bid).sheetName });
      } else if (c.kind === "upload") {
        if (!papers.some((x) => x.askId === c.id))
          papers.push({ kind: "upload", id: c.id, askId: c.id });
      } else {
        const f = bid.forms.find((x) => x.id === c.id)!;
        // A form someone else provides is a paper she uploads, like a certificate.
        // One answer is one slot: a bond form and the bond upload are the same paper.
        if (f.handling.includes("someone-else") && f.askId) {
          if (!papers.some((x) => x.askId === f.askId))
            papers.push({ kind: "form", id: f.id, askId: f.askId });
        } else {
          pieces.push({ id: `form:${f.id}`, kind: "form", label: f.name, formId: f.id });
        }
      }
    }
    if (papers.length > 0) {
      pieces.push({
        id: `papers:${file.id}`,
        kind: "papers",
        label: pieces.length === 0 ? partLabel(bid, file.name) : "Papers you upload",
        papers,
      });
    }
    out.push({ id: file.id, label: partLabel(bid, file.name), file, pieces });
  }
  return out;
}

// ─── Where an answer lands ───

/** The fields of one screen of a typed portal. */
export function portalFields(bid: AvaBid, screenId?: string) {
  return bid.submission.portalScreens?.find((x) => x.id === screenId)?.fields ?? [];
}

/** The forms a feed names. "Form 1 · Cover sheet" names the form with "Form 1"
 *  in its name; "Form · W-9" names the W-9; "Price · Profit" names none. */
function formsFedBy(bid: AvaBid, feeds: string[]): string[] {
  const keys = feeds.flatMap((f) => {
    const [head, tail = ""] = f.split(" · ").map((x) => x.trim());
    if (/^form$/i.test(head)) return tail ? [tail] : [];
    return /^(Form\s+\S+|W-9|SF\s*\d+)/i.test(head) ? [head] : [];
  });
  return bid.forms
    .filter((f) => keys.some((k) => f.name.toLowerCase().includes(k.toLowerCase())))
    .map((f) => f.id);
}

/** Where a spot is at home, when it lands in more than one place: the paper
 *  itself, then the writing, then a form, then the price sheet. */
const HOME: Record<PieceKind, number> = { papers: 0, section: 1, form: 2, portal: 2, price: 3 };

/** Every piece an ask lands in, in package order. */
export function piecesOfAsk(bid: AvaBid, s: BidState, parts: Part[], askId: string): Piece[] {
  const ask = bid.asks.find((a) => a.id === askId);
  if (!ask) return [];
  const prices = priceAskIds(bid);
  const fed = new Set(formsFedBy(bid, ask.feeds));
  for (const p of bid.plan) {
    if (p.askId === askId && p.answeredIn.kind === "form") fed.add(p.answeredIn.id);
  }
  const out: Piece[] = [];
  for (const part of parts) {
    for (const pc of part.pieces) {
      let lands = false;
      if (pc.kind === "section") {
        const sec = bid.sections.find((x) => x.id === pc.sectionId)!;
        lands =
          sectionParagraphs(s, sec).some((para) => para.some((sp) => sp.claim?.askId === askId)) ||
          bid.plan.some(
            (p) =>
              p.askId === askId && p.answeredIn.kind === "section" && p.answeredIn.id === sec.id,
          );
      } else if (pc.kind === "price") {
        lands = prices.has(askId);
      } else if (pc.kind === "form") {
        lands = fed.has(pc.formId!);
      } else if (pc.kind === "portal") {
        lands = portalFields(bid, pc.screenId).some((x) => x.answeredBy?.asks?.includes(askId));
      } else {
        lands = (pc.papers ?? []).some((x) => x.askId === askId);
      }
      if (lands && !out.some((x) => x.id === pc.id)) out.push(pc);
    }
  }
  return out;
}

// ─── The spots on a piece ───

export interface BidModel {
  parts: Part[];
  items: ComplianceItem[];
  /** Every finding, exact and the reviewer's, that is not a page 2 item. */
  findings: Finding[];
  /** Spots by piece id, in the order the page lists them. */
  spots: Record<string, Spot[]>;
}

/** Where a finding sits: its section, the price sheet, the forms, or Send it. */
function pieceOfFinding(parts: Part[], f: Finding): string {
  const all = parts.flatMap((p) => p.pieces);
  if (f.sectionId && all.some((pc) => pc.sectionId === f.sectionId)) return `sec:${f.sectionId}`;
  if (f.view === "price" && all.some((pc) => pc.kind === "price")) return "price";
  if (f.view === "forms") {
    const named = all.find(
      (pc) => pc.kind === "form" && f.title.toLowerCase().includes(pc.label.toLowerCase()),
    );
    const first = all.find((pc) => pc.kind === "form");
    if (named ?? first) return (named ?? first)!.id;
  }
  if (f.askId) {
    const hit = all.find((pc) => (pc.papers ?? []).some((x) => x.askId === f.askId));
    if (hit) return hit.id;
  }
  return SEND;
}

/** The last part of the page: sending it. */
export const SEND = "send";

export function bidModel(bid: AvaBid, s: BidState): BidModel {
  const parts = packageParts(bid);
  const items = complianceItems(bid, s);
  const byAsk = new Map(items.filter((i) => i.askId).map((i) => [i.askId!, i]));
  const visible = new Set(visibleAsks(bid, s).map((a) => a.id));
  const findings = [...exactChecks(bid, s).findings, ...reviewerChecks(bid)].filter(
    (f) => !MIRRORS_LIST(f.id),
  );

  const spots: Record<string, Spot[]> = {};
  const add = (pieceId: string, spot: Spot) => {
    const list = (spots[pieceId] ??= []);
    if (!list.some((x) => x.key === spot.key)) list.push(spot);
  };
  const askSpot = (askId: string): Spot | null => {
    const it = byAsk.get(askId);
    if (!it || !visible.has(askId)) return null;
    return {
      key: `ask:${askId}`,
      kind: "ask",
      title: it.title,
      open: it.holdsBid && it.status === "need",
      note: false,
      decideBy: it.decideBy,
      askId,
      item: it,
    };
  };

  // Asks, where they land.
  for (const a of bid.asks) {
    const spot = askSpot(a.id);
    if (!spot) continue;
    for (const pc of piecesOfAsk(bid, s, parts, a.id)) add(pc.id, spot);
  }

  // Promises, in the section that makes them.
  for (const part of parts) {
    for (const pc of part.pieces) {
      if (pc.kind !== "section") continue;
      const sec = bid.sections.find((x) => x.id === pc.sectionId)!;
      const ids = new Set(
        sectionParagraphs(s, sec).flatMap((para) =>
          para.flatMap((sp) => (sp.claim?.commitmentId ? [sp.claim.commitmentId] : [])),
        ),
      );
      for (const c of bid.commitments.filter((x) => ids.has(x.id))) {
        const st = commitmentStatus(s, c);
        if (st === "no-approval-needed") continue;
        const it = items.find((i) => i.commitmentId === c.id);
        add(pc.id, {
          key: `promise:${c.id}`,
          kind: "promise",
          title: c.text,
          open: st === "needs-approval" || st === "reopened",
          note: false,
          decideBy: null,
          commitmentId: c.id,
          item: it,
        });
      }
    }
  }

  // A promise a portal screen asks her to accept sits on that screen.
  for (const part of parts) {
    for (const pc of part.pieces) {
      if (pc.kind !== "portal") continue;
      const ids = new Set(
        portalFields(bid, pc.screenId).flatMap((x) => x.answeredBy?.commitmentIds ?? []),
      );
      for (const c of bid.commitments.filter((x) => ids.has(x.id))) {
        const st = commitmentStatus(s, c);
        if (st === "no-approval-needed") continue;
        add(pc.id, {
          key: `promise:${c.id}`,
          kind: "promise",
          title: c.text,
          open: st === "needs-approval" || st === "reopened",
          note: false,
          decideBy: null,
          commitmentId: c.id,
          item: items.find((i) => i.commitmentId === c.id),
        });
      }
    }
  }

  // A promise no section makes (a bid with no writing) is made where she
  // signs for the price: the price sheet, or else the first form.
  const placedPromises = new Set(
    Object.values(spots)
      .flat()
      .flatMap((x) => (x.commitmentId ? [x.commitmentId] : [])),
  );
  const allPieces = parts.flatMap((p) => p.pieces);
  const signs =
    allPieces.find((pc) => pc.kind === "price") ?? allPieces.find((pc) => pc.kind === "form");
  for (const c of bid.commitments) {
    const st = commitmentStatus(s, c);
    if (!signs || placedPromises.has(c.id) || st === "no-approval-needed") continue;
    add(signs.id, {
      key: `promise:${c.id}`,
      kind: "promise",
      title: c.text,
      open: st === "needs-approval" || st === "reopened",
      note: false,
      decideBy: null,
      commitmentId: c.id,
      item: items.find((i) => i.commitmentId === c.id),
    });
  }

  // Ava's decisions, in the section whose words they are, in reading order.
  for (const part of parts) {
    for (const pc of part.pieces) {
      if (pc.kind !== "section") continue;
      const sec = bid.sections.find((x) => x.id === pc.sectionId)!;
      const spans = sectionParagraphs(s, sec).flat();
      for (const d of sec.decisions ?? []) {
        const words = spans.filter((sp) => sp.decisionId === d.id);
        if (words.length === 0) continue;
        const key = decisionKey(sec.id, d.id);
        add(pc.id, {
          key: `decision:${key}`,
          kind: "decision",
          title: words.map((sp) => sp.text).join(""),
          open: !s.decisions?.[key],
          note: false,
          decideBy: null,
          decision: { sectionId: sec.id, decisionId: d.id },
        });
      }
    }
  }

  // The price: approving it, on the price sheet.
  const price = items.find((i) => i.id === "price");
  if (price && parts.some((p) => p.pieces.some((pc) => pc.kind === "price"))) {
    add("price", {
      key: "price",
      kind: "price",
      title: price.title,
      open: price.status === "need",
      note: false,
      decideBy: null,
      item: price,
    });
  }

  // Findings, on the spot they are about.
  for (const f of findings) {
    const st = findingState(bid, s, f);
    add(pieceOfFinding(parts, f), {
      key: f.kind === "reviewer" ? f.id : `finding:${f.id}`,
      kind: f.kind === "reviewer" ? "reviewer" : "finding",
      title: f.title,
      open: st === "open" && f.severity !== "minor",
      note: st === "open" && f.severity === "minor",
      decideBy: null,
      askId: f.askId,
      finding: f,
    });
  }

  // Open spots first, by date; then the rest.
  for (const key of Object.keys(spots)) spots[key].sort(bySpot);
  return { parts, items, findings, spots };
}

function bySpot(a: Spot, b: Spot): number {
  if (a.open !== b.open) return a.open ? -1 : 1;
  // Ava's decisions keep the order they are read in.
  if (a.kind === "decision" && b.kind === "decision") return 0;
  if (a.item && b.item) return byDecideDate(a.item, b.item);
  const da = a.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const db = b.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return da - db || a.title.localeCompare(b.title);
}

/** The spots on a part's pieces, each once. */
export function partSpots(m: BidModel, part: Part): Spot[] {
  const out: Spot[] = [];
  for (const pc of part.pieces) {
    for (const sp of m.spots[pc.id] ?? []) if (!out.some((x) => x.key === sp.key)) out.push(sp);
  }
  return out;
}

const IS_FIX = (x: Spot) => x.kind === "finding" || x.kind === "reviewer";

/** What a part or piece shows on the left: the answers that land there, the
 *  fixes on it, and its notes. The rail shows answers first, then fixes, so a
 *  part never shows a check while something on it still holds the bid. */
export function tally(spots: Spot[]): { answers: number; fixes: number; notes: number } {
  return {
    answers: spots.filter((x) => x.open && !IS_FIX(x)).length,
    fixes: spots.filter((x) => x.open && IS_FIX(x)).length,
    notes: spots.filter((x) => x.note).length,
  };
}

/** Page 2 items that need her and land in no file: a site visit, a registration. */
export function notInFiles(m: BidModel): ComplianceItem[] {
  const placed = new Set(
    Object.values(m.spots)
      .flat()
      .map((x) => x.key),
  );
  return needsYouNow(m.items).filter((i) => {
    if (i.commitmentId) return !placed.has(`promise:${i.commitmentId}`);
    if (i.id === "price") return !placed.has("price");
    return !i.askId || !placed.has(`ask:${i.askId}`);
  });
}

// ─── Decisions: the final build's bar ───

export interface DecisionCount {
  done: number;
  total: number;
  /** The next one still open: in the order of the files, the price last. */
  next: Located | null;
}

/** Whether a spot is decided on the final build: Ava's decisions, the price,
 *  the check's findings, and a reviewer's finding she has not answered on her
 *  list. A promise is approved on the list, so it is not counted here. */
function decidesHere(bid: AvaBid, s: BidState, x: Spot): boolean {
  if (x.note) return false;
  if (x.kind === "decision" || x.kind === "price" || x.kind === "finding") return true;
  return x.kind === "reviewer" && !!x.finding && findingState(bid, s, x.finding) !== "answered";
}

/** What is hers to decide on the final build, and the next one. A finding
 *  Ava fixed leaves the check, so the count still holds every finding the
 *  check raised: a fix moves it to done, never out of the count. */
export function decisionCount(bid: AvaBid, s: BidState, m: BidModel): DecisionCount {
  const keys = new Set<string>();
  const open: Located[] = [];
  for (const part of m.parts) {
    for (const pc of part.pieces) {
      for (const spot of m.spots[pc.id] ?? []) {
        if (keys.has(spot.key) || !decidesHere(bid, s, spot)) continue;
        keys.add(spot.key);
        if (spot.open) open.push({ spot, pieceId: pc.id });
      }
    }
  }
  const raised = exactChecks(bid, { ...s, fixes: {} }).findings.filter(
    (f) => f.severity !== "minor" && !MIRRORS_LIST(f.id) && pieceOfFinding(m.parts, f) !== SEND,
  );
  for (const f of raised) keys.add(`finding:${f.id}`);
  // The price goes last: a fix can change it.
  const next = open.find((x) => x.spot.kind !== "price") ?? open[0] ?? null;
  return { done: keys.size - open.length, total: keys.size, next };
}

// ─── The top line ───

export type TopState =
  | { kind: "paused" }
  | { kind: "submitted" }
  | { kind: "building"; answers: number; next: Located | null }
  | { kind: "fixing"; fixes: number; notes: number; next: Located | null }
  | { kind: "ready"; notes: number };

/** A spot and the piece it is shown on. */
export interface Located {
  spot: Spot;
  pieceId: string;
}

/** The piece a spot is at home on: the paper itself, then the writing, a form,
 *  the price sheet; in package order within each. */
export function locate(m: BidModel, key: string): Located | null {
  const hits: { spot: Spot; pc: Piece }[] = [];
  for (const part of m.parts) {
    for (const pc of part.pieces) {
      const spot = (m.spots[pc.id] ?? []).find((x) => x.key === key);
      if (spot) hits.push({ spot, pc });
    }
  }
  if (hits.length > 0) {
    const best = [...hits].sort((a, b) => HOME[a.pc.kind] - HOME[b.pc.kind])[0];
    return { spot: best.spot, pieceId: best.pc.id };
  }
  const send = (m.spots[SEND] ?? []).find((x) => x.key === key);
  return send ? { spot: send, pieceId: SEND } : null;
}

/** The next spot the top button goes to: the earliest decide-by date across the
 *  bid while she answers; the first fix in package order after that. */
export function nextSpot(m: BidModel, fixing: boolean): Located | null {
  const order = [...m.parts.flatMap((p) => p.pieces.map((pc) => pc.id)), SEND];
  const keys: string[] = [];
  for (const pieceId of order) {
    for (const spot of m.spots[pieceId] ?? []) {
      if (spot.open && !keys.includes(spot.key)) keys.push(spot.key);
    }
  }
  const all = keys.map((k) => locate(m, k)).filter((x): x is Located => x !== null);
  const pool = all.filter((x) => (fixing ? IS_FIX(x.spot) : !IS_FIX(x.spot)));
  if (fixing) return pool[0] ?? all[0] ?? null;
  return (
    [...pool].sort((a, b) => {
      if (a.spot.item && b.spot.item) return byDecideDate(a.spot.item, b.spot.item);
      const da = a.spot.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = b.spot.decideBy?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    })[0] ?? null
  );
}

export function topState(fixture: AvaBid, bid: AvaBid, s: BidState, m: BidModel): TopState {
  if (s.receipt) return { kind: "submitted" };
  if (bidDecision(bid, s)) return { kind: "paused" };
  const answers = needsYouNow(m.items).length;
  const notes = m.findings.filter(
    (f) => f.severity === "minor" && findingState(bid, s, f) === "open",
  ).length;
  if (answers > 0) return { kind: "building", answers, next: nextSpot(m, false) };
  const fixes = blockingFindings(bid, s).filter((f) => !MIRRORS_LIST(f.id)).length;
  if (fixes > 0 || progress(fixture, s).phase === "reviewing") {
    return { kind: "fixing", fixes, notes, next: nextSpot(m, true) };
  }
  return { kind: "ready", notes };
}
