/**
 * Which control changes a row, and what it is seeded with. Pure.
 *
 * `Row.tsx` renders a value; `ControlFor` edits one. The translation is a
 * decision rather than markup, so it lives here where it can be tested without
 * a browser: the record holds an `MbValue`, a control takes the shape ON DISK,
 * and four upload rows get no control at all.
 *
 * A legacy row is seeded with `fromMb(key, value)[key]` and what comes back is
 * stored unchanged — `ControlFor`'s `onSave` shapes ARE the legacy storage
 * shapes, which is why the storage never moves. Four `mb` keys borrow a
 * registry control and are lifted back through `parseMbValue`; seven kinds
 * that fit none get `MbControlField` (`mbEditor.ts`).
 *
 * `service_to_sell_to_government` takes its options from her own earlier
 * answers via `servicesFrom`, which is why this takes the rest of her record.
 *
 * A key that is not its row's own key gets no editor — `can_get_bonding` and
 * the four `LEGACY_KEYS` are folded into a host row and never rendered alone.
 */

import { copyFor, FIELDS_BY_ID, ownRow, specOf, type CatalogField } from "./catalog";
import { fieldKeyFor } from "./crosswalk";
import { fromMb, storageFor, WIDENED_KEYS } from "./legacyShapes";
import {
  isMbControlKind,
  mbControlFor,
  mbShownIn,
  mbWireFrom,
  type MbControlField,
} from "./mbEditor";
import {
  isUnknownValue,
  MbValueError,
  parseMbValue,
  type MbType,
  type MbValue,
  type RecordLookup,
} from "./mbValue";
import {
  fieldDef,
  type ControlKind,
  type RegistryField,
  type RegistryOption,
  type SectionId,
} from "./registry";
import { pickFromYourListNote, servicesFrom } from "./servicesFrom";
import { legacyProblem , textShapeProblem } from "./storedValue";

/**
 * A registry field needs a section and a catalog row has a part instead. The
 * borrowed control never reads it — it is here to satisfy the shared type, and
 * nothing groups the record by section.
 */
const UNSECTIONED: SectionId = "company";

/** The `mbType`s that map one-to-one onto a registry control. The seven with an
 *  editor of their own are `mbEditor.ts`'s. */
const BORROWED_CONTROL = {
  text: "text",
  "long-text": "long-text",
  choice: "radio",
  choices: "checkbox",
} as const satisfies Partial<Record<MbType, ControlKind>>;

type BorrowedType = keyof typeof BORROWED_CONTROL;

function isBorrowed(mbType: MbType): mbType is BorrowedType {
  return mbType in BORROWED_CONTROL;
}

/** Either kind of field `ControlFor` dispatches on. The two `control` unions
 *  are disjoint, so one switch handles both without a second seam. */
export type EditorField = RegistryField | MbControlField;

export interface RowEditor {
  /** The control she types into — a registry field where one fits, and an
   *  `MbControlField` for the seven kinds no registry control describes. */
  control: EditorField;
  /** Her current answer, in the shape that control takes. */
  initialValue: unknown;
}


/** A registry field around a catalog row, so a new key can borrow an editor. */
function borrowedControl(
  field: CatalogField,
  key: string,
  mbType: BorrowedType,
  options: RegistryOption[] | undefined,
): RegistryField {
  const copy = copyFor(field);
  return {
    key,
    label: copy.label,
    section: UNSECTIONED,
    control: BORROWED_CONTROL[mbType],
    required: false,
    helper: copy.helper,
    whyItMatters: copy.whyItMatters,
    options,
  };
}

/** A radio or a checkbox with nothing on it is a control that cannot hold the
 *  answer its label asks for. */
function isPick(control: ControlKind): boolean {
  return control === "radio" || control === "checkbox";
}

/**
 * The source row as `servicesFrom` reads it: her list, lowered back to the
 * shape ON DISK. The lowering is `legacyShapes`', and the reading is
 * `servicesFrom`'s — the same function `/intake` fills this radio with, so the
 * two surfaces cannot offer different answers to the same question. A source
 * that stores an `MbValue` rather than a `string[]` would read back as nothing;
 * the suite pins that no `optionsFrom` row points at one.
 */
function storedSource(sourceId: string, record: RecordLookup | undefined): { value: unknown } | undefined {
  const key = fieldKeyFor(sourceId);
  const value = record?.(sourceId);
  if (!key || !value) return undefined;
  return { value: fromMb(key, value)[key] };
}

/**
 * The options this row offers her: the catalog's own, or — where the row picks
 * from her own earlier answers — the list she wrote. Undefined either way when
 * there is nothing to offer, which is what closes the editor below.
 */
function optionsFor(field: CatalogField, record: RecordLookup | undefined): RegistryOption[] | undefined {
  const sourceId = field.optionsFrom;
  if (!sourceId) return copyFor(field).options;
  return servicesFrom(storedSource(sourceId, record))?.map((service) => ({
    value: service,
    label: service,
  }));
}

