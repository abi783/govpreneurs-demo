// Builds the member's one-page capability statement PDF from the story, at the
// path the persona points to (PERSONA.capabilityStatementFile, in public/).
// Run: DEMO_MEMBER=<id> bun scripts/make-capability-statement.ts (a new member adds its lines to COPY)
//      DEMO_MEMBER=agency bun scripts/make-capability-statement.ts   (Lantern Row Creative)
//      DEMO_MEMBER=caterer bun scripts/make-capability-statement.ts  (Haddad Catering)
//      DEMO_MEMBER=construction bun scripts/make-capability-statement.ts (Ninebark Builders)
//      DEMO_MEMBER=it bun scripts/make-capability-statement.ts           (Gallberry Technology Group)
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";
import { MEMBER } from "../src/demo/member";
// The member's own persona file: story/persona.ts picks it with import.meta.glob, which only Vite runs.
const { PAST_PERFORMANCE, PERSONA } = (await import(`../src/demo/members/${MEMBER}/persona.ts`)) as typeof import("../src/demo/members/agency/persona");

/** What only one member's statement says. Everything else is read from the persona. */
const COPY = {
  caterer: {
    who: `A woman-owned small business in ${PERSONA.hqCity}, ${PERSONA.hqState}, founded ${PERSONA.formedOn}. ${PERSONA.employeesW2} staff and one commercial kitchen. We cook, pack and deliver meals for government buyers across North Carolina, Virginia and South Carolina.`,
    capabilities: [
      ...PERSONA.differentiators,
      "Event and ceremony catering from 50 to 600 guests",
      "HACCP food-safety plan; USDA meal-pattern menus; daily temperature logs",
    ],
    extraRows: [] as [string, string][],
  },
  // The pack's line (marketing-agency-pack.md §1), then the facts behind it. The
  // equipment and PSC lines are what My Business reads off this file (members/agency/sc/business.ts).
  agency: {
    who: `Woman-owned ad agency 12 miles from Fort Bragg: video, paid social and search, print buying, landing pages and lead routing for campaigns that reach military families. Founded ${PERSONA.formedOn} in ${PERSONA.hqCity}, ${PERSONA.hqState}. ${PERSONA.employeesW2} staff and three freelancers. We work across North Carolina, Virginia and South Carolina.`,
    capabilities: [
      ...PERSONA.differentiators,
      "Studio and edit suite on Person Street. Two cinema cameras, a drone and location lighting",
      "Weekly print buying in local papers, with rates locked in writing",
    ],
    extraRows: [
      ["PSC", "PSC R701 · T006"],
      ["Contract vehicles", "None yet (no GSA schedule)"],
    ] as [string, string][],
  },
  // The pack's line (construction-pack.md §1). The equipment and PSC lines are what
  // My Business reads off this file (members/construction/sc/business.ts).
  construction: {
    who: `HUBZone general contractor 12 miles from Fort Bragg. We self-perform electrical and HVAC work with two crews of each, and run building repairs from bid to closeout. Founded ${PERSONA.formedOn} in ${PERSONA.hqCity}, ${PERSONA.hqState}. ${PERSONA.employeesW2} staff. We work across North Carolina, within ${PERSONA.serviceRadiusMiles} miles of our shop.`,
    capabilities: [
      ...PERSONA.differentiators,
      "Shop and yard on Grove Street. Two bucket trucks, a scissor lift and refrigerant recovery machines",
      "Phased work in occupied buildings, with outages booked ahead",
    ],
    extraRows: [
      ["PSC", "PSC Z2AA · Z2JZ"],
      ["Bonding", `$${(PERSONA.bondLine?.single ?? 0) / 1_000_000}M a job · $${(PERSONA.bondLine?.aggregate ?? 0) / 1_000_000}M in total`],
    ] as [string, string][],
  },
  // The pack's line (it-services-pack.md §1).
  it: {
    who: `8(a) IT services firm 12 miles from Fort Bragg: help desk, desktop and video-conference support, Microsoft 365 and SharePoint admin, and network support, with Security+ techs who already work on Army and Air Force networks. Founded ${PERSONA.formedOn} in ${PERSONA.hqCity}, ${PERSONA.hqState}. ${PERSONA.employeesW2} staff. We work across North Carolina, South Carolina and Virginia.`,
    capabilities: [
      ...PERSONA.differentiators,
      "Imaging and asset tracking, from one office to 4,800 devices in a summer",
      "CMMC Level 1 (Self), affirmed in SPRS",
    ],
    extraRows: [
      ["PSC", "PSC DE01 · DG01"],
      ["Contract vehicles", "GSA MAS, SIN 54151S"],
    ] as [string, string][],
  },
}[MEMBER];

const doc = await PDFDocument.create();
doc.setTitle(`${PERSONA.businessName} capability statement`);
doc.setAuthor(PERSONA.businessName);
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
para(COPY.who);
y -= 6;
heading("Core capabilities");
for (const d of COPY.capabilities) para(`•  ${d}`);
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
  ...COPY.extraRows,
  ["SAM", "Active, renewed every year"],
];
for (const [k, v] of rows) {
  page.drawText(k, { x: 40, y, size: 9, font: bold, color: navy });
  // A long line wraps under its own column.
  const words = v.split(" ");
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (reg.widthOfTextAtSize(next, 9) > 422) {
      page.drawText(line, { x: 150, y, size: 9, font: reg, color: grey });
      y -= 12;
      line = w;
    } else line = next;
  }
  page.drawText(line, { x: 150, y, size: 9, font: reg, color: grey });
  y -= 14;
}
page.drawText(`Sample document for the GovPreneurs demo. ${PERSONA.businessShortName} is a fictional business.`, { x: 40, y: 30, size: 7.5, font: reg, color: grey });
const out = `public${PERSONA.capabilityStatementFile}`;
const bytes = await doc.save();
writeFileSync(out, bytes);
console.log(`written ${out} (${bytes.length} bytes)`);
