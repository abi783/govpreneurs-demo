/**
 * What a member is told when storage refuses an upload.
 *
 * The routes used to answer with the caught exception's own message, so a
 * misconfigured server told her, in red on her own profile page, that
 * `DO_SPACES_ENDPOINT`, `DO_SPACES_KEY` and friends were missing. That names
 * our infrastructure and its exact config keys to anyone who can reach the
 * endpoint — on `/api/intake/upload`, anyone at all, with no session — and it
 * is useless to her besides: she cannot set an environment variable, and a
 * fault she cannot act on, in red, reads as something SHE did wrong.
 *
 * So the diagnosis goes to `console.error` where the operator is, and she gets
 * a sentence she can act on. The messages say the file is fine because at that
 * point it provably is: type and size are validated earlier and answer their
 * own 400s. Without that line the obvious move is to re-export a good file.
 */

const CANNOT_SAVE = "We could not save that just now — nothing is wrong with your file.";

/** Members inside the portal, who have a mentor to escalate to. */
export const UPLOAD_FAILED_PORTAL =
  `${CANNOT_SAVE} Try again in a minute, and tell your mentor if it keeps happening.`;

/** The public intake form, where there is no mentor yet to name. */
export const UPLOAD_FAILED_PUBLIC = `${CANNOT_SAVE} Try again in a minute.`;
