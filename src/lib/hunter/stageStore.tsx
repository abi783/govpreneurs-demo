// The stage store — what is pinned above the opportunity feed right now.
//
// ARCHITECTURE.md §3(d) fixes this signature. Two properties are load-bearing:
//
//   1. The store holds a SINGLE NULLABLE VALUE. There is no array, no stack and
//      no history, so "one artifact at a time" is a property of the capability
//      rather than a check the mount performs. `showArtifact` overwrites.
//   2. It is in-memory only. No sessionStorage, no URL state — an artifact is
//      the answer to a question asked this minute, and restoring one on reload
//      would put an answer on screen with no question above it.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { StageArtifact, StageArtifactInput } from "./stageArtifact";

interface StageStore {
  /** The one artifact on the stage, or null when the stage is empty. */
  artifact: StageArtifact | null;
  /** Put an artifact on the stage, replacing whatever was there. */
  showArtifact: (input: StageArtifactInput) => void;
  /** Clear the stage. Nothing is retained to restore. */
  dismissArtifact: () => void;
}

const Ctx = createContext<StageStore | null>(null);

/**
 * Stamps the store's monotonic instance counter onto a caller's input. The
 * switch is exhaustive so feature 14's kinds cannot be added without passing
 * through here, and it keeps the discriminated union intact — a spread over the
 * union would widen `payload` and lose the correlation with `kind`.
 */
function withKey(input: StageArtifactInput, key: number): StageArtifact {
  switch (input.kind) {
    case "scorecard":
      return { kind: input.kind, key, payload: input.payload };
    case "compare":
      return { kind: input.kind, key, payload: input.payload };
    case "checklist":
      return { kind: input.kind, key, payload: input.payload };
    case "matches":
      return { kind: input.kind, key, payload: input.payload };
    case "research":
      return { kind: input.kind, key, payload: input.payload };
    case "profile":
      return { kind: input.kind, key, payload: input.payload };
    case "profileUpdate":
      return { kind: input.kind, key, payload: input.payload };
  }
}

/** Holds the one stage artifact for the page body it wraps. */
export function StageStoreProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<StageArtifact | null>(null);
  // Monotonic, never rendered: it re-runs the reveal when the member asks the
  // same question twice.
  const nextKey = useRef(0);

  const showArtifact = useCallback((input: StageArtifactInput) => {
    nextKey.current += 1;
    setArtifact(withKey(input, nextKey.current));
  }, []);

  const dismissArtifact = useCallback(() => setArtifact(null), []);

  const value = useMemo(
    () => ({ artifact, showArtifact, dismissArtifact }),
    [artifact, showArtifact, dismissArtifact],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Reads and drives the stage. Throws outside `StageStoreProvider`. */
export function useStageStore(): StageStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStageStore must be used within StageStoreProvider");
  return ctx;
}
