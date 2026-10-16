// DEMO: the sample documents on each opportunity page.
//
// A click on a document in "Reference documents" must save a real file. This file
// writes a simple, believable PDF on the fly (pdf-lib) from the same story facts
// and the same clauses that the page and Grant use. The library loads on the
// first download only.

import { getOpportunity } from "@/demo/story/opportunities";
import { domainFor, offerWord, type Domain } from "./domains";
import { documentsFor, heroDetailFor, solicitationFor, type DocSpec } from "./detail";
import { factsFor, longDate, termText, type OppFacts } from "./facts";
import { naicsLabel, type Solicitation } from "./solicitation";

interface Block {
  kind: "h1" | "h2" | "p" | "bullet" | "table" | "gap" | "kv";
  text?: string;
  rows?: string[][];
  widths?: number[];
  head?: boolean;
}

export interface RenderedDocument {
  fileName: string;
  bytes: Uint8Array;
}

/** Standard PDF fonts cannot print every character. Keep the text to what they can. */
function clean(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[→✓✔]/g, "-")
    .replace(/ /g, " ")
    // keep Latin-1 and the Windows-1252 punctuation that the standard fonts hold
    .replace(/[^\x20-\x7E -ÿ–—•]/g, "");
}

// ── Contents ─────────────────────────────────────────────────────────────

function headerBlocks(f: OppFacts, title: string, subtitle?: string): Block[] {
  const offer = offerWord(f.opp);
  return [
    { kind: "h1", text: title },
    ...(subtitle ? [{ kind: "p", text: subtitle } as Block] : []),
    {
      kind: "table",
      widths: [130, 374],
      rows: [
        ["Number", f.id],
        ["Buyer", `${f.opp.agency}, ${f.opp.office}`],
        ["Title", f.opp.title],
        ["Issued", longDate(f.posted)],
        [offer === "bid" ? "Bids due" : offer === "reply" ? "Replies due" : offer === "quote" ? "Quotes due" : "Proposals due", `${longDate(f.closes)}, 5:00 PM Eastern`],
        ["Set-aside", f.setAsideLabel],
        ["NAICS", `${f.opp.naics} ${naicsLabel(f.opp.naics)}`],
        ["Place of performance", f.placeText],
        ["Contact", `${f.contact.name}, ${f.contact.title}, ${f.contact.phone}, ${f.contact.email}`],
      ],
    },
    { kind: "gap" },
  ];
}

function solicitationBlocks(f: OppFacts, sol: Solicitation): Block[] {
  const out: Block[] = headerBlocks(f, sol.docTitle);
  for (const section of sol.sections) {
    out.push({ kind: "h2", text: `Section ${section.id}: ${section.title}` });
    for (const c of section.clauses) {
      out.push({ kind: "p", text: `${c.ref}  ${c.heading}. ${c.text}` });
    }
  }
  return out;
}

function pwsBlocks(f: OppFacts, d: Domain): Block[] {
  const out: Block[] = headerBlocks(f, "PERFORMANCE WORK STATEMENT");
  out.push({ kind: "h2", text: "1. Background" });
  out.push({ kind: "p", text: `${f.opp.summary}` });
  out.push({ kind: "h2", text: "2. Scope" });
  out.push({ kind: "p", text: d.scopeLine });
  out.push({ kind: "h2", text: "3. Requirements" });
  for (const n of d.needs) out.push({ kind: "bullet", text: n });
  out.push({ kind: "h2", text: "4. Service standards" });
  for (const t of d.technical) out.push({ kind: "bullet", text: t });
  out.push({ kind: "h2", text: "5. Staffing" });
  for (const p of d.personnel) out.push({ kind: "bullet", text: p });
  out.push({ kind: "h2", text: "6. Reports and records" });
  for (const x of d.deliverables) out.push({ kind: "bullet", text: x });
  out.push({ kind: "h2", text: "7. Inspection and acceptance" });
  out.push({ kind: "p", text: "The buyer's representative inspects the service on a schedule it sets. The buyer accepts a service that meets this statement. The buyer records late, short or unsafe service and can reduce payment for it." });
  out.push({ kind: "h2", text: "8. Place and period" });
  out.push({ kind: "p", text: `The place of performance is ${f.placeText}. The period of performance is ${f.years > 0 ? termText(f.years) : "not stated"}.` });
  return out;
}

