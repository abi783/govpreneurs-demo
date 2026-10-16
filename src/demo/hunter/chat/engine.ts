// DEMO (Hunter chat): the scripted engine behind `POST /hunter-chat/message`.
//
// Every turn does four things: read the message, find the first rule that
// fits, add the follow-up buttons, and shape the answer as a `HunterTurnResponse`.
// The member sees the same answer for the same question, with real numbers from
// the story. No rule makes up a fact: each one reads `persona.ts`,
// `opportunities.ts` and `places.ts`.

import type { HunterTurnResponse } from "../../../lib/hunterChat";
import { forYouRows } from "../data";
import { getFeedContext } from "../feedContext";
import { FORECAST_RULES } from "./forecasts";
import { RULES, unknown } from "./intents";
import { normalize, visibleRows } from "./resolve";
import { readSession, resetSession, updateSession } from "./session";
import type { ChatCtx, MessageBody, Turn } from "./types";

const SESSION_ID = "demo-hunter-session";

/** The engine's answer to one message, before it is shaped for the wire. */
export function answer(body: MessageBody): Turn {
  const text = String(body.message ?? "").trim();
  const feed = getFeedContext();
  const tab = body.tab ?? feed.tab ?? "for_you";
  const visible = visibleRows(body.visibleOpps);
  const ctx: ChatCtx = {
    text,
    norm: normalize(text),
    tab,
    visible: visible.length > 0 ? visible : tab === "for_you" && body.surface !== "forecasts" ? forYouRows() : [],
    feed,
    surface: body.surface === "forecasts" ? "forecasts" : "feed",
    raw: body.visibleOpps ?? [],
  };
  if (!ctx.norm) {
    return {
      reply: "Ask me about your matches. For example: what's out there for me right now?",
      chips: ["What's out there for me right now?", "What's new this week?", "How do you pick my matches?"],
    };
  }
  for (const rule of ctx.surface === "forecasts" ? FORECAST_RULES : RULES) {
    const turn = rule.run(ctx);
    if (turn) return turn;
  }
  return unknown.run(ctx) as Turn;
}

/** The handler for `POST /hunter-chat/message`. */
export function handleHunterMessage(body: MessageBody): HunterTurnResponse & { suggestions?: string[] } {
  const turn = answer(body);
  const n = readSession().turns + 1;
  updateSession((s) => ({ ...s, turns: n }));
  return {
    chatReply: turn.reply,
    uiPayload: { kind: turn.kind ?? "none", data: turn.data ?? {} },
    sessionId: SESSION_ID,
    turnId: `turn-${n}`,
    ...(turn.actPayload ? { actPayload: turn.actPayload } : {}),
    ...(turn.chips && turn.chips.length > 0 ? { suggestions: turn.chips } : {}),
  };
}

/** `POST /hunter-chat/reset`: forget the thread. Saved proposals and changes stay out of the reset. */
export function resetChat(): void {
  resetSession();
}
