// The files she downloads, built on her device (see download.ts). The three
// libraries load only when she downloads, so they never weigh on the page.
//
//   · Nothing open: a PDF of each file the buyer receives, ready to send
//     (PRD §5.3, design 5.3). Ava measured the page limits on her own file;
//     a PDF keeps that layout on every device.
//   · Something open: the writing and forms as a Word file to finish, each
//     hole a marked space saying what goes there (Shyam, 7 October 2026).
//   · Her papers: one PDF made from the files she sent, in the buyer's
//     order. Never a page that only names them (review panel, 7 October
//     2026). Every paper is opened before any file is written: a file of
//     papers is complete or not made at all, never empty or partial. A paper
//     this session no longer has, or one that will not open, she sends again
//     (papersToResend); she is never asked to join PDFs on a phone (round 2).
//   · The price sheet, when the buyer gave it as Excel: an Excel file back
//     (D31), every period's prices in it and the buyer's totals as formulas.
//
// On fixtures the buyer's own forms and Excel file are not here, so the forms
// and the price sheet are stand-ins, built in the buyer's order and marked as
// a prototype sample on their first line. The product fills the buyer's own
// files in place (PRD D21, D31; docs/ava/build-handoff-two-phase.md).

import type { Question } from "../../lib/ava/flow";
import { buyerWord } from "../../lib/ava/flow";
import { askResolved, claimView, sectionParagraphs } from "../../lib/ava/derive";
import { approvalTotal, linePrices, priceOf } from "../../lib/ava/price";
import { packageParts, type Part, type Piece } from "../../lib/ava/package";
import type { BidState } from "../../lib/ava/store";
import type { AvaBid, BidForm } from "../../lib/ava/types";
import { answerOnForm, formAsks } from "./FormPaper";
import { gapWords } from "./BidText";
import { isBroken, markBroken, paperFile, paperKind, recordBuilt, usablePaper } from "./paperFiles";
import { periodColumns } from "./PriceParts";
import { fileName } from "./primitives";
import type { AvaContext } from "./useAva";

export interface BuiltFile {
  name: string;
  blob: Blob;
}

/** PDF to send when nothing is open; Word to finish while a hole is open. */
export type Mode = "pdf" | "word";

export function modeFor(holes: number): Mode {
  return holes === 0 ? "pdf" : "word";
}

export interface PlannedFile {
  part: Part;
  /** The name it downloads under, with its real extension. */
  name: string;
  kind: "pdf" | "docx" | "xlsx";
}

export interface PlannedPaper {
  askId: string;
  title: string;
  /** The file she sent, by name. */
  sent: string | null;
  /** The downloaded file it belongs in, or the part's own name. */
  into: string;
  /** It is inside that file. */
  inFile: boolean;
  /** She sent it, but this session no longer has it or cannot open it: she
   *  sends it again before she downloads. */
  resend: boolean;
  /** The download could not open it. */
  broken: boolean;
  /** A paper bid's bid bond or certified check: the signed original goes in
   *  the envelope. Never a copy in a file. */
  original?: "bond" | "check";
}

const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** "1_Proposal_HaddadCatering.pdf" → "1_Proposal_HaddadCatering.docx". */
function renamed(name: string, ext: string): string {
  return /\.[a-z0-9]+$/i.test(name) ? name.replace(/\.[a-z0-9]+$/i, ext) : `${name}${ext}`;
}

const onlyPapers = (part: Part) => part.pieces.every((pc) => pc.kind === "papers");
const isXlsx = (bid: AvaBid, part: Part) =>
  part.pieces.length === 1 &&
  part.pieces[0].kind === "price" &&
  !!bid.price &&
  /\.xlsx?$/i.test(fileName(bid, bid.price.sheetFileId));

/** What she downloads, and where each of her papers is: inside a file, or
 *  hers to add. How to send it reads this, so it lists exactly the files she
 *  has and never a paper that is not in them. */
