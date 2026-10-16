import { AgentAvatar } from "../AgentAvatar";
import type { AgentIdentity, CompanionApi, ChatMsgAction } from "../types";

const FALLBACK_REPLIES = [
  "Good question. Open the card and I'll have Grant pull together a full bid/no-bid in about a minute.",
  "Looking at the agency's history — they've awarded similar work to firms your size 4 of the last 6 times. I'd lean toward bidding.",
  "I can re-rank by that. Hold on — refreshing your feed.",
];

function delayedAgent(
  api: CompanionApi,
  text: string,
  opts?: { actions?: ChatMsgAction[]; after?: () => void; ms?: number },
) {
  api.setTyping(true);
  setTimeout(() => {
    api.setTyping(false);
    api.appendAgentMessage(text, { actions: opts?.actions });
    opts?.after?.();
  }, opts?.ms ?? 800);
}

// DEMO: unused prototype. The copy is true for the sample member, Amira Haddad.
export function buildHunterIdentity(handlers: {
  onEnterStretches: () => void;
}): AgentIdentity {
  return {
    id: "hunter",
    name: "Hunter",
    role: "your discovery agent",
    accentVar: "--ai-7",
    avatar: <AgentAvatar agent="hunter" size={32} />,
    seedMessage:
      "Hi Amira — I'm Hunter, and I find government contracts that match your business. I've already pulled 14 matches for you. Want me to walk you through the top one?",
    placeholder: "Ask Hunter anything…",
    footerNote:
      "Hunter scopes fit. For deep bid analysis, open an opportunity to ask Grant.",
    suggestions: [
      {
        id: "top-match",
        label: "Walk me through the top match",
        onSelect: (api) =>
          delayedAgent(
            api,
            "The top match is field meals for Camp Mackall training rotations — about $660K, a woman-owned set-aside, 45 miles from your kitchen. Want me to open it?",
            {
              actions: [
                { label: "Open this opportunity", variant: "primary", onClick: () => console.log("Open top match") },
                { label: "Show me #2 instead", variant: "ghost", onClick: () => console.log("Show #2") },
              ],
            },
          ),
      },
      {
        id: "wosb",
        label: "What's a WOSB set-aside?",
        onSelect: (api) =>
          delayedAgent(
            api,
            "WOSB stands for Women-Owned Small Business. Only woman-owned small businesses can compete for these set-asides, so the field is smaller. You are woman-owned and small, so you qualify.",
          ),
      },
      {
        id: "compare-top-3",
        label: "Compare the top 3",
        onSelect: (api) => delayedAgent(api, "Pulling them up side by side…"),
      },
      {
        id: "prime-vs-partner",
        label: "What's the difference between Prime and Partner?",
        onSelect: (api) =>
          delayedAgent(
            api,
            "Two ways in. Prime means you bid directly — if you win, you hold the contract with the government and they pay you. More reward, more responsibility. Partner means you team up with a company already winning this kind of work — they hold the contract, you do a piece of it, and they pay you. No federal track record needed yet, which is how most first-timers start. Hunter mixes both in your feed and tags every card.",
          ),
      },
      {
        id: "stretches",
        label: "Show me stretch opportunities",
        onSelect: (api) =>
          delayedAgent(
            api,
            "Switching to stretches mode. Showing the opportunities that fit your profile but need a partner, a certification, or more capacity. Each card explains the gap.",
            { after: handlers.onEnterStretches },
          ),
      },
    ],
    onFreeMessage: (_text, api) => {
      const reply = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      delayedAgent(api, reply);
    },
  };
}
