// PDF generation — ported near-verbatim from caps-builder.js's PDF section
// (renderPdfClassic / renderPdfModern / renderPdfExecutive + shared helpers).
import { jsPDF } from "jspdf";
import {
  getEffective,
  type CapStmtState,
  type CapStmtTemplate,
} from "@/lib/tools/capStatement.types";

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [5, 26, 83];
}
function shadeRgb(rgb: RGB, amount: number): RGB {
  return [
    Math.round(rgb[0] * (1 - amount)),
    Math.round(rgb[1] * (1 - amount)),
    Math.round(rgb[2] * (1 - amount)),
  ];
}

interface Ctx {
  doc: jsPDF;
  W: number;
  H: number;
  primary: RGB;
  secondary: RGB;
  y: number;
  marginX: number;
  contentW: number;
}

function ensureSpace(ctx: Ctx, need: number): void {
  if (ctx.y + need > ctx.H - 18) {
    ctx.doc.addPage();
    ctx.y = 18;
  }
}
function sectionHeader(ctx: Ctx, label: string): void {
  ensureSpace(ctx, 12);
  ctx.doc.setFillColor(245, 247, 252);
  ctx.doc.rect(ctx.marginX, ctx.y, ctx.contentW, 8, "F");
  ctx.doc.setFillColor(...ctx.secondary);
  ctx.doc.circle(ctx.marginX + 4, ctx.y + 4, 1.4, "F");
  ctx.doc.setTextColor(...ctx.primary);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(10);
  ctx.doc.text(String(label).toUpperCase(), ctx.marginX + 8, ctx.y + 5.4);
  ctx.y += 11;
}
function kvRows(ctx: Ctx, rows: [string, string][]): void {
  ctx.doc.setFontSize(9.5);
  const labelW = 42;
  rows.forEach((row) => {
    ensureSpace(ctx, 7);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setTextColor(15, 23, 42);
    ctx.doc.text(`${row[0]}:`, ctx.marginX + 2, ctx.y);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(75, 85, 99);
    const val = String(row[1] || "");
    const lines = ctx.doc.splitTextToSize(val, ctx.contentW - labelW - 6);
    ctx.doc.text(lines, ctx.marginX + labelW, ctx.y);
    ctx.y += Math.max(5.5, lines.length * 4.8);
  });
  ctx.y += 3;
}
function paragraph(
  ctx: Ctx,
  text: string,
  opts: { size?: number; bold?: boolean; color?: RGB } = {},
): void {
  const sz = opts.size || 10;
  ctx.doc.setFontSize(sz);
  ctx.doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  ctx.doc.setTextColor(...(opts.color || [55, 65, 81]));
  const lines = ctx.doc.splitTextToSize(String(text || ""), ctx.contentW - 4);
  lines.forEach((line: string) => {
    ensureSpace(ctx, sz * 0.55 + 1);
    ctx.doc.text(line, ctx.marginX + 2, ctx.y);
    ctx.y += sz * 0.45 + 1.2;
  });
  ctx.y += 1.5;
}
function bulletPoints(ctx: Ctx, text: string): void {
  const items = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
  ctx.doc.setFontSize(9.5);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setTextColor(55, 65, 81);
  items.forEach((item) => {
    const lines = ctx.doc.splitTextToSize(item, ctx.contentW - 10);
    ensureSpace(ctx, lines.length * 4.8 + 1);
    ctx.doc.setFillColor(...ctx.secondary);
    ctx.doc.circle(ctx.marginX + 3, ctx.y - 1.4, 1, "F");
    ctx.doc.text(lines, ctx.marginX + 7, ctx.y);
    ctx.y += lines.length * 4.8 + 1;
  });
  ctx.y += 2;
}

function addLogo(doc: jsPDF, dataUrl: string, x: number, y: number, w: number, h: number): void {
  try {
    const fmt = /^data:image\/png/i.test(dataUrl) ? "PNG" : "JPEG";
    doc.addImage(dataUrl, fmt, x, y, w, h, undefined, "FAST");
  } catch {
    /* corrupt/unsupported image data — skip rather than fail the whole PDF */
  }
}

