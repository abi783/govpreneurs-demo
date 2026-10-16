#!/usr/bin/env node
// Tripwire, not a parser.
//
// The Partners/Awards surfaces are read by first-time federal bidders at about a
// sixth-grade level. Procurement jargon in a member-facing string is a regression,
// and it creeps back in one innocuous-looking sentence at a time — so this fails the
// build instead of relying on a reviewer noticing.
//
// Scope is deliberately narrow: quoted string literals only. Identifiers, types and
// comments legitimately use the real domain words (the API field IS called
// `setAside`), and banning them there would just teach people to disable the check.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FILES = [
  "src/lib/partnersApi.ts",
  "src/lib/awardsApi.ts",
  "../backend/src/partners/partners.ranking.ts",
];

const BANNED = [
  "set-aside",
  "SDVOSB",
  "IDIQ",
  "capture plan",
  "past performance",
  "socio-economic",
  "flow-down",
  "solicitation",
  "NAICS",
];

/** Quoted strings: single, double, and backtick. Good enough for a tripwire. */
const STRINGS = /"([^"\\\n]|\\.)*"|'([^'\\\n]|\\.)*'|`([^`\\]|\\.)*`/g;

/** Lines that are structurally not member-facing copy. */
function isCodeLine(line) {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("/*") ||
    // import/export specifiers: the quoted part is a module path.
    /^(import|export)\b/.test(t) ||
    // A quoted key in a type/interface member, e.g. `"set-aside": string;`
    /:\s*(string|number|boolean|null)\b/.test(t)
  );
}

let violations = 0;

for (const rel of FILES) {
  const path = resolve(root, rel);
  let src;
  try {
    src = readFileSync(path, "utf8");
  } catch {
    console.error(`! skipped (not found): ${rel}`);
    continue;
  }

  let inBlockComment = false;
  src.split("\n").forEach((line, i) => {
    // Track /* … */ so a multi-line doc comment never trips the check.
    const wasInBlock = inBlockComment;
    if (inBlockComment && line.includes("*/")) inBlockComment = false;
    else if (!inBlockComment && /\/\*/.test(line) && !line.includes("*/")) inBlockComment = true;
    if (wasInBlock || isCodeLine(line)) return;

    // Drop a trailing line comment so `foo("ok"); // NAICS note` does not trip.
    const code = line.replace(/\/\/.*$/, "");

    for (const literal of code.match(STRINGS) ?? []) {
      // `${…}` spans are code, not copy — `naicsCodes` is a field name a member
      // never sees. Blank them out so only the prose around them is checked.
      const prose = literal.replace(/\$\{[^}]*\}/g, " ");
      for (const term of BANNED) {
        if (prose.toLowerCase().includes(term.toLowerCase())) {
          console.error(`${rel}:${i + 1}  banned term "${term}" in member copy: ${literal.trim()}`);
          violations++;
        }
      }
    }
  });
}

if (violations > 0) {
  console.error(
    `\n✗ ${violations} jargon violation(s). Say it the way a member would say it out loud.`,
  );
  process.exit(1);
}

console.log("✓ partner/award copy is jargon-free");
