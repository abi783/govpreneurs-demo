// The compact inline reference — what a tool result leaves in the chat thread.
//
// One line, and nothing beyond what names the artifact. The full card lives on
// the stage above the feed and is NEVER duplicated here (ARCHITECTURE.md §3(d)):
// a conversation whose every turn carries a table is not readable, and two
// copies of one answer is two things a member has to reconcile.
//
// The whole row is a button, so an artifact dismissed by accident is one click
// back. It calls the caller's handler with the same input the turn produced —
// the mini card holds no store of its own.

import {
  Building2,
  ClipboardCheck,
  Columns3,
  Globe,
  ListChecks,
  PencilLine,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StageArtifactInput, StageArtifactKind } from "../../../lib/hunter/stageArtifact";
import { artifactLabel } from "../../../lib/hunter/artifactTitle";

/** One icon per kind, so the thread is scannable without reading every line. */
const ICON: Record<StageArtifactKind, LucideIcon> = {
  scorecard: ClipboardCheck,
  compare: Columns3,
  checklist: ListChecks,
  matches: Sparkles,
  research: Globe,
  profile: Building2,
  profileUpdate: PencilLine,
};

/** Where the full answer is. Fixed copy — it names a place, not a finding. */
const HINT = "On the stage ↑";

/** Renders the one-line chat reference to an artifact, re-showing it on click. */
export function StageMiniCard({
  artifact,
  onShow,
}: {
  artifact: StageArtifactInput;
  /** Puts the artifact back on the stage. The thread owns no stage state. */
  onShow: (input: StageArtifactInput) => void;
}) {
  const Icon = ICON[artifact.kind];
  const label = artifactLabel(artifact);
  return (
    <button type="button" className="stage-mini" onClick={() => onShow(artifact)}>
      <span className="stage-mini__icon" aria-hidden="true">
        <Icon size={13} />
      </span>
      <span className="stage-mini__label">{label}</span>
      <span className="stage-mini__hint">{HINT}</span>
    </button>
  );
}
