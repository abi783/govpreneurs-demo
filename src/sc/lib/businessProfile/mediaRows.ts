/**
 * mediaRows.ts — the two catalog rows that no `ProfileField` key backs.
 * ENTITY LAYER: pure, no Prisma, no React.
 *
 * F19. `profilePhoto` and `businessLogo` live on `SuccessCenter`
 * (`mainContactPhotoUrl` / `companyLogoUrl`), not on a keyed row, which is why
 * `recordView.rowsIn` leaves them out and says so in its own comment. This is
 * the other half of that sentence: WHERE their surface is, and what it posts.
 *
 * ── WHY IT IS NOT INLINE IN THE COMPONENT ─────────────────────────────────
 * Three decisions live here and none of them belong on a screen: which rows are
 * virtual (the crosswalk's `VIRTUAL_KEYS`, already pinned by a test), which part
 * holds them (the catalog's, so the pair moves if the catalog moves them), and
 * what each one is called (`copyFor`, never restated — restating catalog copy is
 * how two surfaces come to name the same thing differently).
 *
 * Only the last column is authored: which `type` the upload endpoint takes and
 * which `media` URL the row shows. That mapping is this module's whole content.
 */

import { FIELDS_BY_ID, copyFor } from "./catalog";
import { VIRTUAL_KEYS } from "./crosswalk";
import type { PartId } from "./parts";

/** The upload endpoint's discriminator for the two image artifacts. */
export type MediaUploadType = "contact" | "logo";
/** The `payload.media` field a row shows and, after an upload, replaces. */
export type MediaKey = "photoUrl" | "logoUrl";

/** What the endpoint takes and what the payload calls it, per virtual row. */
const SURFACE: Record<string, { uploadType: MediaUploadType; mediaKey: MediaKey; round: boolean }> = {
  profilePhoto: { uploadType: "contact", mediaKey: "photoUrl", round: true },
  businessLogo: { uploadType: "logo", mediaKey: "logoUrl", round: false },
};

/** One image the member can replace, with everything its card needs. */
export interface MediaRow {
  /** The catalog id. There is no `fieldKey` — that is what makes it virtual. */
  id: string;
  part: PartId;
  label: string;
  helper: string;
  /** `POST /api/portal/{locationId}/upload` takes this as `type`. */
  uploadType: MediaUploadType;
  mediaKey: MediaKey;
  /** Round preview for the person, square for the logo. */
  round: boolean;
}

/**
 * The virtual rows, in catalog order.
 *
 * A `VIRTUAL_KEY` with no surface throws HERE rather than quietly disappearing
 * from the page: a row the member cannot reach at all is the defect F19 exists
 * to close, and it must not be able to come back silently.
 */
export const MEDIA_ROWS: readonly MediaRow[] = VIRTUAL_KEYS.map((id) => {
  const field = FIELDS_BY_ID[id];
  const surface = SURFACE[id];
  if (!field || !surface) {
    throw new Error(`No upload surface for the virtual catalog row "${id}".`);
  }
  const copy = copyFor(field);
  return {
    id,
    part: field.part,
    label: copy.label,
    helper: copy.helper ?? "",
    ...surface,
  };
});

/** The images that belong to one part of the record. Usually none. */
export function mediaRowsIn(part: PartId): readonly MediaRow[] {
  return MEDIA_ROWS.filter((row) => row.part === part);
}
