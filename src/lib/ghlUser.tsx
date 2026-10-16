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
import { setMockLocationId } from "./api";
import { demoSession } from "../demo/session";

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

async function fetchSession(): Promise<GhlUserSession> {
  // DEMO: no GHL handshake, no backend. The session is fixed and always Elite.
  // The same answer comes from POST /users/from-highlevel in src/demo/api/session.ts.
  return demoSession();
}

// Dev/staging mock override: mirror any `?locationId=` on the current URL into
// the mock-location slot so backend mock auth resolves the right user.
function applyQueryLocationOverride(): void {
  if (typeof window === "undefined") return;
  const queryLocationId = new URLSearchParams(window.location.search).get("locationId");
  if (queryLocationId) setMockLocationId(queryLocationId);
}

export function GhlUserProvider({ children }: { children: ReactNode }) {
  // DEMO: the session exists from the first render, so no "Loading…" screen shows.
  const [session, setSession] = useState<GhlUserSession | null>(() => demoSession());
  const [loading, setLoading] = useState(false);
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
  const bootStarted = useRef(true); // DEMO: the session is already set, so boot does not load again.
  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    load();
  }, [load]);

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
