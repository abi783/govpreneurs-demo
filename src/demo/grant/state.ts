// DEMO: what the visitor tells Grant, kept in the demo store so it survives a
// reload and goes away with "Reset demo".
//
//   grant.answers  the answers to Grant's open questions, by opportunity
//   grant.rail     the rail conversation, by opportunity
//   grant.skips    open questions the visitor skipped, by opportunity
//   grant.dfy      "Have us do it" requests from a No-Bid roadmap

import { readDemoState, updateDemoState } from "@/demo/runtime/store";

export interface RailMessage {
  role: "user" | "grant";
  text: string;
  at: string;
}

type AnswerMap = Record<string, Record<string, string>>;
type RailMap = Record<string, RailMessage[]>;
type SkipMap = Record<string, Record<string, number>>;

const ANSWERS = "grant.answers";
const RAIL = "grant.rail";
const SKIPS = "grant.skips";
const DFY = "grant.dfy";

export const getAnswers = (oppKey: string): Record<string, string> =>
  readDemoState<AnswerMap>(ANSWERS, {})[oppKey] ?? {};

export function setAnswer(oppKey: string, questionId: string, value: string): void {
  updateDemoState<AnswerMap>(ANSWERS, {}, (prev) => ({
    ...prev,
    [oppKey]: { ...(prev[oppKey] ?? {}), [questionId]: value },
  }));
}

export const getRail = (oppKey: string): RailMessage[] => readDemoState<RailMap>(RAIL, {})[oppKey] ?? [];

export function addRailMessages(oppKey: string, messages: RailMessage[]): void {
  updateDemoState<RailMap>(RAIL, {}, (prev) => ({ ...prev, [oppKey]: [...(prev[oppKey] ?? []), ...messages] }));
}

export const getSkips = (oppKey: string): Record<string, number> =>
  readDemoState<SkipMap>(SKIPS, {})[oppKey] ?? {};

export function addSkip(oppKey: string, questionId: string): void {
  updateDemoState<SkipMap>(SKIPS, {}, (prev) => {
    const mine = prev[oppKey] ?? {};
    return { ...prev, [oppKey]: { ...mine, [questionId]: (mine[questionId] ?? 0) + 1 } };
  });
}

/** Start over: forget the conversation, the skips and the answers for one opportunity. */
export function resetRail(oppKey: string): void {
  updateDemoState<RailMap>(RAIL, {}, (prev) => {
    const { [oppKey]: _gone, ...rest } = prev;
    void _gone;
    return rest;
  });
  updateDemoState<SkipMap>(SKIPS, {}, (prev) => {
    const { [oppKey]: _gone, ...rest } = prev;
    void _gone;
    return rest;
  });
}

export const getDfyRequests = (): string[] => readDemoState<string[]>(DFY, []);

export function addDfyRequest(key: string): void {
  updateDemoState<string[]>(DFY, [], (prev) => (prev.includes(key) ? prev : [...prev, key]));
}
