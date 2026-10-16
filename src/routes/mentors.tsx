import { useEffect } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentors")({
  component: MentorsLayout,
});

// The mentors page runs inside a GoHighLevel custom-menu-link IFRAME. Two
// things bite here:
//   1. CSS `dvh` resolves against the TOP-LEVEL browser viewport, not the
//      iframe's own (smaller) viewport, so a `100dvh` shell renders taller
//      than the iframe. `document.documentElement.clientHeight` is scoped to
//      the current document — inside the iframe that's the iframe's real
//      height — so we track it in a CSS var instead.
//   2. GHL sizes the iframe TALLER than the area it actually displays: on a
//      typical viewport the iframe reports ~794px but GHL's own container
//      clips it ~48px sooner, and the page can't scroll. The iframe can't
//      measure this (cross-origin — it can't read the parent's viewport), so
//      we reserve a fixed bottom safe-area (`--mentors-shell-reserve`,
//      applied in styles.css) to keep the pinned composer + Send button
//      above GHL's clip band. Standalone (non-iframe) has no clip, but the
//      small reserve is harmless there.
function useMentorsShellHeightVar() {
  useEffect(() => {
    const root = document.documentElement;
    // DEMO: the shell's main area scrolls (not the window), so measure that area.
    // The 3px is the brand stripe that the page header area keeps.
    const host = document.getElementById("demo-main");
    const updateHeight = () => {
      const h = host ? host.clientHeight - 3 : root.clientHeight;
      root.style.setProperty("--mentors-shell-h", `${h}px`);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    const observer = host && typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateHeight) : null;
    if (host && observer) observer.observe(host);
    return () => {
      window.removeEventListener("resize", updateHeight);
      observer?.disconnect();
      root.style.removeProperty("--mentors-shell-h");
    };
  }, []);
}

function MentorsLayout() {
  useMentorsShellHeightVar();
  return <Outlet />;
}