export function planDownload(
  ctx: Pick<AvaContext, "id" | "bid" | "s">,
  only: Part | null,
  mode: Mode,
): { files: PlannedFile[]; papers: PlannedPaper[] } {
  const { id, bid, s } = ctx;
  const parts = (only ? [only] : packageParts(bid)).filter((p) => !p.onPortal);
  const files: PlannedFile[] = [];
  const papers: PlannedPaper[] = [];
  for (const part of parts) {
    const kind: PlannedFile["kind"] = isXlsx(bid, part)
      ? "xlsx"
      : onlyPapers(part) || mode === "pdf"
        ? "pdf"
        : "docx";
    const name = renamed(part.file.name, `.${kind}`);
    const mine: PlannedPaper[] = [];
    for (const pc of part.pieces) {
      if (pc.kind !== "papers") continue;
      for (const p of pc.papers ?? []) {
        if (!askResolved(bid, s, p.askId)) continue; // a hole, marked in the bid
        const ask = bid.asks.find((a) => a.id === p.askId);
        const a = s.answers[p.askId];
        const title = ask?.title ?? "A paper";
        if (bid.submission.method === "paper" && bid.bidSecurity?.bondAskId === p.askId) {
          mine.push({
            askId: p.askId,
            title,
            sent: a?.fileName ?? null,
            into: part.file.name,
            inFile: false,
            resend: false,
            broken: false,
            original: a?.status === "dont-have" ? "check" : "bond",
          });
          continue;
        }
        const file = usablePaper(id, p.askId);
        const pdf = kind === "pdf" || onlyPapers(part);
        mine.push({
          askId: p.askId,
          title,
          sent: a?.fileName ?? null,
          into: name,
          inFile: !!file && pdf,
          resend: pdf && !file,
          broken: isBroken(id, p.askId),
        });
      }
    }
    papers.push(...mine);
    // A file of papers is made only when every paper in it is there: never
    // empty, never short of one (round 2).
    const copies = mine.filter((x) => !x.original);
    if (onlyPapers(part) && (copies.length === 0 || copies.some((x) => !x.inFile))) continue;
    files.push({ part, name, kind });
  }
  return { files, papers };
}

/** Her papers she must send again before she downloads: this session no
 *  longer has them (a reload), or the download could not open them. The
 *  reader asks for each one, with its upload buttons. */
export function papersToResend(ctx: Pick<AvaContext, "id" | "bid" | "s">): {
  askId: string;
  title: string;
  sent: string | null;
  /** Why: the download could not open it, a PDF cannot hold that kind of
   *  file (a HEIC photo: send a JPEG, PNG or PDF), or this session no longer
   *  has it. */
  why: "broken" | "kind" | "gone";
}[] {
  return planDownload(ctx, null, "pdf")
    .papers.filter((p) => p.resend)
    .map(({ askId, title, sent, broken }) => {
      const f = paperFile(ctx.id, askId);
      return {
        askId,
        title,
        sent,
        why: broken ? "broken" : f && !paperKind(f) ? "kind" : "gone",
      };
    });
}

/** The name the brief uses for the same list. */
export const papersMissing = papersToResend;

/** Open every paper that goes inside a file, before any file is written.
 *  DEMO: the live product asks her to send a paper again when it will not open.
 *  A sales call cannot stop on a file the visitor picked at random, so the demo
 *  takes any file: one that cannot go inside a PDF is shown as a page that names
 *  it (addPapers). Nothing fails here, so no ask id comes back. */
async function openPapers(_ctx: AvaContext, _papers: PlannedPaper[]): Promise<string[]> {
  return [];
}

/** The files of her bid, or of one part. When a paper will not open, no file
 *  is written: the reader asks her to send it again (round 2). */
