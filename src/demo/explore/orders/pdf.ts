// A small PDF writer for the sample order papers. One page, plain text, the
// built-in Helvetica font. It makes a real PDF file that any reader opens.

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 15;
const MAX_CHARS = 92;

/** The PDF text here allows plain characters only; swap the rest for safe ones. */
function clean(text: string): string {
  return text
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/é/g, "e")
    .replace(/[^\x20-\x7e]/g, "");
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(line: string): string[] {
  const words = clean(line).split(" ");
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && `${current} ${word}`.length > MAX_CHARS) {
      out.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  out.push(current);
  return out;
}

/** Build a one-page PDF. The first line is the title. */
export function simplePdf(title: string, lines: readonly string[]): Uint8Array {
  const wrapped = [title, "", ...lines].flatMap((l) => (l === "" ? [""] : wrap(l)));
  const maxLines = Math.floor((PAGE_HEIGHT - 2 * MARGIN) / LINE_HEIGHT);
  const shown = wrapped.slice(0, maxLines);

  const content: string[] = [
    "BT",
    "/F2 15 Tf",
    `${MARGIN} ${PAGE_HEIGHT - MARGIN} Td`,
    `${LINE_HEIGHT + 3} TL`,
  ];
  shown.forEach((line, i) => {
    if (i === 1) content.push("/F1 10.5 Tf", `${LINE_HEIGHT} TL`);
    content.push(`(${escapeText(line)}) Tj`, "T*");
  });
  content.push("ET");
  const stream = content.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) body += `${String(off).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
