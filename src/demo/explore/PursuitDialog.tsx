// The details of a closed pursuit on the Pipeline: what she sent, or why she
// lost. These two pursuits are not in the feed any more, so there is no
// opportunity page to open. The dialog says what the Army and Air Force told her.

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CLOSED_PURSUITS, closedPursuitDetail } from "@/demo/story/workspace";
import { outcomeDetail, outcomePursuit } from "@/demo/state/outcomes";


export function PursuitDetailDialog({
  closedId,
  open,
  onOpenChange,
}: {
  closedId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // DEMO: a bid Tim played forward to an award (presenter control C2) uses this dialog too.
  const pursuit = CLOSED_PURSUITS.find((c) => c.id === closedId) ?? outcomePursuit(closedId);
  const detail = pursuit ? (closedPursuitDetail(closedId, pursuit.daysAgo) ?? outcomeDetail(closedId)) : null;
  if (!pursuit || !detail) return null;
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md">
        <Modal.Header title={pursuit.title} description={`${pursuit.agency} · ${detail.heading}`} />
        <Modal.Body>
          <p className="t-body" style={{ marginTop: 0 }}>
            {detail.lead}
          </p>
          <ul className="t-body-sm" style={{ paddingLeft: 18, margin: "var(--s-3) 0 0" }}>
            {detail.points.map((p) => (
              <li key={p} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          {detail.link && (
            <Link to={detail.link.to as never} className="btn btn-secondary btn-sm" onClick={() => onOpenChange(false)}>
              {detail.link.label} <ArrowRight size={13} aria-hidden />
            </Link>
          )}
          <Modal.Close asChild>
            <button type="button" className="btn btn-primary btn-sm">
              Close
            </button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
