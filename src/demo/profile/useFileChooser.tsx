// DEMO: a file picker behind a button. Pressing the button shows a short note, then
// opens the computer's file window. Any file is accepted.

import { useEffect, useRef, useState, type ReactNode } from "react";

export function useFileChooser(
  onFiles: (files: File[]) => void | Promise<void>,
  opts: { multiple?: boolean } = {},
): { open: () => void; input: ReactNode; choosing: boolean } {
  const ref = useRef<HTMLInputElement>(null);
  const [choosing, setChoosing] = useState(false);

  // The note goes away when the window closes (the page gets focus back).
  useEffect(() => {
    if (!choosing) return;
    const done = () => window.setTimeout(() => setChoosing(false), 400);
    window.addEventListener("focus", done, { once: true });
    return () => window.removeEventListener("focus", done);
  }, [choosing]);

  const input = (
    <input
      ref={ref}
      type="file"
      hidden
      multiple={opts.multiple}
      aria-label="Choose a file"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        setChoosing(false);
        if (files.length > 0) void onFiles(files);
      }}
    />
  );

  return {
    open: () => {
      setChoosing(true);
      ref.current?.click();
    },
    input,
    choosing,
  };
}
