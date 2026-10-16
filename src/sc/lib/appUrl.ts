/**
 * The app's own public base URL, for links that leave the app: the receipt
 * email.
 *
 * Layer: Entities (configuration). Pure apart from one env read at call time,
 * so tests can stub it. A page on the app links with a relative path instead.
 */

const TRAILING_SLASHES = /\/+$/;

/** `NEXT_PUBLIC_APP_URL` without the spaces around it, or null when it is empty. */
export function configuredAppUrl(): string | null {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || null;
}

/** The absolute link to `path` (which starts with "/"): the app base, its trailing slashes removed, + path. */
export function absoluteAppUrl(appUrl: string, path: string): string {
  return `${appUrl.replace(TRAILING_SLASHES, "")}${path}`;
}
