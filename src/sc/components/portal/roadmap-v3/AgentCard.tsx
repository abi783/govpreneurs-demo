"use client";

// One AI agent's card on a roadmap v3 sub-step.
//
// Extracted verbatim from the Hunter card that used to be inlined in
// RoadmapV3Client and hardcoded to the `pursuit` card type — the markup and
// classes are unchanged, so steps already showing Hunter look identical. What
// is new: any of the three agents can appear on any sub-step, and a card can
// carry a button.

import type { V3AgentCard } from "@sc/lib/roadmapV3/agents";
import { AgentAvatar } from "./Avatar";

export function AgentCard({ card }: { card: V3AgentCard }) {
  return (
    <div className="rm2-panel rm2-panel--ai ai-surface">
      <div className="rm2-panel-row">
        <AgentAvatar agent={card.key} name={card.name} size={32} />
        <div>
          <div className="rm2-panel-title rm2-panel-title--ai">
            {card.name}
            <span className="rm2-panel-isai">AI</span>
          </div>
          <div className="rm2-panel-desc rm2-panel-desc--ai">{card.tagline}</div>
        </div>
      </div>
      <p className="rm2-panel-say">{card.body}</p>
      {/* No URL, no button: a call to action that lands nowhere is worse than
          none, the same rule the DFY panel follows. */}
      {card.ctaUrl && (
        <a
          className="rm2-agent-cta"
          href={card.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {card.ctaLabel}
          <span aria-hidden="true"> →</span>
        </a>
      )}
    </div>
  );
}
