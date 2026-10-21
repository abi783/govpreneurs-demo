/**
 * One fact of the record.
 *
 * Composes `SummaryRow` + `StatusChip` and takes every per-state decision from
 * `ROW_CONTRACT`. There is no `switch (state)` in this file and there must
 * never be one — that switch is `rowContract.ts`, where a tenth state is a
 * compile error.
 *
 * Both halves of the acronym rule are kept apart on purpose: the government's
 * `term` belongs to the QUESTION and sits under the label; `why` belongs to the
 * ANSWER and sits under the value.
 *
 * Given an `onSave` the row opens `ControlFor` in place; which control and what
 * seeds it is `rowEditor.ts`'s decision. The `doc_*` rows are answered by
 * uploading, so they open only where an `onUpload` was passed too.
 *
 * It must not: render `confidenceTag` (audit only, not even in the payload);
 * render a source chip that opens nothing; put a government label on a fact we
 * cannot fetch; or use an error colour for a missing value.
 *
 * `stale`, `pending_dfy` and `conflict` have no producer yet — the dev page
 * renders one Row per state so they can be seen.
 */

"use client";

import { useState, type ReactElement } from "react";
import { catalogFor, copyFor } from "@sc/lib/businessProfile/catalog";
import type { DisplayPart } from "@sc/lib/businessProfile/formatValue";
import type { ProposalPayload, ProvenancePayload, RecordFieldPayload } from "@sc/lib/businessProfile/payload";
import { labelFor } from "@sc/lib/businessProfile/recordView";
import { unknown, type RecordLookup } from "@sc/lib/businessProfile/mbValue";
import { KEEP_THESE, proposalChoice } from "@sc/lib/businessProfile/proposalAnswer";
import { canConfirm, orderedPick } from "@sc/lib/businessProfile/subsetConfirm";
import { editorGap, isDocumentEditor, rowEditor, type RowEditor } from "@sc/lib/businessProfile/rowEditor";
import {
  ACTION_LABEL,
  CHANGE_LABEL,
  offeredAction,
  promptFor,
  rowContract,
  termToShow,
  valueLines,
  type RowCapability,
  type RowContract,
} from "@sc/lib/businessProfile/rowContract";
import { ControlFor, type UploadFile } from "../controls";
import { rowAnchorId } from "@sc/lib/businessProfile/rowAnchor";
import { SourceSheet } from "../SourceSheet";
import type { ApiProvenance } from "../types";
import { ItemPicker } from "./ItemPicker";
import { StatusChip } from "./StatusChip";
import { SummaryRow, type SummaryRowProps } from "./SummaryRow";
import { JobEntries } from "./JobEntries";
import { ValueLines } from "./ValueLines";
import "./mybusiness.css";

/** A conflict asks; it never merges and never takes the last write. */
const CONFLICT_ASK = "Which one is right?";
const SEPARATOR = " · ";
/** The way back out of an editor she did not mean to open. */
const STOP_LABEL = "Cancel";

