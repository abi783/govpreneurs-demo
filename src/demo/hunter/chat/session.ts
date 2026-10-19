// DEMO (Hunter chat): what the chat remembers between turns.
// It lives in the demo store, so it survives a reload and "Reset demo" clears it.

import { readDemoState, updateDemoState, writeDemoState } from "../../runtime/store";

export interface ProfileProposal {
  label: string;
  /** What the member said, for the card. */
  heard: string;
  /** The text saved if she taps Save. */
  value: string;
}

export interface ChatSession {
  /** The opportunity that the last answer was about, for "it" and "that one". */
  lastOppId?: string;
  turns: number;
  /** Proposals that wait for Save or Cancel, by proposal id. */
  proposals: Record<string, ProfileProposal>;
  /** Changes she saved from chat. My Business can read them. */
  savedChanges: { label: string; value: string }[];
}

const KEY = "hunter.chat";
const init = (): ChatSession => ({ turns: 0, proposals: {}, savedChanges: [] });

export function readSession(): ChatSession {
  return readDemoState<ChatSession>(KEY, init);
}

export function updateSession(fn: (s: ChatSession) => ChatSession): ChatSession {
  return updateDemoState<ChatSession>(KEY, init, fn);
}

/** Forgets the thread. A change that she saved from chat stays. */
export function resetSession(): void {
  const kept = readSession().savedChanges;
  writeDemoState<ChatSession>(KEY, { ...init(), savedChanges: kept });
}
