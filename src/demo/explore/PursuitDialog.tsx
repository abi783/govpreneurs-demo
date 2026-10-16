// The details of a closed pursuit on the Pipeline: what she sent, or why she
// lost. These two pursuits are not in the feed any more, so there is no
// opportunity page to open. The dialog says what the Army and Air Force told her.

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CLOSED_PURSUITS } from "@/demo/story/workspace";
import { PERSONA } from "@/demo/story/persona";
import { SEYMOUR_FORECAST_KEY } from "./forecastLocalSeeds";

interface Detail {
  heading: string;
  lead: string;
  points: string[];
  link?: { label: string; to: string };
}

function detailFor(id: string, daysAgo: number): Detail | null {
  if (id === "W912PM-26-Q-0009") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Army expects to award in about 3 weeks.`,
      points: [
        "Menus for each holiday event at Fort Bragg Morale, Welfare and Recreation (MWR).",
        "A staffing plan for cooks and servers, with food-handler certificates.",
        "Your references: Riverside Fellowship Church events and Cumberland County summer meals.",
        "Your price: $96,000.",
      ],
      link: { label: "See event catering coming up", to: "/forecasts" },
    };
  }
  if (id === "FA4800-26-Q-0007") {
    return {
      heading: "Debrief notes",
      lead: "The Air Force told you the award went to a firm that priced about 4% lower. Your technical score was equal to the winner's.",
      points: [
        "Your price was close. A small cut per breakfast would have changed the result.",
        `Price breakfast per guest, not per day. Ask the base for the lodging head count before you quote.`,
        `${PERSONA.ownerFirstName}, the next contract is already on the Forecasts page. You know this buyer's number now.`,
      ],
      link: { label: "See the next lodging breakfast forecast", to: `/forecasts/${SEYMOUR_FORECAST_KEY}` },
    };
  }
  if (id === "W81K04-24-Q-0187") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $126,000.",
      points: [
        "You made therapeutic diet trays for the inpatient wards while the kitchen was rebuilt.",
        "The Army has not yet written your performance rating. Ask for an interim rating: Sarah sent you a template.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}

export function PursuitDetailDialog({
  closedId,
  open,
  onOpenChange,
}: {
  closedId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pursuit = CLOSED_PURSUITS.find((c) => c.id === closedId);
  const detail = pursuit ? detailFor(closedId, pursuit.daysAgo) : null;
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
