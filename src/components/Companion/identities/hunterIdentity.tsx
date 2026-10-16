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
      "Hi Marcus — I'm Hunter, and I find government contracts that match your business. I've already pulled 247 strong matches for you. Want me to walk you through the top one?",
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
            "The top match is a USACE Wilmington / Fort Bragg DPW re-roof of 6 barracks — $480K, SDVOSB set-aside, closes in 18 days. Right in your lane and your past commercial roofs cover the past-performance bar. Want me to open it?",
            {
              actions: [
                { label: "Open this opportunity", variant: "primary", onClick: () => console.log("Open top match") },
                { label: "Show me #2 instead", variant: "ghost", onClick: () => console.log("Show #2") },
              ],
            },
          ),
      },
      {
        id: "sdvosb",
        label: "What's an SDVOSB set-aside?",
        onSelect: (api) =>
          delayedAgent(
            api,
            "SDVOSB stands for Service-Disabled Veteran-Owned Small Business. Federal agencies set aside specific contracts for SDVOSB-certified firms — the competition pool is limited to certified firms only, which dramatically improves win rates. You're SDVOSB-certified, so you qualify for these. About 20% of opportunities I pull for you are SDVOSB set-asides.",
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
            "Switching to stretches mode. Showing 47 opportunities that fit your profile but need a partner, certification, or capacity stretch. Each card explains the gap.",
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
