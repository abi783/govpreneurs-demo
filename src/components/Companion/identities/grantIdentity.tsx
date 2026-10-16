import { AgentAvatar } from "../AgentAvatar";
import type { AgentIdentity, CompanionApi, CompanionSuggestion } from "../types";
import type { Opportunity } from "../../../lib/mock/opportunities";
import { getGrantVerdict } from "../../../lib/mock/grantAnalysis";

function delayedAgent(api: CompanionApi, text: string, ms = 700) {
  api.setTyping(true);
  setTimeout(() => {
    api.setTyping(false);
    api.appendAgentMessage(text);
  }, ms);
}

export function buildGrantIdentity(opp: Opportunity): AgentIdentity {
  const verdict = getGrantVerdict(opp);
  const suggestions: CompanionSuggestion[] = verdict.suggestions.map((s) => ({
    id: s.id,
    label: s.label,
    onSelect: (api) => delayedAgent(api, s.response),
  }));

  return {
    id: "grant",
    name: "Grant",
    role: "your bid analyst",
    accentVar: "--blue-7",
    avatar: <AgentAvatar agent="grant" size={32} />,
    seedMessage: verdict.seedMessage,
    placeholder: "Ask Grant about this opportunity…",
    footerNote:
      "Grant analyzes this one opportunity. For the big-picture search, head back to Hunter.",
    suggestions,
    onFreeMessage: (_text, api) =>
      delayedAgent(
        api,
        "Good question. My short answer is in the verdict above — happy to expand any part of the fit matrix. Try one of the suggested questions, or ask about bonding, competition, or the evaluation criteria.",
      ),
  };
}
