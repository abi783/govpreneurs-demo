/**
 * The photo and the logo — on the Basic Info screen, which shows both, or on
 * the one part the catalog files them under.
 *
 * The two VIRTUAL catalog rows have no `ProfileField` key — they live on
 * `SuccessCenter.mainContactPhotoUrl` / `companyLogoUrl` — so `rowsIn` leaves
 * them out and `ImageUploadCard` is their surface. This file supplies the
 * member-portal endpoint and nothing else; the card is reused verbatim.
 *
 * The POST is not `request.ts`'s `call` because this one answers `{ url }`
 * rather than the whole payload — it writes a `SuccessCenter` column, not a
 * `ProfileField` row.
 *
 * That URL IS the new column value, already persisted through
 * `updateSuccessCenterWithProfileWebhook`, so it is merged into the held
 * record's `media` and nothing is fetched again.
 */

"use client";

import type { ReactElement } from "react";
import { MEDIA_ROWS, mediaRowsIn, type MediaRow } from "@sc/lib/businessProfile/mediaRows";
import type { PartId } from "@sc/lib/businessProfile/parts";
import { ImageUploadCard } from "../ImageUploadCard";
import { useRecord } from "./RecordStore";
import { UPLOAD_FAILED_PORTAL } from "@sc/lib/storage/uploadMessages";
import "./mybusiness.css";

/* The failure sentence is `UPLOAD_FAILED_PORTAL`, shared with the route that
   answers it — a second wording here would have to be kept in step with that
   one by hand, and one of the two would drift. */

export interface MediaUploadsProps {
  locationId: string;
  /** One part's images. Omit it for ALL of them — the Basic Info screen shows
   *  the pair together, the way the source design opens "Your company", rather
   *  than waiting for her to find whichever part the catalog files them under. */
  part?: PartId;
}

/** What the endpoint answers on the way through. */
interface UploadResponse {
  url?: unknown;
  error?: unknown;
}

/** The images this part holds — or all of them — each one hers to replace. */
export function MediaUploads({ locationId, part }: MediaUploadsProps): ReactElement | null {
  const { payload, mergePayload } = useRecord();
  const rows = part === undefined ? MEDIA_ROWS : mediaRowsIn(part);
  if (rows.length === 0) return null;

  /** One image, straight to the column the portal home's cards already read. */
  async function upload(row: MediaRow, file: File): Promise<{ url: string } | { error: string }> {
    const form = new FormData();
    form.set("type", row.uploadType);
    form.set("file", file);

    const res = await fetch(`/api/portal/${locationId}/upload`, { method: "POST", body: form });
    const body = (await res.json().catch(() => null)) as UploadResponse | null;

    if (!res.ok || typeof body?.url !== "string") {
      return { error: typeof body?.error === "string" ? body.error : UPLOAD_FAILED_PORTAL };
    }
    const url = body.url;

    // The column has already moved; the held record follows it in the same
    // step, so every screen under this layout shows the new image. Merged into
    // whatever is held WHEN THE UPLOAD LANDS, never into the copy this render
    // closed over — a row she saved while the file was in flight would
    // otherwise be replaced by the pre-save snapshot and revert on screen.
    mergePayload((current) => ({
      ...current,
      media: { ...current.media, [row.mediaKey]: url },
    }));
    return { url };
  }

  return (
    <div className="mb-media">
      {rows.map((row) => (
        <ImageUploadCard
          key={row.id}
          label={row.label}
          helper={row.helper}
          round={row.round}
          currentUrl={payload.media[row.mediaKey]}
          upload={(file) => upload(row, file)}
        />
      ))}
    </div>
  );
}
