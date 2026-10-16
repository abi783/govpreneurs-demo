/**
 * Convert a YouTube share / watch URL into a `/embed/` URL the customer
 * portal can drop into an `<iframe>`. Returns `null` for non-YouTube URLs
 * so the caller can fall back to a `<video>` element or a plain link.
 */
export function ytEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns true when the URL ends in a direct video file extension. */
export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}
