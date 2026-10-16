// Every box she types in asks for one fact (Shyam, 7 October 2026: "phone and
// email" in one box, and she cannot tell how to type it). A phone box is a
// phone, an email box is an email, so her keyboard fits. Run: bun test src/lib/ava

import { describe, expect, test } from "vitest";
import { AVA_BIDS } from "./fixtures";

const FACT = "name|title|job|role|phone|email|address|date|dates|start|end";
/** "phone and email", "name and title", "start and end dates", "name, phone". */
const TWO_FACTS = new RegExp(
  `\\b(${FACT})\\b[^.]*\\b(and|or)\\b[^.]*\\b(${FACT})\\b|\\b(${FACT})\\s*,\\s*(${FACT})\\b`,
  "i",
);

/** Two questions in one box: "How often you check hot food, and how you record it". */
const TWO_QUESTIONS = /\b(how|what|who|when|where)\b[^?]*\band\s+(how|what|who|when|where)\b/i;

const boxes = Object.entries(AVA_BIDS).flatMap(([id, bid]) =>
  bid.asks.flatMap((a) =>
    a.answer.type === "enter"
      ? a.answer.fields.map((f) => ({ where: `${id} ${a.id}/${f.id}`, f }))
      : [],
  ),
);

describe("the boxes she types in", () => {
  test("each box asks for one fact", () => {
    const two = boxes
      .filter((b) => TWO_FACTS.test(b.f.label) || TWO_QUESTIONS.test(b.f.label))
      .map((b) => `${b.where}: ${b.f.label}`);
    expect(two).toEqual([]);
  });

  test("a phone box is a phone and an email box is an email", () => {
    const wrong = boxes
      .filter(
        (b) =>
          (/\bphone\b/i.test(b.f.label) && b.f.unit !== "phone") ||
          (/\bemail\b/i.test(b.f.label) && b.f.unit !== "email"),
      )
      .map((b) => `${b.where}: ${b.f.label} (${b.f.unit})`);
    expect(wrong).toEqual([]);
  });
});
