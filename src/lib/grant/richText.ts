import type { RichLine } from "./types";

/** Flatten a RichLine to plain text. Used to carry a claim into the source sheet,
 *  where it is restated as prose rather than re-rendered as markup.
 *
 *  Lives here rather than in a component file so component modules keep working
 *  fast-refresh (a non-component export disables it for the whole file). */
export const lineText = (line: RichLine) => line.map((s) => s.text).join("");

/** The aria-label of a row that opens an answered question so the member can change it. */
export const changeAnswerLabel = (question: RichLine, value: string) =>
  `Change your answer to ${lineText(question)}. Current answer: ${value}`;

/** "You told me on “<title>”, <date>." — where an answer reused from another opportunity came from. */
export const reusedNote = (from: { title: string | null; date: string }): string =>
  `You told me on ${from.title ? `“${from.title}”` : "another opportunity"}, ${from.date}.`;
