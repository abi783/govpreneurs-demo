import { useEffect, useState } from "react";
import {
  clearToolsToken,
  getMe,
  getToolsToken,
  ToolsApiError,
  type ToolsUser,
} from "@/lib/tools/api";

// Module-level cache: the token rarely changes within a page session, so every
// mounted consumer (header, landing page, gate) shares one /me fetch instead
// of each firing its own on mount.
let cached: ToolsUser | null = null;
let inFlight: Promise<ToolsUser | null> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

async function load(): Promise<ToolsUser | null> {
  if (!getToolsToken()) {
    cached = null;
    return null;
  }
  if (!inFlight) {
    inFlight = getMe()
      .then((user) => {
        cached = user;
        return user;
      })
      .catch((err: unknown) => {
        // Only a rejected token signs the user out. A network blip or a 5xx
        // must not: dropping the token there would sign people out every time
        // the API restarts.
        const status = err instanceof ToolsApiError ? err.status : 0;
        if (status === 401 || status === 403) clearToolsToken();
        cached = null;
        return null;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Re-read /me and tell every mounted consumer. Call after a sign-in or a
 *  name change so the header flips without a reload. */
export async function refreshToolsAccount(): Promise<void> {
  cached = null;
  await load();
  notify();
}

export interface UseToolsAccount {
  user: ToolsUser | null;
  loading: boolean;
  signOut: () => void;
  refresh: () => Promise<void>;
}

export function useToolsAccount(): UseToolsAccount {
  const [user, setUser] = useState<ToolsUser | null>(cached);
  const [loading, setLoading] = useState(!cached && !!getToolsToken());

  useEffect(() => {
    const onChange = () => setUser(cached);
    listeners.add(onChange);

    if (!cached && getToolsToken()) {
      load().then(() => {
        setLoading(false);
        notify();
      });
    } else {
      setLoading(false);
    }

    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const refresh = async () => {
    inFlight = null; // force a re-fetch
    setLoading(true);
    await load();
    setLoading(false);
    notify();
  };

  const signOut = () => {
    clearToolsToken();
    cached = null;
    notify();
  };

  return { user, loading, signOut, refresh };
}
