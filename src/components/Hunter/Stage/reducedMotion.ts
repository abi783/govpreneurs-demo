// One reading of the member's motion preference, shared by the stage shell and
// by every stage artifact. Feature 14's four artifacts read it too, which is why
// it is a module rather than an inline `matchMedia` call in each file.

/** True when the member asked their system for reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