/**
 * Her other answers, by the catalog id `optionsFrom` names, over the record as
 * a screen holds it.
 *
 * THE BOUNDARY IS HERE, ONCE: `optionsFrom` names a catalog id and a row is
 * keyed by a field key, and three ids are spelled the same as an unrelated key.
 * Every screen builds its lookup with this rather than crossing that boundary
 * itself.
 */
export function recordLookup(
  fields: readonly { fieldKey: string; value: MbValue }[],
): RecordLookup {
  const byKey = new Map(fields.map((f) => [f.fieldKey, f.value]));
  return (catalogId) => {
    const key = fieldKeyFor(catalogId);
    return key ? byKey.get(key) : undefined;
  };
}

/**
 * Why this row cannot be opened yet, in words she can act on — or null when
 * there is no such reason, which is every row but one.
 *
 * A row whose options ARE her own earlier answers has nothing to offer until
 * she has given them. Saying so is the only honest thing it can do: an empty
 * radio is a control that cannot hold the answer its label asks for, and this
 * field is one of the fourteen, so a member who cannot answer it cannot send
 * her intake at all.
 */
export function editorGap(fieldKey: string, record?: RecordLookup): string | null {
  const field = ownRow(fieldKey);
  const sourceId = field?.optionsFrom;
  if (!sourceId || optionsFor(field, record)?.length) return null;
  return pickFromYourListNote(copyFor(FIELDS_BY_ID[sourceId]).label);
}

/** What the control shows when she opens it: her answer, in the control's terms. */
function shownIn(mbType: BorrowedType, value: MbValue): unknown {
  if (value.kind === "text" && (mbType === "text" || mbType === "long-text")) return value.text;
  if (value.kind === "choice" && mbType === "choice") return value.value;
  if (value.kind === "choices" && mbType === "choices") return value.options.map((o) => o.value);
  return undefined;
}

/** The control's answer as `parseMbValue` takes it, or null when it is not one. */
function wireFrom(mbType: BorrowedType, answer: unknown): unknown {
  if (mbType === "text" || mbType === "long-text") {
    return typeof answer === "string" ? { kind: "text", text: answer } : null;
  }
  if (mbType === "choice") {
    return typeof answer === "string" ? { kind: "choice", value: answer } : null;
  }
  if (!Array.isArray(answer)) return null;
  return { kind: "choices", options: answer.map((value) => ({ value })) };
}

/**
 * The wire payload for whichever sort of control this row has, or null when the
 * row has no editor at all. Both halves feed the ONE parser.
 *
 * Exported because the model extractor (`tellModel.ts`) treats a candidate as
 * what the row's own editor would have handed over, and must not build the
 * `kind` literals a second time — a `kind` written twice is a kind that drifts.
 */
export function wirePayloadFor(mbType: MbType, answer: unknown): unknown {
  if (isBorrowed(mbType)) return wireFrom(mbType, answer);
  return isMbControlKind(mbType) ? mbWireFrom(mbType, answer) : null;
}

/**
 * Keys the RECORD answers with a richer control than the registry's.
 *
 * THE SAME LIST the storage widening uses (`WIDENED_KEYS`), imported rather
 * than restated: the control she edits with and the shape the row can hold are
 * one decision, and holding it twice is how a row starts saving in a shape
 * nothing renders. `/intake` keeps the registry control for all of them —
 * `registry.ts` is frozen, and a stranger part-way through a public form should
 * not be handed five boxes and a file picker.
 */
// DEMO: `past_performance` opens the jobs editor (all jobs, with dates and a reference),
// not the one-project box. See `storageFor` in legacyShapes.ts.
const RICHER_THAN_REGISTRY: ReadonlySet<string> = new Set([...WIDENED_KEYS, "past_performance"]);

/**
 * The control this row is answered or changed with, seeded with what is on the
 * record — or null where there is no editor for it, so the row can say nothing
 * rather than promise something.
 */
export function rowEditor(fieldKey: string, value: MbValue, record?: RecordLookup): RowEditor | null {
  const field = ownRow(fieldKey);
  const def = RICHER_THAN_REGISTRY.has(fieldKey) ? undefined : fieldDef(fieldKey);
  // A legacy control's `onSave` shape IS the shape on disk, uploads included:
  // `fileAdapter` carries a stored file through both ways, untouched.
  if (def) {
    // Its options may still be hers rather than the registry's: one of the
    // fourteen deliberately carries none and is filled from her own list.
    const options = field ? optionsFor(field, record) : def.options;
    if (isPick(def.control) && !options?.length) return null;
    // And its helper may be the catalog's, on the rows the registry left with a
    // label and nothing else — `copyFor` resolves that, and cannot override a
    // registry line, so this stays one wording per question rather than two.
    const copy = field ? copyFor(field) : undefined;
    return {
      control: {
        ...def,
        helper: copy?.helper ?? def.helper,
        whyItMatters: copy?.whyItMatters ?? def.whyItMatters,
        options,
      },
      initialValue: fromMb(fieldKey, value)[fieldKey],
    };
  }

  if (!field) return null;
  if (isBorrowed(field.mbType)) {
    const options = optionsFor(field, record);
    if (isPick(BORROWED_CONTROL[field.mbType]) && !options?.length) return null;
    return {
      control: borrowedControl(field, fieldKey, field.mbType, options),
      initialValue: shownIn(field.mbType, value),
    };
  }
  if (!isMbControlKind(field.mbType)) return null;
  return {
    control: mbControlFor(field, fieldKey, field.mbType, copyFor(field)),
    initialValue: mbShownIn(field.mbType, value),
  };
}

