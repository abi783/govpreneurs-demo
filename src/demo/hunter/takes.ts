// DEMO (Hunter): "Why Hunter thinks this fits" for each card.
// The story holds a line for every For You pick. For any other opportunity the
// line is built from story facts (see `generatedLine`), so no card shows a
// loading bar that never ends.

import { rowById } from "./data";
import { hunterLine } from "./facts";

export interface Take {
  oppKey: string;
  line: string;
}

/** One line for each key that the story knows. A key that it does not know is left out. */
export function takesFor(keys: string[]): Take[] {
  const takes: Take[] = [];
  for (const key of keys.slice(0, 50)) {
    const row = rowById(key);
    if (row) takes.push({ oppKey: key, line: hunterLine(row) });
  }
  return takes;
}
