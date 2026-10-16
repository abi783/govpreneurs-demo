import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, X, HelpCircle } from "lucide-react";
import {
  FIELD_META,
  OPERATOR_LABEL,
  countMatches,
  defaultValueForField,
  makeEmptyCondition,
  makeEmptyGroup,
  type Condition,
  type ConditionField,
  type ConditionGroup,
  type ConditionOperator,
  type ConditionValue,
  type SmartList,
} from "../../lib/smartList";

// ───── Tiny dropdown primitive (reuses chip-popover styles) ─────

function Dropdown({
  value,
  width,
  children,
  panelWidth = 220,
}: {
  value: string;
  width?: number;
  children: (close: () => void) => React.ReactNode;
  panelWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="sl-dd-anchor" style={{ width }}>
      <button type="button" className="sl-dd-btn" onClick={() => setOpen((o) => !o)}>
        <span className="sl-dd-value">{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="sl-dd-panel" style={{ width: panelWidth }} role="listbox">
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}

function DropdownSingle({
  value,
  options,
  onChange,
  width,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  width?: number;
}) {
  return (
    <Dropdown value={value || "Select…"} width={width}>
      {(close) => (
        <div className="chip-pop-list">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="chip-pop-pickrow"
              onClick={() => {
                onChange(opt);
                close();
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

function DropdownMulti({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const label =
    value.length === 0
      ? "Select…"
      : value.length === 1
        ? value[0]
        : `${value[0]} +${value.length - 1}`;
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <Dropdown value={label}>
      {() => (
        <div className="chip-pop-list">
          {options.map((opt) => (
            <label key={opt} className="chip-pop-row">
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

function ValueNumberInput({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <span className="sl-num-wrap">
      <input
        type="number"
        className="sl-num-input"
        aria-label={suffix ? `Value (${suffix})` : "Value"}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {suffix && <span className="sl-num-suffix">{suffix}</span>}
    </span>
  );
}

function ValueDollarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const display = value >= 1000 ? Math.round(value / 1000) : value;
  return (
    <span className="sl-num-wrap">
      <span className="sl-num-prefix">$</span>
      <input
        type="number"
        className="sl-num-input"
        aria-label="Dollar value (thousands)"
        value={display || ""}
        onChange={(e) => onChange((Number(e.target.value) || 0) * 1000)}
      />
      <span className="sl-num-suffix">K</span>
    </span>
  );
}

// ───── Value control router ─────

function ValueControl({
  cond,
  onChange,
}: {
  cond: Condition;
  onChange: (v: ConditionValue) => void;
}) {
  const meta = FIELD_META[cond.field];
  if (cond.field === "contractValue") {
    if (cond.operator === "between") {
      const v = Array.isArray(cond.value) ? (cond.value as [number, number]) : [0, 0];
      return (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <ValueDollarInput value={Number(v[0])} onChange={(n) => onChange([n, Number(v[1])])} />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>and</span>
          <ValueDollarInput value={Number(v[1])} onChange={(n) => onChange([Number(v[0]), n])} />
        </span>
      );
    }
    return <ValueDollarInput value={Number(cond.value)} onChange={onChange} />;
  }
  if (cond.field === "closesWithin") {
    return <ValueNumberInput value={Number(cond.value)} onChange={onChange} suffix="days" />;
  }
  if (cond.operator === "is_any_of" || meta.valueKind === "multi") {
    const arr = Array.isArray(cond.value) ? (cond.value as string[]) : [String(cond.value)];
    if (cond.operator === "is_any_of") {
      return (
        <DropdownMulti value={arr} options={meta.options ?? []} onChange={(v) => onChange(v)} />
      );
    }
    return (
      <DropdownSingle
        value={String(cond.value)}
        options={meta.options ?? []}
        onChange={(v) => onChange(v)}
      />
    );
  }
  return (
    <DropdownSingle
      value={String(cond.value)}
      options={meta.options ?? []}
      onChange={(v) => onChange(v)}
    />
  );
}

// ───── Group & list components ─────

const JOIN_HELP =
  "all = must match every condition (narrows results) · any = match at least one (broadens results)";

function JoinSelector({
  join,
  onChange,
  label,
}: {
  join: "AND" | "OR";
  onChange: (j: "AND" | "OR") => void;
  label: "wordy" | "andor";
}) {
  const display =
    label === "wordy" ? (join === "AND" ? "all" : "any") : join === "AND" ? "and" : "or";
  return (
    <span className="sl-join">
      <Dropdown value={display} panelWidth={120}>
        {(close) => (
          <div className="chip-pop-list">
            {(["AND", "OR"] as const).map((j) => (
              <button
                key={j}
                type="button"
                className="chip-pop-pickrow"
                onClick={() => {
                  onChange(j);
                  close();
                }}
              >
                {label === "wordy" ? (j === "AND" ? "all" : "any") : j === "AND" ? "and" : "or"}
              </button>
            ))}
          </div>
        )}
      </Dropdown>
      <span className="sl-join-help" title={JOIN_HELP}>
        <HelpCircle size={11} />
      </span>
    </span>
  );
}

function ConditionRow({
  cond,
  onUpdate,
  onRemove,
}: {
  cond: Condition;
  onUpdate: (patch: Partial<Condition>) => void;
  onRemove: () => void;
}) {
  const meta = FIELD_META[cond.field];
  const fieldOptions = (Object.keys(FIELD_META) as ConditionField[]).map(
    (k) => FIELD_META[k].label,
  );
  const fieldLabelToKey = (lbl: string): ConditionField =>
    (Object.keys(FIELD_META) as ConditionField[]).find((k) => FIELD_META[k].label === lbl) ??
    "workType";

  return (
    <div className="sl-row">
      <DropdownSingle
        value={meta.label}
        options={fieldOptions}
        onChange={(lbl) => {
          const nextField = fieldLabelToKey(lbl);
          const nextOp = FIELD_META[nextField].operators[0];
          onUpdate({
            field: nextField,
            operator: nextOp,
            value: defaultValueForField(nextField, nextOp),
          });
        }}
        width={150}
      />
      <DropdownSingle
        value={OPERATOR_LABEL[cond.operator]}
        options={meta.operators.map((op) => OPERATOR_LABEL[op])}
        onChange={(lbl) => {
          const nextOp =
            (Object.keys(OPERATOR_LABEL) as ConditionOperator[]).find(
              (op) => OPERATOR_LABEL[op] === lbl,
            ) ?? cond.operator;
          onUpdate({
            operator: nextOp,
            value: defaultValueForField(cond.field, nextOp),
          });
        }}
        width={120}
      />
      <ValueControl cond={cond} onChange={(v) => onUpdate({ value: v })} />
      <button type="button" className="sl-row-x" aria-label="Remove condition" onClick={onRemove}>
        <X size={14} />
      </button>
    </div>
  );
}

function GroupCard({
  group,
  index,
  canRemove,
  onUpdateGroup,
  onRemoveGroup,
}: {
  group: ConditionGroup;
  index: number;
  canRemove: boolean;
  onUpdateGroup: (next: ConditionGroup) => void;
  onRemoveGroup: () => void;
}) {
  const updateCond = (id: string, patch: Partial<Condition>) =>
    onUpdateGroup({
      ...group,
      conditions: group.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const removeCond = (id: string) =>
    onUpdateGroup({ ...group, conditions: group.conditions.filter((c) => c.id !== id) });
  const addCond = () =>
    onUpdateGroup({ ...group, conditions: [...group.conditions, makeEmptyCondition()] });

  return (
    <div className="sl-group">
      <div className="sl-group-head">
        <span className="sl-group-name">Group {index + 1}</span>
        <span className="sl-group-join">
          Match{" "}
          <JoinSelector
            join={group.join}
            onChange={(j) => onUpdateGroup({ ...group, join: j })}
            label="wordy"
          />{" "}
          of these
        </span>
        {canRemove && (
          <button
            type="button"
            className="sl-group-x"
            aria-label="Remove group"
            onClick={onRemoveGroup}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="sl-group-rows">
        {group.conditions.map((c) => (
          <ConditionRow
            key={c.id}
            cond={c}
            onUpdate={(patch) => updateCond(c.id, patch)}
            onRemove={() => removeCond(c.id)}
          />
        ))}
      </div>
      <button type="button" className="sl-add-row" onClick={addCond}>
        <Plus size={12} /> Add condition
      </button>
    </div>
  );
}

// ───── Main builder ─────

export function SmartListBuilder({
  initial,
  onApply,
  onClear,
  onClose,
  onSave,
}: {
  initial: SmartList;
  onApply: (list: SmartList) => void;
  onClear: () => void;
  onClose: () => void;
  onSave: (name: string, list: SmartList) => void;
}) {
  const [draft, setDraft] = useState<SmartList>(initial);
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");

  const matchCount = useMemo(() => countMatches(draft), [draft]);

  const updateGroup = (id: string, next: ConditionGroup) =>
    setDraft({ ...draft, groups: draft.groups.map((g) => (g.id === id ? next : g)) });
  const removeGroup = (id: string) =>
    setDraft({ ...draft, groups: draft.groups.filter((g) => g.id !== id) });
  const addGroup = () => {
    if (draft.groups.length >= 2) return;
    setDraft({ ...draft, groups: [...draft.groups, makeEmptyGroup()] });
  };

  return (
    <div className="sl-builder" role="region" aria-label="Build a smart list">
      <div className="sl-builder-head">
        <div>
          <div className="sl-builder-title">Build a smart list</div>
          <div className="sl-builder-sub">Show opportunities that match…</div>
        </div>
        <button type="button" className="sl-builder-x" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="sl-builder-body">
        {draft.groups.map((g, i) => (
          <div key={g.id}>
            <GroupCard
              group={g}
              index={i}
              canRemove={draft.groups.length > 1}
              onUpdateGroup={(next) => updateGroup(g.id, next)}
              onRemoveGroup={() => removeGroup(g.id)}
            />
            {i < draft.groups.length - 1 && (
              <div className="sl-between-groups">
                <JoinSelector
                  join={draft.groupJoin}
                  onChange={(j) => setDraft({ ...draft, groupJoin: j })}
                  label="andor"
                />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="sl-add-group"
          onClick={addGroup}
          disabled={draft.groups.length >= 2}
        >
          <Plus size={12} /> Add group
        </button>
      </div>

      <div className="sl-builder-foot">
        <button type="button" className="sl-foot-ghost" onClick={onClear}>
          Clear
        </button>
        <div className="sl-foot-right">
          <span className={`sl-count ${matchCount === 0 ? "sl-count--zero" : ""}`}>
            {matchCount === 0
              ? "No matches — try changing 'all' to 'any' in a group to broaden"
              : `≈ ${matchCount} opportunit${matchCount === 1 ? "y" : "ies"} match`}
          </span>
          {saveMode ? (
            <span className="sl-save-inline">
              <input
                autoFocus
                type="text"
                className="sl-save-input"
                placeholder="Name this list…"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button
                type="button"
                className="sl-foot-primary"
                disabled={!saveName.trim()}
                onClick={() => {
                  onSave(saveName.trim(), draft);
                  setSaveMode(false);
                  setSaveName("");
                }}
              >
                Save
              </button>
              <button type="button" className="sl-foot-ghost" onClick={() => setSaveMode(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <>
              <button type="button" className="sl-foot-ghost" onClick={() => setSaveMode(true)}>
                Save as list
              </button>
              <button type="button" className="sl-foot-primary" onClick={() => onApply(draft)}>
                Apply
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
