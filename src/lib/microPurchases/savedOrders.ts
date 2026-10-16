// Small orders — which orders she saved.
//
// ONE LIST FOR "SAVED", AND IT IS THE WORKSPACE'S. A small order's id IS its
// `oppKey` in the `opportunities` collection, so a saved small order is a saved
// opportunity. It used to live in `small_orders_member_state.savedOrderIds`,
// which the pipeline never reads; it now lives in `user_workspace.savedOpps`,
// which the pipeline does. The opportunities feed saves into the same list.
//
// The member state still owns everything else about small orders — quotes,
// wins, registrations, sourcing answers. Only "saved" moved.
import { bus, useLiveSlice } from "../eventBus";
import { addSavedOpp, fetchWorkspace, removeSavedOpp } from "../workspace";
import { fetchSmallOrdersByIds } from "./api";
import type { MicroOrder } from "./order";

let saved: string[] = [];
let loading: Promise<void> | null = null;

function publish(next: string[]): void {
  saved = next;
  publishRecords();
}

/**
 * Read her saved opportunities from the workspace, once per session.
 *
 * Every page that shows a saved state calls this, so a member who lands on an
 * order page first still sees the right Save button. A failed read leaves the
 * list empty and says so in the console: she can still save, and the board
 * still opens.
 */
export function loadSavedOrders(): Promise<void> {
  if (loading == null) {
    loading = fetchWorkspace().then(
      (ws) => publish([...ws.savedOpps]),
      (error: unknown) => {
        console.warn(
          `small-orders saved: could not read the workspace — ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      },
    );
  }
  return loading;
}

/** Her saved ids, in the order she saved them. */
export function savedOrderIds(): string[] {
  return saved;
}

export function isOrderSaved(id: string): boolean {
  return saved.includes(id);
}

/** The saved ids as a live value: re-renders when the list changes. */
export function useSavedOrderIds(): string[] {
  return useLiveSlice("smallOrdersSaved", savedOrderIds);
}

/**
 * Save or un-save an order. The screen changes at once; if the workspace
 * refuses, the list goes back to what it was, so the button never claims a
 * save the server did not keep.
 */
export async function toggleSavedOrder(id: string): Promise<void> {
  const before = saved;
  const wasSaved = before.includes(id);
  publish(wasSaved ? before.filter((x) => x !== id) : [...before, id]);
  try {
    await (wasSaved ? removeSavedOpp(id) : addSavedOpp(id));
  } catch (error) {
    console.warn(
      `small-orders saved: ${wasSaved ? "un-save" : "save"} failed — ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    publish(before);
  }
}

/**
 * Keep an order she has sent a price on. Add-only, because a quote she sent must
 * stay reachable after DLA closes the order, and saving is that route back.
 */
export async function keepOrder(id: string): Promise<void> {
  if (saved.includes(id)) return;
  await toggleSavedOrder(id);
}

// ── The Saved tab's orders ─────────────────────────────────────────────────
//
// The ids above are all she saved. The Saved tab needs the ORDERS, and most of
// them are not in the board's loaded pages: the board holds the newest 50, and
// an order she saved last week, or one that has closed, is not among them. So
// the tab reads them by id, once per id.

/** What the Saved tab can show. */
export interface SavedOrderRecords {
  /** Her saved orders, newest save first. Ids that are not orders are absent. */
  orders: MicroOrder[];
  /** `loading` while a read is open; `failed` when the last read failed. */
  state: "ready" | "loading" | "failed";
}

const records = new Map<string, MicroOrder>();
/** Ids already read, found or not, so nothing is asked for twice. */
const asked = new Set<string>();
let recordsState: SavedOrderRecords["state"] = "ready";
let recordsSnapshot: SavedOrderRecords = { orders: [], state: "ready" };

function publishRecords(): void {
  recordsSnapshot = {
    orders: [...saved]
      .reverse()
      .map((id) => records.get(id))
      .filter((o): o is MicroOrder => o !== undefined),
    state: recordsState,
  };
  bus.publish("smallOrdersSaved");
}

/**
 * Read the saved orders not read yet. A failed read un-asks its ids, so the
 * next call tries them again, and the tab says it could not get them.
 */
export async function loadSavedOrderRecords(): Promise<void> {
  await loadSavedOrders();
  const missing = saved.filter((id) => !asked.has(id));
  if (missing.length === 0) {
    publishRecords();
    return;
  }
  for (const id of missing) asked.add(id);
  recordsState = "loading";
  publishRecords();
  const orders = await fetchSmallOrdersByIds(missing);
  if (orders === null) {
    for (const id of missing) asked.delete(id);
    recordsState = "failed";
  } else {
    for (const order of orders) records.set(order.id, order);
    recordsState = "ready";
  }
  publishRecords();
}

/** The Saved tab's orders now. */
export function savedOrderRecords(): SavedOrderRecords {
  return recordsSnapshot;
}

/** The Saved tab's orders as a live value. It follows saves and un-saves. */
export function useSavedOrderRecords(): SavedOrderRecords {
  return useLiveSlice("smallOrdersSaved", savedOrderRecords);
}
