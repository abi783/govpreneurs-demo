// Ready to submit (Ava-Build-Spec §10, concept §10).
//
// Ava stops before submission. This screen is the package, measured on the
// files, plus the checklist of what only the member can do. The member signs
// and submits; uploading the receipt is how the bid counts as submitted.
// Never a percentage, never a "100% compliant" badge, never a Send button.

import { useId, useState } from "react";
import { CalendarClock, ChevronDown, CircleCheck, Flag, Paperclip, Upload } from "lucide-react";
import { acceptedRisks, blockingFindings } from "../../lib/ava/checks";
import { dayFromNow, fullDate, weekdayDate, aboutTime } from "../../lib/ava/dates";
import { bidDecision, commitmentStatus, openBidAsks, openCommitments } from "../../lib/ava/derive";
import { approvalTotal } from "../../lib/ava/price";
import { progress, readyLabel, MIRRORS_LIST } from "../../lib/ava/status";
import { ava } from "../../lib/ava/store";
import type { SubmitMethod } from "../../lib/ava/types";
import { dueLine } from "./AvaChrome";
import { AvaCard, ConfirmDialog, SeverityChip, SourcePin } from "./primitives";
import { PackageTable } from "./SubmitPackage";
import type { ViewProps } from "./views";

const METHOD_LABEL: Record<SubmitMethod, string> = {
  portal: "Online, through the buyer's portal",
  email: "By email",
  paper: "Printed copies, delivered by hand or by carrier",
  "typed-portal": "Typed into the buyer's portal, screen by screen",
};

const ACCOUNT_LABEL: Record<SubmitMethod, string> = {
  portal: "Account",
  email: "Send to",
  paper: "Deliver to",
  "typed-portal": "Account",
};

/** A careful read of one certified statement and the rule behind it. The
 *  concept promises the whole read in under an hour. */
