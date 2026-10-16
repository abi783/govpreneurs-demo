// In-memory UI state — ephemeral per-session flags (hint dismissals,
// sidebar group open/close, etc.). Replaces the localStorage/sessionStorage
// flags that used to live inline in each component. Resets on reload.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Flags = Record<string, unknown>;

interface UIStateCtx {
  get: <T = unknown>(key: string, fallback: T) => T;
  set: <T = unknown>(key: string, value: T) => void;
}

const Ctx = createContext<UIStateCtx | null>(null);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flags>({});

  const get = useCallback(<T,>(key: string, fallback: T): T => {
    return (key in flags ? (flags[key] as T) : fallback);
  }, [flags]);

  const set = useCallback(<T,>(key: string, value: T) => {
    setFlags((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const value = useMemo(() => ({ get, set }), [get, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useCtx(): UIStateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUIFlag must be used within UIStateProvider");
  return ctx;
}

export function useUIFlag<T>(key: string, fallback: T): [T, (next: T) => void] {
  const ctx = useCtx();
  const value = ctx.get<T>(key, fallback);
  const setter = useCallback((next: T) => ctx.set(key, next), [ctx, key]);
  return [value, setter];
}

// Sugar for the common "one-shot dismiss" pattern (hints, primers, gloss bars).
export function useDismissibleHint(key: string): { dismissed: boolean; dismiss: () => void } {
  const [dismissed, setDismissed] = useUIFlag<boolean>(`hint:${key}`, false);
  const dismiss = useCallback(() => setDismissed(true), [setDismissed]);
  return { dismissed, dismiss };
}