/**
 * A row answered by sending a file rather than by typing.
 *
 * The registry's `upload` and the catalog's `file` are the same question under
 * two storage shapes. A screen with nowhere to send a file must not open this
 * editor at all — a prompt that opens an empty box is the same broken promise as
 * a source chip that opens nothing.
 */
export function isDocumentEditor(editor: RowEditor): boolean {
  return editor.control.control === "upload" || editor.control.control === "file";
}

/**
 * What the control's answer becomes under this key, or null when the record
 * cannot take it.
 *
 * A legacy key stores the control's shape unchanged — that is the invariant the
 * whole port is built on. A new key stores a parsed `MbValue`, validated by the
 * single parser against the row's own options, so a refusal (an answer past the
 * record's caps, an option that is not on the row) is a null she can be told
 * about rather than an exception thrown mid-keystroke.
 */
export function storedFrom(fieldKey: string, answer: unknown): { value: unknown } | null {
  const lowered = lowerForSave(fieldKey, answer);
  return lowered.ok ? { value: lowered.value } : null;
}

/** What the record will store, or why it will not — in HER words where the rule
 *  has any. */
export type Lowered =
  | { ok: true; value: unknown }
  | { ok: false; message: string | null };

/**
 * Why this answer would be refused, in her words — or null when it would not.
 *
 * The same gate `saveField` uses, asked while she is still typing. A control
 * that runs its own check would drift from the one that decides; this cannot,
 * because it IS that one.
 *
 * Null for an empty answer: nothing typed is an unanswered row, not a wrong
 * one. Null too where the rule has no member-facing sentence — the caller has
 * nothing worth putting on screen then, and the save still refuses it.
 */
export function fieldProblem(fieldKey: string, answer: unknown): string | null {
  if (answer === "" || answer === null || answer === undefined) return null;
  const lowered = lowerForSave(fieldKey, answer);
  return lowered.ok ? null : lowered.message;
}

/**
 * The same lowering as `storedFrom`, keeping the refusal's own sentence.
 *
 * `storedFrom` answers null for every refusal, which is all its callers need
 * but is not all the MEMBER needs: `parseMbValue` writes a sentence she can act
 * on for the rules that have one — the shape of a UEI, of a PSC code, of an EIN
 * — and collapsing that to null is why a malformed entry used to vanish with
 * no explanation. `message` is null where the rule has no member-facing wording
 * (a cap, a payload shape); the caller shows its own sentence then.
 */
export function lowerForSave(fieldKey: string, answer: unknown): Lowered {
  /* "I AM NOT SURE" TRAVELS AS ITSELF, on every key.

     THIS IS THE ONE THAT MADE THE BUTTON DO NOTHING. Every check below is
     about the shape of an answer, and this answer has no shape — so
     `wirePayloadFor` returned null for an `mb` key and `legacyProblem`
     rejected it on a legacy one. 39 of the 77 keys never sent the request at
     all, and 38 of those returned `message: null`, which the row renders as
     no message: she pressed the button and the screen did not move.

     Ahead of `textShapeProblem` too, for the same reason the server puts it
     first: `year_started_operating` answered the button by telling her to put
     the year on its own as four digits. */
  if (isUnknownValue(answer)) return { ok: true, value: answer };

  // The key's own shape rule, before the branch — the same call
  // `acceptStoredValue` makes, so a fixed-width identifier is refused in the
  // browser rather than after a round trip. It spans both branches because the
  // three identifiers do: `ein` and `uei` are legacy keys, `cage_code` is not.
  const shape = textShapeProblem(fieldKey, answer);
  if (shape) return { ok: false, message: shape };

  if (storageFor(fieldKey) === "legacy") {
    // The SAME table the server gates on. Without this a legacy key had no
    // check in the browser at all: a malformed ZIP or year travelled, came back
    // a 422, and only then said what was wrong — while an `mb` key had been
    // refused in place all along.
    const problem = legacyProblem(fieldKey, answer);
    return problem ? { ok: false, message: problem } : { ok: true, value: answer };
  }

  const field = ownRow(fieldKey);
  if (!field) return { ok: false, message: null };
  const raw = wirePayloadFor(field.mbType, answer);
  if (raw === null) return { ok: false, message: null };

  try {
    return { ok: true, value: parseMbValue(raw, specOf(field)) };
  } catch (error) {
    // A value the record refuses is an answer to report, not a crash. Anything
    // else is a fault and is left to surface.
    if (error instanceof MbValueError) return { ok: false, message: error.memberMessage ?? null };
    throw error;
  }
}