/** Sample wage rates. They are for the demonstration and are not the Department of Labor's. */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Cook I", "$14.58", "$5.36"],
  ["Cook II", "$16.24", "$5.36"],
  ["Baker", "$15.10", "$5.36"],
  ["Food Service Worker", "$11.89", "$5.36"],
  ["Dishwasher", "$11.53", "$5.36"],
  ["Driver, light truck", "$14.12", "$5.36"],
  ["Dining Facility Attendant", "$12.07", "$5.36"],
];

function wageBlocks(f: OppFacts): Block[] {
  return [
    { kind: "h1", text: "WAGE DETERMINATION" },
    { kind: "p", text: `Service Contract Labor Standards. Locality: ${f.place.city}, ${f.place.state}. Applies to ${f.id}.` },
    { kind: "gap" },
    { kind: "table", head: true, widths: [250, 140, 140], rows: WAGE_ROWS },
    { kind: "gap" },
    { kind: "p", text: "Paid holidays: New Year's Day, Martin Luther King Jr.'s Birthday, Memorial Day, Independence Day, Labor Day, Thanksgiving Day, Christmas Day." },
    { kind: "p", text: "Vacation: two weeks after one year of service, three weeks after five years. Uniform allowance applies where the employer requires a uniform." },
    { kind: "p", text: "The rates in this sample show the shape of a wage determination. The contractor pays the rates in the determination that the buyer attaches at award." },
  ];
}

function priceBlocks(f: OppFacts, d: Domain): Block[] {
  const out: Block[] = headerBlocks(f, "PRICE SCHEDULE");
  out.push({ kind: "p", text: "Enter a firm fixed price on every line. A line left blank can make the offer unacceptable." });
  const years = Math.max(f.years, 1);
  for (let y = 0; y < years; y++) {
    out.push({ kind: "h2", text: y === 0 ? "Base year" : `Option year ${y}` });
    out.push({
      kind: "table",
      head: true,
      widths: [60, 300, 170],
      rows: [
        ["Line", "Description", "Unit price"],
        ...d.priceLines.map((line, i) => [`${String(y * 10 + i + 1).padStart(4, "0")}`, line, "$ ______________"]),
      ],
    });
  }
  out.push({ kind: "gap" });
  out.push({ kind: "p", text: "Offeror: ______________________    Signature: ______________________    Date: ____________" });
  return out;
}

const MENU_BY_DOMAIN: Record<string, string[]> = {
  dining: ["Serve a 21-day cycle menu. Do not repeat a main dish within seven days.", "Offer a hot entree, a vegetarian choice, a salad bar and fresh fruit at each meal.", "Offer a short-order line at lunch and dinner.", "Publish the weekly menu with allergens one week ahead."],
  cafe: ["Offer a hot choice, a cold choice and a healthy choice every day.", "Change the menu at least every two weeks.", "Label allergens and calories on every item.", "Offer a vegetarian choice every day."],
  events: ["Offer reception, buffet and plated menus for each size of event.", "Offer halal, vegetarian and allergen-free options at every event.", "Give the buyer the menu and the price per guest at least five days before the event."],
  school: ["Follow the USDA meal pattern for each grade group.", "Offer fruit, vegetables, whole grains, milk and a protein at each lunch.", "Keep calories, sodium and saturated fat inside the USDA limits.", "Offer a meal for students with a doctor's note on diet."],
  hospital: ["Cook to the hospital diet manual: regular, renal, diabetic, low-sodium, pureed, minced and mechanical soft.", "Label every tray with the patient, the diet and the allergens.", "Send a meal replacement within 30 minutes when a diet order changes."],
  field: ["Serve a 14-day rotation menu approved by the unit.", "Offer one hot entree, two sides and a drink at each meal.", "Label every container with the meal, the time packed and the allergens."],
  boxed: ["Offer a standard box and a box for special diets.", "Pack hot items and cold items apart.", "Label every box with the date, the contents and the allergens."],
  senior: ["Meet the state's older adult nutrition standards at each lunch.", "Offer diabetic, low-sodium and soft-food choices.", "Approve the monthly menu with a registered dietitian."],
  detention: ["Serve a cycle menu approved by a dietitian.", "Meet the state jail standard for calories each day.", "Offer medical, religious and allergen diets when the jail orders them."],
  staffing: ["The buyer sets the menu. The contractor does not cook."],
  construction: ["The buyer sets the menu for the operating years."],
};

