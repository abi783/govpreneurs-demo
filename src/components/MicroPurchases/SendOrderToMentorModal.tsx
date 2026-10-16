// Send-an-order-to-a-mentor dialog. The form and the wallet half live in
// `Mentors/MentorSendModal.tsx`, shared with the opportunity page's dialog;
// this file supplies only what is the small order's own. The "What I'm
// sending" block names the order and its price line, because Grant does not
// analyse small orders and "Grant's take" would be false here.
import type { MicroOrder } from "../../lib/microPurchases/order";
import {
  MentorSendModal,
  type MentorHelpOption,
  type MentorRequest,
} from "../Mentors/MentorSendModal";

export const ORDER_HELP_OPTIONS: MentorHelpOption[] = [
  { label: "Should I quote on this?" },
  {
    label: "Can I supply this part?",
    detail: "(approved sources, qualified list, acquisition code)",
  },
  { label: "Pricing my quote" },
  { label: "Quantity and unit of issue" },
  { label: "Delivery and shipping" },
  { label: "Filling in the quote on DIBBS" },
  { label: "Something else" },
];

export function SendOrderToMentorModal({
  order,
  whatSheIsSending,
  ...rest
}: {
  order: MicroOrder;
  /** One line saying what a mentor would be looking at — the price line. */
  whatSheIsSending: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (request: MentorRequest) => void;
  /** Live wallet balance (USD) from the backend. */
  balance: number;
  /** Per-review charge (USD) from the backend. */
  chargeAmount: number;
  sending?: boolean;
  loading?: boolean;
  error?: string | null;
  locationId?: string;
}) {
  return (
    <MentorSendModal
      {...rest}
      snapshotTitle={order.plainName}
      snapshotLine={whatSheIsSending}
      readLabel="I've read the order and the part details"
      helpOptions={ORDER_HELP_OPTIONS}
      questionPlaceholder={`e.g. "I can get this part from a distributor, but it's not on the approved list. Can I still quote?"`}
      attachHint="Supplier quote, spec sheet, or other supporting file."
    />
  );
}

/** The sentence that says where the mentor's answer arrives, once sent. */
export const ORDER_MENTOR_SENT = "Sent to a mentor. The answer will be in Mentors.";
