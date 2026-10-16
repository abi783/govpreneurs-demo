// Feature 14(a) — the stage reads LIVE payloads and never a scripted answer.
//
// This scans SOURCE rather than rendering, because what it guards is an absence:
// the prototype ships an authored-answer player (a scenarios module), and an
// artifact that imported it would render perfectly and say something no backend
// ever said. Same shape as `HunterChatOverlay.tierlabels.test.ts` next door.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = fileURLToPath(new URL(".", import.meta.url));

const SOURCES = readdirSync(DIR)
  .filter((f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.includes(".test."))
  .map((file) => ({ file, text: readFileSync(`${DIR}${file}`, "utf8") }));

describe("the stage modules", () => {
  it("are a non-trivial set — a scan over nothing proves nothing", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(8);
  });

  it("import the prototype's authored-answer player nowhere", () => {
    for (const { file, text } of SOURCES) {
      expect({ file, scripted: text.includes("hunter/scenarios") }).toEqual({
        file,
        scripted: false,
      });
    }
  });

  it("import no mock module at all", () => {
    for (const { file, text } of SOURCES) {
      expect({ file, mock: /from "[^"]*\/mock\//.test(text) }).toEqual({ file, mock: false });
    }
  });

  it("take every artifact body through the live payload types", () => {
    const bodies = SOURCES.filter((s) => s.file.endsWith("Artifact.tsx"));
    expect(bodies.length).toBe(7);
    for (const { file, text } of bodies) {
      expect({ file, live: text.includes('from "../../../lib/hunterChat"') }).toEqual({
        file,
        live: true,
      });
    }
  });
});
