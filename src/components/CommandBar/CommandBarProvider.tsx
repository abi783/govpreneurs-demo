import { createContext, useContext, useMemo, type ReactNode } from "react";
// Ctrl+K command bar disabled per request — the global shortcut and the modal
// are commented out below. Re-enable by restoring these imports + the blocks.
// import { useCallback, useEffect, useState } from "react";
// import { useLocation } from "@tanstack/react-router";
// import { CommandBar } from "./CommandBar";

interface Ctx {
  open: () => void;
  close: () => void;
}

const CommandBarContext = createContext<Ctx | null>(null);

export function useCommandBar(): Ctx {
  const ctx = useContext(CommandBarContext);
  if (!ctx) throw new Error("useCommandBar must be used within CommandBarProvider");
  return ctx;
}

export function CommandBarProvider({ children }: { children: ReactNode }) {
  // Command bar (Ctrl+K modal) is disabled. open/close are kept as no-ops so
  // existing consumers don't crash; restore the commented blocks to re-enable.
  const api = useMemo<Ctx>(() => ({ open: () => {}, close: () => {} }), []);

  // --- disabled: global Ctrl/Cmd+K shortcut ---
  // const [open, setOpen] = useState(false);
  // const location = useLocation();
  //
  // useEffect(() => {
  //   function onKey(e: KeyboardEvent) {
  //     const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
  //     if (isCmdK) {
  //       e.preventDefault();
  //       setOpen((v) => !v);
  //     }
  //   }
  //   window.addEventListener("keydown", onKey);
  //   return () => window.removeEventListener("keydown", onKey);
  // }, []);
  //
  // const onDetailPage = location.pathname.startsWith("/opportunities/") && location.pathname !== "/opportunities/";
  // const currentNoticeId = useMemo(() => {
  //   if (!onDetailPage) return null;
  //   const parts = location.pathname.split("/").filter(Boolean);
  //   return parts[1] ?? null;
  // }, [location.pathname, onDetailPage]);
  //
  // const close = useCallback(() => setOpen(false), []);

  return (
    <CommandBarContext.Provider value={api}>
      {children}
      {/* --- disabled: Ctrl+K command-bar modal ---
      <CommandBar
        open={open}
        onClose={close}
        onDetailPage={onDetailPage}
        currentNoticeId={currentNoticeId}
      />
      */}
    </CommandBarContext.Provider>
  );
}
