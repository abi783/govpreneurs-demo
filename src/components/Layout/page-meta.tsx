import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PageMeta = {
  kicker?: string;
  title?: string;
  subtitle?: string;
  /** "wide" lets the page render full-bleed inside the main column (no container max / padding). */
  layout?: "default" | "wide";
};

type Ctx = {
  meta: PageMeta;
  setMeta: (m: PageMeta) => void;
};

const PageMetaContext = createContext<Ctx | null>(null);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>({});
  return (
    <PageMetaContext.Provider value={{ meta, setMeta }}>{children}</PageMetaContext.Provider>
  );
}

export function usePageMetaValue() {
  const ctx = useContext(PageMetaContext);
  return ctx?.meta ?? {};
}

export function usePageMeta(meta: PageMeta) {
  const ctx = useContext(PageMetaContext);
  const previous = useRef<PageMeta | null>(null);

  useEffect(() => {
    if (!ctx) return;

    const unchanged =
      previous.current?.kicker === meta.kicker &&
      previous.current?.title === meta.title &&
      previous.current?.subtitle === meta.subtitle &&
      previous.current?.layout === meta.layout;

    if (!unchanged) {
      ctx.setMeta(meta);
      previous.current = meta;
    }

    return () => {
      if (previous.current) {
        ctx.setMeta({});
        previous.current = null;
      }
    };
  }, [meta.kicker, meta.title, meta.subtitle, meta.layout]);
}
