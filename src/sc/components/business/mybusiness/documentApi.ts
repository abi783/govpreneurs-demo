/**
 * Storing one document.
 *
 * Not `request.ts`'s `call`, for the same reason as `MediaUploads`: this writes
 * a `MemberDocument` rather than a `ProfileField`, so it answers with a
 * document and there is no payload to unwrap.
 *
 * This function stops at the stored file. What makes the row show it is the
 * caller's own `onSave` — the same `PUT` a typed answer takes. That is one
 * deliberate extra round trip, and the alternative is worse: the file on file
 * while the record still says "Upload your tax form", which reads as the upload
 * having failed.
 *
 * `document_uploaded` fires on the upload, not the save: the file reached the
 * bucket, whatever happens to the record entry afterwards.
 */

"use client";

import { documentKindFor } from "@sc/lib/businessProfile/documentKinds";
import type { StoredFile } from "@sc/lib/businessProfile/mbValue";
import type { UploadOutcome } from "../mbControls";
import { trackDocumentUploaded } from "./request";

/** Ours, when the endpoint does not say what went wrong in her words. */
export const UPLOAD_MESSAGE = "That did not upload. You can try again.";
/** A row that holds no document — a caller bug, never something she did. */
const NOT_A_DOCUMENT = "There is nowhere to keep that file.";
/** A file with no type of its own still has to say something. */
const UNKNOWN_MIME = "application/octet-stream";

/** What the endpoint answers on the way through. */
interface DocumentResponse {
  documentId?: unknown;
  error?: unknown;
}

/** The record entry a stored document becomes. No URL: the address belongs to
 *  `MemberDocument`, and a profile row is not where a document is served from. */
function entryFor(documentId: string, file: File, at: Date): StoredFile {
  return {
    id: documentId,
    name: file.name,
    mime: file.type || UNKNOWN_MIME,
    sizeBytes: file.size,
    uploadedAt: at.toISOString(),
  };
}

/**
 * Store one document against the row that asked for it, and hand back the entry
 * the record keeps. The caller saves that entry; this does not.
 */
export async function uploadDocument(
  locationId: string,
  fieldKey: string,
  file: File,
): Promise<UploadOutcome> {
  const kind = documentKindFor(fieldKey);
  if (!kind) return { ok: false, message: NOT_A_DOCUMENT };

  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);

  const res = await fetch(`/api/portal/${locationId}/business-documents`, {
    method: "POST",
    body: form,
  }).catch(() => null);
  const body = res ? ((await res.json().catch(() => null)) as DocumentResponse | null) : null;

  if (!res?.ok || typeof body?.documentId !== "string") {
    return { ok: false, message: typeof body?.error === "string" ? body.error : UPLOAD_MESSAGE };
  }

  trackDocumentUploaded(locationId, fieldKey, kind);
  return { ok: true, file: entryFor(body.documentId, file, new Date()) };
}
