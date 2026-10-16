import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, ChevronDown, ChevronUp, Sparkles, Upload, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useCurrentMember } from "../../lib/mock/currentMember";
import { useBusinessProfile, profileFacts } from "../../lib/businessProfile";
import { capabilityStatementUrl } from "../../lib/preview";
import { useGhlUser } from "../../lib/ghlUser";
import { useCapStatementUploaded } from "../../lib/capStatementState";
import { useUIFlag } from "@/lib/uiState";
// Stay Ready + cap-statement refresh prompts surface through Tasks; this embed
// keeps its existing gap behavior.

type Mode = "collapsed" | "expanded";

type Gap = {
  id: "capability_statement" | "target_value_range";
  title: string;
  explanation: string;
  primaryLabel: string;
  dfy?: { label: string; modal: "dfy_capstmt" };
  primaryModal: "upload_capstmt" | "tell_value_range";
};

function selectGap(m: ReturnType<typeof useCurrentMember>, dismissCount: number): Gap {
  if (dismissCount >= 3) {
    return {
      id: "target_value_range",
      title: "Target Value Range",
      explanation:
        "I notice you keep dismissing opps for being the wrong size. Tell me your target value range and I'll stop showing wrong-sized ones.",
      primaryLabel: "Tell me now",
      primaryModal: "tell_value_range",
    };
  }
  // Default Marcus gap
  if (!m.capabilityStatementUploaded) {
    return {
      id: "capability_statement",
      title: "Capability statement",
      explanation:
        "Without one, I'm matching on general scope only. Add it and my match quality improves across the board — plus I can pull your past projects from it.",
      primaryLabel: "Tell me now",
      primaryModal: "upload_capstmt",
      dfy: { label: "Want us to build it for you?", modal: "dfy_capstmt" },
    };
  }
  return {
    id: "capability_statement",
    title: "Capability statement",
    explanation: "Add it and my match quality improves.",
    primaryLabel: "Tell me now",
    primaryModal: "upload_capstmt",
  };
}

type ModalKind = null | "upload_capstmt" | "dfy_capstmt" | "tell_value_range";

