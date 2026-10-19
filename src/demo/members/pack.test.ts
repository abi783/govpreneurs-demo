// A pack member (src/demo/member.ts) has every file the agency's pack has, with
// the same exports, so the shared code finds what it reads. The agency is the
// template: copy its folder, then rewrite every file for the new member.

import { describe, expect, it } from "vitest";
import { MEMBERS } from "../member";

const FILES = import.meta.glob("/src/demo/members/*/**/*.{ts,tsx}", { eager: true }) as Record<string, Record<string, unknown>>;

/** member → file in its folder → its export names */
const PACKS = new Map<string, Map<string, string[]>>();
for (const [path, mod] of Object.entries(FILES)) {
  const m = /^\/src\/demo\/members\/([^/]+)\/(.+)$/.exec(path);
  if (!m || /\.test\.tsx?$/.test(path)) continue;
  if (!PACKS.has(m[1]!)) PACKS.set(m[1]!, new Map());
  PACKS.get(m[1]!)!.set(m[2]!, Object.keys(mod).sort());
}
const TEMPLATE = PACKS.get("agency")!;

describe("member packs", () => {
  for (const { id } of MEMBERS.filter((m) => m.id !== "caterer" && m.id !== "agency")) {
    it(`${id} has the agency's files and exports`, () => {
      const pack = PACKS.get(id);
      expect(pack, `src/demo/members/${id}/ is missing`).toBeDefined();
      for (const [file, names] of TEMPLATE) {
        expect(pack!.has(file), `${id} has no ${file}`).toBe(true);
        expect(pack!.get(file), `${id}/${file} exports`).toEqual(names);
      }
    });
  }

  it("every member names its own words", () => {
    for (const { id } of MEMBERS) expect(PACKS.get(id)?.has("words.ts"), `${id} has no words.ts`).toBe(true);
  });
});

describe("ids across members", () => {
  // Any member can open another member's opportunity or past job by its number
  // (member.ts, others), so no number may belong to two members.
  const ids = (pick: (mod: Record<string, unknown>) => { id: string }[] | undefined, file: string) =>
    [...PACKS.keys()].flatMap((m) => (pick(FILES[`/src/demo/members/${m}/${file}`] ?? {}) ?? []).map((x) => `${x.id} (${m})`));
  const dupes = (list: string[]) => {
    const seen = new Map<string, string>();
    return list.filter((entry) => {
      const id = entry.replace(/ \(.*\)$/, "");
      const before = seen.get(id);
      seen.set(id, entry);
      return before !== undefined;
    });
  };

  it("no opportunity number belongs to two members", () => {
    expect(dupes(ids((m) => m.OPPORTUNITIES as { id: string }[], "opportunities.ts"))).toEqual([]);
  });

  it("no past-job id belongs to two members", () => {
    expect(dupes(ids((m) => m.PAST_PERFORMANCE as { id: string }[], "persona.ts"))).toEqual([]);
  });
});
