/**
 * The "View billing history" link of a purchase (PRD §8.3): it takes the
 * member to her portal home and opens the wallet card's Usage History drawer.
 * The success view and the wallet card both read this file, so the two sides
 * cannot drift.
 *
 * Layer: Interface Adapters (client).
 *
 * TWO PATHS, because the portal runs inside the GHL dashboard.
 * - Inside GHL (the portal is framed): the link sends the WHOLE GHL page to
 *   the portal home's custom-menu-link, so GHL selects the right sidebar item.
 *   GHL builds the frame's address itself and is not known to pass on our
 *   query, so before it leaves, the link leaves a note in this app's
 *   localStorage (the same origin inside the next frame). The wallet card
 *   takes the note on load and opens the drawer. A note older than
 *   `WALLET_HISTORY_NOTE_TTL_MS` is ignored, so a click that never arrived
 *   cannot open the drawer on some later visit.
 * - Outside GHL (staging in a plain browser): a plain link to
 *   `/<loc>?billing=history`, which the card reads from the address.
 */
import { menuLinkHref } from "@sc/lib/businessProfile/menuLink";

/** The query parameter, and the one value of it that opens the drawer. */
export const WALLET_HISTORY_PARAM = "billing";
export const WALLET_HISTORY_VALUE = "history";

/** The GHL custom-menu-link of the member's portal home ("Open Account"). */
export const PORTAL_HOME_MENU_LINK_ID = "f0b947ba-af7a-438f-ab9e-29a8ebbedde2";

/** The localStorage key of the note, and how long a note counts. */
export const WALLET_HISTORY_NOTE_KEY = "gp:open-wallet-history";
export const WALLET_HISTORY_NOTE_TTL_MS = 2 * 60 * 1000;

/** The portal home of this member with the drawer open, for a page outside GHL. */
export function walletHistoryHref(locationId: string): string {
  return `/${encodeURIComponent(locationId)}?${WALLET_HISTORY_PARAM}=${WALLET_HISTORY_VALUE}`;
}

/** The portal home's sidebar item in the GHL dashboard. */
export function walletHistoryMenuHref(locationId: string): string {
  return menuLinkHref(encodeURIComponent(locationId), PORTAL_HOME_MENU_LINK_ID);
}

/** True when the page was opened by the plain link. `value` is the parameter's value, or null. */
export function opensWalletHistory(value: string | null): boolean {
  return value === WALLET_HISTORY_VALUE;
}

/** The part of `Storage` that the note needs. */
type NoteStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The browser's localStorage, or null where it is blocked (a private window, a strict iframe policy). */
function browserStorage(): NoteStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Leaves the note. Returns false when storage is blocked; the link still goes to the portal home. */
export function leaveWalletHistoryNote(now: number, storage: NoteStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(WALLET_HISTORY_NOTE_KEY, String(now));
    return true;
  } catch (err) {
    console.warn("[wallet] billing history note not saved", err instanceof Error ? err.name : "error");
    return false;
  }
}

/** Takes the note: removes it, and answers true when it is fresh. */
export function takeWalletHistoryNote(now: number, storage: NoteStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(WALLET_HISTORY_NOTE_KEY);
    if (raw === null) return false;
    storage.removeItem(WALLET_HISTORY_NOTE_KEY);
    const at = Number(raw);
    return Number.isFinite(at) && now - at >= 0 && now - at <= WALLET_HISTORY_NOTE_TTL_MS;
  } catch (err) {
    console.warn("[wallet] billing history note not read", err instanceof Error ? err.name : "error");
    return false;
  }
}

/** True when this page runs inside another page's frame (the GHL dashboard). */
export function isFramed(win: Pick<Window, "parent"> & { self: unknown } = window): boolean {
  try {
    return win.parent !== win.self;
  } catch {
    return true;
  }
}

/** The part of the clicked link that the click handler changes. */
type LinkElement = { href: string; target: string };

/**
 * The click of "View billing history". Framed: leave the note, then point the
 * clicked link itself at the portal home's sidebar item with
 * `target="_top"`, and let the browser follow it. That is the same mechanism
 * as the app's other `target="_top"` links, which GHL's frame allows; a
 * script that sets `window.top.location` can be refused. Not framed: the
 * plain link runs unchanged.
 */
export function followWalletHistoryLink(
  link: LinkElement,
  locationId: string,
  framed: boolean = isFramed(),
  now: number = Date.now(),
): void {
  if (!framed) return;
  leaveWalletHistoryNote(now);
  link.href = walletHistoryMenuHref(locationId);
  link.target = "_top";
}