function renderPdfClassic(
  doc: jsPDF,
  P: CapStmtState,
  W: number,
  H: number,
  primary: RGB,
  secondary: RGB,
): void {
  const title = (P.legalName || P.dba || "Capability Statement").toUpperCase();
  doc.setFillColor(...primary);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, W / 2, 21, { align: "center", maxWidth: W - 60 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const slogan = P.slogan || "CAPABILITY STATEMENT";
  doc.text(String(slogan).toUpperCase(), W / 2, 29, {
    align: "center",
    maxWidth: W - 60,
    charSpace: 1,
  });

  if (P.logoDataUrl) addLogo(doc, P.logoDataUrl, W - 38, 6, 32, 26);
  doc.setFillColor(...secondary);
  doc.rect(0, 38, W, 3, "F");

  const ctx: Ctx = { doc, W, H, primary, secondary, y: 47, marginX: 14, contentW: W - 28 };

  const companyRows: [string, string][] = (
    [
      P.uei && ["UEI", P.uei],
      P.cage && ["CAGE Code", P.cage],
      P.yearInc && ["Year Incorporated", P.yearInc],
      P.stateInc && ["State Incorporated", P.stateInc],
      P.corpType && ["Corporation Type", P.corpType],
      P.dba && ["DBA", P.dba],
      P.naics && ["NAICS Codes", P.naics],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (companyRows.length) {
    sectionHeader(ctx, "Company Information");
    kvRows(ctx, companyRows);
  }
  if (P.summary) {
    sectionHeader(ctx, "Company Overview");
    if (P.slogan) paragraph(ctx, `"${P.slogan}"`, { size: 10.5, bold: true, color: primary });
    paragraph(ctx, P.summary, { size: 10 });
  }
  if (P.competencies) {
    sectionHeader(ctx, "Core Competencies");
    bulletPoints(ctx, P.competencies);
  }
  if (P.differentiators) {
    sectionHeader(ctx, "Differentiators");
    bulletPoints(ctx, P.differentiators);
  }

  const certRows: [string, string][] = (
    [
      P.fedCerts && ["Federal SB Certs", P.fedCerts],
      P.stateCerts && ["State Certs", P.stateCerts],
      P.vehicles && ["Contract Vehicles", P.vehicles],
      P.clearances && ["Clearances", P.clearances],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (certRows.length) {
    sectionHeader(ctx, "Certifications & Clearances");
    kvRows(ctx, certRows);
  }

  const ppRows: [string, string][] = (
    [
      P.clients && ["Major Clients", P.clients],
      P.localAgencies && ["Agencies Served", P.localAgencies],
      P.partners && ["Partners", P.partners],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (ppRows.length) {
    sectionHeader(ctx, "Past Performance");
    kvRows(ctx, ppRows);
  }

  const contactRows: [string, string][] = (
    [
      P.contactName && ["Contact", P.contactName],
      P.contactPhone && ["Phone", P.contactPhone],
      P.contactEmail && ["Email", P.contactEmail],
      P.contactWebsite && ["Website", P.contactWebsite],
      P.contactAddress && ["Address", P.contactAddress],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (contactRows.length) {
    ensureSpace(ctx, 20);
    sectionHeader(ctx, "Contact Information");
    kvRows(ctx, contactRows);
  }

  const fy = H - 14;
  doc.setFillColor(...secondary);
  doc.rect(0, fy, W, 3, "F");
  doc.setFillColor(...primary);
  doc.rect(0, fy + 3, W, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const foot = [P.contactPhone, P.contactEmail, P.contactWebsite].filter(Boolean).join("   ·   ");
  if (foot) doc.text(foot, W / 2, fy + 10, { align: "center" });
}

function renderPdfModern(
  doc: jsPDF,
  P: CapStmtState,
  W: number,
  H: number,
  primary: RGB,
  secondary: RGB,
): void {
  const sideW = 70;
  const primaryDark = shadeRgb(primary, 0.35);
  const bandH = H / 8;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    doc.setFillColor(
      Math.round(primary[0] * (1 - t) + primaryDark[0] * t),
      Math.round(primary[1] * (1 - t) + primaryDark[1] * t),
      Math.round(primary[2] * (1 - t) + primaryDark[2] * t),
    );
    doc.rect(0, i * bandH, sideW, bandH + 1, "F");
  }

  const sx = 8;
  let sy = 18;
  const sW = sideW - 16;
  if (P.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(sx + sW / 2 - 18, sy, 36, 24, 2, 2, "F");
      addLogo(doc, P.logoDataUrl, sx + sW / 2 - 16, sy + 1, 32, 22);
      sy += 30;
    } catch {
      /* skip logo */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const name = P.legalName || P.dba || "Your Company";
  const nameLines = doc.splitTextToSize(name, sW);
  nameLines.forEach((line: string) => {
    doc.text(line, sx + sW / 2, sy, { align: "center" });
    sy += 6;
  });
  if (P.slogan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const slogLines = doc.splitTextToSize(String(P.slogan).toUpperCase(), sW);
    slogLines.forEach((line: string) => {
      doc.text(line, sx + sW / 2, sy + 2, { align: "center", charSpace: 1 });
      sy += 4;
    });
  }
  sy += 6;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(sx + 4, sy, sx + sW - 4, sy);
  sy += 6;

  function sideHeader(label: string) {
    doc.setTextColor(...secondary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(label).toUpperCase(), sx, sy, { charSpace: 1.2 });
    sy += 5;
  }
  function sideKv(rows: [string, string][]) {
    rows.forEach((r) => {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(String(r[0]).toUpperCase(), sx, sy, { charSpace: 0.5 });
      sy += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(String(r[1] || ""), sW);
      lines.forEach((l: string) => {
        if (sy > H - 18) return;
        doc.text(l, sx, sy);
        sy += 4;
      });
      sy += 1.5;
    });
    sy += 2;
  }
  function sideText(label: string, val: string | undefined) {
    if (!val) return;
    sideHeader(label);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(String(val), sW);
    lines.forEach((l: string) => {
      if (sy > H - 18) return;
      doc.text(l, sx, sy);
      sy += 4;
    });
    sy += 3;
  }

  const companyRows: [string, string][] = (
    [
      P.uei && ["UEI", P.uei],
      P.cage && ["CAGE", P.cage],
      P.yearInc && ["Founded", P.yearInc],
      P.stateInc && ["State", P.stateInc],
      P.corpType && ["Type", P.corpType],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (companyRows.length) {
    sideHeader("Company");
    sideKv(companyRows);
  }
  sideText("Certifications", P.fedCerts);
  sideText("NAICS", P.naics);

  const contactRows: [string, string][] = (
    [
      P.contactPhone && ["Phone", P.contactPhone],
      P.contactEmail && ["Email", P.contactEmail],
      P.contactWebsite && ["Web", P.contactWebsite],
      P.contactAddress && ["Address", P.contactAddress],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (contactRows.length) {
    sideHeader("Contact");
    sideKv(contactRows);
  }

  const mx = sideW + 12;
  const mW = W - mx - 12;
  let my = 22;

  doc.setTextColor(120, 130, 145);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("CAPABILITY STATEMENT", mx, my, { charSpace: 2 });
  my += 6;
  doc.setTextColor(...primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(P.legalName || P.dba || "Your Company", mW);
  titleLines.forEach((l: string) => {
    doc.text(l, mx, my);
    my += 7;
  });
  doc.setFillColor(...secondary);
  doc.rect(mx, my, 30, 1.5, "F");
  my += 8;

  function ensureSpaceMain(need: number) {
    if (my + need > H - 14) {
      doc.addPage();
      my = 18;
    }
  }
  function mainHeader(label: string) {
    ensureSpaceMain(10);
    doc.setFillColor(...secondary);
    doc.rect(mx, my + 1, 6, 1, "F");
    doc.setTextColor(...primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(label).toUpperCase(), mx + 9, my + 2.5, { charSpace: 1.2 });
    my += 7;
  }
  function mainPara(text: string) {
    ensureSpaceMain(8);
    doc.setTextColor(80, 90, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(String(text || ""), mW);
    lines.forEach((l: string) => {
      ensureSpaceMain(4.5);
      doc.text(l, mx, my);
      my += 4.5;
    });
    my += 2;
  }
  function mainBullets(text: string) {
    const items = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);
    doc.setTextColor(40, 50, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, mW - 7);
      ensureSpaceMain(lines.length * 4.5 + 1);
      doc.setTextColor(...secondary);
      doc.text("▸", mx, my);
      doc.setTextColor(40, 50, 65);
      doc.text(lines, mx + 5, my);
      my += lines.length * 4.5 + 1;
    });
    my += 2;
  }

  if (P.summary) {
    mainHeader("Overview");
    mainPara(P.summary);
  }
  if (P.competencies) {
    mainHeader("Core Competencies");
    mainBullets(P.competencies);
  }
  if (P.differentiators) {
    mainHeader("Differentiators");
    mainBullets(P.differentiators);
  }
  if (P.vehicles) {
    mainHeader("Contract Vehicles");
    mainPara(P.vehicles);
  }
  if (P.clients || P.localAgencies || P.partners) {
    mainHeader("Past Performance");
    if (P.clients) mainPara(`Clients: ${P.clients}`);
    if (P.localAgencies) mainPara(`Agencies: ${P.localAgencies}`);
    if (P.partners) mainPara(`Partners: ${P.partners}`);
  }
  if (P.clearances) {
    mainHeader("Clearances");
    mainPara(P.clearances);
  }
}

function renderPdfExecutive(
  doc: jsPDF,
  P: CapStmtState,
  W: number,
  H: number,
  primary: RGB,
  secondary: RGB,
): void {
  const primaryLight: RGB = [
    Math.round(primary[0] + (255 - primary[0]) * 0.35),
    Math.round(primary[1] + (255 - primary[1]) * 0.35),
    Math.round(primary[2] + (255 - primary[2]) * 0.35),
  ];
  const bandH = 44 / 6;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    doc.setFillColor(
      Math.round(primary[0] * (1 - t) + primaryLight[0] * t),
      Math.round(primary[1] * (1 - t) + primaryLight[1] * t),
      Math.round(primary[2] * (1 - t) + primaryLight[2] * t),
    );
    doc.rect(0, i * bandH, W, bandH + 1, "F");
  }

  const title = P.legalName || P.dba || "Your Company";
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text(title, W / 2, 22, { align: "center", maxWidth: W - 60 });
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text("CAPABILITY STATEMENT", W / 2, 31, { align: "center", charSpace: 3 });

  doc.setFillColor(...secondary);
  doc.rect(W / 2 - 20, 36, 40, 0.8, "F");

  if (P.logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(W - 36, 6, 30, 24, 2, 2, "F");
      addLogo(doc, P.logoDataUrl, W - 34, 8, 26, 20);
    } catch {
      /* skip logo */
    }
  }

  doc.setFillColor(251, 247, 241);
  doc.rect(0, 44, W, H - 44 - 16, "F");
  doc.setFillColor(...secondary);
  doc.rect(0, 44, W, 1, "F");

  const ctx: Ctx = { doc, W, H, primary, secondary, y: 52, marginX: 18, contentW: W - 36 };

  function execHeader(label: string) {
    ensureSpace(ctx, 12);
    ctx.doc.setFillColor(...ctx.secondary);
    ctx.doc.rect(ctx.marginX, ctx.y - 0.5, 6, 1.2, "F");
    ctx.doc.setTextColor(...ctx.primary);
    ctx.doc.setFont("times", "bold");
    ctx.doc.setFontSize(12);
    ctx.doc.text(String(label), ctx.marginX + 9, ctx.y + 2);
    ctx.y += 8;
  }
  function execKv(rows: [string, string][]) {
    ctx.doc.setFontSize(9);
    const labelW = 38;
    rows.forEach((row) => {
      ensureSpace(ctx, 6);
      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setTextColor(...ctx.primary);
      ctx.doc.setFontSize(7.5);
      ctx.doc.text(String(row[0]).toUpperCase(), ctx.marginX + 2, ctx.y, { charSpace: 0.8 });
      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(58, 51, 40);
      ctx.doc.setFontSize(9.5);
      const lines = ctx.doc.splitTextToSize(String(row[1] || ""), ctx.contentW - labelW - 4);
      ctx.doc.text(lines, ctx.marginX + labelW, ctx.y);
      ctx.y += Math.max(5, lines.length * 4.5);
    });
    ctx.y += 3;
  }
  function execPara(
    text: string,
    opts: { size?: number; serif?: boolean; italic?: boolean; bold?: boolean; color?: RGB } = {},
  ) {
    const sz = opts.size || 10;
    ctx.doc.setFontSize(sz);
    ctx.doc.setFont(
      opts.serif ? "times" : "helvetica",
      opts.italic ? "italic" : opts.bold ? "bold" : "normal",
    );
    ctx.doc.setTextColor(...(opts.color || [58, 51, 40]));
    const lines = ctx.doc.splitTextToSize(String(text || ""), ctx.contentW - 4);
    lines.forEach((line: string) => {
      ensureSpace(ctx, sz * 0.55);
      ctx.doc.text(line, ctx.marginX + 2, ctx.y);
      ctx.y += sz * 0.5 + 1;
    });
    ctx.y += 2;
  }
  function execPullQuote(text: string) {
    ensureSpace(ctx, 10);
    ctx.doc.setFillColor(...ctx.secondary);
    ctx.doc.rect(ctx.marginX, ctx.y, 1.2, 8, "F");
    ctx.doc.setFont("times", "italic");
    ctx.doc.setFontSize(11);
    ctx.doc.setTextColor(...ctx.primary);
    const lines = ctx.doc.splitTextToSize(String(text), ctx.contentW - 8);
    lines.forEach((line: string) => {
      ensureSpace(ctx, 5);
      ctx.doc.text(line, ctx.marginX + 6, ctx.y + 5);
      ctx.y += 5;
    });
    ctx.y += 3;
  }
  function execBullets(text: string) {
    const items = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);
    ctx.doc.setFontSize(9.5);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setTextColor(58, 51, 40);
    items.forEach((item) => {
      const lines = ctx.doc.splitTextToSize(item, ctx.contentW - 10);
      ensureSpace(ctx, lines.length * 4.5 + 1);
      ctx.doc.setFontSize(7);
      ctx.doc.setTextColor(...ctx.secondary);
      ctx.doc.text("♦", ctx.marginX + 2, ctx.y);
      ctx.doc.setFontSize(9.5);
      ctx.doc.setTextColor(58, 51, 40);
      ctx.doc.text(lines, ctx.marginX + 7, ctx.y);
      ctx.y += lines.length * 4.5 + 1;
    });
    ctx.y += 2;
  }

  const companyRows: [string, string][] = (
    [
      P.uei && ["UEI", P.uei],
      P.cage && ["CAGE", P.cage],
      P.yearInc && ["Founded", P.yearInc],
      P.stateInc && ["State", P.stateInc],
      P.corpType && ["Type", P.corpType],
      P.naics && ["NAICS", P.naics],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (companyRows.length) {
    execHeader("Company Information");
    execKv(companyRows);
  }
  if (P.summary || P.slogan) {
    execHeader("Company Overview");
    if (P.slogan) execPullQuote(P.slogan);
    if (P.summary) execPara(P.summary, { size: 10 });
  }
  if (P.competencies) {
    execHeader("Core Competencies");
    execBullets(P.competencies);
  }
  if (P.differentiators) {
    execHeader("Differentiators");
    execBullets(P.differentiators);
  }
  const certRows: [string, string][] = (
    [
      P.fedCerts && ["Federal", P.fedCerts],
      P.stateCerts && ["State", P.stateCerts],
      P.vehicles && ["Vehicles", P.vehicles],
      P.clearances && ["Cleared", P.clearances],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (certRows.length) {
    execHeader("Certifications & Clearances");
    execKv(certRows);
  }
  const ppRows: [string, string][] = (
    [
      P.clients && ["Clients", P.clients],
      P.localAgencies && ["Agencies", P.localAgencies],
      P.partners && ["Partners", P.partners],
    ] as (false | [string, string])[]
  ).filter(Boolean) as [string, string][];
  if (ppRows.length) {
    execHeader("Past Performance");
    execKv(ppRows);
  }

  const fy = H - 14;
  doc.setFillColor(...primary);
  doc.rect(0, fy, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const foot = [P.contactPhone, P.contactEmail, P.contactWebsite].filter(Boolean).join("   ·   ");
  if (foot) doc.text(foot, W / 2, fy + 9, { align: "center", charSpace: 1 });
}

export function downloadCapStmtPdf(state: CapStmtState, tpl: CapStmtTemplate): void {
  const P = getEffective(state);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210;
  const H = 297;
  const primary = hexToRgb(P.primaryColor || "#051A53");
  const secondary = hexToRgb(P.secondaryColor || (tpl === "executive" ? "#c8a96b" : "#f59e0b"));

  if (tpl === "modern") renderPdfModern(doc, P, W, H, primary, secondary);
  else if (tpl === "executive") renderPdfExecutive(doc, P, W, H, primary, secondary);
  else renderPdfClassic(doc, P, W, H, primary, secondary);

  const fname =
    (P.legalName || P.dba || "capability-statement")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-capability-statement.pdf";
  doc.save(fname);
}
