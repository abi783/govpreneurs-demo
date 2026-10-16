/**
 * The checkout address gate: asks for a business address before a wallet
 * purchase when the member has none that places her for tax.
 *
 * Layer: Interface Adapters (client). No React, so a node test can drive it
 * with a mocked `fetch` (FD3). `useBusinessAddressGate` wraps it for a screen.
 *
 * The gate never blocks a sale on our fault (D1, D2, FD7). If the check
 * fails, the purchase runs. If the save fails with any answer except 422, the
 * purchase runs. Only a 422 (the server refused what she typed) keeps the form
 * open, with the server's sentence.
 */

import type { Address } from "@sc/lib/businessProfile/mbValue";
import { ADDRESS_SAVE_REFUSED } from "@sc/lib/walletCopy";

/** What a screen shows: the form, a save in progress, and the server's sentence. */
export interface AddressGateState {
  asking: boolean;
  saving: boolean;
  error: string | null;
}

/** The gate that one checkout screen holds. */
export interface AddressGate {
  /** Reads GET /billing-address once and keeps the answer. Resolves true when the form must show. */
  check(): Promise<boolean>;
  /**
   * If no address is needed, runs `purchase` at once. Else keeps `purchase`, sets `asking`, and
   * runs it after `submit` succeeds, or after a save failure that is our fault (D2).
   * A `run` while an earlier one is in flight joins it and starts no second purchase.
   */
  run(purchase: () => void | Promise<void>): Promise<void>;
  /** Sends the address to the company_address PUT. */
  submit(address: Address): Promise<void>;
  /** Closes the form. The kept purchase does not run. */
  cancel(): void;
  /** The current state. */
  getState(): AddressGateState;
}

type Purchase = () => void | Promise<void>;

/** The only answer that is about what she typed (FD7). */
const UNPROCESSABLE = 422;

const CLOSED: AddressGateState = { asking: false, saving: false, error: null };

/** The server's sentence from a 422 body, or the fallback sentence. */
async function refusalSentence(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    const error = (body as { error?: unknown } | null)?.error;
    return typeof error === "string" && error.trim() ? error : ADDRESS_SAVE_REFUSED;
  } catch (err) {
    console.warn("[wallet] address refusal had no readable body", err);
    return ADDRESS_SAVE_REFUSED;
  }
}

/** Creates the gate for one member location. `fetchImpl` defaults to the global fetch. */
export function createAddressGate(options: {
  locationId: string;
  onChange: (state: AddressGateState) => void;
  fetchImpl?: typeof fetch;
}): AddressGate {
  const doFetch: typeof fetch = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const base = `/api/portal/${encodeURIComponent(options.locationId)}`;
  let state: AddressGateState = CLOSED;
  let answer: Promise<boolean> | null = null;
  let kept: Purchase | null = null;
  /**
   * The purchase flow in flight: the check, the open form, the save or the
   * purchase itself. A second `run` while it is set joins it and starts no
   * second purchase (a double click). It clears when the flow settles.
   */
  let inFlight: Promise<void> | null = null;

  function setState(next: AddressGateState): void {
    state = next;
    options.onChange(state);
  }

  async function readNeed(): Promise<boolean> {
    try {
      const res = await doFetch(`${base}/billing-address`, { cache: "no-store" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = (await res.json()) as { needsAddress?: unknown };
      return body.needsAddress === true;
    } catch (err) {
      console.warn("[wallet] address check failed", err);
      // Do not keep a failed answer: a later purchase reads again.
      answer = null;
      return false;
    }
  }

  function check(): Promise<boolean> {
    answer ??= readNeed();
    return answer;
  }

  /** Ends the flow in flight, so a later deliberate purchase can start. */
  function release(): void {
    inFlight = null;
  }

  /** Runs the purchase and ends the flow when it settles, also when it throws. */
  async function purchaseAndRelease(purchase: Purchase): Promise<void> {
    try {
      await purchase();
    } finally {
      release();
    }
  }

  async function startFlow(purchase: Purchase): Promise<void> {
    if (!(await check())) return purchaseAndRelease(purchase);
    // The flow stays in flight while the form is open: submit or cancel ends it.
    kept = purchase;
    setState({ asking: true, saving: false, error: null });
  }

  function run(purchase: Purchase): Promise<void> {
    inFlight ??= startFlow(purchase);
    return inFlight;
  }

  /** Closes the form and runs the kept purchase, if one is kept. */
  async function continuePurchase(): Promise<void> {
    const purchase = kept;
    kept = null;
    setState(CLOSED);
    if (purchase) return purchaseAndRelease(purchase);
    release();
  }

  async function submit(address: Address): Promise<void> {
    // A second submit during the save sends no second PUT.
    if (state.saving) return;
    setState({ ...state, saving: true, error: null });
    let res: Response;
    try {
      res = await doFetch(`${base}/business-profile/company_address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: address }),
      });
    } catch (err) {
      console.error("[wallet] address save failed", err);
      return continuePurchase();
    }
    if (res.ok) {
      answer = Promise.resolve(false);
      return continuePurchase();
    }
    if (res.status === UNPROCESSABLE) {
      setState({ asking: true, saving: false, error: await refusalSentence(res) });
      return;
    }
    console.error("[wallet] address save failed", `status ${res.status}`);
    return continuePurchase();
  }

  function cancel(): void {
    kept = null;
    release();
    setState(CLOSED);
  }

  return { check, run, submit, cancel, getState: () => state };
}

/**
 * Runs a purchase through the gate if the sale records an invoice row, else
 * runs it at once. `recordsInvoice` is the host's own flag (D14): the host
 * already knows if the sale is free.
 */
export function purchaseThroughGate(
  gate: Pick<AddressGate, "run">,
  recordsInvoice: boolean,
  purchase: () => Promise<void>,
): Promise<void> {
  return recordsInvoice ? gate.run(purchase) : purchase();
}
