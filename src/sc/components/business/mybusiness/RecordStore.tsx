/**
 * The one copy of the record the screen holds.
 *
 * A React context mounted in `layout.tsx` ABOVE both the rail and `children`.
 * Every mutation on this route family answers with the whole payload, so a
 * confirm or a save is one `setPayload(...)` and the rail, heading and queue
 * re-render together — they cannot disagree about the count.
 *
 * `payload` is a PROP, not a fetch: the layout loads on the server and seeds
 * this, so there is no empty-rail flash and no client GET on mount. A new
 * server render replaces what is held — the server wins whenever it has just
 * spoken.
 *
 * THE COST: a Next layout is not re-rendered when the URL moves between its
 * own child segments, which is what keeps the rail alive across a part change
 * and also means this store is not re-seeded by one. A proposal created
 * elsewhere appears on the next full load, not the next part click.
 *
 * Two PRD §11 events live here because nothing else can see them:
 * `intake_opened` (this is the only component that mounts once per visit) and
 * `intake_completed` (the handoff route answers 200 to a repeat send, so only
 * the record held here a moment ago knows which send stamped `intakeSentAt`).
 * The act events belong to the request that caused them and live in
 * `request.ts`.
 */

"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import type { MyBusinessPayload } from "@sc/lib/businessProfile/payload";
import { trackIntakeCompleted, trackIntakeOpened } from "./request";

export interface RecordStore {
  /** The record as this screen holds it. Every count on the page reads it. */
  payload: MyBusinessPayload;
  /** One clock for the whole screen, so no two of the rail's counts can be
   *  computed a second apart. */
  now: Date;
  /** What a mutation's response becomes. The only way the record changes. */
  setPayload: (next: MyBusinessPayload) => void;
  /**
   * For the one response that carries a PIECE of the record rather than the
   * whole of it: the change is applied to whatever is held at the time, not to
   * the snapshot the caller rendered with.
   *
   * `setPayload` cannot do this. An upload in flight while she saves a row
   * would write back its own pre-save copy of the record and undo the save
   * until the next full load. The updater runs inside React's state update, so
   * it must be pure — React invokes it twice in development.
   */
  mergePayload: (change: (current: MyBusinessPayload) => MyBusinessPayload) => void;
}

const RecordContext = createContext<RecordStore | null>(null);

export interface RecordProviderProps {
  /** Loaded by `layout.tsx` on the server; the store's initial value. */
  payload: MyBusinessPayload;
  /** The request's clock, as an ISO string so it survives the boundary. */
  nowIso: string;
  /** Whose visit this is — for the two §11 events below, and nothing else. */
  locationId: string;
  children: ReactNode;
}

/** Holds the record above the rail and the page, so both move together. */
export function RecordProvider({ payload, nowIso, locationId, children }: RecordProviderProps): ReactElement {
  const [held, setHeld] = useState(payload);
  const [seeded, setSeeded] = useState(payload);
  /** One open per visit. A ref, not state: it survives React's development
   *  double-invoke of this effect, which a second `useState` would not, and it
   *  is never rendered so it must never cause a render. */
  const opened = useRef(false);

  // The count and the cohort AS SHE FOUND THEM — read from the seeding prop, so
  // the number in the event is the one on the screen when it opened, not the one
  // after her first answer.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    trackIntakeOpened(locationId, payload.counter.answered, payload.onboarding.cohort);
  }, [locationId, payload]);

  // A newly loaded payload wins: after a server render the server is the truth,
  // and this screen must not keep showing what it happened to have first.
  if (seeded !== payload) {
    setSeeded(payload);
    setHeld(payload);
  }

  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const store = useMemo<RecordStore>(
    () => ({
      payload: held,
      now,
      // The one place a mutation's response becomes the record, so the one
      // place a completion is visible as a CHANGE rather than as a response.
      // Outside the state updater deliberately: an updater must stay pure, and
      // React invokes it twice in development.
      setPayload: (next) => {
        trackIntakeCompleted(locationId, held, next);
        setHeld(next);
      },
      // No completion can hide in here: a partial change carries no handoff, and
      // the tracking above must stay OUTSIDE the updater in any case.
      mergePayload: (change) => setHeld(change),
    }),
    [held, now, locationId],
  );

  return <RecordContext.Provider value={store}>{children}</RecordContext.Provider>;
}

/** The record, for anything rendered inside `layout.tsx`. */
export function useRecord(): RecordStore {
  const store = useContext(RecordContext);
  if (!store) throw new Error("useRecord must be used inside <RecordProvider>.");
  return store;
}

/** The record when a `<RecordProvider>` is above, else null. For a control that
 *  also renders on `/intake`, where no record is held. */
export function useRecordIfHeld(): RecordStore | null {
  return useContext(RecordContext);
}
