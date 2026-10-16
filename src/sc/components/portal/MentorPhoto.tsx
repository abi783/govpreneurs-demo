"use client";

import { useState, type ReactNode } from "react";

/**
 * A mentor's photo, or `fallback` when there is no photo or it fails to load.
 *
 * `Mentor.avatarUrl` is a link that an admin pastes. A GHL profile-photo link
 * stops working when the photo changes in GHL (JP Cervantes, 7 Oct 2026). The
 * browser then shows a broken image and the alt text. The fallback replaces it.
 */
export function MentorPhoto({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null;
  alt: string;
  className: string;
  fallback: ReactNode;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
}
