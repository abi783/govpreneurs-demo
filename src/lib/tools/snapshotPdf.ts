// One-page market-snapshot PDF, generated client-side. No firm names, no
// opportunity rows — aggregates only, same rule as the on-screen snapshot.
import { jsPDF } from "jspdf";
import type { NaicsStat } from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const QUARTER_LABELS: Record<number, string> = {
  1: "Oct–Dec",
  2: "Jan–Mar",
  3: "Apr–Jun",
  4: "Jul–Sep",
};

const SET_ASIDE_LABELS: Record<string, string> = {
  "8a": "8(a)",
  sdvosb: "SDVOSB",
  wosb: "WOSB/EDWOSB",
  hubzone: "HUBZone",
  sb: "Small business set-aside",
  none: "Full and open",
  other: "Other",
};

interface Ctx {
  doc: jsPDF;
  y: number;
  marginX: number;
  contentW: number;
}

function ensureSpace(ctx: Ctx, need: number): void {
  if (ctx.y + need > 297 - 18) {
    ctx.doc.addPage();
    ctx.y = 18;
  }
}

function label(ctx: Ctx, text: string): void {
  ensureSpace(ctx, 8);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(90, 100, 115);
  ctx.doc.text(text.toUpperCase(), ctx.marginX, ctx.y);
  ctx.y += 5.5;
}

function body(ctx: Ctx, text: string): void {
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(10);
  ctx.doc.setTextColor(30, 35, 45);
  const lines = ctx.doc.splitTextToSize(text, ctx.contentW);
  lines.forEach((line: string) => {
    ensureSpace(ctx, 5.5);
    ctx.doc.text(line, ctx.marginX, ctx.y);
    ctx.y += 5;
  });
  ctx.y += 3;
}

/** A single horizontal bar: label left, value right, filled bar below. */
function bar(ctx: Ctx, name: string, valueText: string, share: number): void {
  ensureSpace(ctx, 9);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(30, 35, 45);
  ctx.doc.text(name, ctx.marginX, ctx.y);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.text(valueText, ctx.marginX + ctx.contentW, ctx.y, { align: "right" });
  ctx.y += 2;
  const barH = 3;
  ctx.doc.setFillColor(230, 233, 238);
  ctx.doc.rect(ctx.marginX, ctx.y, ctx.contentW, barH, "F");
  ctx.doc.setFillColor(37, 99, 235);
  ctx.doc.rect(ctx.marginX, ctx.y, ctx.contentW * Math.max(0, Math.min(1, share)), barH, "F");
  ctx.y += barH + 4;
}

function crowdTakeaway(medianOffers: number): string {
  if (medianOffers <= 2) return "Thin competition";
  if (medianOffers <= 5) return "Normal field";
  return "Crowded";
}

function concentrationTakeaway(top5Share: number): string {
  const pct = top5Share * 100;
  if (pct <= 25) return "Wide open";
  if (pct <= 50) return "Some incumbents";
  return "Concentrated";
}

