// The one control a Get ready step carries. Every kind goes somewhere real (D-D2):
// a page in the app, an outside site, or Grant's rail.

import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { StepAction as Action } from "../../lib/forecasts/grant";
import { crossPageClick } from "../../lib/ghlNav";

export interface RailFocus {
  question?: string;
  draft?: string;
}

export function StepAction({
  action,
  className,
  onRail,
}: {
  action: Action;
  className: string;
  onRail: (focus: RailFocus) => void;
}) {
  switch (action.kind) {
    case "partners": {
      // Partners is its own GHL page: when embedded, the parent opens it.
      const query = new URLSearchParams(action.search).toString();
      return (
        <Link
          to="/partners"
          search={action.search as never}
          className={className}
          onClick={crossPageClick(query ? `/partners?${query}` : "/partners")}
        >
          {action.label} <ArrowRight size={14} aria-hidden />
        </Link>
      );
    }
    case "profile":
      return (
        <Link to="/business-profile" search={{ tab: "positioning" }} className={className}>
          {action.label} <ArrowRight size={14} aria-hidden />
        </Link>
      );
    case "external":
      return (
        <a className={className} href={action.href} target="_blank" rel="noreferrer">
          {action.label} <ExternalLink size={13} aria-hidden />
        </a>
      );
    case "rail":
      return (
        <button
          type="button"
          className={className}
          onClick={() => onRail({ question: action.question, draft: action.draft })}
        >
          {action.label} <ArrowRight size={14} aria-hidden />
        </button>
      );
  }
}
