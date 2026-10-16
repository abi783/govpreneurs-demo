/**
 * Copies a short text to the clipboard.
 *
 * Layer: Frameworks & Drivers (the browser). The portal runs inside the
 * HighLevel iframe, where the Clipboard API can refuse the write. If it
 * refuses, or does not exist, the text goes through a hidden text area and
 * `execCommand("copy")`.
 */

/** The part of `document` that the fallback uses. */
export type CopyDocument = Pick<Document, "createElement" | "body" | "execCommand">;

/** Where `copyText` writes. The default is the browser; a test passes fakes. */
export interface CopyEnv {
  clipboard?: Pick<Clipboard, "writeText">;
  doc: CopyDocument;
}

function browserEnv(): CopyEnv {
  return { clipboard: navigator.clipboard, doc: document };
}

function copyThroughTextArea(text: string, doc: CopyDocument): boolean {
  const area = doc.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  doc.body.appendChild(area);
  area.select();
  try {
    return doc.execCommand("copy");
  } finally {
    area.remove();
  }
}

/** Copies `text`. Returns true when the text reached the clipboard. */
export async function copyText(text: string, env: CopyEnv = browserEnv()): Promise<boolean> {
  if (env.clipboard) {
    try {
      await env.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("[clipboard] Clipboard API refused the write; using the fallback", error);
    }
  }
  return copyThroughTextArea(text, env.doc);
}