export function HunterKnowsYouEmbed({
  dismissCount = 0,
  mode: tabMode = "open",
}: {
  dismissCount?: number;
  mode?: "open" | "awarded";
}) {
  const member = useCurrentMember();
  const { profile } = useBusinessProfile();
  const { uploaded: capUploaded } = useCapStatementUploaded();
  const effectiveMember = capUploaded ? { ...member, capabilityStatementUploaded: true } : member;
  const [mode, setMode] = useUIFlag<Mode>("hunter-embed-state", "expanded");
  const [modal, setModal] = useState<ModalKind>(null);
  const proactiveTriggered = useRef(false);
  // For the capability-statement CTA, which links out to the Roadmap.
  const { session } = useGhlUser();

  // Proactive expand once when dismissCount crosses threshold
  useEffect(() => {
    if (dismissCount >= 3 && !proactiveTriggered.current) {
      proactiveTriggered.current = true;
      setMode("expanded");
    }
  }, [dismissCount]);

  const facts = useMemo(() => (profile ? profileFacts(profile) : []), [profile]);
  const gap = useMemo(
    () => selectGap(effectiveMember, dismissCount),
    [effectiveMember, dismissCount],
  );

  return (
    <>
      {mode === "collapsed" ? (
        <button
          type="button"
          className="knows-you-embed knows-you-collapsed"
          onClick={() => setMode("expanded")}
          aria-label="Expand Hunter knows you"
        >
          <Sparkles size={16} className="ky-spark" />
          <span className="ky-label">Hunter knows you</span>
          <Check size={16} className="ky-check" />
          <span className="ky-dot" aria-hidden>
            ·
          </span>
          <span className="ky-help">+1 thing would help</span>
          <ChevronDown size={16} className="ky-chev" />
        </button>
      ) : (
        <section className="knows-you-embed knows-you-expanded">
          <div className="ky-head">
            <span className="ky-head-label">Hunter knows you</span>
            <button
              type="button"
              className="ky-collapse-btn"
              onClick={() => setMode("collapsed")}
              aria-label="Collapse"
            >
              <ChevronUp size={16} />
            </button>
          </div>

          {tabMode === "awarded" && (
            <p className="ky-mode-headline">
              These are companies already winning your kind of work — here's who to approach first.
            </p>
          )}

          {facts.length > 0 ? (
            <ul className="ky-facts">
              {facts.map((f) => (
                <li key={f} className="ky-fact-row">
                  <Check size={14} className="ky-check" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ky-gap-explain">
              Nothing on file yet. Complete your <a href="/business-profile">business profile</a> so
              Hunter can match you to the right opportunities.
            </p>
          )}

          <div className="ky-divider" />

          <div className="ky-gap">
            <div className="ky-gap-eyebrow">+1 thing would help me match better:</div>
            <h3 className="ky-gap-title">{gap.title}</h3>
            <p className="ky-gap-explain">{gap.explanation}</p>
            <div className="ky-gap-actions">
              <button
                type="button"
                className="ky-btn-primary"
                onClick={() => setModal(gap.primaryModal)}
              >
                {gap.primaryLabel}
              </button>
              {gap.dfy && (
                <button
                  type="button"
                  className="ky-btn-secondary"
                  onClick={() => setModal(gap.dfy!.modal)}
                >
                  {gap.dfy.label}
                </button>
              )}
            </div>
          </div>

          <Link to="/business-profile" search={{ tab: "positioning" }} className="ky-profile-link">
            View full profile
            <ArrowUpRight size={12} />
          </Link>
        </section>
      )}

      <Dialog.Root
        open={modal !== null}
        onOpenChange={(o) => {
          if (!o) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="ky-modal-overlay" />
          <Dialog.Content className="ky-modal-content">
            {modal === "upload_capstmt" && (
              <>
                <Dialog.Title className="ky-modal-title">
                  Upload your capability statement
                </Dialog.Title>
                <Dialog.Description className="ky-modal-body">
                  Add it on your Roadmap and Hunter will weight your matches to your real
                  capabilities and past performance.
                </Dialog.Description>
                <div className="ky-modal-actions">
                  {/* Links out rather than uploading here: there is no capability-statement
                      upload endpoint in this app — the Success Center portal owns that field
                      and tells us it changed via the profile-updated webhook. This button was
                      previously a bare <button> with no handler, so it silently did nothing. */}
                  {session?.locationId ? (
                    <a
                      href={capabilityStatementUrl(session.locationId)}
                      className="ky-btn-primary ky-btn-icon"
                      onClick={() => setModal(null)}
                    >
                      <Upload size={14} /> Add it on your Roadmap
                    </a>
                  ) : null}
                  <button type="button" className="ky-btn-secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
            {modal === "dfy_capstmt" && (
              <>
                <Dialog.Title className="ky-modal-title">Want us to build it for you?</Dialog.Title>
                <Dialog.Description className="ky-modal-body">
                  Ava drafts a one-page capability statement from your business profile and
                  knowledge base — never from thin air. You review every section before it's done,
                  then export and save it to your knowledge so Hunter and Grant can cite it.
                </Dialog.Description>
                <div className="ky-modal-actions">
                  <Link
                    to="/cap-statement/builder"
                    className="ky-btn-primary"
                    onClick={() => setModal(null)}
                  >
                    Yes, build it with Ava
                  </Link>
                  <button
                    type="button"
                    className="ky-btn-secondary"
                    onClick={() => setModal("upload_capstmt")}
                  >
                    Upload yours instead
                  </button>
                  <button type="button" className="ky-btn-tertiary" onClick={() => setModal(null)}>
                    Maybe later
                  </button>
                </div>
              </>
            )}
            {modal === "tell_value_range" && (
              <>
                <Dialog.Title className="ky-modal-title">
                  Tell Hunter your target value range
                </Dialog.Title>
                <Dialog.Description className="ky-modal-body">
                  Set the contract size you actually want and Hunter will stop surfacing opps that
                  are too big or too small.
                </Dialog.Description>
                <div className="ky-modal-actions">
                  <button type="button" className="ky-btn-primary">
                    Set range
                  </button>
                  <button type="button" className="ky-btn-secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
            <Dialog.Close asChild>
              <button type="button" className="ky-modal-close" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
