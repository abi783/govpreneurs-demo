/**
 * relock-preserve-optional.mjs — repair a Windows-regenerated package-lock.json.
 *
 * WHY THIS EXISTS
 * Running `npm install` for this workspace on Windows silently DROPS packages
 * that only the Linux/WASM install path needs — currently `@emnapi/core` and
 * `@emnapi/runtime`, which `@tailwindcss/oxide-wasm32-wasi` declares as
 * dependencies. The lock then contains a dangling reference: a dependency that
 * resolves to nothing. `npm install` tolerates it; **`npm ci` does not**, so the
 * Docker build fails on a lockfile that looks fine on the machine that wrote it.
 *
 * WHAT IT DOES
 * Compares the regenerated lock against a baseline (by default the committed
 * `HEAD` version, which was generated on Linux) and restores any package entry
 * the regeneration lost, in npm's own sorted position so the diff stays minimal.
 * It only ever ADDS back what the baseline had; it never edits or removes.
 *
 * USAGE (from frontend-v2/)
 *   git show HEAD:frontend-v2/package-lock.json > /tmp/lock-baseline.json
 *   npm install --package-lock-only --ignore-scripts
 *   node scripts/relock-preserve-optional.mjs /tmp/lock-baseline.json
 *
 * The real fix is to regenerate the lock on Linux (WSL, or the Docker image
 * itself). This script is for when that is not available — it makes a Windows
 * relock safe to commit rather than leaving a broken lock or no dependency.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , baselinePath, lockPath = "package-lock.json"] = process.argv;
if (!baselinePath) {
  console.error("usage: node scripts/relock-preserve-optional.mjs <baseline-lock> [lock]");
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

const missing = Object.keys(baseline.packages ?? {}).filter(
  (k) => !(k in (lock.packages ?? {})),
);

if (!missing.length) {
  console.log("nothing was lost — lock is already complete");
  process.exit(0);
}

// Rebuild `packages` with the restored entries in sorted position. npm writes
// this map sorted by path, so inserting in order keeps the committed diff to the
// restored blocks alone.
const merged = {};
for (const key of [...Object.keys(lock.packages), ...missing].sort()) {
  merged[key] = key in lock.packages ? lock.packages[key] : baseline.packages[key];
}
// The root entry ("") must stay first — npm and every reader expect it there.
const ordered = { "": merged[""] };
for (const [k, v] of Object.entries(merged)) if (k !== "") ordered[k] = v;
lock.packages = ordered;

writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log(`restored ${missing.length} package(s) the Windows relock dropped:`);
for (const k of missing) console.log("  " + k);

// Report any dependency that still resolves to nothing — the condition that
// breaks `npm ci`, and the reason this script exists.
const present = new Set(Object.keys(lock.packages));
const dangling = [];
for (const [path, meta] of Object.entries(lock.packages)) {
  for (const dep of Object.keys(meta.dependencies ?? {})) {
    const candidates = [`node_modules/${dep}`, `${path}/node_modules/${dep}`];
    if (!candidates.some((c) => present.has(c))) dangling.push(`${path} → ${dep}`);
  }
}
if (dangling.length) {
  console.error("\nSTILL DANGLING (npm ci would fail):");
  for (const d of dangling) console.error("  " + d);
  process.exit(1);
}
console.log("\nno dangling dependencies — npm ci can resolve every entry");
