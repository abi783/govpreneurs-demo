/**
 * The words that every member screen uses for the two wallet pools and for
 * how a purchase is paid (design 2026-09-18-wallet-credit-vs-cash §6.2).
 * The sentences about a fully covered purchase are the PRD 1.3.2 copy.
 * Change a string here, and every screen changes with it.
 */

/** The label for the paid balance: money the member paid in. */
export const WALLET_BALANCE_LABEL = "Wallet balance";

/** The label for the big number on the wallet card: both pools added. */
export const TOTAL_CREDIT_LABEL = "Total credit";

/** The label for the complimentary credit. */
export const PROMOTIONAL_CREDIT_LABEL = "Promotional credit";

/** The note beside the promotional credit (open item C2: product may change the words). */
export const PROMOTIONAL_CREDIT_NOTE = "Used first on purchases. Not refundable.";

/** The label for the part of a price that promotional credit pays. */
export const PROMOTIONAL_DISCOUNT_LABEL = "Promotional discount";

/** The invoice label for the up-to-2-cent gap that the wallet absorbs. */
export const ROUNDING_ADJUSTMENT_LABEL = "Rounding adjustment";

/** The label for the part of a price that the paid balance pays. */
export const FROM_WALLET_LABEL = "From your wallet";

/** Before a purchase that promotional credit pays in full. */
export const CREDIT_COVERS_PURCHASE =
  "Your promotional credit covers this purchase. Nothing will be deducted from your wallet balance.";

/**
 * Names what a short-wallet check compares against the price: both pools
 * together, because promotional credit is spent first on a purchase.
 */
export const WALLET_AND_CREDIT_TOTAL = "Your wallet balance and promotional credit come to";

/** Labels the paid balance after a top-up. A top-up adds to the paid balance only. */
export const WALLET_AFTER_TOP_UP_LABEL = "Your wallet balance will be";

/** After a purchase that promotional credit paid in full. */
export const CREDIT_COVERED_PURCHASE =
  "Your promotional credit covered this purchase. Nothing was deducted from your wallet balance.";

/* ── Receipts in the wallet usage history (PRD §8.5 and the history.doc.* keys) ── */

/** Names a charge's document. The member sees the receipt, never the invoice (owner, 22 Sep 2026). */
export const RECEIPT_LABEL = "Receipt";

/** Opens the provider's receipt document through our receipt route. */
export const VIEW_RECEIPT_LABEL = "View receipt";

/** While the receipt is being issued. PRD `history.doc.preparing`. */
export const RECEIPT_PREPARING_LABEL = "Preparing";

/** For a charge with no receipt. PRD `history.doc.unavailable`. */
export const RECEIPT_UNAVAILABLE_LABEL = "Unavailable";

/**
 * Explains an unavailable receipt. Adapted from PRD
 * `history.doc.unavailableTooltip`, which reads "This purchase was made before
 * invoices were available." A member also sees "Unavailable" when her invoice
 * FAILED — staff see the failure, she does not — and for her that sentence
 * would be false. This one is true in both cases and keeps the PRD's advice.
 */
export const RECEIPT_UNAVAILABLE_NOTE = "No receipt is available for this charge. Contact support for a copy.";

/** Staff only: a receipt that could not be issued. The row's stored reason follows it. */
export const RECEIPT_FAILED_LABEL = "Failed";

/* ── The filters and the row detail in the wallet usage history (PRD §8.4) ── */

/** Labels the type filter. */
export const USAGE_TYPE_FILTER_LABEL = "Type";

/** The type filter value that shows every charge. */
export const USAGE_TYPE_ALL_LABEL = "All";

/** The type filter value for DFY service purchases. */
export const USAGE_TYPE_SERVICES_LABEL = "Services";

/** The type filter value for paid calls. A membership renewal is recorded as a call. */
export const USAGE_TYPE_CALLS_LABEL = "Calls";

/** Labels the date range filter. */
export const USAGE_RANGE_FILTER_LABEL = "Date range";

/** A date range value. */
export const USAGE_RANGE_30_DAYS_LABEL = "Last 30 days";

