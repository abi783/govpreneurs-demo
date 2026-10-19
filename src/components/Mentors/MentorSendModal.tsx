// The "Send to a mentor" dialog — ONE form behind both surfaces:
//
//   · the opportunity page (`Opportunity/SendToMentorModal.tsx`), and
//   · a DIBBS small order (`MicroPurchases/SendOrderToMentorModal.tsx`).
//
// Each wrapper supplies only what differs: the "What I'm sending" block, the
// read-it checkbox wording, the help topics, the question placeholder and the
// attachment hint. The wallet half — live balance and charge, recharge
// polling, loading/error states, the GoHighLevel "Add funds" link and the
// confirm button — lives here once, so the two cannot drift.
//
// The form must be complete before the member can pay: she confirms she read
// the item, picks at least one topic, and writes a question of at least
// `MENTOR_QUESTION_MIN_CHARS`. The attachment is optional and checked here
// against the same types and 10 MB ceiling the hint states.
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Send, X, ArrowRight, Paperclip } from "lucide-react";
import { formatUSD } from "../../lib/wallet";
// DEMO: "Add funds" opens an in-app top-up, not the GHL billing page.
import { TopUpDialog } from "../../demo/explore/TopUpDialog";
import { useWalletBalancePolling } from "../../lib/useWalletBalancePolling";
import { Button } from "@/components/ui";
import "./mentor-send-modal.css";

export const MENTOR_QUESTION_MIN_CHARS = 30;
export const MENTOR_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const MENTOR_ATTACHMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];
const ACCEPT = MENTOR_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(",");
export const MENTOR_ATTACHMENT_TYPES_LINE = "PDF, DOC, DOCX, XLS, XLSX, PNG, or JPG (max 10 MB).";

export interface MentorHelpOption {
  /** What the mentor reads in the ticket. */
  label: string;
  /** A muted parenthetical shown after the label; also sent. */
  detail?: string;
}

/** What the member asked for, as the caller sends it. */
export interface MentorRequest {
  /** The composed note: what she confirmed, the topics, then her question. */
  message: string;
  file: File | null;
}

/**
 * The note the mentor reads, one labelled line per answer: what she confirmed,
 * the topics she picked, then her question (last, because it may run over
 * several lines). The backend renders these labels as fields for the mentor
 * (`backend/src/mentor-reviews/member-note-html.ts`) — keep the two in step.
 */
export function composeMentorMessage(parts: {
  confirmed?: string;
  topics: string[];
  question: string;
}): string {
  const q = parts.question.trim();
  const lines: string[] = [];
  if (parts.confirmed) lines.push(`Confirmed: ${parts.confirmed}.`);
  if (parts.topics.length) lines.push(`Help with: ${parts.topics.join("; ")}.`);
  if (lines.length === 0) return q;
  lines.push(`Question: ${q}`);
  return lines.join("\n");
}

/** Null when the file may be attached, otherwise the sentence saying why not. */
export function attachmentProblem(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!MENTOR_ATTACHMENT_EXTENSIONS.includes(ext)) {
    return `That file type can't be attached. Use ${MENTOR_ATTACHMENT_TYPES_LINE}`;
  }
  if (file.size > MENTOR_ATTACHMENT_MAX_BYTES) return "That file is over 10 MB.";
  return null;
}

function topicText(o: MentorHelpOption): string {
  return o.detail ? `${o.label} ${o.detail}` : o.label;
}