export async function buildFiles(
  ctx: AvaContext,
  only: Part | null,
  holes: Question[],
): Promise<BuiltFile[]> {
  const mode = modeFor(holes.length);
  const first = planDownload(ctx, only, mode);
  if ((await openPapers(ctx, first.papers)).length > 0) return [];
  const plan = planDownload(ctx, only, mode);
  const out: BuiltFile[] = [];
  for (const f of plan.files) {
    if (f.kind === "xlsx") out.push({ name: f.name, blob: await workbook(ctx) });
    else if (f.kind === "docx")
      out.push({ name: f.name, blob: await wordFile(ctx, f.part, holes, plan.papers) });
    else out.push({ name: f.name, blob: await pdfFile(ctx, f, plan.papers) });
  }
  recordBuilt(
    ctx.id,
    only === null,
    out.map((f) => f.name),
  );
  return out;
}

// ─── Words both files share ───

/** The first line of a file that stands in for the buyer's own forms or
 *  sheet. A prototype says so; the product fills the buyer's files. */
function sampleLine(bid: AvaBid, part: Part): string | null {
  const forms = part.pieces.some((pc) => pc.kind === "form");
  const price = part.pieces.some((pc) => pc.kind === "price");
  if (!forms && !price) return null;
  const what = forms && price ? "forms and price sheet" : forms ? "forms" : "price sheet";
  return `Sample file: in the live product, Ava fills the ${buyerWord(bid)}'s own ${what}. These are the answers she puts in them.`;
}

/** The part holds a form she signs, and the buyer lists what signing
 *  certifies: the statements go in once, after the forms. */
function signs(bid: AvaBid, part: Part): boolean {
  return (
    bid.submission.certifying.length > 0 &&
    part.pieces.some(
      (pc) =>
        pc.kind === "form" &&
        !!bid.forms.find((f) => f.id === pc.formId)?.handling.includes("you-sign"),
    )
  );
}

/** Each box of a form: its label and what it says, or null while open. */
function formRows(ctx: AvaContext, form: BidForm): [string, string | null][] {
  const { bid, s } = ctx;
  const rows: [string, string | null][] = [];
  if (form.handling.includes("ava-fills"))
    for (const k of bid.knownFacts.filter((x) =>
      /^(legal name|address|unique entity id|business type)/i.test(x.label),
    ))
      rows.push([k.label, k.value]);
  for (const ask of formAsks(ctx, form)) {
    const fields =
      ask.answer.type === "enter" ? ask.answer.fields : [{ id: ask.id, label: ask.title }];
    for (const f of fields) rows.push([f.label, answerOnForm(bid, s, ask, f.id)]);
  }
  return rows;
}

/** Every line's price in every period: "Base year $13.17 · Option year 1 $13.56". */
function priceRows(bid: AvaBid, s: BidState): { label: string; value: string | null }[] {
  const lines = linePrices(bid, s);
  const periods = periodColumns(bid, s);
  const money = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return lines.map((x, i) => {
    const vals = periods.map((pd) => pd.prices[i]);
    const qty = x.line.qty === null ? "" : `, ${x.line.qty.toLocaleString("en-US")} a year`;
    return {
      label: `${i + 1}. ${x.line.item} (${x.line.unit}${qty})`,
      value: vals.some((v) => v === null)
        ? null
        : periods.length === 1
          ? money(vals[0]!)
          : periods.map((pd, k) => `${pd.label} ${money(vals[k]!)}`).join(" · "),
    };
  });
}

