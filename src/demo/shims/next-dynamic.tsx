// DEMO: stand-in for `next/dynamic`. Aliased in vite.config.ts and tsconfig.json.
// It wraps `React.lazy`. `ssr` is ignored. `loading` is the Suspense fallback.

import { Suspense, lazy, type ComponentType, type ReactNode } from "react";

type Loaded<P> = ComponentType<P> | { default: ComponentType<P> };

interface DynamicOptions {
  loading?: ComponentType<unknown> | (() => ReactNode);
  ssr?: boolean;
}

export default function dynamic<P extends object = Record<string, never>>(
  loader: () => Promise<Loaded<P>> | Loaded<P>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return typeof mod === "function" || !("default" in (mod as object))
      ? { default: mod as ComponentType<P> }
      : (mod as { default: ComponentType<P> });
  }) as unknown as ComponentType<Record<string, unknown>>;
  const Fallback = options.loading as ComponentType<unknown> | undefined;
  function Dynamic(props: P) {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : null}>
        <Lazy {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  }
  return Dynamic;
}
