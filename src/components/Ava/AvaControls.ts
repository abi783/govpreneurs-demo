// The prototype controls (AvaChrome.tsx DemoBar) are hidden. Shift+Alt+A shows
// them and hides them again, so Tim can jump a bid to another state if he wants.
// The choice is kept in the demo store, so it survives a reload; "Reset demo"
// hides the bar again.

import { useEffect } from "react";
import { useDemoState } from "../../demo/runtime/store";

const KEY = "ava.controls";

/** True when the controls are showing. Installs the keyboard shortcut. */
export function useAvaControls(): boolean {
  const [shown, setShown] = useDemoState<boolean>(KEY, false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // `code`, not `key`: on a Mac, Option+Shift+A types a different letter.
      if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyA") {
        e.preventDefault();
        setShown((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShown]);
  return shown;
}
