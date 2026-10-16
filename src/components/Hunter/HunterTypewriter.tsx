import { useEffect, useRef, useState } from "react";

/** Frame cadence, a comfortable reading pace for short replies, and a HARD
 *  ceiling (~1.3s): a reply is fully written in `totalMs = min(MAX_MS, len /
 *  CPS)`, so it never takes longer than MAX_MS — vast replies just reveal more
 *  per frame. */
const FRAME_MS = 16;
const NATURAL_CPS = 55;
const MAX_MS = 1300;

/**
 * Reveals `text` progressively for a "typing in real time" effect. Purely
 * client-side (the reply already arrived in full) — one interval, cleared on
 * unmount or completion, and only THIS component re-renders per tick, so the
 * overhead is negligible. Honors prefers-reduced-motion by rendering instantly.
 * `onTick` fires after each reveal (used to keep the list scrolled); `onDone`
 * fires once when the full text is shown.
 */
export function HunterTypewriter({
  text,
  onTick,
  onDone,
}: {
  text: string;
  onTick?: () => void;
  onDone?: () => void;
}) {
  const [count, setCount] = useState(0);
  // Latest callbacks via refs so the effect depends only on `text` and the
  // interval never restarts mid-animation when the parent re-renders.
  const onTickRef = useRef(onTick);
  const onDoneRef = useRef(onDone);
  onTickRef.current = onTick;
  onDoneRef.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !text) {
      setCount(text.length);
      onDoneRef.current?.();
      return;
    }
    // Fit the whole reveal inside totalMs (capped at MAX_MS): pick a per-frame
    // step so `frames * FRAME_MS <= totalMs`, speeding up for long replies.
    const totalMs = Math.min(MAX_MS, (text.length / NATURAL_CPS) * 1000);
    const frames = Math.max(1, Math.round(totalMs / FRAME_MS));
    const step = Math.max(1, Math.ceil(text.length / frames));
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(text.length, n + step);
      setCount(n);
      onTickRef.current?.();
      if (n >= text.length) {
        window.clearInterval(id);
        onDoneRef.current?.();
      }
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [text]);

  return <>{text.slice(0, count)}</>;
}
