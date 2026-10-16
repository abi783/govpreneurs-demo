/**
 * Shared environment detection for v2.
 *
 * True only for genuine local dev — Vite dev server (`import.meta.env.DEV`)
 * or `localhost`/`127.0.0.1`. Staging is treated as a real (non-mock)
 * environment, same as production: staging uses the real GHL SSO handshake
 * and real backend auth (see `backend/src/ghl/ghl.constants.ts`'s
 * `isMockGhlEnvironment()`, which mirrors this on the backend).
 *
 * `src/lib/ghlUser.tsx`'s `isLocal` const imports this function to keep the
 * two in sync.
 *
 * We evaluate it lazily (as a function) rather than at module load so unit
 * tests can stub `window`/`import.meta.env` before calling it.
 */
export function isMockEnv(): boolean {
  return (
    typeof window !== "undefined" &&
    (import.meta.env.DEV ||
      window.location?.hostname === "localhost" ||
      window.location?.hostname === "127.0.0.1")
  );
}
