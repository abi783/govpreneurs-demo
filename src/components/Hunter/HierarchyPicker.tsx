import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import type { AgencyNode } from "../../lib/vocab/filterOptions";

export function HierarchyPicker({
  nodes,
  selected,
  onChange,
}: {
  nodes: AgencyNode[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <ul className="of-tree" role="tree">
      {nodes.map((n) => (
        <TreeNode key={n.id} node={n} depth={0} selected={selected} onChange={onChange} />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  selected,
  onChange,
}: {
  node: AgencyNode;
  depth: number;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const hasKids = !!node.children?.length;
  const [open, setOpen] = useState(depth < 1);
  const isOn = selected.includes(node.id);

  const toggle = () => {
    if (isOn) onChange(selected.filter((v) => v !== node.id));
    else onChange([...selected, node.id]);
  };

  return (
    <li role="treeitem" aria-expanded={hasKids ? open : undefined}>
      <div className="of-tree-node" style={{ paddingLeft: `${depth * 14}px` }}>
        {hasKids ? (
          <button
            type="button"
            className="of-tree-twirl"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className="of-tree-twirl of-tree-twirl--empty" aria-hidden />
        )}
        <button
          type="button"
          className={`of-option of-option--compact${isOn ? " of-option--on" : ""}`}
          onClick={toggle}
          aria-pressed={isOn}
        >
          <span className={`of-option__box${isOn ? " is-on" : ""}`} aria-hidden>
            {isOn && <Check size={11} strokeWidth={3} />}
          </span>
          <span className="of-option__label">{node.label}</span>
        </button>
      </div>
      {hasKids && open && (
        <ul role="group">
          {node.children!.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              selected={selected}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
