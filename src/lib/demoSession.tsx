// Demo session shell — admin mode persisted in sessionStorage so refreshes /
// deep-linked routes don't bounce back to the lead-form gate. Lead mode stays
// per-render (no persistence) to preserve booth-demo behavior.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DemoMode = "lead" | "admin";

export interface DemoLead {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
}

export interface DemoSessionState {
  mode: DemoMode | null;
  lead: DemoLead | null;
}

interface DemoSessionCtx extends DemoSessionState {
  setLead: (lead: DemoLead) => void;
  setAdmin: () => void;
  logout: () => void;
  hydrated: boolean;
}

const Ctx = createContext<DemoSessionCtx | null>(null);

const STORAGE_KEY = "gp_demo_mode";

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoSessionState>({ mode: null, lead: null });
  const [hydrated, setHydrated] = useState(false);

  // Read persisted admin mode after mount (SSR-safe).
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(STORAGE_KEY) === "admin") {
          setState({ mode: "admin", lead: null });
        }
      } catch {
        // sessionStorage unavailable (private mode, etc.) — ignore.
      }
    }
    setHydrated(true);
  }, []);

  const setLead = useCallback((lead: DemoLead) => {
    setState({ mode: "lead", lead });
  }, []);

  const setAdmin = useCallback(() => {
    setState({ mode: "admin", lead: null });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "admin");
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(() => {
    setState({ mode: null, lead: null });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo<DemoSessionCtx>(
    () => ({ ...state, setLead, setAdmin, logout, hydrated }),
    [state, setLead, setAdmin, logout, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoSession(): DemoSessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoSession must be used within DemoSessionProvider");
  return ctx;
}
