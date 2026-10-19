// DEMO: real files for the profile surfaces. A download builds the file in the
// browser (PDF, Word or text) or gives back a file that ships with the demo.
// Nothing here calls a server.

import { PERSONA } from "../story/persona";
import { fmtLong } from "./dates";
import type { CapStatementDraft } from "../../lib/capStatementBuilder";
import { CAP_STATEMENT_FILE_NAME, getCapStatement } from "../../lib/capStatementState";
import type { KnowledgeSource } from "../../lib/knowledgeBase";

const SAMPLE_FOOTER = `Sample document for the GovPreneurs demo. ${PERSONA.businessShortName} is a fictional business.`;

/** Save a blob as a file with the given name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function saveTextFile(fileName: string, text: string, mime = "text/plain"): void {
  saveBlob(new Blob([text], { type: `${mime};charset=utf-8` }), fileName);
}

/** Download a file that ships with the demo (it lives in public/). */
export function saveStaticFile(href: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ── a small PDF writer (jsPDF is loaded only when a PDF is made) ─────────────

export interface PdfSection {
  heading?: string;
  lines: string[];
}

export async function makeSimplePdf(opts: {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  footer?: string;
}): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const width = 612 - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > 792 - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const write = (text: string, size: number, bold = false, gap = 4) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const rows = text.split("\n").flatMap((para) => doc.splitTextToSize(para, width) as string[]);
    for (const row of rows) {
      ensure(size + gap);
      doc.text(row, margin, y + size);
      y += size + gap;
    }
  };

  write(opts.title, 20, true, 6);
  if (opts.subtitle) {
    doc.setTextColor(90);
    write(opts.subtitle, 10, false, 4);
    doc.setTextColor(0);
  }
  y += 8;
  for (const s of opts.sections) {
    if (s.heading) {
      y += 6;
      write(s.heading.toUpperCase(), 10, true, 4);
    }
    for (const line of s.lines) write(line, 10.5, false, 3);
  }
  y += 14;
  doc.setTextColor(120);
  write(opts.footer ?? SAMPLE_FOOTER, 8, false, 3);
  return doc.output("blob");
}

// ── the capability statement ────────────────────────────────────────────────

function sectionLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[•\-*]/.test(l) ? `• ${l.replace(/^[•\-*]\s*/, "")}` : l));
}

export async function buildCapStatementPdf(draft: CapStatementDraft): Promise<Blob> {
  const codes = [
    `UEI ${draft.codes.uei ?? "—"}`,
    `CAGE ${draft.codes.cage ?? "—"}`,
    `NAICS ${draft.codes.primaryNaics}`,
    `SAM ${draft.codes.samStatus}`,
  ].join("  ·  ");
  const byId = (id: string) => draft.sections.find((s) => s.id === id);
  const order = ["overview", "competencies", "differentiators", "past_performance", "certifications", "contact"];
  return makeSimplePdf({
    title: draft.companyName,
    subtitle: `${draft.tagline}\n${codes}`,
    sections: order
      .map((id) => byId(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ heading: s.title, lines: sectionLines(s.body) })),
  });
}

export async function buildCapStatementDocx(draft: CapStatementDraft): Promise<Blob> {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const codes = [
    `UEI ${draft.codes.uei ?? "—"}`,
    `CAGE ${draft.codes.cage ?? "—"}`,
    `NAICS ${draft.codes.primaryNaics}`,
    `SAM ${draft.codes.samStatus}`,
  ].join("  ·  ");
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: draft.companyName, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: draft.tagline, italics: true })] }),
    new Paragraph({ children: [new TextRun({ text: codes, size: 20 })] }),
  ];
  for (const s of draft.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(s.title)] }));
    for (const line of sectionLines(s.body)) {
      if (line.startsWith("• ")) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(line.slice(2))] }));
      else children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }
  children.push(new Paragraph({ children: [new TextRun({ text: SAMPLE_FOOTER, size: 16, color: "777777" })] }));
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

/** Download the capability statement on file. Ava's own draft is rebuilt as a PDF. */
export async function downloadCapStatement(): Promise<void> {
  const cap = getCapStatement();
  if (cap.origin === "ava" && cap.draft) {
    saveBlob(await buildCapStatementPdf(cap.draft), CAP_STATEMENT_FILE_NAME);
    return;
  }
  saveStaticFile(PERSONA.capabilityStatementFile, CAP_STATEMENT_FILE_NAME);
}

// ── knowledge files ─────────────────────────────────────────────────────────

function knowledgeBody(file: KnowledgeSource): PdfSection[] {
  const name = file.name.toLowerCase();
  if (name.includes("sam.gov registration")) {
    return [
      {
        heading: "Registration",
        lines: [
          `Entity: ${PERSONA.businessName}`,
          `UEI: ${PERSONA.uei}`,
          `CAGE: ${PERSONA.cage}`,
          `Status: Active until ${fmtLong(PERSONA.samActiveUntil)}`,
          `Primary NAICS: ${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}`,
          `Physical address: ${PERSONA.physicalAddress}`,
        ],
      },
    ];
  }
  if (name.includes("food-handler")) {
    return [
      {
        heading: "Food-handler certificates",
        lines: [
          `${PERSONA.foodHandlerCertified} of ${PERSONA.employeesW2} staff hold a current food-handler certificate.`,
          `${PERSONA.employeesW2 - (PERSONA.foodHandlerCertified ?? 0)} staff still need one.`,
        ],
      },
    ];
  }
  if (name.includes("menu")) {
    return [
      {
        heading: "What we serve",
        lines: PERSONA.differentiators.map((d) => `• ${d}`),
      },
    ];
  }
  if (name.includes("allergen")) {
    return [
      {
        heading: "How we handle allergens and halal food",
        lines: [
          "• Every tray carries an allergen label.",
          "• Halal menus are prepared with separate tools and surfaces.",
          "• Daily temperature logs are kept for every service.",
        ],
      },
    ];
  }
  if (name.includes("kitchen")) {
    return [{ heading: "Kitchen and vehicles", lines: [(PERSONA.kitchen ?? "")] }];
  }
  return [{ heading: "About this file", lines: [`${file.name} was added to your knowledge base.`] }];
}

/** Download a knowledge file: the real file when we have its bytes, else a built sample. */
export async function downloadKnowledgeFile(file: KnowledgeSource): Promise<void> {
  if (file.kind === "generated" && file.name.includes("Capability Statement")) {
    const cap = getCapStatement();
    if (cap.draft) {
      saveBlob(await buildCapStatementPdf(cap.draft), file.name);
      return;
    }
  }
  if (file.href) {
    saveStaticFile(file.href, file.name);
    return;
  }
  if (file.dataUrl) {
    const blob = await (await fetch(file.dataUrl)).blob();
    saveBlob(blob, file.name);
    return;
  }
  if (file.mime === "pdf" || file.kind === "generated" || file.kind === "gdrive" || file.kind === "dropbox") {
    const blob = await makeSimplePdf({
      title: file.name.replace(/\.pdf$/i, ""),
      subtitle: `Added to your knowledge base. ${PERSONA.businessName}`,
      sections: knowledgeBody(file),
    });
    saveBlob(blob, file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`);
    return;
  }
  const lines = knowledgeBody(file).flatMap((s) => [s.heading ?? "", ...s.lines, ""]);
  saveTextFile(
    file.name.endsWith(".txt") ? file.name : `${file.name.replace(/\.[a-z0-9]+$/i, "")}.txt`,
    [file.name, "", ...lines, SAMPLE_FOOTER].join("\n"),
  );
}
