/**
 * Which `kind` a document row is stored under. Pure.
 *
 * The set is DERIVED, not listed twice: the record has ten document rows, six
 * with no registry home, and a second hand-written list in the upload route
 * would drift the first time a row is added — the failure mode being a 400 on
 * an upload she was invited to make.
 *
 * ONE ROW'S KIND IS NOT ITS KEY. `doc_llc_paperwork` stores under `llc`,
 * because `kind === "llc"` is what stamps `MemberOnboarding.llcUploadedAt` and
 * auto-ticks `/tasks`' first step. The prefix rule alone would upload the right
 * file and tick nothing.
 *
 * A `doc_` PREFIX IS NOT THE ONLY WAY A ROW HOLDS A FILE. A `papers` row —
 * insurance, licences, a HUBZone letter — is a named thing with an issuer and
 * an expiry, kept under the row's OWN key rather than a `doc_` one. Deriving
 * the set from the `file` rows alone left eight rows offering her a file picker
 * that answered "There is nowhere to keep that file", which is a caller bug
 * worded as if she had done something wrong.
 */

import { CATALOG } from "./catalog";
import { REGISTRY } from "./registry";

/** Every document row's key opens with this. */
const DOC_PREFIX = "doc_";
/** The row whose kind is not its key — see the header. */
const LLC_KEY = "doc_llc_paperwork";
const LLC_KIND = "llc";
/** The `mbType`s whose control renders a file picker. `papers` passes
 *  `onUpload` down per certificate exactly as `file` does. */
const HOLDS_A_FILE: ReadonlySet<string> = new Set(["file", "papers"]);

/** Catalog rows that hold a file under their own key rather than a `doc_` one.
 *  Declared before `DOCUMENT_KINDS`, which reads it at import. */
const PAPER_KEYS: ReadonlySet<string> = new Set(
  CATALOG.filter((f) => f.mbType === "papers" && f.key !== null).map((f) => f.key as string),
);

/** The kind this field's document is stored under, or null for a row that
 *  holds no document. */
export function documentKindFor(fieldKey: string): string | null {
  if (fieldKey === LLC_KEY) return LLC_KIND;
  // A paper is stored under the row's own name: there is no `doc_` key to
  // slice, and inventing one would key her insurance under `insurance`.
  if (PAPER_KEYS.has(fieldKey)) return fieldKey;
  if (!fieldKey.startsWith(DOC_PREFIX)) return null;
  const kind = fieldKey.slice(DOC_PREFIX.length);
  return kind === "" ? null : kind;
}

/** The keys that hold a document: every catalog row whose control renders a
 *  file picker, plus the registry `upload` fields — `doc_certifications` is
 *  folded into another row and so has no catalog row of its own. */
function documentKeys(): string[] {
  const fromCatalog = CATALOG.filter((f) => HOLDS_A_FILE.has(f.mbType) && f.key !== null).map(
    (f) => f.key as string,
  );
  const fromRegistry = REGISTRY.filter((f) => f.control === "upload").map((f) => f.key);
  return [...new Set([...fromCatalog, ...fromRegistry])];
}

/** Every kind the record can produce — what the endpoint accepts. */
export const DOCUMENT_KINDS: ReadonlySet<string> = new Set(
  documentKeys()
    .map(documentKindFor)
    .filter((kind): kind is string => kind !== null),
);

/** Whether an incoming `kind` is one the record knows how to hold. */
export function isDocumentKind(kind: string): boolean {
  return DOCUMENT_KINDS.has(kind);
}