/** A date range value, and the default. */
export const USAGE_RANGE_90_DAYS_LABEL = "Last 90 days";

/** A date range value. */
export const USAGE_RANGE_12_MONTHS_LABEL = "Last 12 months";

/** A date range value that shows every charge. */
export const USAGE_RANGE_ALL_LABEL = "All time";

/** The history has charges, but the filters show none of them. */
export const USAGE_NO_MATCH = "No charges match these filters.";

/** Labels the full price of a sale, before the discounts. */
export const USAGE_PRICE_LABEL = "Price";

/** Labels how the member paid. */
export const PAYMENT_METHOD_LABEL = "Payment method";

/** The only payment method of a wallet charge. */
export const PAYMENT_METHOD_WALLET = "GovPreneurs wallet";

/** Labels the id of the sale: the service enrollment or the booking. */
export const ORDER_ID_LABEL = "Order ID";

/** Opens the detail of one charge. */
export const SHOW_CHARGE_DETAIL_LABEL = "Show details";

/** Closes the detail of one charge. */
export const HIDE_CHARGE_DETAIL_LABEL = "Hide details";

/** The copy button. */
export const COPY_LABEL = "Copy";

/** The copy button after the copy worked. */
export const COPIED_LABEL = "Copied";

/** The copy button after the copy failed. */
export const COPY_FAILED_LABEL = "Copy failed";

/** The accessible name of a copy button: what it copies. */
export function copyValueLabel(label: string): string {
  return `${COPY_LABEL} ${label}`;
}

/* ── Paid in full: the invoice notes and the invoice footer ── */

/** The one place that says a wallet sale owes nothing. The sentence below ends with it. */
const NOTHING_DUE_SENTENCE = "Nothing is due.";

/**
 * The first notes line of every provider's invoice. Each gateway calls it with
 * `invoiceDate(row.soldAt)`, so the two invoices cannot say different things.
 */
export function paidInFullInvoiceNote(soldOn: string): string {
  return `Paid in full from your GovPreneurs wallet on ${soldOn}. ${NOTHING_DUE_SENTENCE}`;
}

/* ── The business address before a purchase ── */

/** The title of the address step before a purchase. */
export const BUSINESS_ADDRESS_TITLE = "Your business address";

/** Tells the member why we ask and that the save replaces the address in My Business. */
export const BUSINESS_ADDRESS_NOTE =
  "We need your business address to calculate the tax on your receipt. We save it in My Business. It replaces the business address that is there now.";

/** The label for the first street line. */
export const ADDRESS_LINE1_LABEL = "Street address";

/** The label for the optional second line. */
export const ADDRESS_LINE2_LABEL = "Suite, unit or floor (optional)";

/** The label for the city. */
export const ADDRESS_CITY_LABEL = "City";

/** The label for the state. */
export const ADDRESS_STATE_LABEL = "State";

/** The label for the ZIP code. */
export const ADDRESS_ZIP_LABEL = "ZIP code";

/** The button that saves the address and continues the purchase. */
export const ADDRESS_SUBMIT_LABEL = "Save and continue";

/** The submit button while the save runs. */
export const ADDRESS_SAVING_LABEL = "Saving";

/** The button that closes the address step. The purchase does not continue. */
export const ADDRESS_CANCEL_LABEL = "Cancel";

/** The street line is empty. */
export const ADDRESS_LINE1_REQUIRED = "Enter the street address.";

/** The city is empty. */
export const ADDRESS_CITY_REQUIRED = "Enter the city.";

/** The state is empty. */
export const ADDRESS_STATE_REQUIRED = "Enter the state.";

/** The state is not two letters. */
export const ADDRESS_STATE_INVALID = "Enter the state as two letters, for example NC.";

/** The ZIP code is empty. */
export const ADDRESS_ZIP_REQUIRED = "Enter the ZIP code.";

/** The ZIP code is not five digits or ZIP+4. */
export const ADDRESS_ZIP_INVALID = "Enter a ZIP code of five digits, for example 27603, or nine digits, for example 27603-1234.";

/** The server refused the address and sent no sentence of its own. */
export const ADDRESS_SAVE_REFUSED = "We could not save this address. Examine it and try again.";

