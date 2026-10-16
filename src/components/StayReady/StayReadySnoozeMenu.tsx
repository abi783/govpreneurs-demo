import { useState } from "react";
import { Clock } from "lucide-react";
import { snoozeItem } from "../../lib/stayReady";

const OPTIONS = [
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
];

export function StayReadySnoozeMenu({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sr-snooze-wrap">
      <button
        type="button"
        className="sr-snooze-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Clock size={12} /> Remind me later
      </button>
      {open && (
        <div className="sr-snooze-menu" role="menu">
          {OPTIONS.map((o) => (
            <button
              key={o.days}
              type="button"
              className="sr-snooze-opt"
              onClick={() => {
                snoozeItem(itemId, o.days);
                setOpen(false);
              }}
            >
              In {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