function menuBlocks(f: OppFacts, d: Domain): Block[] {
  const out: Block[] = headerBlocks(f, "MENU REQUIREMENTS");
  for (const m of MENU_BY_DOMAIN[d.key] ?? MENU_BY_DOMAIN.dining) out.push({ kind: "bullet", text: m });
  return out;
}

function sitesBlocks(f: OppFacts, d: Domain): Block[] {
  const out: Block[] = headerBlocks(f, "DELIVERY SITES");
  const rows: string[][] = [["Site", "Place", "Time"]];
  if (d.key === "field") {
    rows.push(["Drop point A", `${f.place.city}, ${f.place.state}`, "Breakfast 5:30 AM, dinner 5:00 PM"]);
    rows.push(["Drop point B", `${f.place.city}, ${f.place.state}`, "Breakfast 5:30 AM, dinner 5:00 PM"]);
  } else if (d.key === "detention") {
    rows.push(["Annex receiving gate", `${f.place.city}, ${f.place.state}`, "6:00 AM, 11:30 AM, 4:30 PM"]);
  } else if (d.key === "senior") {
    rows.push(["Senior center 1", `${f.place.city}, ${f.place.state}`, "Delivery by 10:30 AM"]);
    rows.push(["Senior center 2", `${f.place.city}, ${f.place.state}`, "Delivery by 10:30 AM"]);
    rows.push(["Home-delivered meals", `${f.place.city}, ${f.place.state}`, "By 12:00 PM"]);
  } else {
    rows.push(["Main site", `${f.place.city}, ${f.place.state}`, "As posted in the work statement"]);
  }
  out.push({ kind: "table", head: true, widths: [170, 170, 190], rows });
  out.push({ kind: "gap" });
  out.push({ kind: "p", text: "The buyer gives the exact grid points or street addresses at award. The buyer can add a site with 30 days notice." });
  return out;
}

function amendmentBlocks(f: OppFacts, text: string, label: string): Block[] {
  return [
    ...headerBlocks(f, "AMENDMENT OF SOLICITATION", label),
    { kind: "h2", text: `${label}: what changed` },
    { kind: "p", text },
    { kind: "p", text: "All other terms and conditions stay the same. Send a signed copy of this amendment with the offer." },
  ];
}

function customBlocks(f: OppFacts, spec: DocSpec): Block[] {
  const hero = heroDetailFor(f);
  const doc = hero?.custom?.[spec.fileName];
  if (!doc) return [{ kind: "h1", text: spec.title }];
  const out: Block[] = [{ kind: "h1", text: doc.title }];
  if (doc.subtitle) out.push({ kind: "p", text: doc.subtitle });
  out.push({ kind: "gap" });
  for (const s of doc.sections) {
    out.push({ kind: "h2", text: s.heading });
    for (const p of s.paragraphs) out.push({ kind: "p", text: p });
  }
  return out;
}

export function blocksFor(f: OppFacts, spec: DocSpec): Block[] {
  const d = domainFor(f.opp);
  switch (spec.kind) {
    case "solicitation":
      return solicitationBlocks(f, solicitationFor(f));
    case "pws":
      return pwsBlocks(f, d);
    case "wage":
      return wageBlocks(f);
    case "price":
      return priceBlocks(f, d);
    case "menu":
      return menuBlocks(f, d);
    case "sites":
      return sitesBlocks(f, d);
    case "amendment": {
      const hero = heroDetailFor(f);
      return amendmentBlocks(f, hero?.amendment?.summary ?? "", hero?.amendment?.label ?? spec.title);
    }
    case "custom":
      return customBlocks(f, spec);
  }
}

