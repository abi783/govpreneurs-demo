// Builds public/demo-files/haddad-catering-capability-statement.pdf from the story.
// Run: bun scripts/make-capability-statement.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";
import { PAST_PERFORMANCE, PERSONA } from "../src/demo/story/persona";

const doc = await PDFDocument.create();
const page = doc.addPage([612, 792]);
const reg = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const navy = rgb(0.06, 0.09, 0.2);
const red = rgb(0.85, 0.15, 0.17);
const grey = rgb(0.35, 0.35, 0.38);
let y = 792;

page.drawRectangle({ x: 0, y: 700, width: 612, height: 92, color: navy });
page.drawText(PERSONA.businessName, { x: 40, y: 752, size: 18, font: bold, color: rgb(1, 1, 1) });
page.drawText("CAPABILITY STATEMENT", { x: 40, y: 730, size: 10, font: bold, color: rgb(0.95, 0.6, 0.6) });
page.drawText(`${PERSONA.physicalAddress}  ·  ${PERSONA.phone}  ·  ${PERSONA.email}  ·  ${PERSONA.website}`, { x: 40, y: 712, size: 8.5, font: reg, color: rgb(0.85, 0.87, 0.92) });
y = 670;

function heading(t: string) {
  page.drawText(t.toUpperCase(), { x: 40, y, size: 10, font: bold, color: red });
  y -= 6;
  page.drawLine({ start: { x: 40, y }, end: { x: 572, y }, thickness: 0.6, color: red });
  y -= 14;
}
function para(t: string, size = 9.5, width = 532) {
  const words = t.split(" ");
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (reg.widthOfTextAtSize(next, size) > width) {
      page.drawText(line, { x: 40, y, size, font: reg, color: grey });
      y -= size + 4;
      line = w;
    } else line = next;
  }
  if (line) { page.drawText(line, { x: 40, y, size, font: reg, color: grey }); y -= size + 4; }
}

heading("Who we are");
para(`A woman-owned small business in ${PERSONA.hqCity}, ${PERSONA.hqState}, founded ${PERSONA.formedOn}. ${PERSONA.employeesW2} staff and one commercial kitchen. We cook, pack and deliver meals for government buyers across North Carolina, Virginia and South Carolina.`);
y -= 6;
heading("Core capabilities");
for (const d of PERSONA.differentiators) para(`•  ${d}`);
para("•  Event and ceremony catering from 50 to 600 guests");
para("•  HACCP food-safety plan; USDA meal-pattern menus; daily temperature logs");
y -= 6;
heading("Past performance");
for (const p of PAST_PERFORMANCE) {
  page.drawText(`${p.projectTitle}`, { x: 40, y, size: 9.5, font: bold, color: navy });
  y -= 13;
  para(`${p.customerName} · ${p.role === "sub" ? "Subcontractor" : "Prime"} · $${p.totalValue.toLocaleString("en-US")} · ${p.periodStart.slice(0, 7)} to ${p.periodEnd.slice(0, 7)}`, 8.5);
  y -= 3;
}
y -= 4;
heading("Company data");
const rows: [string, string][] = [
  ["UEI", PERSONA.uei], ["CAGE", PERSONA.cage],
  ["Primary NAICS", `${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`],
  ["Other NAICS", PERSONA.secondaryNaics.map((n) => `${n.code} ${n.label}`).join(" · ")],
  ["Certifications", PERSONA.certifications.join(" · ")],
  ["SAM", "Active, renewed every year"],
];
for (const [k, v] of rows) {
  page.drawText(k, { x: 40, y, size: 9, font: bold, color: navy });
  page.drawText(v, { x: 150, y, size: 9, font: reg, color: grey });
  y -= 14;
}
page.drawText("Sample document for the GovPreneurs demo. Haddad Catering is a fictional business.", { x: 40, y: 30, size: 7.5, font: reg, color: grey });
writeFileSync("public/demo-files/haddad-catering-capability-statement.pdf", await doc.save());
console.log("written");
