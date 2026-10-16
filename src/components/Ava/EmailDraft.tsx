// An email Ava wrote, shown in the app: who it goes to, its subject and its
// words, each with a Copy button.
//
// DEMO: the prototype opened the visitor's mail program with the draft. The
// mail program is outside this app and differs on every laptop, so the demo
// shows the email here and lets the visitor copy it. Ava never sends it.

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "../ui/Modal";
import { copyText } from "./primitives";

/** A Copy button that always answers: "Copied" for a moment. */
export function CopyButton({
  text,
  label = "Copy",
  className = "btn btn-ghost btn-sm",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void copyText(text);
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{" "}
      {done ? "Copied" : label}
    </button>
  );
}

export function EmailDraftDialog({
  open,
  onOpenChange,
  to,
  subject,
  body,
  sendLabel = "I sent it",
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  to: string;
  subject: string;
  body: string;
  sendLabel?: string;
  onSent?: () => void;
}) {
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md" className="ava-modal" aria-describedby={undefined}>
        <Modal.Header title="The email Ava wrote" />
        <Modal.Body>
          <dl className="ava-email">
            <div>
              <dt>To</dt>
              <dd>{to}</dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>
                {subject} <CopyButton text={subject} />
              </dd>
            </div>
          </dl>
          <pre className="ava-email__body">{body}</pre>
          <p className="ava-dialog__p ava-muted">
            Ava never sends an email for you. Copy it into your own email, then come back.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <CopyButton text={body} label="Copy the email" className="btn btn-secondary" />
          <Modal.Close asChild>
            <button type="button" className="btn btn-ghost">
              Close
            </button>
          </Modal.Close>
          {onSent ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onSent();
                onOpenChange(false);
              }}
            >
              {sendLabel}
            </button>
          ) : null}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