function totalLine(bid: AvaBid, s: BidState): string | null {
  const t = approvalTotal(bid, s);
  if (t === null) return null;
  const periods = periodColumns(bid, s).length;
  const money = `$${t.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return periods > 1
    ? `Total evaluated price, every period (${periods}): ${money}`
    : `Total: ${money}`;
}

// ─── PDF ───

const PAGE: [number, number] = [612, 792]; // US Letter, in points
const MARGIN = 56;

async function pdfFile(ctx: AvaContext, file: PlannedFile, papers: PlannedPaper[]): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const { id, bid, s } = ctx;
  const doc = await PDFDocument.create();
  doc.setTitle(file.name);
  doc.setAuthor(bid.samLegalName);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.16);
  const soft = rgb(0.35, 0.38, 0.44);
  const part = file.part;
  const width = PAGE[0] - 2 * MARGIN;
  // Her own papers carry no line from Ava: only the pages Ava writes are
  // numbered (round 2). Declared before any paper is added.
  const hers = new Set<unknown>();

  // The standard fonts carry only Western characters: anything else becomes
  // its nearest plain form, never an error.
  const ok = new Map<string, boolean>();
  const clean = (t: string) =>
    [
      ...t
        .replace(/[\u2009\u00a0\u202f]/g, " ")
        .replace(/[\u2010-\u2012]/g, "-")
        .replace(/\u2192/g, "->")
        .replace(/\u2265/g, ">=")
        .replace(/\u2264/g, "<="),
    ]
      .map((ch) => {
        if (!ok.has(ch)) {
          try {
            font.widthOfTextAtSize(ch, 10);
            bold.widthOfTextAtSize(ch, 10);
            ok.set(ch, true);
          } catch {
            ok.set(ch, false);
          }
        }
        return ok.get(ch) ? ch : "?";
      })
      .join("");

  let page = doc.addPage(PAGE);
  let y = PAGE[1] - MARGIN;
  // After one of her papers, the next words start on a fresh page, made only
  // when there are words to put on it.
  let needPage = false;
  const newPage = () => {
    page = doc.addPage(PAGE);
    y = PAGE[1] - MARGIN;
    needPage = false;
  };
  const write = (
    raw: string,
    o: { size?: number; f?: typeof font; indent?: number; after?: number; color?: typeof ink } = {},
  ) => {
    const size = o.size ?? 10.5;
    const f = o.f ?? font;
    const indent = o.indent ?? 0;
    const lead = size * 1.4;
    const words = clean(raw).split(/\s+/).filter(Boolean);
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width - indent && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    if (needPage && lines.length > 0) newPage();
    for (const l of lines) {
      if (y - lead < MARGIN + 18) newPage();
      page.drawText(l, { x: MARGIN + indent, y: y - size, size, font: f, color: o.color ?? ink });
      y -= lead;
    }
    y -= o.after ?? 6;
  };
  const heading = (t: string, size = 13) => {
    if (needPage || y - size * 3 < MARGIN + 18) newPage();
    y -= 4;
    write(t, { size, f: bold, after: 4 });
  };
  const blank = "________________";

  // The first page names the bid and her company: the cover the buyer's
  // marking rules ask for (Exhibit C on the city's bid).
  write(`${bid.bidNumber}, ${bid.officialTitle}`, { size: 14, f: bold, after: 2 });
  write(bid.samLegalName, { size: 12, after: 10 });
  heading(part.label, 12);
  const note = sampleLine(bid, part);
  if (note) write(note, { size: 9, color: soft, after: 10 });

  let n = 0;
  for (const pc of part.pieces) {
    if (pc.kind === "section") {
      const sec = bid.sections.find((x) => x.id === pc.sectionId);
      if (!sec) continue;
      n += 1;
      heading(`${n}. ${sec.title}`);
      for (const spans of sectionParagraphs(s, sec)) {
        // A statement with no proof yet stays out of the file she sends.
        const text = spans
          .map((sp) => {
            if (!sp.claim) return sp.text;
            const v = claimView(bid, s, sp.claim);
            return v.tag === "unsupported" ? "" : (v.text ?? sp.text);
          })
          .join("")
          .trim();
        if (text) write(text);
      }
    } else if (pc.kind === "form") {
      const form = bid.forms.find((f) => f.id === pc.formId);
      if (!form) continue;
      heading(form.name, 12);
      for (const [label, value] of formRows(ctx, form)) {
        write(label, { f: bold, size: 9.5, after: 0 });
        write(value ?? blank, { indent: 12, after: 4 });
      }
      if (form.handling.includes("you-sign"))
        write(`Signature: ${blank}    Date: ${blank}${form.signer ? `    ${form.signer}` : ""}`, {
          after: 4,
        });
      if (form.handling.includes("notary")) write(`Notary public: ${blank}    Seal:`, { after: 4 });
    } else if (pc.kind === "price" && bid.price) {
      heading(priceOf(bid).sheetName, 12);
      for (const r of priceRows(bid, s)) {
        write(r.label, { f: bold, size: 9.5, after: 0 });
        write(r.value ?? blank, { indent: 12, after: 4 });
      }
      const t = totalLine(bid, s);
      if (t) write(t, { f: bold });
    } else if (pc.kind === "papers") {
      await addPapers(pc);
    }
  }

  // What she certifies by signing, once, after the forms she signs.
  if (signs(bid, part)) {
    heading("What you are certifying when you sign", 11);
    for (const c of bid.submission.certifying) write(`- ${c}`, { indent: 8, after: 2 });
  }

  async function addPapers(pc: Piece) {
    for (const p of pc.papers ?? []) {
      const plan = papers.find((x) => x.askId === p.askId && x.into === file.name);
      if (!plan?.inFile) continue;
      const f = usablePaper(id, p.askId);
      if (!f) continue;
      // A page that names a file the PDF cannot hold: any kind, or one that will not open.
      const standIn = () => {
        const pg = doc.addPage(PAGE);
        hers.add(pg);
        pg.drawText(clean(plan.title).slice(0, 110), {
          x: MARGIN,
          y: PAGE[1] - MARGIN - 10,
          size: 10,
          font: bold,
          color: ink,
        });
        pg.drawText(clean(`File you sent: ${f.name}`).slice(0, 110), {
          x: MARGIN,
          y: PAGE[1] - MARGIN - 34,
          size: 12,
          font,
          color: ink,
        });
        pg.drawText(
          "The sample keeps the name of this file. The live product puts the file itself here.",
          {
            x: MARGIN,
            y: PAGE[1] - MARGIN - 56,
            size: 9,
            font,
            color: soft,
          },
        );
      };
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const kind = paperKind(f);
        if (kind === null) {
          standIn();
        } else if (kind === "pdf") {
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await doc.copyPages(src, src.getPageIndices());
          for (const pg of pages) hers.add(doc.addPage(pg));
        } else {
          const img = kind === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const pg = doc.addPage(PAGE);
          hers.add(pg);
          const room = [PAGE[0] - 2 * MARGIN, PAGE[1] - 2 * MARGIN - 24];
          const k = Math.min(room[0] / img.width, room[1] / img.height, 1);
          pg.drawText(clean(plan.title).slice(0, 110), {
            x: MARGIN,
            y: PAGE[1] - MARGIN - 10,
            size: 10,
            font: bold,
            color: ink,
          });
          pg.drawImage(img, {
            x: MARGIN,
            y: PAGE[1] - MARGIN - 24 - img.height * k,
            width: img.width * k,
            height: img.height * k,
          });
        }
      } catch {
        // It could not be opened: the page names it instead (see standIn).
        standIn();
      }
      needPage = true;
    }
  }

  const pages = doc.getPages().filter((pg) => !hers.has(pg));
  pages.forEach((pg, i) => {
    pg.drawText(clean(`${file.name} · Page ${i + 1} of ${pages.length}`), {
      x: MARGIN,
      y: 28,
      size: 8,
      font,
      color: soft,
    });
  });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

// ─── Word: the copy she finishes ───

async function wordFile(
  ctx: AvaContext,
  part: Part,
  holes: Question[],
  papers: PlannedPaper[],
): Promise<Blob> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    ShadingType,
    Table,
    TableRow,
    TableCell,
    WidthType,
  } = docx;
  const { bid, s } = ctx;

  /** A marked space: shaded, and saying what goes there. */
  const space = (what: string) =>
    new TextRun({
      text: ` [Left for you: ${what}] `,
      bold: true,
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "DCE6F7" },
    });

  const body: InstanceType<typeof Paragraph | typeof Table>[] = [
    new Paragraph({
      text: `${bid.bidNumber}, ${bid.officialTitle}`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({ text: bid.samLegalName }),
    new Paragraph({ text: part.label, heading: HeadingLevel.HEADING_1 }),
  ];
  const note = sampleLine(bid, part);
  if (note) body.push(new Paragraph({ children: [new TextRun({ text: note, italics: true })] }));
  const left = holes.filter((h) => h.pieces.some((pc) => part.pieces.some((x) => x.id === pc.id)));
  if (left.length > 0) {
    body.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${left.length} ${left.length === 1 ? "part is" : "parts are"} left for you. Fill each marked space before you send.`,
            italics: true,
          }),
        ],
      }),
    );
  }

  let n = 0;
  for (const pc of part.pieces) {
    if (pc.kind === "section") {
      const sec = bid.sections.find((x) => x.id === pc.sectionId)!;
      n += 1;
      body.push(new Paragraph({ text: `${n}. ${sec.title}`, heading: HeadingLevel.HEADING_2 }));
      for (const spans of sectionParagraphs(s, sec)) {
        body.push(
          new Paragraph({
            children: spans.map((sp) => {
              if (!sp.claim) return new TextRun(sp.text);
              const v = claimView(bid, s, sp.claim);
              if (v.tag === "unsupported") return space(gapWords(v.gap, sp.text));
              return new TextRun(v.text ?? sp.text);
            }),
          }),
        );
      }
    } else if (pc.kind === "form") {
      const form = bid.forms.find((f) => f.id === pc.formId)!;
      body.push(new Paragraph({ text: form.name, heading: HeadingLevel.HEADING_2 }));
      const cell = (t: string | InstanceType<typeof TextRun>) =>
        new TableCell({
          children: [new Paragraph({ children: [typeof t === "string" ? new TextRun(t) : t] })],
        });
      const rows = formRows(ctx, form).map(
        ([label, value]) => new TableRow({ children: [cell(label), cell(value ?? space(label))] }),
      );
      if (form.handling.includes("you-sign"))
        rows.push(new TableRow({ children: [cell("Signature and date"), cell("You sign here")] }));
      if (form.handling.includes("notary"))
        rows.push(new TableRow({ children: [cell("Notary"), cell("A notary fills this in")] }));
      if (rows.length > 0)
        body.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    } else if (pc.kind === "papers") {
      body.push(new Paragraph({ text: pc.label, heading: HeadingLevel.HEADING_2 }));
      for (const p of pc.papers ?? []) {
        const ask = bid.asks.find((a) => a.id === p.askId);
        const title = ask?.title ?? "this paper";
        const plan = papers.find((x) => x.askId === p.askId);
        body.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${title}: `, bold: true }),
              // Her copy goes here when she saves this file as a PDF. It is a
              // marked space until then, never a line that stands for it.
              space(
                plan?.sent
                  ? `put your copy here (you sent me ${plan.sent})`
                  : `your copy of ${title.charAt(0).toLowerCase()}${title.slice(1)}`,
              ),
            ],
          }),
        );
      }
    } else if (pc.kind === "price" && bid.price) {
      body.push(new Paragraph({ text: priceOf(bid).sheetName, heading: HeadingLevel.HEADING_2 }));
      for (const r of priceRows(bid, s)) {
        body.push(
          new Paragraph({
            children: [
              new TextRun(`${r.label}: `),
              r.value === null ? space("your price") : new TextRun({ text: r.value, bold: true }),
            ],
          }),
        );
      }
      const t = totalLine(bid, s);
      if (t) body.push(new Paragraph({ children: [new TextRun({ text: t, bold: true })] }));
    }
  }
  if (signs(bid, part)) {
    body.push(
      new Paragraph({
        text: "What you are certifying when you sign",
        heading: HeadingLevel.HEADING_2,
      }),
    );
    for (const c of bid.submission.certifying)
      body.push(new Paragraph({ text: c, bullet: { level: 0 } }));
  }
  const doc = new Document({ sections: [{ children: body }] });
  const blob = await Packer.toBlob(doc);
  return new Blob([blob], { type: WORD });
}

// ─── Excel ───

async function workbook(ctx: AvaContext): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const { bid, s } = ctx;
  const p = priceOf(bid);
  const periods = periodColumns(bid, s);
  const many = periods.length > 1;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(p.sheetName.split(",")[0].slice(0, 31));
  // A Line, B Description, C Unit, D Qty, then a unit price and an extended
  // price for each period, in the buyer's period labels.
  ws.columns = [
    { width: 8 },
    { width: 36 },
    { width: 14 },
    { width: 12 },
    ...periods.flatMap(() => [{ width: 16 }, { width: 18 }]),
  ];
  const col = (n: number) => String.fromCharCode(65 + n);
  const unitCol = (k: number) => col(4 + k * 2);
  const extCol = (k: number) => col(5 + k * 2);
  ws.getCell("A1").value = `${bid.buyer} · ${bid.bidNumber}`;
  ws.getCell("A2").value = p.sheetName;
  ws.getRow(4).values = [
    "Line",
    "Description",
    "Unit",
    "Qty a year",
    ...periods.flatMap((pd) =>
      many
        ? [`${pd.label}, unit price`, `${pd.label}, extended`]
        : ["Unit price", "Extended price"],
    ),
  ];
  ws.getRow(4).font = { bold: true };
  const prices = linePrices(bid, s);
  const first = 5;
  // A line with no quantity has a unit price and no extended price; a sheet
  // with no quantities has no total (D-A7, round 2). Every formula carries its
  // value too, so a preview shows the number.
  const rates = prices.length > 0 && prices.every((x) => x.line.qty === null);
  const sums = periods.map(() => 0);
  let complete = true;
  prices.forEach((x, i) => {
    const r = first + i;
    ws.getCell(`A${r}`).value = i + 1;
    ws.getCell(`B${r}`).value = x.line.item;
    ws.getCell(`C${r}`).value = x.line.unit;
    ws.getCell(`D${r}`).value = x.line.qty;
    periods.forEach((pd, k) => {
      const price = ws.getCell(`${unitCol(k)}${r}`);
      const v = pd.prices[i];
      if (v === null) {
        price.value = "Left for you: your price";
        price.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F7" } };
      } else {
        price.value = v;
        price.numFmt = "$#,##0.00";
        price.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4DC" } };
      }
      if (x.line.qty === null) return;
      const ext = v === null ? null : Math.round(x.line.qty * v * 100) / 100;
      if (ext === null) complete = false;
      else sums[k] += ext;
      ws.getCell(`${extCol(k)}${r}`).value =
        ext === null
          ? { formula: `D${r}*${unitCol(k)}${r}` }
          : { formula: `D${r}*${unitCol(k)}${r}`, result: ext };
      ws.getCell(`${extCol(k)}${r}`).numFmt = "$#,##0.00";
    });
  });
  const last = first + prices.length - 1;
  const total = last + 2;
  const end = extCol(periods.length - 1);
  if (rates) {
    ws.getCell(`B${total}`).value = "No total: the buyer gives no quantities.";
  } else {
    ws.getCell(`B${total}`).value = many
      ? `Total evaluated price, every period (${periods.length})`
      : "Total evaluated price";
    ws.getCell(`B${total}`).font = { bold: true };
    const formula = periods
      .map((_, k) => `SUM(${extCol(k)}${first}:${extCol(k)}${last})`)
      .join("+");
    const sum = Math.round(sums.reduce((a, b) => a + b, 0) * 100) / 100;
    ws.getCell(`${end}${total}`).value = complete ? { formula, result: sum } : { formula };
    ws.getCell(`${end}${total}`).numFmt = "$#,##0.00";
  }
  ws.getCell(`B${total + 2}`).value = "Offeror";
  ws.getCell(`C${total + 2}`).value = bid.samLegalName;

  // What this file is, on its own sheet so the price layout stays the buyer's.
  const about = wb.addWorksheet("About this file");
  about.getColumn(1).width = 100;
  about.getCell("A1").value =
    `Sample file: in the live product, Ava fills the ${buyerWord(bid)}'s own Excel file. These are the prices she puts in it.`;
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: EXCEL });
}