// Same BASE_URL normalization Avatar.tsx uses for public/* assets.
const B = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const LOGO_PNG_SRC = `${B}brand/govpreneurs-logo@2x.png`;
const LOGO_ASPECT = 314 / 1754; // height / width, from the rasterised PNG

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PNG_SRC);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadSnapshotPdf(stat: NaicsStat): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const marginX = 16;
  const contentW = 210 - marginX * 2;
  const ctx: Ctx = { doc, y: 20, marginX, contentW };

  const logoDataUrl = await loadLogoDataUrl();
  if (logoDataUrl) {
    const logoW = 40;
    const logoH = logoW * LOGO_ASPECT;
    doc.addImage(logoDataUrl, "PNG", marginX, ctx.y - 12, logoW, logoH);
    ctx.y += 2;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`Market snapshot · NAICS ${stat.code}`, marginX, ctx.y);
  ctx.y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 70, 85);
  doc.text(stat.title, marginX, ctx.y);
  ctx.y += 6;

  // Red rule under the header — the one brand-red moment on the page.
  doc.setDrawColor(216, 34, 33);
  doc.setLineWidth(0.8);
  doc.line(marginX, ctx.y, marginX + contentW, ctx.y);
  doc.setLineWidth(0.2);
  ctx.y += 6;

  // Headline figures
  const years = stat.fiscalYears;
  const yearRange =
    years.length > 0
      ? years.length === 1
        ? `FY${years[0]}`
        : `FY${Math.min(...years)}–FY${Math.max(...years)}`
      : null;
  const headline = [
    `${compactUsd.format(stat.obligated)} obligated${yearRange ? ` ${yearRange}` : ""}`,
    `${stat.awardCount.toLocaleString()} awards`,
    `Median award ${stat.medianValue != null ? compactUsd.format(stat.medianValue) : "n/a"}`,
    `${stat.openOppCount.toLocaleString()} open now`,
  ].join("   ·   ");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const headlineLines = doc.splitTextToSize(headline, contentW);
  headlineLines.forEach((line: string) => {
    doc.text(line, marginX, ctx.y);
    ctx.y += 5.5;
  });
  ctx.y += 4;
  doc.setDrawColor(220, 223, 228);
  doc.line(marginX, ctx.y, marginX + contentW, ctx.y);
  ctx.y += 8;

  // 1. How crowded it is
  if (stat.medianOffers != null) {
    label(ctx, "How crowded it is");
    body(
      ctx,
      `${crowdTakeaway(stat.medianOffers)} — ${stat.medianOffers} bidders per award, typically.`,
    );
  }

  // 2. Do small firms win here?
  if (stat.setAsideMix && stat.setAsideMix.length > 0) {
    label(ctx, "Do small firms win here?");
    const setAsideShare = stat.setAsideMix
      .filter((m) => m.key !== "none")
      .reduce((sum, m) => sum + m.share, 0);
    body(ctx, `${Math.round(setAsideShare * 100)}% of dollars went to set-asides.`);
    stat.setAsideMix.forEach((m) => {
      bar(ctx, SET_ASIDE_LABELS[m.key] ?? m.key, `${Math.round(m.share * 100)}%`, m.share);
    });
    ctx.y += 2;
  }

  // 3. The sweet spot
  if (stat.sizeBands && stat.sizeBands.length > 0) {
    label(ctx, "The sweet spot");
    const bandLabels: Record<string, string> = {
      under25k: "Under $25K",
      "25k-250k": "$25K–$250K",
      over250k: "Over $250K",
    };
    const largest = stat.sizeBands.reduce((a, b) => (b.share > a.share ? b : a));
    body(ctx, `Most awards here are ${bandLabels[largest.key]?.toLowerCase() ?? largest.key}.`);
    stat.sizeBands.forEach((b) => {
      bar(ctx, bandLabels[b.key] ?? b.key, `${Math.round(b.share * 100)}%`, b.share);
    });
    ctx.y += 2;
  }

  // 4. Direction
  if (stat.byFiscalYear && stat.byFiscalYear.length > 0) {
    label(ctx, "Direction");
    const fys = stat.byFiscalYear;
    // The last entry is the current, partial fiscal year, so year-over-year
    // compares the two most recent COMPLETE years.
    const full = fys.slice(0, -1);
    const last = full[full.length - 1];
    const prev = full.length > 1 ? full[full.length - 2] : null;
    let takeaway = "Not enough history yet.";
    if (last && prev && prev.obligated > 0) {
      const pct = Math.round(((last.obligated - prev.obligated) / prev.obligated) * 100);
      const span = `FY${prev.fy} to FY${last.fy}`;
      takeaway =
        pct > 5
          ? `Up ${pct}% from ${span}.`
          : pct < -5
            ? `Down ${Math.abs(pct)}% from ${span}.`
            : `Flat from ${span}.`;
    }
    body(ctx, takeaway);
    const maxObligated = Math.max(...fys.map((f) => f.obligated), 1);
    fys.forEach((f) => {
      bar(
        ctx,
        `FY${f.fy}`,
        `${compactUsd.format(f.obligated)} · ${f.count.toLocaleString()} awards`,
        f.obligated / maxObligated,
      );
    });
    ctx.y += 2;
  }

  // 5. When agencies buy
  if (stat.byQuarter && stat.byQuarter.length > 0) {
    label(ctx, "When agencies buy");
    const peak = stat.byQuarter.reduce((a, b) => (b.share > a.share ? b : a));
    body(ctx, `Most awards land ${QUARTER_LABELS[peak.q]} — the fiscal year-end rush.`);
    stat.byQuarter.forEach((q) => {
      bar(ctx, QUARTER_LABELS[q.q], `${Math.round(q.share * 100)}%`, q.share);
    });
    ctx.y += 2;
  }

  // 6. How open the market is
  if (stat.top5Share != null) {
    label(ctx, "How open the market is");
    body(
      ctx,
      `${concentrationTakeaway(stat.top5Share)} — top 5 firms hold ${Math.round(stat.top5Share * 100)}% of dollars.`,
    );
  }

  // Footer
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 148, 160);
    doc.text(
      `Counted from federal award records (FPDS). Prepared by GovPreneurs Tools · tools.govpreneurs.com · ${dateStr}`,
      marginX,
      297 - 10,
    );
  }

  doc.save(`govpreneurs-snapshot-${stat.code}.pdf`);
}
