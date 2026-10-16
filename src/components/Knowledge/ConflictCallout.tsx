import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { resolveConflict, useKnowledgeHub } from "../../lib/knowledgeHub";

export function ConflictCallout() {
  const { conflicts } = useKnowledgeHub();
  const [openId, setOpenId] = useState<string | null>(null);

  if (conflicts.length === 0) return null;
  const active = conflicts.find((c) => c.id === openId) ?? null;

  return (
    <section className="kh-conflicts" aria-label="Needs your eye">
      <header className="kh-conflicts-head">
        <AlertTriangle size={14} className="kh-conflicts-icon" aria-hidden />
        <h3 className="kh-conflicts-title">Needs your eye</h3>
      </header>

      <ul className="kh-conflicts-list">
        {conflicts.map((c) => (
          <li key={c.id} className="kh-conflict-row">
            <div className="kh-conflict-body">
              <span>
                Your capability statement says{" "}
                <strong>{c.docValue} bonding capacity</strong> but your profile
                says <strong>{c.profileValue}</strong> — which is right?
              </span>
              <div className="kh-conflict-source">
                from {c.sourceFileName}
              </div>
            </div>
            <button
              type="button"
              className="kh-btn-secondary"
              onClick={() => setOpenId(c.id)}
            >
              Resolve
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={!!active}
        onOpenChange={(o) => !o && setOpenId(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="kh-dialog-overlay" />
          <Dialog.Content className="kh-dialog">
            {active && (
              <>
                <div className="kh-dialog-head">
                  <Dialog.Title className="kh-dialog-title">
                    Resolve {active.field.toLowerCase()}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="kh-icon-btn"
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="kh-dialog-desc">
                  Pick the value Hunter should use on your profile.
                </Dialog.Description>

                <div className="kh-dialog-choices">
                  <button
                    type="button"
                    className="kh-choice"
                    onClick={() => {
                      resolveConflict(active.id, "doc");
                      setOpenId(null);
                    }}
                  >
                    <div className="kh-choice-value">{active.docValue}</div>
                    <div className="kh-choice-src">
                      Keep document value — from {active.sourceFileName}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="kh-choice"
                    onClick={() => {
                      resolveConflict(active.id, "profile");
                      setOpenId(null);
                    }}
                  >
                    <div className="kh-choice-value">{active.profileValue}</div>
                    <div className="kh-choice-src">
                      Keep profile value — what's currently on file
                    </div>
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
