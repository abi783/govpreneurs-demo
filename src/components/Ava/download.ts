// Downloading her bid. Ava never sends anything: she downloads the files and
// sends them herself (Part 5). A hole stays a marked space in the file, for
// her or her mentor to fill before she sends (Shyam, 7 October 2026).
//
// The files are built on her device. Filled in by downloads.ts (step 11 of the
// build plan): PDF when nothing is open, Word while a part is open, and the
// price sheet as Excel.

import type { Question } from "../../lib/ava/flow";
import type { Part } from "../../lib/ava/package";
import type { AvaContext } from "./useAva";

/** Builds and saves the files. Returns how many were written: none when a
 *  paper would not open, so the caller records a download only when one
 *  happened (review panel, round 2). */
export async function downloadBid(
  ctx: AvaContext,
  part: Part | null,
  holes: Question[],
): Promise<number> {
  const { buildFiles } = await import("./downloads");
  const files = await buildFiles(ctx, part, holes);
  for (const f of files) {
    const url = URL.createObjectURL(f.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return files.length;
}
