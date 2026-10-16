import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Named imports, not a default one. `frontend-v2/tsconfig.json` sets neither
// `esModuleInterop` nor `allowSyntheticDefaultImports`, and `node:path` is an
// `export =` module — `import path from "node:path"` does not compile here.
import { dirname, join, resolve } from "node:path";

/**
 * Small orders — reading the SOURCE TREE from a vitest spec.
 *
 * WHY IT EXISTS. Two gates in this work read files rather than call functions:
 * the corpus-clock sweep (no `new Date()` outside `wallClock.ts`) and the
 * stylesheet sweep (no `.mp-*` rule with no element behind it). Each needs to
 * walk a directory and each needs the SAME exclusion rule, and a sweep that
 * walks the tree its own way is a sweep that can pass for the wrong reason —
 * a scan that reads its own spec file finds the very literal it forbids and
 * reports a violation nobody wrote, and a scan that skips too much reports a
 * clean tree it never looked at. The rule is written here once.
 *
 * `.testkit.ts` is not collected by vitest (`**\/*.{test,spec}.*`) and is
 * imported by no application module, so it never reaches a bundle. The
 * `import.meta.url` root resolution follows
 * `src/components/Hunter/HunterChatOverlay.tierlabels.test.ts`, the in-repo
 * precedent for a spec that reads source text.
 *
 * These helpers are synchronous. The trees involved are a few hundred files and
 * a spec that awaits nothing is a spec with no ordering to get wrong.
 */

/** `frontend-v2/src`, resolved from this file rather than from `cwd`. Vitest
 *  runs from the workspace root today; a spec that assumed so would break the
 *  first time someone runs one file from elsewhere. */
export const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** One file the sweep looked at. `relativePath` is POSIX-separated and is what
 *  a failure message should name — an absolute path is machine-specific. */
export interface SourceFile {
  relativePath: string;
  text: string;
}

/** How a sweep narrows the tree. Every field has a rule behind it. */
export interface ScanOptions {
  /** File extensions to read, with the dot. Default: `.ts` and `.tsx`. */
  extensions?: string[];
  /**
   * Include the suite's own files. Default `false`.
   *
   * A sweep that forbids a literal must not read the spec that names the
   * literal in order to forbid it. Set this to `true` only when the sweep is
   * ABOUT the tests.
   */
  includeTests?: boolean;
  /** A further filter on the POSIX relative path, applied after the two above. */
  match?: (relativePath: string) => boolean;
}

/** Directories that are never source. `dist` and `node_modules` are build
 *  output; walking them is slow and every hit in them is a false positive. */
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", ".vite"]);

/** A spec, a Playwright spec, or a helper for one. Excluded by default. */
function isTestFile(relativePath: string): boolean {
  return /\.(test|spec)\.[cm]?[jt]sx?$|\.testkit\.[cm]?[jt]s$/.test(relativePath);
}

/** Every file under `directory`, depth first, as POSIX relative paths. */
function walk(directory: string, relativeBase: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (SKIPPED_DIRECTORIES.has(entry)) continue;
    const absolute = join(directory, entry);
    const relative = relativeBase ? `${relativeBase}/${entry}` : entry;
    if (statSync(absolute).isDirectory()) {
      found.push(...walk(absolute, relative));
    } else {
      found.push(relative);
    }
  }
  return found;
}

/**
 * Every source file under a directory of `frontend-v2/src`.
 *
 * @param relativeDirectory a path under `src`, e.g. `lib/microPurchases`
 * @param options how to narrow the tree; see `ScanOptions`
 * @returns the matching files, each with its text, sorted by path
 */
export function readSourceFiles(
  relativeDirectory: string,
  options: ScanOptions = {},
): SourceFile[] {
  const extensions = options.extensions ?? [".ts", ".tsx"];
  const root = join(SOURCE_ROOT, relativeDirectory);
  return walk(root, "")
    .filter((relative) => extensions.some((ext) => relative.endsWith(ext)))
    .filter((relative) => options.includeTests === true || !isTestFile(relative))
    .map((relative) => (relativeDirectory ? `${relativeDirectory}/${relative}` : relative))
    .filter((relative) => options.match?.(relative) ?? true)
    .sort()
    .map((relativePath) => ({
      relativePath,
      text: readFileSync(join(SOURCE_ROOT, relativePath), "utf8"),
    }));
}

/**
 * One file of `frontend-v2/src`, by its path under `src`.
 *
 * Throws if the file is absent, and that is deliberate: a gate whose subject
 * has been renamed must fail loudly rather than sweep an empty string and
 * report a clean pass.
 *
 * @param relativePath a path under `src`, e.g. `styles/small-orders.css`
 * @returns the file's text
 */
export function readSourceFile(relativePath: string): string {
  return readFileSync(join(SOURCE_ROOT, relativePath), "utf8");
}
