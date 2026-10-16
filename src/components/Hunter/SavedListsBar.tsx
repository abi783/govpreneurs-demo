import { Bookmark } from "lucide-react";
import type { SavedSmartList } from "../../lib/smartList";

export function SavedListsBar({
  lists,
  activeName,
  onApply,
}: {
  lists: SavedSmartList[];
  activeName: string | null;
  onApply: (id: string) => void;
}) {
  if (lists.length === 0) return null;
  return (
    <div className="saved-lists-bar">
      <span className="saved-lists-label">
        <Bookmark size={11} /> Saved lists
      </span>
      <div className="saved-lists-pills">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`saved-list-pill ${activeName === l.name ? "is-active" : ""}`}
            onClick={() => onApply(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>
    </div>
  );
}
