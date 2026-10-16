// DEMO: the wrapper for every lifted Success Center page.
//
//   <ScPage>                      a Design System page (scope class `gpds`)
//   <ScPage legacy>               a legacy page: Home, Mentors (adds `sc-legacy`)
//   <ScPage scope="gpds-rm3">     another scope class (or an array of them)
//
// While it is mounted it sets the root font size to 16px, because the Success
// Center was built for 16px and frontend-v2 uses 14px. It puts the old value back
// when it unmounts. It also asks the app shell for a full-width page.
//
// `remountOnRefresh` mounts the children again each time `router.refresh()` runs
// (the Next.js shim calls `demoRefresh()`). Use it for a page that loads its data
// in a mount effect and has no other way to load it again.

import { Fragment, useLayoutEffect, type CSSProperties, type ReactNode } from "react";
import { usePageMeta } from "../../components/Layout/page-meta";
import { useDemoRefresh } from "../runtime/refresh";

export interface ScPageProps {
  children: ReactNode;
  /** Adds `sc-legacy`: the legacy portal tokens (--bg-base, --text-muted, --gold, ...). */
  legacy?: boolean;
  /** Scope class or classes. Default `gpds`. Pass `[]` for none. */
  scope?: string | string[];
  /** Full-width page, with no container limit (default true). */
  wide?: boolean;
  remountOnRefresh?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ScPage({
  children,
  legacy = false,
  scope = "gpds",
  wide = true,
  remountOnRefresh = false,
  className,
  style,
}: ScPageProps) {
  usePageMeta({ layout: wide ? "wide" : "default" });
  const refreshTick = useDemoRefresh();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRoot = root.style.fontSize;
    const previousBody = body.style.fontSize;
    root.style.fontSize = "16px";
    body.style.fontSize = "16px";
    return () => {
      root.style.fontSize = previousRoot;
      body.style.fontSize = previousBody;
    };
  }, []);

  const scopes = Array.isArray(scope) ? scope : [scope];
  const classes = [...scopes, legacy ? "sc-legacy" : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      data-sc-page
      style={{ flex: "1 1 auto", minWidth: 0, fontSize: 16, ...style }}
    >
      {remountOnRefresh ? <Fragment key={refreshTick}>{children}</Fragment> : children}
    </div>
  );
}
