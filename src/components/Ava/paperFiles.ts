// The papers she sends Ava, kept as the files themselves for this session,
// so her download carries her own certificates and never a page that only
// names them (review panel, 7 October 2026; KNOWLEDGE D-C5).
//
// The store keeps only the file's name: a photo does not belong in the
// browser's storage. In the product the files live with her bid on the
// server. Here they live in memory: after a reload, or on a screen built from
// the screen switch, a paper is known by name only, and How to send it asks
// her to add it herself.

const files = new Map<string, File>();
/** Files that were kept but could not be opened when the download was built. */
const broken = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

const key = (noticeId: string, askId: string) => `${noticeId}::${askId}`;

function changed() {
  version += 1;
  listeners.forEach((fn) => fn());
}

/** Keep the file she sent for an ask. A later file replaces it. */
export function keepPaper(noticeId: string, askId: string, file: File): void {
  files.set(key(noticeId, askId), file);
  broken.delete(key(noticeId, askId));
  changed();
}

/** The file she sent for an ask, if this session still has it. */
export function paperFile(noticeId: string, askId: string): File | null {
  return files.get(key(noticeId, askId)) ?? null;
}

/** "Choose another": the file is not used. */
export function dropPaper(noticeId: string, askId: string): void {
  files.delete(key(noticeId, askId));
  broken.delete(key(noticeId, askId));
  changed();
}

/** The download could not open this file, so it is not inside her files. */
export function markBroken(noticeId: string, askId: string): void {
  if (broken.has(key(noticeId, askId))) return;
  broken.add(key(noticeId, askId));
  changed();
}

/** The download could not open this paper: she sends it again. */
export function isBroken(noticeId: string, askId: string): boolean {
  return broken.has(key(noticeId, askId));
}

/** The papers of this bid the download could not open, by ask. */
export function brokenPapers(noticeId: string): string[] {
  const head = `${noticeId}::`;
  return [...broken].filter((k) => k.startsWith(head)).map((k) => k.slice(head.length));
}

/** What a file is, for the PDF: a photo, a PDF, or something it cannot hold. */
export function paperKind(file: File): "jpg" | "png" | "pdf" | null {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  if (t === "image/jpeg" || /\.jpe?g$/.test(n)) return "jpg";
  if (t === "image/png" || /\.png$/.test(n)) return "png";
  if (t === "application/pdf" || /\.pdf$/.test(n)) return "pdf";
  return null;
}

/** The file she sent, when a PDF can carry it. Null when this session does
 *  not have it, when it is a kind a PDF cannot hold (a HEIC photo), or when
 *  it could not be opened. */
export function usablePaper(noticeId: string, askId: string): File | null {
  const f = paperFile(noticeId, askId);
  // DEMO: any kind of file counts. One a PDF cannot hold is named on a page.
  if (!f || broken.has(key(noticeId, askId))) return null;
  return f;
}

/** The files a download wrote, by name, so How to send it lists what she
 *  actually has: the last whole bid, and the last single part. In memory, like
 *  her papers; after a reload How to send it falls back to the plan. */
const built = new Map<string, string[]>();

export function recordBuilt(noticeId: string, whole: boolean, names: string[]): void {
  built.set(`${noticeId}::${whole ? "whole" : "part"}`, names);
  changed();
}

export function builtFiles(noticeId: string, whole: boolean): string[] | null {
  return built.get(`${noticeId}::${whole ? "whole" : "part"}`) ?? null;
}

/** For useSyncExternalStore: a screen that lists her papers re-reads them. */
export function subscribePapers(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function papersVersion(): number {
  return version;
}
