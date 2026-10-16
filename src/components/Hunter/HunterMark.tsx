import type { SVGProps } from "react";

/**
 * Hunter's identity mark — a stylized scope/magnifier in the AI accent color.
 * Used inline anywhere Hunter is "speaking".
 */
export function HunterMark({ size = 14, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="hunter-mark"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <circle cx="7" cy="7" r="4.25" />
      <path d="M7 4.25v5.5M4.25 7h5.5" strokeWidth={1.1} />
      <path d="M10.4 10.4l3 3" />
    </svg>
  );
}