const MINUTES_PER_STATEMENT = 4;

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function SubmitView({ ctx, go }: ViewProps) {
  const { bid, s, id, fixture } = ctx;
  const p = progress(fixture, s);
  const label = readyLabel(s);
  const risks = acceptedRisks(s);
  const left = Object.entries(s.reviewerLeft);
  const decision = bidDecision(bid, s);
  const sub = bid.submission;

  const d = bid.deadline;
  const early = `${weekdayDate(dayFromNow(d.dueDaysFromNow - 1))}, ${d.time} ${d.zone ?? "(the buyer's files give no time zone)"}`;

  const labelRisk = label ? risks.find((r) => r.label === label) : undefined;

  // What keeps the bid in Building, so the button goes where the work is.
  const asksOpen = openBidAsks(bid, s).length;
  const promises = openCommitments(bid, s);
  const promisesOpen = promises.length;
  const promisesReopened = promises.some((c) => commitmentStatus(s, c) === "reopened");
  // The price is approved at the total the buyer evaluates: every period, when there are periods.
  const total = approvalTotal(bid, s);
  const priceOpen =
    total !== null && (!s.priceApproval || Math.abs(s.priceApproval.total - total) > 0.005);
  // The internal deadline is derived from the current due date above, so it
  // stays right when an addendum moves the date. The fixture's own line would
  // repeat it with a date written before any addendum.
  const checklist = sub.checklist.filter(
    (item) => !(item.auto && /^internal deadline/i.test(item.label)),
  );

  return (
    <>
      <section className="ava-card ava-s-verdict" aria-labelledby="ava-s-verdict-h">
        {p.phase === "submitted" ? (
          <>
            <h2 id="ava-s-verdict-h" className="ava-h2">
              {p.remaining > 0
                ? `Submitted with ${p.remaining} ${plural(p.remaining, "item", "items")} still open.`
                : "Submitted. Your receipt is saved."}
            </h2>
            <p className="ava-lede">
              {p.remaining > 0 ? "Your receipt is saved. " : ""}The bid counts as submitted from the
              day you saved the receipt.
            </p>
            {p.remaining > 0 ? (
              <>
                <p className="ava-muted">
                  The open items stay listed. Some may still matter to the buyer, like a missing
                  form.
                </p>
                <div className="ava-actions ava-s-verdict__actions">
                  <button type="button" className="btn btn-secondary" onClick={() => go("check")}>
                    Open the check to see them
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : p.phase === "ready" ? (
          <>
            <h2 id="ava-s-verdict-h" className="ava-h2">
              Your bid is ready to submit.
            </h2>
            {label ? (
              <p className="ava-s-label">
                <Flag size={15} strokeWidth={2} aria-hidden />
                {labelRisk ? <SeverityChip severity={labelRisk.severity} /> : null}
                <strong>{label}</strong>
              </p>
            ) : null}
            <p className="ava-lede">Ava does not submit for you. You sign and submit.</p>
          </>
        ) : (
          <>
            <h2 id="ava-s-verdict-h" className="ava-h2">
              {p.phase === "understanding"
                ? "Not ready yet: your Bid Brief needs a first read."
                : `Not ready yet: complete except ${p.remaining} ${plural(p.remaining, "item", "items")}.`}
            </h2>
            <p className="ava-lede">
              {decision
                ? "Progress is paused. The bid is back with Grant."
                : p.phase === "reviewing"
                  ? "The check lists what is left. Fix each one, or go ahead at risk."
                  : p.phase === "understanding"
                    ? "Ava starts building once you say the brief looks right."
                    : asksOpen > 0
                      ? "Page 2 shows what Ava still needs from you."
                      : "Ava needs your approval. Only you can approve a promise or the price."}
            </p>
            <div className="ava-actions ava-s-verdict__actions">
              {p.phase === "understanding" || decision ? (
                <button type="button" className="btn btn-primary" onClick={() => go("brief")}>
                  Open the Bid Brief
                </button>
              ) : p.phase === "reviewing" ? (
                <button type="button" className="btn btn-primary" onClick={() => go("check")}>
                  Open the check
                </button>
              ) : asksOpen > 0 ? (
                <button type="button" className="btn btn-primary" onClick={() => go("list")}>
                  Open 2. Compliance and inputs
                </button>
              ) : (
                <>
                  {promisesOpen > 0 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        go(
                          promisesReopened
                            ? "addenda"
                            : bid.sections.length > 0
                              ? "writing"
                              : "list",
                        )
                      }
                    >
                      {promisesOpen === 1
                        ? "Review the promise"
                        : `Review the ${promisesOpen} promises`}
                    </button>
                  ) : null}
                  {priceOpen ? (
                    <button
                      type="button"
                      className={`btn ${promisesOpen > 0 ? "btn-secondary" : "btn-primary"}`}
                      onClick={() => go("price")}
                    >
                      Open the price to approve it
                    </button>
                  ) : null}
                </>
              )}
            </div>
            <p className="ava-muted">
              You can still submit before Ava calls it ready. That is your call. The package below
              shows what is missing.
            </p>
          </>
        )}
      </section>

      <AvaCard label="The package" className="ava-s-package">
        <PackageTable ctx={ctx} />
        <ul className="ava-s-lines">
          <li>
            <strong>Limits:</strong> {sub.limits.replace(/[.\s]+$/, "")}. Ava named and split the
            files for these limits.
          </li>
          {sub.markings.map((m) => (
            <li key={m}>
              <strong>Marking:</strong> {m}
            </li>
          ))}
          <li>Unsupported statements and gaps are left out of the files.</li>
        </ul>
      </AvaCard>

      <div className="ava-split ava-s-split">
        <div className="ava-s-col">
          <AvaCard label="Only you can do these" className="ava-s-todo">
            <ul className="ava-s-dates">
              <li>
                <CalendarClock size={15} strokeWidth={2} aria-hidden />
                <span>
                  <strong>The deadline.</strong> {dueLine(bid)}.
                </span>
              </li>
              <li>
                <CalendarClock size={15} strokeWidth={2} aria-hidden />
                <span>
                  <strong>Your own deadline, one day early.</strong> {early}. It leaves a day for
                  problems.
                </span>
              </li>
            </ul>
            <ul className="ava-s-checklist">
              {checklist.map((item) =>
                item.auto ? (
                  <li key={item.id} className="ava-s-item is-auto">
                    <CircleCheck size={16} strokeWidth={2} aria-hidden />
                    <span>
                      {item.label} <span className="ava-s-auto">Ava checked this.</span>
                    </span>
                  </li>
                ) : (
                  <li key={item.id} className="ava-s-item">
                    <label className="ava-check">
                      <input
                        type="checkbox"
                        checked={!!s.checklist[item.id]}
                        onChange={() => ava.toggleChecklist(id, item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ),
              )}
            </ul>
            {risks.length > 0 || left.length > 0 ? (
              <ul className="ava-s-risks">
                {risks.map((r) => (
                  <li key={r.key}>
                    <Flag size={13} strokeWidth={2} aria-hidden />
                    <span>
                      <SeverityChip severity={r.severity} /> You are going ahead at risk:{" "}
                      {r.label.replace(/^going ahead at risk:\s*/i, "")}
                    </span>
                  </li>
                ))}
                {left.map(([rid]) => {
                  const f = bid.reviewerFindings.find((x) => x.id === rid);
                  const sec = f ? bid.sections.find((x) => x.id === f.sectionId) : undefined;
                  return (
                    <li key={`left:${rid}`}>
                      <Flag size={13} strokeWidth={2} aria-hidden />
                      <span>
                        {f ? <SeverityChip severity={f.severity} /> : null} You are going ahead at
                        risk: you left the reviewer&apos;s finding{sec ? ` on ${sec.title}` : ""} as
                        it is.
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {risks.length > 0 || left.length > 0 ? (
              <p className="ava-s-note">
                These labels stay here and on your package. They never go in your files.
              </p>
            ) : null}
            <Certifying items={sub.certifying} />
          </AvaCard>
        </div>

        <div className="ava-s-col">
          <AvaCard label="Where and how to submit" className="ava-s-how">
            <dl className="ava-s-dl">
              <dt>How</dt>
              <dd>{METHOD_LABEL[sub.method]}</dd>
              <dt>Where</dt>
              <dd>
                {sub.where}{" "}
                <SourcePin bid={bid} source={sub.source} claim={`Submit to ${sub.where}.`} />
              </dd>
              <dt>{ACCOUNT_LABEL[sub.method]}</dt>
              <dd className={sub.method === "email" ? "mono" : undefined}>{sub.account}</dd>
              <dt>Limits</dt>
              <dd>{sub.limits}</dd>
            </dl>
            <p className="ava-s-note">Ava does not submit for you. You sign and submit.</p>
          </AvaCard>
          <Receipt ctx={ctx} remaining={p.remaining} />
        </div>
      </div>
    </>
  );
}

// ─── What you're certifying ───

export function Certifying({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  if (items.length === 0) return null;
  return (
    <div className="ava-s-cert">
      <button
        type="button"
        className="ava-s-disclose"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ava-s-disclose__text">
          <strong>What you&apos;re certifying</strong>
          <span className="ava-s-disclose__sub">
            <span className="mono">{items.length}</span>{" "}
            {plural(items.length, "statement", "statements")} ·{" "}
            {aboutTime(items.length * MINUTES_PER_STATEMENT).replace(/^about/, "About")} to read
          </span>
        </span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden className="ava-s-disclose__chev" />
      </button>
      <ol id={regionId} className="ava-s-cert__list" hidden={!open}>
        {items.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
    </div>
  );
}

// ─── The receipt: how a bid counts as submitted ───

/** Everything still open, as progress counts it once the receipt is saved:
 *  the items that keep the bid in Building, then the findings that hold it
 *  in Reviewing. The dialog lists exactly what the count counts. */
function stillOpen(ctx: ViewProps["ctx"]): string[] {
  const { bid, s } = ctx;
  const out: string[] = [];
  if (s.briefConfirmed) {
    for (const a of openBidAsks(bid, s)) out.push(`On your list: ${a.title}`);
    for (const c of openCommitments(bid, s)) out.push(`A promise to approve: ${c.text}`);
    const total = approvalTotal(bid, s);
    if (total !== null && (!s.priceApproval || Math.abs(s.priceApproval.total - total) > 0.005)) {
      out.push(
        s.priceApproval ? "Your price changed since you approved it" : "Your approval of the price",
      );
    }
  }
  // A finding that restates a list item above is the same item: count it once.
  for (const f of blockingFindings(bid, s)) {
    if (!s.briefConfirmed || !MIRRORS_LIST(f.id)) out.push(`The check: ${f.title}`);
  }
  return out;
}

/** The dialog shows this many, then says how many more. */
const SHOW_OPEN = 8;

export function Receipt({ ctx, remaining }: { ctx: ViewProps["ctx"]; remaining: number }) {
  const { bid, s, id, fixture } = ctx;
  const inputId = useId();
  const [pending, setPending] = useState<string | null>(null);

  if (s.receipt) {
    return (
      <AvaCard label="Your submission receipt" className="ava-s-receipt is-done">
        <p className="ava-s-receipt__done">
          <CircleCheck size={18} strokeWidth={2} aria-hidden />
          <strong>
            {remaining > 0
              ? `Submitted with ${remaining} ${plural(remaining, "item", "items")} still open. Your receipt is saved.`
              : "Submitted. Your receipt is saved."}
          </strong>
        </p>
        <p className="ava-s-receipt__file">
          <Paperclip size={14} strokeWidth={2} aria-hidden />
          <span className="mono">{s.receipt.fileName}</span>
          <span className="ava-muted">· saved {fullDate(new Date(s.receipt.at))}</span>
        </p>
        <p className="ava-s-p">
          Ava will watch for the award result. When the buyer&apos;s rules allow a debrief, Ava
          drafts the request. A debrief is where the buyer explains how they judged your bid. You
          send the request.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => ava.removeReceipt(id)}
        >
          Remove the receipt
        </button>
      </AvaCard>
    );
  }

  const p = progress(fixture, s);
  const early = p.phase !== "ready" || p.remaining > 0;
  const open = early ? stillOpen(ctx) : [];
  const shown = [...new Set(open)].slice(0, SHOW_OPEN);
  const more = open.length - shown.length;
  const lines = [
    open.length > 0
      ? `You are submitting with ${open.length} ${plural(open.length, "item", "items")} still open.`
      : "Ava has not called this bid ready yet.",
    "The receipt marks the bid as submitted. The open items stay listed.",
    ...(!s.briefConfirmed ? ["You have not said your Bid Brief looks right."] : []),
    ...(bidDecision(bid, s) ? ["The bid is back with Grant, so it is paused."] : []),
    ...shown,
    ...(more > 0 ? [`And ${more} more. Your list shows them all.`] : []),
  ];

  return (
    <AvaCard label="After you submit" className="ava-s-receipt">
      <p className="ava-s-p">
        Save the receipt the buyer gives you. That is how the bid counts as submitted.
      </p>
      <div className="ava-s-upload">
        <input
          id={inputId}
          type="file"
          className="ava-s-upload__input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            // Early: say what is still open before the bid counts as submitted.
            if (early) setPending(file.name);
            else ava.uploadReceipt(id, file.name);
          }}
        />
        <label htmlFor={inputId} className={`btn ${early ? "btn-secondary" : "btn-primary"}`}>
          <Upload size={14} strokeWidth={2} aria-hidden /> Upload your submission receipt
        </label>
      </div>
      {early ? (
        <p className="ava-s-p">
          Ava has not called this bid ready. If you upload a receipt now, Ava first shows what is
          still open.
        </p>
      ) : null}
      <p className="ava-s-p ava-s-checked">
        “Checked” means Ava confirmed the package against the current files. It also used the proof
        you gave. The facts about your company are yours to stand behind.
      </p>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => {
          if (!o) setPending(null);
        }}
        title="Submit with items still open"
        lines={lines}
        agreement="I know these items are still open. I submitted the bid anyway."
        confirmLabel="Save the receipt"
        onConfirm={() => {
          if (pending) ava.uploadReceipt(id, pending);
          setPending(null);
        }}
      />
    </AvaCard>
  );
}
