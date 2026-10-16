// DEMO: the business logo that the page starts with, and the helpers that turn an
// uploaded image into a small picture that fits in the session store.
//
// The starting logo is a drawn mark (a green tile with the letters HC), because the
// story has no logo file. It is an inline SVG, so no file can go missing.

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
<rect width="160" height="160" rx="30" fill="#1f5c4d"/>
<circle cx="80" cy="80" r="56" fill="none" stroke="#f3e9d2" stroke-width="3" opacity="0.55"/>
<text x="80" y="98" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="#f3e9d2">HC</text>
</svg>`;

/** A data URL for the starting logo. */
export const MEDIA_LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

const MAX_SIDE = 320;

/**
 * Read an image file and return a small data URL (a JPEG or PNG at most 320 px on a
 * side) so it fits in `sessionStorage`. A file that is not an image, or that cannot
 * be read, gets the starting logo instead, so the upload still ends in a picture.
 */
export async function imageToDataUrl(file: Blob, fallback: string): Promise<string> {
  try {
    if (!file.type.startsWith("image/")) return fallback;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return fallback;
  }
}

/** A drawn avatar with the owner's initials, for a photo upload that is not an image. */
export function initialsAvatar(initials: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><rect width="160" height="160" fill="#7b5b3a"/><text x="80" y="102" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#f3e9d2">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