export interface RowProps {
  field: RecordFieldPayload;
  /** The rest of her record, for the one row whose options are her own earlier
   *  answers (`recordLookup`, built once by the screen). Without it that row
   *  says which question to answer first rather than opening an empty pick. */
  record?: RecordLookup;
  /** Change this answer SOMEWHERE ELSE — the check-answers screen sends her to
   *  the part that holds it. Given, it wins over editing in place. */
  onEdit?: () => void;
  onConfirm?: () => void;
  onResolve?: () => void;
  /** Re-run the check behind a `stale` or `error` row. Not "type it yourself" —
   *  labelling our own retry as her edit would blame her for our failure. */
  onRetry?: () => void;
  /** Saves what she typed into this row's own control — the prompt on a row
   *  with nothing on it yet, and "Change" on a row that is settled. Answers
   *  whether it actually saved: `false` keeps the editor open, holding what she
   *  typed, so a refusal never costs her the answer. A caller that reports
   *  nothing returns void, and the editor closes as it always did. */
  onSave?: (value: unknown) => void | Promise<boolean>;
  /** Stores a file for a document row and hands back the entry the record
   *  keeps, which is then saved through `onSave` like any other answer (F17).
   *  A document row without one opens no editor at all. */
  onUpload?: UploadFile;
  busy?: boolean;
  /** Why her last attempt ON THIS ROW was refused, in her words. Shown beside
   *  the control she typed into — a message at the foot of the part is a
   *  message she scrolls past. */
  error?: string | null;
  /** Render as a FORM QUESTION rather than a record row — Basic Info, which is
   *  a form she is filling in, not the record she is reading back.
   *
   *  It drops the two things a record row carries and a form question does
   *  not: the official term beside the question, and the provenance line under
   *  the answer. Basic Info showed "Your trade" with "NAICS codes" in mono
   *  beside it and "You told us · 2 weeks ago" under almost every answer — a
   *  filing note on a form, on rows she is being asked to complete. On the
   *  confirm rows it was worse than noise: the origin already appears inside
   *  "Hunter warm-start wizard · Yes, that is right", so the line under it
   *  printed the same source a second time.
   *
   *  The parts keep both. That is where she reads the record back and where
   *  the question "who said this, and when" is the one being asked. The
   *  prototype's Basic Info renders label and reason and nothing else. */
  asForm?: boolean;
  /** Something a channel proposed for THIS row, waiting on her yes or no.
   *
   *  IT LIVES ON THE ROW BECAUSE THE QUESTION DOES. These were answered on a
   *  separate "What needs you" queue until that screen was removed, after which
   *  `tell` kept writing proposals, the rail kept counting them, and nothing
   *  could accept one — Hunter understood her and put the answer where she
   *  could not reach it. Asked here, the question and the answer are in the
   *  same place, which is how the source design does it. */
  proposal?: ProposalPayload;
  /** Yes — the endpoint returns the whole payload, so the row, the rail and
   *  the counts all move on one response. It carries the items she kept when
   *  the proposal named more than the row holds, and nothing when it did not. */
  onAcceptProposal?: (picked?: string[]) => void;
  /** No. The row keeps whatever it already had: declining is not a wipe. */
  onRejectProposal?: () => void;
  /** Why her last yes or no ON THIS PROPOSAL was refused, in her words. Kept
   *  apart from `error`, which belongs to the editor: a refused answer is said
   *  beside the buttons that made it, and the editor is closed at that moment. */
  proposalError?: string | null;
}

/** The editor this row can open, why it cannot, and whether it is open. */
interface ChangeState {
  editor: RowEditor | null;
  /** What to answer first, on the row whose options are her own earlier
   *  answers. Null on every other row and once she has given them. */
  gap: string | null;
  editing: boolean;
  open: () => void;
  close: () => void;
}

/**
 * The editor this row can open on THIS screen, or null.
 *
 * `rowEditor` says which control the row has; the caller says what it can
 * actually do with it. A row is only editable here where the caller can save it,
 * and a document row only where it can also send a file — otherwise the row
 * promises something it cannot open.
 */
function editorFor(props: RowProps): RowEditor | null {
  if (!props.onSave) return null;
  const editor = rowEditor(props.field.fieldKey, props.field.value, props.record);
  if (!editor) return null;
  return isDocumentEditor(editor) && !props.onUpload ? null : editor;
}