export function MentorSendModal({
  snapshotTitle,
  snapshotLine,
  readLabel,
  helpOptions,
  questionPlaceholder,
  attachHint,
  open,
  onOpenChange,
  onConfirm,
  balance,
  chargeAmount,
  sending = false,
  loading = false,
  error = null,
  locationId,
}: {
  snapshotTitle: ReactNode;
  snapshotLine: ReactNode;
  /** The "I've read …" confirmation. */
  readLabel: string;
  helpOptions: MentorHelpOption[];
  questionPlaceholder: string;
  /** An extra line above the file types, e.g. what to attach. */
  attachHint?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (request: MentorRequest) => void;
  /** Live wallet balance (USD) from the backend. */
  balance: number;
  /** Per-review charge (USD) from the backend. */
  chargeAmount: number;
  /** In-flight send — disables confirm to prevent double-submit. */
  sending?: boolean;
  /** Wallet balance/cost still loading — shows a loading state and disables confirm. */
  loading?: boolean;
  /** Wallet balance/cost failed to load — shows an error state and disables confirm. */
  error?: string | null;
  /** GHL sub-account locationId — when present, the shortfall "Add funds"
   * link opens the GHL billing deep-link directly instead of routing to
   * the in-app /wallet page. */
  locationId?: string;
}) {
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [hasRead, setHasRead] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  // Clear the form once the dialog closes — not on confirm, so a failed send
  // leaves her answers in place for a retry.
  useEffect(() => {
    if (open) return;
    setHasRead(false);
    setPicked([]);
    setQuestion("");
    setFile(null);
    setFileError(null);
  }, [open]);

  // While the modal is open and showing the insufficient-balance state (per
  // the route's one-shot `balance` prop), poll the live balance so a recharge
  // done elsewhere (GHL billing) is picked up without the member closing and
  // reopening the modal. The hook stops polling once a tick reports a
  // sufficient balance (see useWalletBalancePolling).
  const promptShort = !loading && !error && balance < chargeAmount;
  const polled = useWalletBalancePolling(locationId, open && promptShort, chargeAmount);
  const effectiveBalance = polled?.balance ?? balance;
  const effectiveShort = !loading && !error && effectiveBalance < chargeAmount;

  const questionShort = question.trim().length < MENTOR_QUESTION_MIN_CHARS;
  const formComplete = hasRead && picked.length > 0 && !questionShort;

  const togglePick = (i: number) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].sort((a, b) => a - b)));

  const onFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setFileError(null);
      return;
    }
    const problem = attachmentProblem(f);
    setFileError(problem);
    setFile(problem ? null : f);
    if (problem && fileInput.current) fileInput.current.value = "";
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="gate-modal__overlay" />
        <Dialog.Content className="gate-modal mentor-modal mentor-modal--form" aria-describedby={undefined}>
          <Button
            variant="ghost"
            size="sm"
            className="mentor-modal__close"
            icon={<X size={16} />}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          />
          <Dialog.Title className="gate-modal__title">Send to a mentor</Dialog.Title>
          <div className="gate-modal__body mentor-modal__body">
            <div className="mentor-modal__snapshot">
              <div className="t-label">What I'm sending</div>
              <div className="mentor-modal__snapshot-title">{snapshotTitle}</div>
              <div className="mentor-modal__snapshot-verdict">{snapshotLine}</div>
            </div>

            <label className="mentor-modal__read">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
              />
              <span>
                {readLabel} <span className="mentor-modal__req" aria-hidden>*</span>
              </span>
            </label>

            <fieldset className="mentor-modal__field">
              <legend className="mentor-modal__field-label">
                What do you need help with? <span className="mentor-modal__req" aria-hidden>*</span>
              </legend>
              <div className="mentor-modal__field-hint">Select one or more options.</div>
              <div className="mentor-modal__topics">
                {helpOptions.map((o, i) => (
                  <label
                    key={o.label}
                    className={`mentor-modal__topic${picked.includes(i) ? " is-on" : ""}`}
                  >
                    <input type="checkbox" checked={picked.includes(i)} onChange={() => togglePick(i)} />
                    <span>
                      {o.label}
                      {o.detail && <span className="mentor-modal__topic-detail"> {o.detail}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mentor-modal__field">
              <label htmlFor={`${ids}-q`} className="mentor-modal__field-label">
                Your question for the mentor <span className="mentor-modal__req" aria-hidden>*</span>
              </label>
              <div className="mentor-modal__field-hint" id={`${ids}-qhint`}>
                At least {MENTOR_QUESTION_MIN_CHARS} characters.
              </div>
              <textarea
                id={`${ids}-q`}
                aria-describedby={`${ids}-qhint`}
                className="mentor-modal__note"
                rows={3}
                placeholder={questionPlaceholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="mentor-modal__field">
              <label htmlFor={`${ids}-f`} className="mentor-modal__field-label">
                Attach a file (optional)
              </label>
              <div className="mentor-modal__file">
                <Paperclip size={18} aria-hidden className="mentor-modal__file-icon" />
                <input
                  ref={fileInput}
                  id={`${ids}-f`}
                  type="file"
                  accept={ACCEPT}
                  className="mentor-modal__file-input"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor={`${ids}-f`} className="mentor-modal__file-btn">
                  Choose file
                </label>
                <span className="mentor-modal__file-name">{file ? file.name : "No file chosen"}</span>
                {file && (
                  <button
                    type="button"
                    className="mentor-modal__file-clear"
                    aria-label="Remove file"
                    onClick={() => {
                      onFile(null);
                      if (fileInput.current) fileInput.current.value = "";
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="mentor-modal__field-hint">
                {attachHint && (
                  <>
                    {attachHint}
                    <br />
                  </>
                )}
                {MENTOR_ATTACHMENT_TYPES_LINE}
              </div>
              {fileError && (
                <div className="mentor-modal__file-error" role="alert">
                  {fileError}
                </div>
              )}
            </div>

            {loading ? (
              <div className="mentor-modal__cost-row" role="status">
                <div>
                  <div className="mentor-modal__cost-label">Cost</div>
                  <div className="mentor-modal__cost-value">Loading wallet…</div>
                </div>
              </div>
            ) : error ? (
              <div className="mentor-modal__shortfall" role="alert">
                {error}
              </div>
            ) : (
              <>
                <div className="mentor-modal__cost-row">
                  <div className="mentor-modal__cost">
                    <div className="mentor-modal__cost-label">Cost</div>
                    <div className="mentor-modal__cost-value">{formatUSD(chargeAmount)}</div>
                    <div className="mentor-modal__cost-sub">charged to your Wallet</div>
                  </div>
                  <div className="mentor-modal__sla">
                    A mentor reviews and responds in Mentors, usually within 1 business day.
                  </div>
                </div>
                {effectiveShort && (
                  <div className="mentor-modal__shortfall" role="note">
                    Your wallet has {formatUSD(effectiveBalance)} — a review costs{" "}
                    {formatUSD(chargeAmount)}.{" "}
                    {/* DEMO: an in-app top-up replaces the link to the billing page. */}
                    <button
                      type="button"
                      className="mentor-modal__shortfall-link"
                      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
                      onClick={() => setTopUpOpen(true)}
                    >
                      Add funds <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="gate-modal__actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="mentor-modal__confirm"
              disabled={!formComplete || effectiveShort || sending || loading || !!error}
              onClick={() =>
                onConfirm({
                  message: composeMentorMessage({
                    confirmed: readLabel,
                    topics: picked.map((i) => topicText(helpOptions[i])),
                    question,
                  }),
                  file,
                })
              }
            >
              <Send size={14} />{" "}
              {sending ? "Sending…" : loading ? "Loading…" : `Send for ${formatUSD(chargeAmount)}`}
            </Button>
          </div>
          {/* DEMO: the balance poll above picks up the new funds within a second. */}
          <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
