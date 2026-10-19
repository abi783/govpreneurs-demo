// DEMO: stand-in for `next/navigation`. Aliased in vite.config.ts and tsconfig.json.
//
//   useRouter()        push / replace / back / forward / refresh / prefetch
//   usePathname()      the current path
//   useSearchParams()  read-only URLSearchParams
//   useParams()        route params. `locationId` is always the demo location.
//   notFound()         shows the app's 404 page
//   redirect(url)      moves to `url`, replacing the current entry
//
// `router.refresh()` calls `demoRefresh()` (src/demo/runtime/refresh.ts).

import { useMemo } from "react";
import {
  notFound as tanstackNotFound,
  useParams as useTanstackParams,
  useRouter as useTanstackRouter,
  useRouterState,
} from "@tanstack/react-router";
import { demoNavigate } from "../nav/navigate";
import { demoRefresh } from "../runtime/refresh";
import { PERSONA } from "../story/persona";
import { formatHref } from "./next-link";

export class ReadonlyURLSearchParams extends URLSearchParams {
  append(): never {
    throw new Error("Method unavailable on `ReadonlyURLSearchParams`.");
  }
  delete(): never {
    throw new Error("Method unavailable on `ReadonlyURLSearchParams`.");
  }
  set(): never {
    throw new Error("Method unavailable on `ReadonlyURLSearchParams`.");
  }
  sort(): never {
    throw new Error("Method unavailable on `ReadonlyURLSearchParams`.");
  }
}

export interface AppRouterInstance {
  push(href: string, options?: { scroll?: boolean }): void;
  replace(href: string, options?: { scroll?: boolean }): void;
  back(): void;
  forward(): void;
  refresh(): void;
  prefetch(href: string, options?: unknown): void;
}

export function useRouter(): AppRouterInstance {
  const tanstack = useTanstackRouter();
  return useMemo<AppRouterInstance>(
    () => ({
      push: (href) => demoNavigate(formatHref(href)),
      replace: (href) => demoNavigate(formatHref(href), { replace: true }),
      back: () => tanstack.history.back(),
      forward: () => tanstack.history.forward(),
      refresh: () => demoRefresh(),
      prefetch: () => {},
    }),
    [tanstack],
  );
}

export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams(): ReadonlyURLSearchParams {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  return useMemo(() => new ReadonlyURLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  const params = useTanstackParams({ strict: false }) as Record<string, string>;
  return useMemo(
    () => ({ locationId: PERSONA.locationId, ...params }) as unknown as T,
    [params],
  );
}

export function useSelectedLayoutSegment(): string | null {
  const pathname = usePathname();
  return pathname.split("/").filter(Boolean)[0] ?? null;
}

export function useSelectedLayoutSegments(): string[] {
  const pathname = usePathname();
  return pathname.split("/").filter(Boolean);
}

export function notFound(): never {
  throw tanstackNotFound();
}

/** Never returns. It starts the move, then suspends until the new page replaces this one. */
export function redirect(url: string): never {
  demoNavigate(formatHref(url), { replace: true });
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw new Promise<never>(() => {});
}

export const permanentRedirect = redirect;
