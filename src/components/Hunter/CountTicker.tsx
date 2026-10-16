import { useEffect, useRef, useState } from "react";

/** How long a roll from the previous value to the next one takes, in ms. */
const DEFAULT_DURATION_MS = 500;

/** Rolls the displayed integer from the previous value to the next one over
 *  {@link DEFAULT_DURATION_MS}, in tabular mono digits. The first paint shows
 *  the value as given — only a CHANGE animates. A `prefers-reduced-motion`
 *  match swaps to the final value and creates no animation frame at all.
 *
 *  Every frame is formatted with `toLocaleString()`, so digit grouping holds
 *  throughout the roll and not only at rest. */
export function CountTicker({
  value,
  duration = DEFAULT_DURATION_MS,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || fromRef.current === value) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — fast off the mark, settles gently on the real figure.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={`count-ticker of-num${className ? ` ${className}` : ""}`} aria-live="off">
      {display.toLocaleString()}
    </span>
  );
}