/* ── The receipt email ── */

/** The subject of the receipt email. It names the service. */
export function receiptEmailSubject(description: string): string {
  return `Your receipt for ${description}`;
}

/** The first line of the receipt email. */
export const RECEIPT_EMAIL_INTRO = "Thank you for your purchase. This email is your receipt.";

/** Labels the service that the member bought. */
export const RECEIPT_SERVICE_LABEL = "Service";

/** Labels the date of the sale. */
export const RECEIPT_DATE_LABEL = "Date";

/** Labels the coupon line on the invoice and in the receipt email. */
export const COUPON_LABEL = "Coupon";

/** The coupon line label, with the coupon code when the sale has one. */
export function couponLabel(code: string | null): string {
  return code ? `${COUPON_LABEL} ${code}` : COUPON_LABEL;
}

/** Labels the amount that the paid balance paid. */
export const RECEIPT_PAID_LABEL = "Paid from your wallet";

/** Labels the receipt number. */
export const RECEIPT_NUMBER_LABEL = "Receipt number";

/** Comes before the receipt link. */
export const RECEIPT_EMAIL_LINK_LABEL = "Open your receipt";

/** Tells the member where else she can find the receipt. */
export const RECEIPT_EMAIL_HISTORY_NOTE =
  "You can also open this receipt from the wallet usage history in your portal.";

/* ── The receipt page ── */

/** Labels the member's company on the receipt page. */
export const RECEIPT_BILLED_TO_LABEL = "Billed to";

/** Labels the tax that is inside the price. The page shows it only when the provider reported tax above 0. */
export const RECEIPT_TAX_INCLUDED_LABEL = "Includes tax";

/** Comes before the support address on the receipt page. */
export const RECEIPT_SUPPORT_LABEL = "Questions about this receipt";

/** The label of one item line: the name alone for quantity 1, else the name and the count. */
export function receiptItemLabel(name: string, quantity: number): string {
  return quantity === 1 ? name : `${name} × ${quantity}`;
}

/* ── Summit centres: what membership adds (2026-09-27) ── */

/** The Your Mentor card on a Summit centre: no primary mentor until membership. */
export const SUMMIT_MENTOR_LOCK_TITLE = "A primary mentor comes with membership";

/** Why, and what they can do meanwhile. */
export const SUMMIT_MENTOR_LOCK_BODY =
  "Until then, you can book a call with any mentor from the Mentors page.";

/** The roadmap gate on a General Admission Summit centre. */
export const SUMMIT_ROADMAP_LOCK_TITLE = "Your roadmap is for members";

/** Why the roadmap is not there. */
export const SUMMIT_ROADMAP_LOCK_BODY =
  "Your Summit ticket opened your Success Center. The roadmap opens with membership.";

/** The one thing to do about either lock. */
export const SUMMIT_LOCK_UPGRADE = "Recharge your wallet to upgrade to membership.";

/**
 * What happens to the ticket money. It arrives as complimentary credit (the
 * portal calls it promotional credit), never as paid balance, so the sentence
 * says so.
 */
export const SUMMIT_LOCK_CREDIT_NOTE =
  "When you become a member, what you paid for your Summit ticket is credited to your wallet as promotional credit.";

/** The 403 body from assign-mentor for a Summit centre. */
export const SUMMIT_MENTOR_API_MESSAGE =
  "A primary mentor comes with membership. You can book any mentor from the Mentors page.";

/** The 403 body from enroll, book-call and book-delivery for a General Admission centre. */
export const SUMMIT_ROADMAP_API_MESSAGE =
  "The roadmap is for members. Recharge your wallet to upgrade to membership.";

/**
 * The 409 body from enroll when she already owns the service (PRD §8.5
 * `error.alreadyPurchased`). It names the service, because a bundle can hold
 * several.
 */
export function alreadyPurchasedMessage(serviceTitle: string): string {
  return `You already have ${serviceTitle}. You can follow its progress on your roadmap.`;
}

/**
 * The sentence when the wallet provider refuses a charge. The member never
 * sees the provider's own reply: it can be raw JSON from HighLevel.
 */
