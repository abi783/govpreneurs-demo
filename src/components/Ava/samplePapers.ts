// The papers she sends Ava are kept as files for this page view only (see
// paperFiles.ts). After a reload, or for a bid that starts with papers already
// sent, a paper is known by name only, and the download would ask her to send
// it again.
//
// DEMO: that is a dead end on a sales call. So each paper that has an answer
// but no file gets a one-page stand-in PDF with its own name on it, built here
// on the device. A file the visitor really chose is never replaced.

import type { BidState } from "../../lib/ava/store";
import type { AvaBid } from "../../lib/ava/types";
import { keepPaper, paperFile } from "./paperFiles";

const making = new Set<string>();

export async function ensureSamplePapers(
  noticeId: string,
  bid: AvaBid,
  s: BidState,
): Promise<void> {
  const asks = bid.asks.filter((a) => {
    if (a.kind !== "upload") return false;
    const ans = s.answers[a.id];
    return (
      ans?.status === "done" && !paperFile(noticeId, a.id) && !making.has(`${noticeId}::${a.id}`)
    );
  });
  if (asks.length === 0) return;
  for (const a of asks) making.add(`${noticeId}::${a.id}`);
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  for (const a of asks) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([612, 792]);
    const name = s.answers[a.id]?.fileName ?? `${a.title.slice(0, 40)}.pdf`;
    page.drawText("Paper sent to Ava", { x: 72, y: 700, size: 18, font });
    page.drawText(a.title.slice(0, 80), { x: 72, y: 670, size: 12, font });
    page.drawText(name.slice(0, 80), { x: 72, y: 650, size: 10, font });
    page.drawText("This is a one-page stand-in. The sample does not keep uploaded files.", {
      x: 72,
      y: 620,
      size: 9,
      font,
    });
    const bytes = await doc.save();
    keepPaper(
      noticeId,
      a.id,
      new File(
        [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
        /\.pdf$/i.test(name) ? name : `${name}.pdf`,
        { type: "application/pdf" },
      ),
    );
    making.delete(`${noticeId}::${a.id}`);
  }
}
