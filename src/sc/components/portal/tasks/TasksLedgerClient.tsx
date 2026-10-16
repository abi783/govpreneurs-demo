"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalAuthGate } from "../PortalAuthGate";
import type { TasksPayload, TaskView } from "@sc/lib/tasks/read";
import { TaskCard } from "./TaskCard";
import { BookingPickerModal } from "../BookingPickerModal";
import { BookDeliveryModal } from "../BookDeliveryModal";
import { useGhlUserToken } from "../useGhlUserToken";
import "@sc/components/business/ds.css";
import { ChevronIcon } from "./Icon";

/**
 * The member's task list: everything they and their mentors have agreed on,
 * in one place.
 *
 * Counts, never percentages — the denominator moves every time a mentor adds
 * something, and a percentage would let a member go backwards for doing
 * nothing wrong.
 */

/**
 * The three lists, and the question each one answers.
 *
 * THE CUT IS WHO IS WAITING, NOT HOW SOON. The page divided open work into
 * "Needs you now", "Next up" and "Later" and the member had to decode three
 * words we chose. It now divides on the section the adapter declared, which
 * answers the question she actually arrives holding: her mentor gave her some
 * things and the programme gave her others, and she wants one of those piles.
 *
 * FILTERING BY SOURCE IS GONE AS A CONTROL and kept as a label. "Who asked for
 * this" is a question the chip on the row has already answered by the time she
 * is looking at it.
 *
 * `all` is the whole open list; `strategy` and `program` partition it exactly.
 */
const LISTS = [
  { key: "all", label: "All", sub: "Everything open, in one list" },
  /* ROADMAP COMES FIRST. Its work carries no deadline and is what everything
     else waits on, so it leads both the strip and the list underneath — see
     `compareForList`. The keys are unchanged: they name the stored section,
     and renaming a heading is not a reason to migrate a column. */
  { key: "program", label: "Roadmap", sub: "Your roadmap and your business papers" },
  { key: "strategy", label: "Action Plan", sub: "What your mentor asked you to do" },
] as const;

type ListKey = (typeof LISTS)[number]["key"];

/**
 * A section of the list. Every one collapses — the header is a bar the member
 * can actually see, and the chevron carries the open state on its own.
 */
