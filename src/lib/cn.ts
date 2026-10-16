import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge clsx + tailwind-merge so consumer classes win over variant defaults. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
