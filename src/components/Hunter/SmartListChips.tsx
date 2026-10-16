import { X, Pencil } from "lucide-react";
import { conditionToLabel, type SmartList } from "../../lib/smartList";
import { Chip } from "@/components/ui";

export function SmartListChips({
  list,
  onRemoveCondition,
  onEdit,
  onClear,
}: {
  list: SmartList;
  onRemoveCondition: (groupId: string, conditionId: string) => void;
  onEdit: () => void;
  onClear: () => void;
}) {
  return (
    <div className="sl-chips-wrap">
      <div className="sl-chips-head">
        <Chip variant="status" tone="insight">
          Advanced filter active
        </Chip>
        <button type="button" className="sl-chips-link" onClick={onEdit}>
          <Pencil size={11} /> Edit
        </button>
        <button type="button" className="sl-chips-link" onClick={onClear}>
          <X size={11} /> Clear
        </button>
      </div>
      <div className="sl-chips-row">
        {list.groups.map((g, gi) => (
          <span key={g.id} className="sl-chips-group">
            {g.conditions.map((c, ci) => (
              <span key={c.id} className="sl-chips-cluster">
                {ci > 0 && <span className="sl-chips-sep">{g.join === "AND" ? "and" : "or"}</span>}
                <span className="sl-chip-applied">
                  <span>{conditionToLabel(c)}</span>
                  <button
                    type="button"
                    className="sl-chip-x"
                    aria-label="Remove condition"
                    onClick={() => onRemoveCondition(g.id, c.id)}
                  >
                    <X size={10} />
                  </button>
                </span>
              </span>
            ))}
            {gi < list.groups.length - 1 && (
              <span className="sl-chips-group-sep">{list.groupJoin === "AND" ? "AND" : "OR"}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
