// Words she types in the talk box pick the answer on screen they mean.

import { describe, expect, test } from "vitest";
import { matchReply } from "./words";

const promise = [
  { label: "Yes, I promise this", kind: "primary" as const },
  { label: "Not yet", kind: "ghost" as const },
];
const access = [
  { label: "They already hold installation access cards" },
  { label: "They apply after award, before the first delivery" },
  { label: "No driver can be cleared before the start", kind: "ghost" as const },
  { label: "I'm not sure", kind: "ghost" as const },
];

describe("matchReply", () => {
  test("yes picks the main answer, however it is said", () => {
    for (const t of ["yes", "Yes I can do that", "sure", "ok", "that is right", "I will"])
      expect(matchReply(t, promise)?.label).toBe("Yes, I promise this");
  });

  test("no and not yet pick the quiet answer", () => {
    for (const t of ["no", "not yet", "nope"])
      expect(matchReply(t, promise)?.label).toBe("Not yet");
  });

  test("an ordinal picks that answer", () => {
    expect(matchReply("the second one please", access)?.label).toMatch(/apply after award/);
    expect(matchReply("first option", access)?.label).toMatch(/already hold/);
  });

  test("the answer's own words pick it", () => {
    expect(matchReply("they already hold access cards", access)?.label).toMatch(/already hold/);
    expect(matchReply("no driver can be cleared", access)?.label).toMatch(
      /No driver can be cleared/,
    );
  });

  test("not sure picks the not-sure answer", () => {
    expect(matchReply("I am not sure", access)?.label).toBe("I'm not sure");
  });

  test("words that mean nothing here pick nothing", () => {
    expect(matchReply("what is the weather", promise)).toBeNull();
    expect(matchReply("", promise)).toBeNull();
    expect(matchReply("yes", [])).toBeNull();
  });
});
