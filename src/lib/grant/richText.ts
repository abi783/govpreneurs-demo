import type { RichLine } from "./types";

/** Flatten a RichLine to plain text. Used to carry a claim into the source sheet,
 *  where it is restated as prose rather than re-rendered as markup.
 *
 *  Lives here rather than in a component file so component modules keep working
 *  fast-refresh (a non-component export disables it for the whole file). */
export const lineText = (line: RichLine) => line.map((s) => s.text).join("");
