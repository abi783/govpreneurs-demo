// DEMO: stand-in for `next/link`. Aliased in vite.config.ts and tsconfig.json.
//
// It renders a real <a href>, so right-click and middle-click still work. A plain
// left click moves with the router (no page load). `prefetch`, `scroll`, `shallow`
// and `passHref` are accepted and ignored. External links are left to the browser.

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { demoNavigate, rewriteScPath } from "../nav/navigate";

type UrlObject = {
  pathname?: string | null;
  query?: Record<string, string | number | boolean | readonly string[] | undefined | null> | string | null;
  hash?: string | null;
  search?: string | null;
};

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  href: string | UrlObject | URL;
  as?: string | UrlObject;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  prefetch?: boolean | null;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}

/** Turn a Next.js `href` (string or URL object) into a string. */
export function formatHref(href: string | UrlObject | URL): string {
  if (typeof href === "string") return href;
  if (href instanceof URL) return `${href.pathname}${href.search}${href.hash}`;
  let search = "";
  if (typeof href.query === "string") search = href.query ? `?${href.query.replace(/^\?/, "")}` : "";
  else if (href.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(href.query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) v.forEach((item) => params.append(k, String(item)));
      else params.append(k, String(v));
    }
    const qs = params.toString();
    search = qs ? `?${qs}` : "";
  } else if (href.search) {
    search = href.search.startsWith("?") ? href.search : `?${href.search}`;
  }
  const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
  return `${href.pathname ?? ""}${search}${hash}`;
}

function isExternal(href: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, as, replace, scroll: _scroll, shallow: _shallow, prefetch: _prefetch, passHref: _passHref,
    legacyBehavior, locale: _locale, onClick, children, target, ...rest },
  ref,
) {
  const raw = formatHref(as ?? href);
  const external = isExternal(raw);
  const resolved = external ? raw : rewriteScPath(raw);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || external) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target && target !== "_self") return;
    if (resolved.startsWith("#")) return;
    e.preventDefault();
    demoNavigate(resolved, { replace });
  };

  if (legacyBehavior) {
    const child = Children.only(children) as ReactElement<{ onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; href?: string }>;
    if (isValidElement(child)) {
      return cloneElement(child, {
        href: resolved,
        onClick: (e: MouseEvent<HTMLAnchorElement>) => {
          child.props.onClick?.(e);
          handleClick(e);
        },
      });
    }
  }

  return (
    <a ref={ref} href={resolved} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
});

export default Link;
