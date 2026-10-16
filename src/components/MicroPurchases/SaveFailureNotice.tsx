// The save that did not land, said out loud to HER (DH-22).
//
// The store PUTs her whole record after every answer, and its one call site
// discarded the result with `void`. So a 400 from DH-06's caps, a dead session,
// a broken server and a dropped connection were the same thing: nothing. Her
// quotes, her wins and what she can supply stopped persisting, the screen kept
// showing them, and she found out on the next reload.
//
// This is the sentence that removes the silence. It does NOT reverse anything
// on screen — the record is real, it is in this page, and a surface that
// un-ticked her answer over a network blip would be the worse failure. It says
// where the record is and what she can do about it.
//
// Layer: FRAMEWORKS & DRIVERS. Prose and DOM. It reads one value from the store
// and calls nothing else.
import { AlertTriangle } from "lucide-react";
import { useLiveSlice } from "../../lib/eventBus";
import { getSaveFailure, type SaveFailure } from "../../lib/state/microPurchases";

/** One notice: what happened, and what she does about it. */
interface Notice {
  title: string;
  body: string;
}

/**
 * The two failures she can act on differently, and only two.
 *
 * REFUSED is a verdict on this document: the server read it and said no, so
 * sending it again gets the same answer. A cap and an expired session both land
 * here, and the two share their advice — check that she is still signed in,
 * and copy anything she cannot lose. A third variant per status code would be
 * an error code in prose, which is what this notice exists to avoid.
 *
 * UNCONFIRMED is no verdict at all. A request can reach the server and lose its
 * answer, so this never claims the record was lost — only that we cannot say it
 * was kept. Here waiting IS the action: the store writes the whole document
 * again on her next answer, so a later write carries this one.
 */
const NOTICES: Record<SaveFailure, Notice> = {
  refused: {
    title: "Your answers did not save.",
    body:
      "The server refused them, so what you entered is on this page only. " +
      "Sending the same answers again gets the same reply. " +
      "Check that you are still signed in. " +
      "Copy anything you need to keep before you close or reload this page.",
  },
  unconfirmed: {
    title: "We cannot confirm that your answers saved.",
    body:
      "The save did not finish, so we cannot tell whether the server kept them. " +
      "What you entered is still on this page. " +
      "We try again every time you answer something here. " +
      "Keep this page open until this message goes.",
  },
};

/**
 * Tell her that her record is not reaching the server.
 *
 * Renders nothing while the writes are landing. `role="alert"` because it
 * appears after an action she took, and she must not have to look for it.
 */
export function SaveFailureNotice() {
  const failure = useLiveSlice("microPurchases", getSaveFailure);
  if (!failure) return null;
  const notice = NOTICES[failure];
  return (
    <div className="mp-savefail" role="alert">
      <AlertTriangle size={16} aria-hidden />
      <span className="mp-savefail__text">
        <b>{notice.title}</b>
        <em>{notice.body}</em>
      </span>
    </div>
  );
}