/** One fact of the record: label · value · chip · provenance · one action. */
export function Row(props: RowProps): ReactElement {
  const { field } = props;
  const [sourceOpen, setSourceOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const contract = rowContract(field.state);
  // Only where the caller can actually save it. `rowEditor` returns null for a
  // field with no control, so the row promises nothing it cannot open.
  const change: ChangeState = {
    editor: editorFor(props),
    gap: editorGap(field.fieldKey, props.record),
    editing,
    open: () => setEditing(true),
    close: () => setEditing(false),
  };
  const label = labelFor(field.fieldKey);
  const term = props.asForm ? null : termToShow(label, catalogFor(field.fieldKey)?.term);
  const lines = valueLines(field.fieldKey, field.value);
  /** This row is an invitation rather than a report — see the box below. */
  const prompting = contract.value === "prompt";
  /** The one-tap confirm shows; it carries the source line itself. */
  const asking = contract.action === "confirm" && props.onConfirm !== undefined && !change.editing;

  return (
    <>
      <SummaryRow
        anchorId={rowAnchorId(field.fieldKey)}
        label={label}
        term={term ?? undefined}
        why={whyFor(field.fieldKey)}
        action={rowAction(contract, props, change)}
        editing={change.editing}
        // `contract.value === "prompt"` is the one signal for "this row is an
        // invitation, not a report" — the same one `RowValue` switches on, so
        // the box's colour and its contents can never disagree. Line count is
        // NOT that signal: a declined or `none` answer has lines and still
        // renders a prompt, which put a settled tick on a row reading "Add …".
        empty={prompting}
        // A settled row earns a tick; one that still wants her carries its
        // chip in the same slot, at the end of the box, so the two can never
        // both appear and neither wraps into the middle of the value.
        mark={
          prompting ? undefined : contract.chip !== null ? (
            <StatusChip state={field.state} />
          ) : lines.length > 0 ? (
            <RowTick />
          ) : undefined
        }
        footnote={
          <>
            {/* THE ONE-TAP CONFIRM, ON THE ROW IT BELONGS TO. Only where we put
                the value there and she has not yet agreed with it — never on a
                row she typed herself, and never on an expiry, which agreeing
                cannot fix. */}
            {asking ? (
              <p className="mb-row__ask">
                <span className="mb-row__origin">{field.origin}</span>
                {field.provenance ? (
                  <>
                    <span aria-hidden="true">{SEPARATOR}</span>
                    <button type="button" className="mb-prov__src" onClick={() => setSourceOpen(true)}>
                      {field.provenance.sourceLabel ?? field.provenance.type}
                    </button>
                    <span aria-hidden="true">{SEPARATOR}</span>
                  </>
                ) : null}
                <button
                  type="button"
                  className="mb-row__yes"
                  onClick={props.onConfirm}
                  disabled={props.busy === true}
                >
                  {ACTION_LABEL.confirm}
                  <span className="sr-only"> — {label}</span>
                </button>
              </p>
            ) : null}
            {contract.provenance && !asking ? (
              <ProvenanceLine field={field} onOpenSource={() => setSourceOpen(true)} />
            ) : null}
            {props.proposal ? (
              <RowProposal
                proposal={props.proposal}
                busy={props.busy === true}
                error={props.proposalError}
                onAccept={props.onAcceptProposal}
                onReject={props.onRejectProposal}
              />
            ) : null}
          </>
        }
        value={
          <>
            <div className="mb-val">
              <RowValue {...props} contract={contract} lines={lines} change={change} />
            </div>
            {field.errorMessage ? <p className="mb-note">{field.errorMessage}</p> : null}
          </>
        }
      />
      {sourceOpen && field.provenance ? (
        <SourceSheet
          provenance={forSheet(field.provenance)}
          claim={lines.map((l) => l.text).join(SEPARATOR)}
          onClose={() => setSourceOpen(false)}
        />
      ) : null}
    </>
  );
}

/**
 * What this fact does for her, or nothing — THE OTHER HALF OF THE ACRONYM RULE.
 *
 * Two places earn it and no others: an empty row, where it is the reason to
 * answer at all, and a row carrying a government `term`, where it is what
 * decodes the jargon in the same breath. On a settled row with a plain label it
 * is a caption nobody reads, and seventy-five of them is a page of them.
 *
 * The words come from `copyFor`, so a row with a registry home inherits the
 * registry's sentence rather than restating it.
 */
/**
 * Why this question is asked, on EVERY row that has an answer to that.
 *
 * It used to be shown only on a row with nothing in it or a government term
 * beside it, which is the row least likely to be read — the reason a question
 * matters does not stop being true once she has answered it, and a member
 * re-reading her own record to correct something is exactly who needs it. The
 * source design shows it on every row and says so in its own comment.
 */
function whyFor(fieldKey: string): string | undefined {
  const catalog = catalogFor(fieldKey);
  return catalog ? copyFor(catalog).whyItMatters : undefined;
}

/**
 * The row's one action, chosen by the contract and never by the state.
 *
 * A settled row asks nothing of her, so it offers the quiet "change" instead —
 * her answer stays hers to change. "Change" edits in place where the caller can
 * save it, and hands over to `onEdit` where the answer belongs on another screen
 * (the check-answers list sends her to the part that holds it). An open editor
 * always offers the way back out, so no row can be left with her answer hidden.
 *
 * A row whose state asks for a confirm, a resolve or a retry falls back to that
 * same "change" on a screen that was given no such handler — the part page and
 * the check-answers list are both saves and nothing else. A chip that asks her
 * to check something, over a row with no button at all, is a dead end.
 */
function rowAction(
  contract: RowContract,
  p: RowProps,
  change: ChangeState,
): SummaryRowProps["action"] {
  if (change.editing) return { label: STOP_LABEL, onClick: change.close, busy: p.busy };

  /* AN EMPTY ROW'S ACTION IS OPENING ITS OWN EDITOR, and it has to be stated
     here. `offeredAction` answers null for `answer` because the prompt used to
     be its own button inside the value cell — once the box became the control
     that button was removed as invalid nesting, and with it went the only way
     to answer a row that had nothing on it yet. */
  const open = p.onEdit ?? (change.editor ? change.open : undefined);
  if (contract.action === "answer") {
    return open ? { label: ACTION_LABEL.answer, onClick: open, busy: p.busy } : undefined;
  }

  const handlers: Record<RowCapability, (() => void) | undefined> = {
    // NOT `p.onConfirm`. The confirm is its own control under the box, beside
    // the origin it is agreeing with — pressing the value itself must always
    // mean "open this and change it", whatever state the row is in.
    confirm: undefined,
    resolve: p.onResolve,
    retry: p.onRetry,
    change: open,
  };
  // The state's own action where this screen can perform it, "change" where it
  // cannot, nothing where it can do neither. That decision is `rowContract`'s.
  const kind = offeredAction(contract, (capability) => handlers[capability] !== undefined);
  const onClick = kind ? handlers[kind] : undefined;
  if (!kind || !onClick) return undefined;
  return { label: kind === "change" ? CHANGE_LABEL : ACTION_LABEL[kind], onClick, busy: p.busy };
}

function RowValue({
  contract,
  lines,
  change,
  ...p
}: RowProps & {
  contract: RowContract;
  lines: DisplayPart[];
  change: ChangeState;
}): ReactElement {
  if (change.editing && change.editor && p.onSave) {
    return (
      <Editor
        editor={change.editor}
        onSave={p.onSave}
        onUpload={p.onUpload}
        close={change.close}
        busy={p.busy}
        error={p.error}
      />
    );
  }
  if (contract.value === "prompt") return <Prompt {...p} change={change} />;
  if (contract.value === "both") return <Conflict field={p.field} />;
  /* JOBS READ AS ENTRIES, NOT AS A LINE. `formatValue` flattens one job into a
     single string and several into one joined with "; " — everything a buyer
     asks for is on the record and none of it is legible that way. This is the
     one value kind whose shape a `DisplayPart` cannot carry, so it renders from
     the stored value instead. */
  if (p.field.value.kind === "entries" && p.field.value.entries.length > 0) {
    return <JobEntries jobs={p.field.value.entries} />;
  }
  return <ValueLines parts={lines} muted={contract.value === "muted"} />;
}

/**
 * What a channel heard, waiting on her yes or no, under the row it belongs to.
 *
 * IT SHOWS THE VALUE AND HER OWN WORDS. "Yes, that is right" is not answerable
 * without both: the value is what would be stored, and `heard` is the sentence
 * it was read out of. A confirm with neither is asking her to agree with
 * something she cannot see.
 *
 * DECLINING IS NOT A WIPE, and the wording says so — "No, leave it" rather than
 * "Delete", because the row keeps whatever it already had. The two are a
 * quiet pair, not a warning: nothing here is wrong, and neither answer is the
 * dangerous one.
 *
 * AND SHE KEEPS WHAT SHE WANTS OF IT, HERE. A channel can name more items than
 * the row keeps, and the route refuses a confirm that carries no pick. So the
 * row asks for the pick: the tick boxes replace the value block, and the yes
 * carries the items she kept. `proposalChoice` decides whether to ask,
 * `toggleItem` inside `ItemPicker` decides what a tap does, and `canConfirm`
 * decides whether the yes may go. This row holds no cap and no rule.
 *
 * THE PICKER REPLACES THE VALUE BLOCK rather than sitting under it: the items
 * ARE the value here, and printing them twice would ask her to read the same
 * five services before choosing among them. The tell review follows the same
 * rule, with the same component.
 */
function RowProposal({
  proposal,
  busy,
  error,
  onAccept,
  onReject,
}: {
  proposal: ProposalPayload;
  busy: boolean;
  error?: string | null;
  onAccept?: (picked?: string[]) => void;
  onReject?: () => void;
}): ReactElement {
  const lines = valueLines(proposal.fieldKey, proposal.value);
  const choose = proposalChoice(proposal.fieldKey, proposal.value);
  /** The items she has kept so far, when this proposal asked her to choose. */
  const [kept, setKept] = useState<string[]>([]);
  /** What the yes carries, in the order the proposal named them. `orderedPick`
   *  drops anything this proposal no longer offers, so the button is judged on
   *  what it would actually send. */
  const picked = choose ? orderedPick(choose.items, kept) : undefined;
  /** A yes she cannot complete is never offered: with a pick to make, the
   *  button waits until she has kept one. */
  const ready = picked ? canConfirm(picked) : true;
  const [sourceOpen, setSourceOpen] = useState(false);
  const source = proposal.provenance;
  return (
    <div className="mb-prop">
      <p className="gpds-mono mb-prop__from">
        <span>{proposal.origin}</span>
        {source ? (
          <>
            <span aria-hidden="true">{SEPARATOR}</span>
            <button type="button" className="mb-prov__src" onClick={() => setSourceOpen(true)}>
              {source.sourceLabel ?? source.type}
            </button>
          </>
        ) : null}
      </p>
      {sourceOpen && source ? (
        <SourceSheet
          provenance={forSheet(source)}
          claim={lines.map((l) => l.text).join(SEPARATOR)}
          onClose={() => setSourceOpen(false)}
        />
      ) : null}
      <div className="mb-prop__val">
        {choose ? (
          <ItemPicker choose={choose} kept={kept} onKept={setKept} busy={busy} />
        ) : (
          <ValueLines parts={lines} />
        )}
      </div>
      {proposal.heard ? <p className="mb-prop__heard">You said: &ldquo;{proposal.heard}&rdquo;</p> : null}
      <p className="mb-prop__acts">
        <button
          type="button"
          className="mb-row__yes"
          onClick={() => onAccept?.(picked)}
          disabled={busy || !onAccept || !ready}
        >
          {/* "Yes, that is right" is false about a pick: she agreed with three
              of five, not with the card. The tell review's own label, so the two
              surfaces cannot drift. */}
          {choose ? KEEP_THESE : ACTION_LABEL.confirm}
        </button>
        <button type="button" className="mb-prop__no" onClick={onReject} disabled={busy || !onReject}>
          No, leave it
        </button>
      </p>
      {/* Said beside the buttons that made it, never at the foot of the part. */}
      {error ? (
        <p className="mb-note" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The editor, open on this row. THE SAME control `/intake` uses — one question
 * is never asked two ways — seeded with what the record already holds, so
 * pressing save on an untouched control writes back what was already there.
 *
 * It closes as it saves: each answer saves on its own, and the row reads back
 * from the payload the save itself returns.
 */
function Editor({
  editor,
  onSave,
  onUpload,
  close,
  busy,
  error,
}: {
  editor: RowEditor;
  onSave: (value: unknown) => void | Promise<boolean>;
  onUpload: UploadFile | undefined;
  close: () => void;
  busy: boolean | undefined;
  error: string | null | undefined;
}): ReactElement {
  return (
    <div className="mb-edit">
      <ControlFor
        field={editor.control}
        initialValue={editor.initialValue}
        onSave={async (value) => {
          // Closes only once it has SAVED. Closing first — which is what this
          // did — threw away both her answer and the reason it was refused, so
          // a malformed entry looked like nothing had happened at all.
          const saved = await onSave(value);
          if (saved !== false) close();
        }}
        onUpload={onUpload}
        saving={busy === true}
      />

      {/* THE WAY OUT, AND THE HONEST ANSWER — neither of which `ControlFor`
          offers. Every control it renders has a Save and nothing else, so an
          editor opened by mistake had no exit, and a question she genuinely
          cannot answer had no answer but a blank.

          "I am not sure" is a FIRST-CLASS ANSWER here, not a skip: it stores
          `unknown`, which the record renders as "Not sure" and which
          `formatValue` deliberately does not treat as missing. Saying so is
          more use to a mentor than an empty row, and it stops the question
          being asked again. */}
      <div className="mb-edit__acts">
        <button
          type="button"
          className="mb-edit__unsure"
          /* CLOSES ON THE SAME TERMS AS SAVE, because it IS a save. It fired
             and forgot, so answering "I am not sure" left the editor sitting
             open over a row that had just been answered — she had to press
             Cancel to see what she had done. Awaited and closed on success;
             left open on a refusal, so the reason stays on screen. */
          onClick={async () => {
            const saved = await onSave(unknown);
            if (saved !== false) close();
          }}
          disabled={busy === true}
        >
          I am not sure
        </button>
        <button
          type="button"
          className="mb-edit__cancel"
          onClick={close}
          disabled={busy === true}
        >
          {STOP_LABEL}
        </button>
      </div>

      {error ? (
        <p className="mb-note" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Nothing on the record yet: the field's own authored `addPrompt`, live.
 *
 * Never an error colour, and never "not provided" — this is a question nobody
 * has asked her yet, not a gap in her business. The prompt opens the SAME
 * control `/intake` uses, so the two surfaces never ask one question two ways.
 * With nothing to open it stays plain text: a prompt that does nothing is the
 * same broken promise as a source chip that opens nothing.
 *
 * One row picks from her own earlier answers and has nothing to offer until she
 * has given them. There the row says which question to answer first, in place
 * of a prompt that would open a pick with nothing in it.
 */
function Prompt({
  field,
  onEdit,
  change,
}: RowProps & { change: ChangeState }): ReactElement {
  const catalog = catalogFor(field.fieldKey);
  const prompt = catalog ? promptFor(catalog) : ACTION_LABEL.answer;

  if (change.gap) return <p className="mb-prompt mb-prompt--flat">{change.gap}</p>;
  // A PLAIN SPAN, NOT A SECOND BUTTON. The value box around this is already the
  // control, and a button inside a button is invalid markup that a screen
  // reader reports as one confused target. `busy` and `onEdit` are the box's to
  // handle, and it does.
  if (!change.editor && !onEdit) return <p className="mb-prompt mb-prompt--flat">{prompt}</p>;
  return <span className="mb-prompt">{prompt}</span>;
}

/** Both values, both origins, and the question. Never merged, never
 *  last-write-wins — she is the one who decides which is true. */
function Conflict({ field }: { field: RecordFieldPayload }): ReactElement {
  return (
    <div className="mb-conflict">
      <div className="mb-conflict__side">
        <p className="mb-conflict__origin">{field.origin}</p>
        <ValueLines parts={valueLines(field.fieldKey, field.value)} />
      </div>
      {field.conflict ? (
        <div className="mb-conflict__side">
          <p className="mb-conflict__origin">{field.conflict.incomingOrigin}</p>
          <ValueLines parts={valueLines(field.fieldKey, field.conflict.incoming)} />
        </div>
      ) : null}
      <p className="mb-conflict__ask">{CONFLICT_ASK}</p>
    </div>
  );
}

/** origin · source · freshness. The source chip renders ONLY when there is
 *  provenance to open — a chip that opens nothing is worse than no chip. */
function ProvenanceLine({
  field,
  onOpenSource,
}: {
  field: RecordFieldPayload;
  onOpenSource: () => void;
}): ReactElement {
  const source = field.provenance;
  return (
    <p className="gpds-mono mb-prov">
      <span>{field.origin}</span>
      {source ? (
        <>
          <span aria-hidden="true">{SEPARATOR}</span>
          <button type="button" className="mb-prov__src" onClick={onOpenSource}>
            {source.sourceLabel ?? source.type}
          </button>
        </>
      ) : null}
      <span aria-hidden="true">{SEPARATOR}</span>
      <span>{field.freshnessLabel}</span>
    </p>
  );
}

/** The mark on a settled row: a filled circle and a check, at the end of the
 *  value box. Its words are for a screen reader — the shape is the point for
 *  everyone else. */
function RowTick(): ReactElement {
  return (
    <span className="mb-row__tick">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden focusable="false">
        <path
          d="M3 8.5L6.2 11.5L13 4.5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">Answered</span>
    </span>
  );
}

/** The payload types `conversation` loosely so `payload.ts` stays free of the
 *  sheet's shape; the two meet here, at the one call site, and nowhere else. */
function forSheet(provenance: ProvenancePayload): ApiProvenance {
  return { ...provenance, conversation: provenance.conversation as ApiProvenance["conversation"] };
}
