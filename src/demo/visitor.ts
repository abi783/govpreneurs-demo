// DEMO: presenter mode.
//
// A presenter turns on presenter mode at /admin, which shows the presenter panel.
// It lives in localStorage, so this browser remembers it across visits. Everyone
// else opens the demo directly on the sample business (there is no sign-up step).
//
// The /admin password is checked in the browser: anyone who reads the code can find
// it. It only hides demo controls; nothing private sits behind it.

const PRESENTER_KEY = "gp-demo:presenter";
// Any capitals, with or without the space: "Tim Sabir", "timsabir".
const PRESENTER_PASSWORD = "timsabir";

/**
 * Builds that set VITE_PRESENTER=on (the QA builds) and unit tests always run as a
 * presenter, so the crawl and scans see the panel and every page.
 */
export const PRESENTER_ALWAYS =
  import.meta.env?.VITE_PRESENTER === "on" || (typeof process !== "undefined" && !!process.env?.VITEST);

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the session still works, it just isn't remembered */
  }
}

/** Presenter mode: the panel shows. Always on in QA builds and unit tests. */
export function isPresenter(): boolean {
  if (PRESENTER_ALWAYS) return true;
  return typeof window !== "undefined" && read(PRESENTER_KEY) === "1";
}

export function setPresenter(on: boolean): void {
  write(PRESENTER_KEY, on ? "1" : null);
}

export function presenterPasswordMatches(typed: string): boolean {
  return typed.replace(/\s+/g, "").toLowerCase() === PRESENTER_PASSWORD;
}
