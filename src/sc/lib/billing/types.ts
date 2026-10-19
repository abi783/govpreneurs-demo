/**
 * Shared contracts for wallet sales and their invoices, for every provider.
 *
 * Layer: Entities and Use Case interfaces. This file imports nothing. Every
 * other wallet-invoice file depends on it, and it depends on no file. See
 * docs/goals/wallet-invoices/ARCHITECTURE.md for the owner of each function
 * that uses these types.
 *
 * Money values are major units (dollars), rounded to the cent.
 */

/* ── Split of one price between free credits and the paid balance (spec §4) ── */

/** The input to `planWalletSplit`. `price` is the sale total after any coupon. */
export interface WalletSplitInput {
  price: number;
  /** Free credits as the wallet read reports them, before the 1-cent margin. */
  complimentaryCredits: number;
  /** Paid balance as the wallet read reports it. */
  paidBalance: number;
}

/**
 * The tax seam. It receives the taxable amount and returns the tax.
 * In this build the only implementation returns 0.
 */
export type TaxFor = (taxableAmount: number) => number;

/**
 * A split that the wallet can pay.
 * Invariant: creditsApplied + roundingWriteOff + taxableAmount = price,
 * and paidCharge = taxableAmount + tax.
 */
export interface WalletSplit {
  insufficient: false;
  creditsApplied: number;
  /** Up to 2 cents that the seller absorbs when the 1-cent credit margin leaves a gap. */
  roundingWriteOff: number;
  taxableAmount: number;
  tax: number;
  /** The amount debited from the paid balance. It is also the invoice total. */
  paidCharge: number;
}

/** The paid balance cannot cover `paidCharge`. `shortfall` is the missing amount. */
export interface InsufficientWalletSplit {
  insufficient: true;
  shortfall: number;
}

/** The result of `planWalletSplit`. */
export type WalletSplitResult = WalletSplit | InsufficientWalletSplit;

/** The code that `chargeWallet` returns when a fresh balance no longer covers a split. */
export const BALANCE_CHANGED_CODE = "balance_changed" as const;

/** The 409 message that the four sale routes return for `balance_changed`. */
export const BALANCE_CHANGED_MESSAGE = "Your wallet balance changed. Please try again.";

/* ── The recorded sale (spec §6) ───────────────────────────────────────────── */

/** The kind of sale that a `WalletInvoice` row records. */
export type WalletInvoiceSourceType = "enrollment" | "booking" | "renewal";

/** The life cycle of a `WalletInvoice` row. */
export type WalletInvoiceStatus = "pending" | "created" | "paid" | "failed";

/** The status of a row whose invoice the provider reports as paid. */
export const WALLET_INVOICE_PAID = "paid" satisfies WalletInvoiceStatus;

/**
 * One invoice line at full price, before the coupon.
 * `amount` is the unit price, so amount × quantity is the line total.
 */
export interface InvoiceLine {
  name: string;
  amount: number;
  quantity: number;
}

/** The input to `recordWalletSale(tx, sale)`. The route builds it after a successful charge. */
export interface WalletSaleInput {
  successCenterId: string;
  sourceType: WalletInvoiceSourceType;
  sourceId: string;
  /** The wallet charge description. */
  description: string;
  lines: InvoiceLine[];
  couponCode: string | null;
  /** 0 when there is no coupon. */
  couponDiscount: number;
  /** The sale total after the coupon. */
  price: number;
  /** The split that `chargeWallet` debited. */
  split: WalletSplit;
  currency: string;
  soldAt: Date;
  /** The terms acceptance at checkout (PRD §8.2), with its consent record (US-2). Absent when none was asked for. */
  terms?: { acceptedAt: Date; version: string; consent?: TermsConsentRecord };
}

/**
 * Who accepted the terms, and from where (PRD US-2). Each part is null when
 * the request did not carry it. The row stores it only beside an acceptance,
 * and no screen or API answer shows it.
 */
export interface TermsConsentRecord {
  /** The GHL user id in the request's user token. The server decodes the token and does not verify it. */
  userId: string | null;
  /** The client IP address from the proxy headers. */
  ip: string | null;
  /** The browser's User-Agent header, cut to `TERMS_USER_AGENT_MAX` characters. */
  userAgent: string | null;
}

