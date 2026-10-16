// The sample "order paper" for each small order: a real one-page PDF that the
// "Read the order paper" link downloads. The text comes from the order record,
// so the paper and the order page always agree.

import type { MicroOrder } from "@/lib/microPurchases/order";
import { PERSONA } from "@/demo/story/persona";
import { ORDERS, ORDER_META, SHIP_TO } from "./data";
import { simplePdf } from "./pdf";

function money(n: number | null): string {
  return n == null ? "not stated" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function paperLines(o: MicroOrder): string[] {
  const meta = ORDER_META.get(o.id);
  const ship = meta ? SHIP_TO[meta.shipTo] : null;
  const total = o.quantity != null && o.lastPricePerUnit != null ? o.quantity * o.lastPricePerUnit : null;
  return [
    `Solicitation ${o.solicitation}`,
    `Request for quotations. Issued by ${o.buyer}. Posted ${o.postedOn}.`,
    o.closesOn ? `Quotes are due ${o.closesOn}.` : "No closing date is given.",
    "",
    `Item: ${o.officialName}`,
    `National stock number: ${o.nsn}`,
    `Quantity: ${o.quantity ?? "not stated"} (unit of issue ${o.unitOfIssue ?? "not stated"})`,
    `Acquisition method code: ${o.amc ?? "-"}   Suffix code: ${o.amsc ?? "-"}`,
    o.setAside ? `Set-aside: ${o.setAside}` : "Set-aside: none stated",
    "",
    ship ? `Ship to: ${ship.address}` : "Ship to: see the delivery schedule",
    `Delivery: within ${o.deliveryDays ?? "the stated number of"} days after award.`,
    "Delivery terms: FOB destination is not stated on this paper. Check before you price the freight.",
    o.partNumbers ? `Part numbers named: ${o.partNumbers}` : "No part number is named. Any commercial equal that meets the item name is acceptable.",
    "",
    `Last price paid: ${money(o.lastPricePerUnit)} for each unit. About ${money(total)} for this quantity at that price.`,
    "",
    `Contracting contact: ${o.buyerContact.name}, ${o.buyerContact.email}, ${o.buyerContact.phone ?? "no phone listed"}.`,
    "",
    "How to quote: sign in to DIBBS with your CAGE code, find this solicitation number,",
    "enter your unit price and your delivery days, and submit before the closing date.",
    "",
    `Sample paper made for the ${PERSONA.businessShortName} demo. It is not a real DLA document.`,
  ];
}

/** The PDF bytes for one order paper, or null when the order has none. */
export function orderPaperPdf(id: string): Uint8Array | null {
  const o = ORDERS.find((x) => x.id === id);
  if (!o || !o.paper) return null;
  return simplePdf(`Order paper ${o.solicitation}`, paperLines(o));
}

// Fill in each file size from the real bytes, so "2 KB" is the file she gets.
for (const o of ORDERS) {
  if (o.paper) o.paper.fileSize = orderPaperPdf(o.id)?.length ?? null;
}
