import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE_URL, apiFetch, setGhlToken, setMockLocationId } from "./api";
import { isMockEnv } from "./env";
import { isEmbeddedInGhl } from "./ghlNav";
import { LOCATION_REQUEST_MESSAGE, parseLocationIdResponse } from "./ghlSessionSync";

/** How often to ask the GHL parent bridge for the active location id (ms). */
const LOCATION_POLL_MS = 1500;

export interface GhlUserSession {
  userId: string;
  companyId: string;
  activeLocation: string;
  locationId: string;
  contactId: string;
  userName: string;
  email: string;
  role: string;
  type: string;
  isAgencyOwner: boolean;
  appStatus: string;
  productId: string | null;
  priceId: string | null;
  planId: string | null;
  subscriptionId: string | null;
  isMentor: boolean;
  isLocationExist: boolean;
  /** The GHL user who is logged in (`userId` and `email` are the location
   *  owner's). Absent on a session cached before the backend sent them. */
  viewerUserId?: string;
  viewerEmail?: string;
  saasMode: string | null;
  /** grant_v2 cohort flag — true when this location is on the backend whitelist.
   *  Gates the live Grant v2 surface (GrantCanvas + rail); off for everyone else. */
  grantV2?: boolean;
}

interface GhlUserCtx {
  session: GhlUserSession | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const Ctx = createContext<GhlUserCtx | null>(null);

// Local dev only — staging now uses the real GHL SSO handshake, same as
// production. De-duplicated onto `./env`'s `isMockEnv()`; no circular
// import risk since `env.ts` has no imports of its own.
const isLocal = isMockEnv();

/** Number of SSO postMessage attempts before giving up. */
const SSO_MAX_ATTEMPTS = 3;
/** Per-attempt timeout (ms) waiting for the GHL parent's reply. */
const SSO_ATTEMPT_TIMEOUT_MS = 5_000;
/** Delay (ms) between SSO retry attempts. */
const SSO_RETRY_DELAY_MS = 300;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * One postMessage round-trip to the GHL parent for the encrypted session blob.
 * Resolves with the payload, or rejects after `timeoutMs`. Owns its own message
 * listener + timeout and tears both down before settling, so attempts never leak
 * a listener or let a stale reply resolve a superseded attempt.
 */
function requestUserDataOnce(timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timeout waiting for GHL session data"));
    }, timeoutMs);

    const handler = (event: MessageEvent) => {
      if (event.data?.message === "REQUEST_USER_DATA_RESPONSE") {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve(event.data.payload as string);
      }
    };

    window.addEventListener("message", handler);
    window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");
  });
}

async function getEncryptedDataFromGhl(): Promise<string> {
  const appId = import.meta.env.VITE_GHL_APP_ID as string | undefined;

  // Try Custom JavaScript (exposeSessionDetails) if appId is set — direct await,
  // not a timeout race, so it is never part of the retry loop.
  type WinWithExpose = Window & { exposeSessionDetails?: (id: string) => Promise<string> };
  const win = window as unknown as WinWithExpose;
  if (appId && typeof win.exposeSessionDetails === "function") {
    return win.exposeSessionDetails(appId);
  }

  // Custom Pages postMessage fallback. The parent occasionally misses the first
  // request on a cold iframe load, so retry a few times with a short per-attempt
  // timeout before surfacing the error to the user.
  let lastError: unknown;
  for (let attempt = 1; attempt <= SSO_MAX_ATTEMPTS; attempt++) {
    try {
      return await requestUserDataOnce(SSO_ATTEMPT_TIMEOUT_MS);
    } catch (err) {
      lastError = err;
      if (attempt < SSO_MAX_ATTEMPTS) await delay(SSO_RETRY_DELAY_MS);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Timeout waiting for GHL session data");
}

async function fetchSession(): Promise<GhlUserSession> {
  let encryptedData: string;

  if (isLocal) {
    encryptedData = "local";
  } else {
    encryptedData = await getEncryptedDataFromGhl();
    // Store for subsequent authenticated API calls
    setGhlToken(encryptedData);
  }

  const res = await apiFetch(`${API_BASE_URL}/users/from-highlevel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encryptedData }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? "Failed to authenticate with GovPreneurs",
    );
  }

  return res.json() as Promise<GhlUserSession>;
}

// Dev/staging mock override: mirror any `?locationId=` on the current URL into
// the mock-location slot so backend mock auth resolves the right user.
function applyQueryLocationOverride(): void {
  if (typeof window === "undefined") return;
  const queryLocationId = new URLSearchParams(window.location.search).get("locationId");
  if (queryLocationId) setMockLocationId(queryLocationId);
}

export function GhlUserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GhlUserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      applyQueryLocationOverride();
      const data = await fetchSession();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // StrictMode double-invokes effects in dev; without this guard the retrying
  // handshake would fire twice (up to 6 attempts). A ref flag keeps boot to a
  // single load(); manual Retry (refetch) still works because it calls load()
  // directly, not through this effect.
  const bootStarted = useRef(false);
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    load();
  }, [load]);

  // Detect a GHL sub-account switch. GHL rewrites the *parent* URL without
  // reloading this iframe and fires no event, and our app is cross-origin to the
  // parent, so we can't read the parent URL here. The GHL-parent Custom JS
  // bridge (same script as REQUEST_NAVIGATION / REQUEST_AUTH_TOKEN) answers a
  // `REQUEST_LOCATION_ID` with the active location id. We poll it over
  // `window.parent` (the channel the nav/auth bridges already use) and, on a
  // *changed* id, hard-reload — the one action proven to pull the new location's
  // session/token (it's what a manual refresh does). The `currentLocation` guard
  // ignores replies before our own session has loaded, so this can never loop.
  const currentLocation = useRef<string | null>(null);
  currentLocation.current = session?.locationId ?? null;
  useEffect(() => {
    if (isLocal || !isEmbeddedInGhl()) return;

    const askLocation = () => {
      window.parent.postMessage({ message: LOCATION_REQUEST_MESSAGE }, "*");
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return; // only trust our parent frame
      const locationId = parseLocationIdResponse(event.data);
      if (locationId && currentLocation.current && locationId !== currentLocation.current) {
        window.location.reload();
      }
    };

    window.addEventListener("message", onMessage);
    const interval = window.setInterval(askLocation, LOCATION_POLL_MS);
    askLocation();

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
  }, []);

  const value = useMemo<GhlUserCtx>(
    () => ({ session, loading, error, refetch: load }),
    [session, loading, error, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGhlUser(): GhlUserCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGhlUser must be used within GhlUserProvider");
  return ctx;
}