/**
 * A `WalletInvoice` row with money as numbers. `walletInvoice.ts` converts the
 * Prisma row to this shape. The payload builders receive only this shape.
 */
export interface WalletInvoiceRecord {
  id: string;
  successCenterId: string;
  sourceType: WalletInvoiceSourceType;
  sourceId: string;
  description: string;
  lines: InvoiceLine[];
  couponCode: string | null;
  couponDiscount: number;
  price: number;
  creditsApplied: number;
  roundingWriteOff: number;
  taxableAmount: number;
  tax: number;
  paidCharge: number;
  currency: string;
  soldAt: Date;
}

/** The `SuccessCenter` fields that fill `contactDetails` when the contact lacks them. */
export interface InvoiceCenter {
  accountName: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

/* ── The seller (spec §8) ─────────────────────────────────────────────────── */

/**
 * The seller block of the invoice. `invoiceSeller.ts` holds the value.
 * These are the only seller fields that the gateway documents.
 * The block has no email field.
 */
export interface InvoiceBusinessDetails {
  logoUrl: string;
  name: string;
  phoneNo: string;
  /** The seller address. If it is absent, the gateway sends no address. */
  address?: InvoicePostalAddress;
  website: string;
  customValues?: string[];
}

/* ── The gateway port (spec §5; second-provider design §4) ─────────────────── */

/**
 * The invoice system that issued a row's invoice. The value is stored in
 * `WalletInvoice.provider`. The column default is the first value of this union.
 */
export type InvoiceProvider = "highlevel" | "stripe";

/** Which source a billing address came from (`resolveBillingAddress`). Stored nowhere; it explains a result. */
export type BillingAddressSource = "company_address" | "mailing_zip";

/** A US billing address. `postalCode` is always present: without it a tax engine cannot place the member. */
export interface BillingAddress {
  source: BillingAddressSource;
  line1?: string;
  line2?: string;
  city?: string;
  /** Two-letter US state code. */
  state?: string;
  /** Five digits. */
  postalCode: string;
  country: "US";
}

/** A postal address on an invoice: the seller's, or a billing address without its source. */
export type InvoicePostalAddress = Omit<BillingAddress, "source">;

/** The `SuccessCenter` fields that a gateway reads to find or create the invoice recipient. */
export interface InvoiceRecipientInput extends InvoiceCenter {
  successCenterId: string;
  /** The id of the member's main CRM contact. */
  mainContactId: string | null;
  /** The provider customer id, once the gateway has found or created the customer (FD12). */
  stripeCustomerId: string | null;
  phone: string | null;
  /** Where the member is, in the owner's order (`resolveBillingAddress`). Null when no source holds a ZIP. */
  billingAddress: BillingAddress | null;
}

/**
 * The `SuccessCenter` select that reads the three sources of a billing
 * address: the `company_address` row, `mailingZip` and `stateOfFormation`.
 * `billingAddressFromSources` turns the result into one `BillingAddress`.
 * Every reader of "where the member is" uses this select (FD9).
 */
export const BILLING_ADDRESS_SOURCE_SELECT = {
  mailingZip: true,
  stateOfFormation: true,
  profileFields: { where: { fieldKey: "company_address" }, select: { value: true }, take: 1 },
} as const;

/**
 * The `SuccessCenter` select that reads every `InvoiceRecipientInput` field
 * except `successCenterId` and `billingAddress`. It lives here so that the use
 * case names no provider column. It also reads the three address sources; the
 * use case turns them into `billingAddress`.
 */
export const INVOICE_RECIPIENT_SELECT = {
  mainContactId: true,
  stripeCustomerId: true,
  accountName: true,
  ownerName: true,
  ownerEmail: true,
  phone: true,
  ...BILLING_ADDRESS_SOURCE_SELECT,
} as const;

/**
 * What `createInvoice` reads about the member: the bill-to fallbacks, and where
 * the member is. The use case passes an `InvoiceRecipientInput`, which always
 * carries `billingAddress`. A caller that knows no address (the live test
 * script) can leave it out. A gateway with automatic tax turns it on only
 * when `billingAddress` is set (docs/goals/wallet-tax-receipts/ARCHITECTURE.md §4).
 */
export interface InvoiceSaleCenter extends InvoiceCenter {
  billingAddress?: BillingAddress | null;
}

/** The invoice recipient, as the gateway reads it: the provider's contact or customer. */
export interface InvoiceContact {
  id: string;
  name?: string;
  email?: string;
  companyName?: string;
}

/** A reference to a provider invoice. */
export interface InvoiceRef {
  id: string;
  number?: string;
  /** The hosted page that the member can open, when the provider gives one. */
  url?: string;
}

/** The payment state of a provider invoice. Money is major units (dollars). */
export interface InvoiceState {
  status: string;
  total: number;
  amountPaid: number;
  /** The invoice number as a string. An adapter converts a numeric number. */
  number?: string;
  /** The hosted page that the member can open, when the provider gives one. */
  url?: string;
  /**
   * The tax inside the total, as the provider reports it (major units).
   * Undefined when the provider reports no tax figure. The use case stores it
   * in `WalletInvoice.reportedTax` when the row becomes paid.
   */
  tax?: number;
}

/**
 * The port through which the use cases reach the invoice system.
 * One adapter per `InvoiceProvider` value implements it, outside this folder.
 * The composition root lists them. Each adapter builds its own request bodies
 * from the row.
 */
export interface InvoiceGateway {
  /** The provider that this gateway writes to. The use case stores it on the row. */
  readonly provider: InvoiceProvider;
  /** The `lastError` code when `resolveRecipient` returns null. */
  readonly recipientNotFoundCode: string;
  /**
   * True when a $0.00 invoice still needs `recordPayment` to reach the paid
   * status, for a provider that finalises a draft only when it is paid.
   */
  readonly paysZeroInvoices: boolean;
  /** Returns a `lastError` code when the gateway cannot send anything, else null. No I/O. */
  unconfiguredReason(): string | null;
  /** Returns the invoice recipient, or null when it does not exist and cannot be made. */
  resolveRecipient(center: InvoiceRecipientInput): Promise<InvoiceContact | null>;
  /** Finds the invoice that carries `reference`. Returns null when none match. */
  findInvoiceByReference(recipient: InvoiceContact, reference: string): Promise<InvoiceRef | null>;
  /** Creates the invoice for the row: lines at full price, discounts, total = `paidCharge`. */
  createInvoice(row: WalletInvoiceRecord, recipient: InvoiceContact, center: InvoiceSaleCenter): Promise<InvoiceRef>;
  /** Reads the payment state of the invoice. */
  getInvoice(invoiceId: string): Promise<InvoiceState>;
  /** Records the wallet payment of the row on the invoice. */
  recordPayment(invoiceId: string, row: WalletInvoiceRecord): Promise<void>;
}

/** What `issueWalletInvoice` and `retryPendingInvoices` receive. */
export interface WalletInvoiceDeps {
  gateway: InvoiceGateway;
  /**
   * Called once, after the use case writes `status = paid` on a row. The
   * composition root binds it to the receipt email. The use case calls it in a
   * `try` of its own, so a failure here never changes the invoice row.
   * Optional: a test or a caller without it sends no receipt email.
   */
  onPaid?: (rowId: string) => Promise<void>;
}

/* ── The receipt email port (docs/goals/wallet-tax-receipts/ARCHITECTURE.md §6) ── */

/** One receipt email, ready to send. The body is plain text. */
export interface ReceiptEmailMessage {
  /** The member's `SuccessCenter` id. The mailer finds the address from it. */
  successCenterId: string;
  subject: string;
  /** Plain text. Lines end with `\n`. */
  body: string;
}

/**
 * What the mailer did. `error` is a short code (`contact_not_found`,
 * `mailer_not_configured`) or the channel's own refusal text. The use case
 * stores it in `WalletInvoice.receiptEmailError`.
 */
export type ReceiptSendResult = { ok: true } | { ok: false; error: string };

/**
 * The port through which the receipt email use case sends mail.
 * An adapter outside this folder implements it. A refusal
 * is a result, not a throw. The mailer never retries: a second message to a
 * member is worse than none.
 */
export interface ReceiptMailer {
  send(message: ReceiptEmailMessage): Promise<ReceiptSendResult>;
}