function Section({
  title, count, note, hideWhenEmpty, defaultOpen, children,
}: {
  title: string;
  count: number;
  note?: string;
  /** Done and Dismissed vanish at zero rather than showing an empty heading. */
  hideWhenEmpty?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  if (count === 0 && hideWhenEmpty) return null;
  return (
    <section className="gpds-section">
      <button
        type="button"
        className="sh"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="st">{title}</span>
        <span className="sn">{count}</span>
        <span className={`sx${open ? "" : " shut"}`}><ChevronIcon /></span>
      </button>
      {note && open && <p className="snote">{note}</p>}
      {open && children}
    </section>
  );
}

/**
 * Finished work, counted.
 *
 * WHY A BAR IS DEFENSIBLE HERE AND ALMOST NOWHERE ELSE. The goal gradient:
 * effort rises as a visible end gets closer (Kivetz, Urminsky & Zheng, JMR
 * 2006 — the coffee-card study). That effect needs a FINITE, REACHABLE end. A
 * task list has one; a profile of seventy-five fields does not, which is why a
 * completion bar there intimidated people and this one should not.
 *
 * IT LEADS WITH THE COUNT, NOT THE BAR. "3 done" is the headline and the bar is
 * the picture of it. To-date, never to-go: when commitment is uncertain — which
 * is every new member — motivation comes from what is FINISHED (Koo &
 * Fishbach). The remaining count is never the big number, and the fraction is
 * never shown as a percentage.
 *
 * IT LEAVES WHEN IT IS DONE. A bar at 100% on every visit is furniture, and
 * furniture is what a reader learns to stop seeing.
 */
function ProgressCard({ done, open }: { done: number; open: number }) {
  // Dismissed work is deliberately outside the total: the member took it off
  // the list on purpose, and counting it would quietly overrule them.
  const total = done + open;
  if (total === 0 || open === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <section className="gpds-prog" aria-label="Your progress">
      <p className="pl">
        <span className="pn">{done}</span>
        <span className="pof">of {total} done</span>
      </p>
      {/* The bar carries no number of its own. role=progressbar so a screen
          reader gets the same reading the fill gives a sighted member, rather
          than a decorative div it has to skip. */}
      <div
        className="ptrack"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} tasks done`}
      >
        <div className="pfill" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}

export function TasksLedgerClient({
  initial,
  locationId,
  iframeOnly,
}: {
  initial: TasksPayload;
  locationId: string;
  iframeOnly: boolean;
}) {
  const [data, setData] = useState<TasksPayload>(initial);
  // DEMO: in production `router.refresh()` re-reads the server page, and this state
  // keeps the list it started with until a reload. The demo's refresh builds a new
  // `initial`, so take it: a call booked from here, or on the Roadmap, then ticks its task.
  useEffect(() => {
    setData(initial);
  }, [initial]);
  /* ONE LIST OPEN AT A TIME, AND IT CAN BE SHUT. The headings are the control:
     opening one closes whatever was open, and clicking the open one shuts it,
     so the page can reach a state that is just the three headings.

     "All" starts open. A tasks page that greets the member with three closed
     headings has answered no question at all, and the whole list is the honest
     default — the other two are cuts of it she takes when she wants one. */
  const [openList, setOpenList] = useState<ListKey | null>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);

  // Booking happens here rather than by sending the member to the roadmap:
  // it is the same modal that page opens, so the calendar, the wallet leg and
  // the free-session pool all behave identically. It is legacy-palette inside
  // a DS page, which is deliberate — a second, DS-styled calendar would mean
  // two different booking experiences in one product, which is worse than one
  // overlay that does not match its host.
  const router = useRouter();
  const userToken = useGhlUserToken();
  const [bookStepId, setBookStepId] = useState<string | null>(null);
  const [bookDeliveryFor, setBookDeliveryFor] = useState<{ sectionId: string; service: string } | null>(null);
  const [wallet, setWallet] = useState<{ balance: number | null; currency: string } | null>(null);

  // Fetched when a calendar is first opened, not on page load: this page is
  // otherwise database-only, and most visits never open one.
  useEffect(() => {
    if ((!bookStepId && !bookDeliveryFor) || wallet) return;
    let live = true;
    fetch(`/api/portal/${locationId}/wallet-balance`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { balance: number | null; currency: string } | null) => {
        if (live && d) setWallet(d);
      })
      .catch(() => { /* the booking route re-checks funds; this is display */ });
    return () => { live = false; };
  }, [bookStepId, bookDeliveryFor, wallet, locationId]);

  const bookingStep = bookStepId ? data.bookingSteps[bookStepId] ?? null : null;

  /**
   * A milestone's CTA was clicked. Opens the matching calendar and returns
   * true; returns false when we have nothing to open, so the card falls back
   * to its deep link rather than doing nothing.
   */
  function openBooking(refId: string): boolean {
    if (refId.startsWith("call:")) {
      const stepId = refId.slice(5);
      if (!data.bookingSteps[stepId]) return false;
      setBookStepId(stepId);
      return true;
    }
    if (refId.startsWith("delivery:")) {
      // The section id and the service name both ride on the source we already
      // have — "Your roadmap · SAM.gov Registration", …?bookDelivery=<id>.
      const src = data.sections.all.tasks
        .flatMap((t) => t.sources)
        .find((s) => s.refId === refId);
      const sectionId = src?.deepLink?.split("bookDelivery=")[1] ?? null;
      if (!sectionId || !src) return false;
      setBookDeliveryFor({ sectionId, service: src.label.split("·").pop()?.trim() ?? "your service" });
      return true;
    }
    return false;
  }

  async function act(taskId: string, path: string, body?: unknown, undo?: () => void, msg?: string) {
    setBusyId(taskId);
    try {
      const res = await fetch(`/api/portal/${locationId}/tasks/${taskId}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setToast({ msg: j?.error ?? "That didn't save" });
        return;
      }
      setData((await res.json()) as TasksPayload);
      if (msg) {
        setToast({ msg, undo });
        // Long enough to actually read — this list is read, not skimmed.
        setTimeout(() => setToast(null), 8000);
      }
    } catch {
      setToast({ msg: "That didn't save" });
    } finally {
      setBusyId(null);
    }
  }

  const toggle = (t: TaskView) =>
    act(
      t.id,
      "/status",
      { status: t.status === "done" ? "open" : "done" },
      t.status === "done" ? undefined : () => act(t.id, "/status", { status: "open" }),
      t.status === "done" ? undefined : "Marked done.",
    );

  const dismiss = (t: TaskView, reason: string | null) =>
    act(t.id, "/dismiss", { reason }, () => act(t.id, "/restore"), "Dismissed. Your mentor will see this.");

  const restore = (t: TaskView) => act(t.id, "/restore");

  const snooze = (t: TaskView) =>
    act(t.id, "/snooze", { until: new Date(Date.now() + 7 * 86_400_000).toISOString() }, undefined, "Snoozed for a week.");

  const s = data.sections;
  const lists: Record<ListKey, TaskView[]> = {
    all: s.all.tasks,
    strategy: s.strategy.tasks,
    program: s.program.tasks,
  };
  const done = s.done.tasks;
  const dismissed = s.dismissed.tasks;

  /**
   * One card. `index` numbers it inside the list being shown — a position in
   * the list you are looking at, not an identifier for the task, which is why
   * the numbers restart at 1 in each of the three. Done and dismissed are
   * records rather than a queue, so they stay unnumbered.
   */
  const card = (t: TaskView, index?: number) => (
    <TaskCard
      key={t.id}
      task={t}
      index={index}
      busy={busyId === t.id}
      onToggle={() => toggle(t)}
      onDismiss={(reason) => dismiss(t, reason)}
      onRestore={() => restore(t)}
      onSnooze={() => snooze(t)}
      onBook={openBooking}
      mentorsHref={`/${locationId}/mentors`}
      locationId={locationId}
    />
  );

  const empty = data.counts.open === 0 && data.counts.done === 0 && data.counts.dismissed === 0;

  return (
    <PortalAuthGate iframeOnly={iframeOnly}>
      <div className="max-w-[860px] mx-auto">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          {/* The UI face, not the editorial one. `gpds-ed` is Instrument Serif
              in italic — the design system's "one editorial moment per
              surface", which is a fine choice for a page that is being read
              and a poor one for a queue that is being worked through. */}
          <h1 className="gpds-display">Your tasks</h1>
        </div>
        {/* THE VERDICT, THEN THE RECORD. A member should not have to assemble
            "how much is on me?" from the rows underneath. Things, never
            percent: a count says WHICH, and a percentage only says how much. */}
        <p className="text-sm text-gray-600 mt-1 max-w-[620px]">
          {empty ? (
            "Nothing here yet. As you work through your roadmap and meet your mentor, everything you agree on lands here."
          ) : data.counts.open === 0 ? (
            "Nothing needs you right now. Everything you and your mentors have agreed on lives here."
          ) : (
            <>
              <b className="text-gray-900">{data.counts.open}</b>{" "}
              {data.counts.open === 1 ? "thing needs" : "things need"} you.
              {data.counts.fromMentor > 0 && (
                <>
                  {" "}
                  {/* Named only when one mentor owns all of it — see `mentorName`.
                      "asked for" rather than "is waiting on": this ledger has no
                      state meaning the work sits in the mentor's court, so the
                      stronger claim would not be something we can stand behind. */}
                  {data.mentorName ?? "Your mentor"} asked for {data.counts.fromMentor} of them.
                </>
              )}
            </>
          )}
        </p>

        {/* THE HEADINGS ARE THE CONTROL. Three across the strip, each one a
            disclosure rather than a tab — aria-expanded and not aria-selected,
            because a tab strip promises something is always chosen and here
            every one of them can be closed. The panel below spans all three,
            so a card gets the full width and can be one or two lines tall
            instead of a narrow column five lines deep. */}
        {!empty && (
          <section className="gpds-lists" aria-label="Your tasks">
            {/* THE FLAP OF ONE ENVELOPE, not a card of its own. The progress,
                the three headings and the open list are one object: the count
                is a fact about the list directly beneath it, and a gap between
                them made it read as an unrelated banner. */}
            <div className="lhead">
              <ProgressCard done={data.counts.done} open={data.counts.open} />
            </div>
            <div className="ltabs">
              {LISTS.map((l) => {
                const on = openList === l.key;
                return (
                  <h2 key={l.key} className="ltab-h">
                    <button
                      type="button"
                      className={`ltab${on ? " is-open" : ""}`}
                      aria-expanded={on}
                      aria-controls="tasks-panel"
                      onClick={() => setOpenList(on ? null : l.key)}
                    >
                      <span className="ltab-top">
                        <span className="ltab-name">{l.label}</span>
                        <span className="ltab-n">{lists[l.key].length}</span>
                      </span>
                      <span className="ltab-sub">{l.sub}</span>
                    </button>
                  </h2>
                );
              })}
            </div>

            {openList && (
              <div className="lpanel" id="tasks-panel">
                {lists[openList].length === 0 ? (
                  <p className="text-[0.82rem] text-gray-500 py-2">Nothing here.</p>
                ) : (
                  /* NUMBERED, BECAUSE ALL THREE ARE THE SAME QUEUE. Each list
                     is the open work in one order, so the numbers ARE that
                     order and the list is an <ol>. */
                  <>
                    {/* ONE SENTENCE, OVER THE WHOLE LIST. Naming where to start
                        is what lets the page hide nothing: the alternative to a
                        cap on urgent work is answering the question the cap was
                        trying to duck. Only on All — the halves are cuts of it,
                        and their first row is not necessarily the first row. */}
                    {openList === "all" && data.startHere && (
                      <p className="lstart">Start here. {data.startHere}.</p>
                    )}
                    <ol className="lrows">
                      {lists[openList].map((t, i) => (
                        <li key={t.id}>{card(t, i + 1)}</li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {s.done.count > 0 && (
          <Section title="Done" count={s.done.count} hideWhenEmpty defaultOpen={false}>
            {/* No index: `map` would hand its own one straight to `card` and
                number a record that is not a queue. */}
            {done.map((t) => card(t))}
          </Section>
        )}

        {s.dismissed.count > 0 && (
          <Section
            title="Dismissed"
            count={s.dismissed.count}
            hideWhenEmpty
            defaultOpen={false}
            note="Not counted toward your progress."
          >
            {dismissed.map((t) => card(t))}
          </Section>
        )}
      </div>

      {bookStepId && bookingStep && (
        <BookingPickerModal
          stepId={bookStepId}
          stepTitle={bookingStep.stepTitle}
          bookingTitle={bookingStep.bookingTitle}
          bookingDescription={bookingStep.bookingDescription}
          bookingPrice={bookingStep.bookingPrice}
          locationId={locationId}
          walletBalance={wallet?.balance ?? null}
          walletCurrency={wallet?.currency ?? "USD"}
          onBalanceChange={(b) => setWallet((w) => ({ balance: b, currency: w?.currency ?? "USD" }))}
          userToken={userToken}
          onClose={() => {
            setBookStepId(null);
            // A booking that just landed is the signal that ticks this task —
            // re-run the server pass so it comes back done, not open.
            router.refresh();
          }}
        />
      )}

      {bookDeliveryFor && (
        <BookDeliveryModal
          sectionId={bookDeliveryFor.sectionId}
          serviceTitle={bookDeliveryFor.service}
          serviceLabel={bookDeliveryFor.service}
          locationId={locationId}
          onClose={() => { setBookDeliveryFor(null); router.refresh(); }}
        />
      )}

      {toast && (
        <div className="gpds-toast">
          <span>{toast.msg}</span>
          {toast.undo && (
            <button type="button" onClick={() => { toast.undo?.(); setToast(null); }}>Undo</button>
          )}
        </div>
      )}
    </PortalAuthGate>
  );
}