// ── The renderer ─────────────────────────────────────────────────────────

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const FOOTER = "Sample document for the GovPreneurs demo. Names, numbers and figures are made up.";

export async function renderPdf(blocks: Block[], title: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(clean(title));
  doc.setCreator("GovPreneurs demo");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.18);
  const grey = rgb(0.4, 0.42, 0.48);
  const line = rgb(0.82, 0.84, 0.88);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const pages = [page];

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN;
  };
  const need = (h: number) => {
    if (y - h < MARGIN + 24) newPage();
  };

  function wrap(text: string, font: typeof reg, size: number, width: number): string[] {
    const out: string[] = [];
    for (const para of clean(text).split("\n")) {
      let current = "";
      for (const word of para.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && current) {
          out.push(current);
          current = word;
        } else {
          current = next;
        }
      }
      out.push(current);
    }
    return out;
  }

  function drawLines(lines: string[], font: typeof reg, size: number, x: number, color = ink, leading = size + 4) {
    for (const l of lines) {
      need(leading);
      page.drawText(l, { x, y: y - size, size, font, color });
      y -= leading;
    }
  }

  const textW = PAGE_W - 2 * MARGIN;
  for (const b of blocks) {
    switch (b.kind) {
      case "h1": {
        need(40);
        const lines = wrap(b.text ?? "", bold, 17, textW);
        drawLines(lines, bold, 17, MARGIN, ink, 22);
        y -= 4;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.2, color: ink });
        y -= 12;
        break;
      }
      case "h2": {
        need(36);
        y -= 8;
        drawLines(wrap(b.text ?? "", bold, 11.5, textW), bold, 11.5, MARGIN, ink, 16);
        y -= 2;
        break;
      }
      case "p": {
        drawLines(wrap(b.text ?? "", reg, 10, textW), reg, 10, MARGIN, ink, 14);
        y -= 4;
        break;
      }
      case "bullet": {
        const lines = wrap(b.text ?? "", reg, 10, textW - 16);
        need(14);
        page.drawText("-", { x: MARGIN + 2, y: y - 10, size: 10, font: reg, color: grey });
        drawLines(lines, reg, 10, MARGIN + 16, ink, 14);
        y -= 2;
        break;
      }
      case "gap":
        y -= 8;
        break;
      case "kv":
      case "table": {
        const widths = b.widths ?? [textW];
        const rows = b.rows ?? [];
        rows.forEach((row, ri) => {
          const isHead = b.head && ri === 0;
          const font = isHead ? bold : reg;
          const cells = row.map((cell, ci) => wrap(cell, ci === 0 && !b.head ? bold : font, 9.5, (widths[ci] ?? 120) - 10));
          const h = Math.max(...cells.map((c) => c.length)) * 13 + 8;
          need(h);
          let x = MARGIN;
          cells.forEach((lines, ci) => {
            let ly = y;
            for (const l of lines) {
              page.drawText(l, { x: x + 5, y: ly - 14, size: 9.5, font: ci === 0 && !b.head ? bold : font, color: ink });
              ly -= 13;
            }
            x += widths[ci] ?? 120;
          });
          y -= h;
          page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + widths.reduce((a, c) => a + c, 0), y }, thickness: 0.5, color: line });
        });
        y -= 6;
        break;
      }
    }
  }

  pages.forEach((p, i) => {
    p.drawText(clean(FOOTER), { x: MARGIN, y: 28, size: 7.5, font: reg, color: grey });
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: PAGE_W - MARGIN - 52, y: 28, size: 7.5, font: reg, color: grey });
  });
  return doc.save();
}

/** Write one document of one opportunity. Returns null when the file is not on the notice. */
export async function renderDocument(oppId: string, fileName: string): Promise<RenderedDocument | null> {
  const opp = getOpportunity(oppId);
  if (!opp) return null;
  const f = factsFor(opp);
  const spec = documentsFor(f).find((d) => d.fileName === fileName);
  if (!spec) return null;
  const bytes = await renderPdf(blocksFor(f, spec), `${spec.title} - ${f.id}`);
  return { fileName: spec.fileName, bytes };
}