export const WALLET_CHARGE_FAILED_MESSAGE =
  "We could not take the payment from your wallet. Please try again in a few minutes, and contact us if it keeps happening.";

/* ── Pilot checkout and success view (PRD §8.2, §8.3) ──
   Final wording (owner, 30 Sep 2026): the placeholders of 28 Sep became the
   final words, in sentence case. The member sees a RECEIPT, never an
   invoice, so no string here says "invoice" (owner, 30 Sep 2026). Only pilot
   members see this block (`purchaseConfirmation.ts`). The two links
   (`TERMS_URL`, `REFUND_POLICY_URL`) go to the company's official pages on
   its public website (owner, 5 Oct 2026). The checkout opens them in a new
   tab. The pages live outside this app, so a person changes their text on
   govpreneurs.com, not here. The HighLevel invoice notes print the same two
   links. */

/** The Service Terms link: the official terms and conditions page on govpreneurs.com. */
export const TERMS_URL = "https://govpreneurs.com/terms-and-conditions/";

/** The Refund Policy link: the official refund policy page on govpreneurs.com. */
export const REFUND_POLICY_URL = "https://govpreneurs.com/refund-policy/";

/** The invoice notes line with the two legal links. The caller passes absolute links. */
export function legalLinksInvoiceNote(termsUrl: string, refundPolicyUrl: string): string {
  return `Service terms: ${termsUrl} · Refund policy: ${refundPolicyUrl}`;
}

/** The terms checkbox label, in parts, so the two link words can be links. */
export const CHECKOUT_TERMS_PREFIX = "I agree to the ";
/** The link text of the Service Terms. */
export const CHECKOUT_TERMS_LINK = "Terms";
/** The word between the two links. */
export const CHECKOUT_TERMS_JOIN = " and ";
/** The link text of the Refund Policy. */
export const CHECKOUT_REFUND_LINK = "Refund Policy";

/** Shown when she presses Pay before ticking the terms box. Also the text for a 400 terms_required. */
export const CHECKOUT_TERMS_REQUIRED = "Tick the terms box to continue.";

/** The government fee disclosure for SAM.gov registration (PRD §8.8 modal.govFeeDisclosure.sam). */
export const CHECKOUT_GOV_FEE_SAM =
  "Registering on SAM.gov is free from the U.S. government. You are paying GovPreneurs to prepare and file your registration for you.";

/** The tax line under the breakdown. It has no amount: the provider computes the tax after the purchase. */
export const CHECKOUT_TAX_INCLUDED = "Sales tax included in base price (if any)";

/** The receipt note under the terms (PRD §8.8 invoiceNote). */
export const CHECKOUT_INVOICE_NOTE =
  "An email will be sent to you with the corresponding receipt. You can also find it in your billing history shortly after the payment.";

/** The success title (PRD §8.8 success.title). */
export function purchaseSuccessTitle(serviceName: string): string {
  return `You're enrolled in ${serviceName}`;
}

/** The receipt line while the receipt is not ready. */
export const PURCHASE_INVOICE_PREPARING = "Preparing your receipt…";

/** The receipt line when it is ready. The number is absent when the provider gave none. */
export function purchaseInvoiceReady(invoiceNumber: string | undefined): string {
  return invoiceNumber ? `Receipt ${invoiceNumber}` : "Receipt ready";
}

/** The link to the receipt. */
export const PURCHASE_VIEW_INVOICE = "View receipt";

/** The receipt line after 60 seconds with no receipt, or when no receipt will come. */
export const PURCHASE_INVOICE_LATER = "Your receipt will appear in your billing history.";

/** The link to the billing history. */
export const PURCHASE_BILLING_HISTORY = "View billing history";

/** The button that closes the success view. */
export const PURCHASE_DONE = "Done";

/** The toast when the receipt becomes ready after she closed the success view. */
export function invoiceReadyToast(invoiceNumber: string | undefined): string {
  return invoiceNumber ? `Your receipt ${invoiceNumber} is ready` : "Your receipt is ready";
}

/** The toast's link word. */
export const INVOICE_TOAST_VIEW = "View";
