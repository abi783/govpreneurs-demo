// DEMO: stand-in for `next/image`. Aliased in vite.config.ts and tsconfig.json.
// It renders a plain <img>. `fill`, `priority`, `quality`, `placeholder` and
// `loader` are accepted. Only `fill`, `priority`, `width` and `height` change the output.

import { forwardRef, type CSSProperties, type ImgHTMLAttributes } from "react";

export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height" | "placeholder" | "loading"> {
  src: string | StaticImageData;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  quality?: number | `${number}`;
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
  loading?: "lazy" | "eager";
  overrideSrc?: string;
  onLoadingComplete?: (img: HTMLImageElement) => void;
}

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt, width, height, fill, priority, quality: _q, placeholder: _p, blurDataURL: _b,
    unoptimized: _u, loader: _l, loading, overrideSrc, onLoadingComplete: _o, style, ...rest },
  ref,
) {
  const url = overrideSrc ?? (typeof src === "string" ? src : src.src);
  const w = width ?? (typeof src === "object" ? src.width : undefined);
  const h = height ?? (typeof src === "object" ? src.height : undefined);
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : undefined;
  return (
    <img
      ref={ref}
      src={url}
      alt={alt}
      width={fill ? undefined : w}
      height={fill ? undefined : h}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding="async"
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
});

export default Image;
