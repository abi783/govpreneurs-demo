import { useEffect, useRef } from "react";

/**
 * True when the page is loaded inside the GHL funnel iframe (?embed=1). Read
 * once per module load via plain URLSearchParams — no router dependency, so
 * it also works from the layout route before search-param validation runs.
 */
export function isEmbedMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

/**
 * Posts the two messages the funnel parent page already listens for:
 *  - `dc:height` whenever the document body's rendered height changes (so the
 *    parent can resize the iframe — no scrollbars-in-a-scrollbar).
 *  - `dc:state` whenever the caller's `state` argument changes between
 *    'input' and 'result' (drives parent-side chrome, e.g. showing a "start
 *    over" link once a result is on screen).
 * No-op outside embed mode.
 */
export function useEmbedBridge(state: "input" | "result"): void {
  const lastHeight = useRef<number>(0);

  useEffect(() => {
    if (!isEmbedMode() || typeof window === "undefined") return;

    const postHeight = () => {
      const height = document.body.scrollHeight;
      if (height !== lastHeight.current) {
        lastHeight.current = height;
        window.parent.postMessage({ type: "dc:height", height }, "*");
      }
    };

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isEmbedMode() || typeof window === "undefined") return;
    window.parent.postMessage({ type: "dc:state", state }, "*");
  }, [state]);
}
