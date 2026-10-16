"use client";

// Roadmap v3 — the member's whole programme on one page, ported from the
// frozen prototype (roadmap-v2/prototype/src/routes/roadmap.tsx, the build
// spec) and driven by real member data via V3Payload. The rendering rules —
// who-holds-it buckets, the 7-day grace escalation, the never-sell-a-started-
// step column — are the spec's; read its comments before changing them.

import "@sc/components/business/ds.css";
import "./roadmap-v3.css";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalAuthGate } from "@sc/components/portal/PortalAuthGate";
import { useGhlUserToken } from "@sc/components/portal/useGhlUserToken";
import { openIntercomChat } from "@sc/lib/intercom";
import {
  findNextSubStep,
  showDiyCard,
  DIY_CARD_DEFAULTS,
  unmetPrereqs,
  type Blocker,
  type EarlyReleaseMap,
} from "@sc/lib/roadmapV3/programme";
import { SCENARIOS } from "@sc/lib/roadmapV3/scenarios";
import {
  DC_STEP_ID,
  POSITIONING_STEP_ID,
  needsHer,
  nextActionFor,
  owesUsInput,
  readyToStart,
  waitsForPositioning,
} from "@sc/lib/roadmapV3/nextAction";
import { MemberTimeZoneProvider, useMemberDate } from "./memberDate";
import type { Roadmap, RoadmapSubStep, V3Call, V3Payload } from "@sc/lib/roadmapV3/types";
import {
  HUB_LESSON_URL,
  COURSE_URL,
  DEFAULT_DETAIL,
  GATED_CAPTION,
  GRACE_DAYS,
  MENTOR_CALL_BLURB,
  MENTOR_CALL_NAME,
  SUB_STEP_DETAIL,
} from "./detailContent";
import { AgentAvatar, Avatar } from "./Avatar";
import { BookingSheet } from "./BookingSheet";
import { RepeatPurchaseCard } from "./RepeatPurchaseCard";
import { DigitalComplianceAudit } from "./DigitalComplianceAudit";
import { DfyDrawer } from "./DfyDrawer";
import { FormDrawer } from "./FormDrawer";
import { FormResultsCard } from "./FormResultsCard";
import { DfyStatusPanel } from "./DfyStatusPanel";
import { IntakeOfferModal } from "./IntakeOfferModal";
import { VerifyPanel } from "./VerifyPanel";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock,
  Lock,
  Mail,
  PlayCircle,
  Star,
  Users,
} from "./Icon";

/* ── Whose turn is it — the one set of rules every mark reads ─────────── */

/* "Do this next" lives in lib/roadmapV3/nextAction.ts, where the member task
   reads it too. Re-exported so the imports that name this file still work. */
export { nextAction, NEXT_ORDER } from "@sc/lib/roadmapV3/nextAction";

/** The Positioning Call, as the blocker the "Opens once …" note names. */
function positioningBlocker(roadmap: Roadmap): Blocker[] {
  for (const step of roadmap.steps) {
    const sub = step.subSteps.find((x) => x.id === POSITIONING_STEP_ID);
    if (sub) return [{ phaseIndex: step.index, phaseLabel: step.label, subId: sub.id, label: sub.label }];
  }
  return [];
}

/** Her turn for over a week — the ONLY thing on the roadmap that earns red. */
function isPastGrace(sub: RoadmapSubStep): boolean {
  if (!sub.openedAt || !owesUsInput(sub)) return false;
  const days = (Date.now() - new Date(sub.openedAt).getTime()) / 86_400_000;
  return days >= GRACE_DAYS;
}

function durationParts(weeks: number): { n: number; unit: string } {
  return weeks < 2 ? { n: weeks * 7, unit: "days" } : { n: weeks, unit: "weeks" };
}

function DateFig({ iso }: { iso: string }) {
  const memberDate = useMemberDate();
  return <span className="rm2-status__fig rm2-status__date">{memberDate(iso)}</span>;
}

/* ── The work list buckets ────────────────────────────────────────────── */

type WorkBucket = "you" | "us" | "them" | "later" | "done";

function workBucket(roadmap: Roadmap, sub: RoadmapSubStep, earlyRelease: EarlyReleaseMap = {}): WorkBucket {
  if (sub.state === "done") return "done";
  if (waitsForPositioning(roadmap, sub)) return "later";
  if (owesUsInput(sub)) return "you";
  if (sub.state === "in_progress") return sub.awaiting?.who === "them" ? "them" : "us";
  if (readyToStart(roadmap, sub, earlyRelease)) return "you";
  return "later";
}

/* THREE FIXED HEADINGS (owner, 2026-10-02): "Now", "Next", "Completed".
   The five buckets used to be five headings whose names changed with the
   member's state ("Ready for you now", "We are working on this", "Waiting on
   an agency", "Comes later", "Complete"). The buckets still decide each ROW —
   its icon and its note say whose move it is — and "Now" lists them in this
   order: hers first, then ours, then an agency's. */
const WORK_GROUPS: { key: "now" | "next" | "done"; title: string; buckets: WorkBucket[] }[] = [
  { key: "now", title: "Now", buckets: ["you", "us", "them"] },
  { key: "next", title: "Next", buckets: ["later"] },
  { key: "done", title: "Completed", buckets: ["done"] },
];

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** The orange-to-yellow banner on top of the Digital Compliance panel. */
function WaitBanner() {
  return (
    <div
      role="note"
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, margin: "0 0 16px",
        padding: "12px 16px", borderRadius: 12,
        background: "linear-gradient(90deg, #fff7ed 0%, #fefce8 100%)",
        border: "1px solid #fdba74", borderLeft: "4px solid #f97316",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          width: 32, height: 32, borderRadius: 999, background: "#ffedd5", border: "1px solid #fdba74", color: "#c2410c",
        }}
      >
        <Lock size={16} strokeWidth={2.4} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#9a3412" }}>
          Book this call only after your Positioning Call is complete
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#a16207" }}>
          Finish your Positioning Call and check your <strong>Search</strong>, <strong>Save</strong> and{" "}
          <strong>Send</strong> first. You can still open this step and book whenever you are ready.
        </p>
      </div>
    </div>
  );
}

/** Why a locked step is locked — blockers collapse to the phase they sit in. */
function blockerSummary(blockers: Blocker[]): string {
  if (blockers.length === 0) return GATED_CAPTION;
  const byPhase = new Map<number, { phase: string; labels: string[] }>();
  for (const b of blockers) {
    const entry = byPhase.get(b.phaseIndex) ?? { phase: b.phaseLabel, labels: [] };
    entry.labels.push(b.label);
    byPhase.set(b.phaseIndex, entry);
  }
  const parts = [...byPhase.values()].map((e) =>
    e.labels.length === 1 ? e.labels[0]! : `${e.labels.length} steps in ${e.phase}`,
  );
  const verb = blockers.length === 1 ? "is" : "are";
  return `Opens once ${joinAnd(parts)} ${verb} done`;
}

/** The time figure beside a sub-step's name — dates where measured, forecast where not. */
function stepTiming(sub: RoadmapSubStep): { tone: string; content: React.ReactNode } | null {
  if (sub.state === "done") {
    if (sub.startedOn && sub.doneOn) {
      return {
        tone: "badge-pos",
        content: (
          <>
            <span className="rm2-timing__label">Started</span>
            <span className="rm2-timing__value"><DateFig iso={sub.startedOn} /></span>
            <span className="rm2-timing__sep" aria-hidden>·</span>
            <span className="rm2-timing__label">Finished</span>
            <span className="rm2-timing__value"><DateFig iso={sub.doneOn} /></span>
          </>
        ),
      };
    }
    return sub.doneOn
      ? {
          tone: "badge-pos",
          content: (
            <>
              <span className="rm2-timing__label">Finished</span>
              <span className="rm2-timing__value"><DateFig iso={sub.doneOn} /></span>
            </>
          ),
        }
      : null;
  }
  const { n, unit } = durationParts(sub.weeks);
  return {
    tone: "badge-blue",
    content: (
      <>
        <span className="rm2-timing__label">Approximately</span>
        <span className="rm2-timing__value">{n} {unit}</span>
      </>
    ),
  };
}

/** Where a step is, when there is nothing to sell. */
function StepStatusPanel({ sub }: { sub: RoadmapSubStep }) {
  if (sub.state === "done") {
    return (
      <div className="rm2-stepstat rm2-stepstat--done">
        <span className="rm2-stepstat__mark" aria-hidden>
          <Check size={16} strokeWidth={3} />
        </span>
        <div>
          <div className="rm2-stepstat__title">This step is done.</div>
          {sub.doneOn && (
            <div className="rm2-stepstat__sub">
              Finished <DateFig iso={sub.doneOn} />.
            </div>
          )}
        </div>
      </div>
    );
  }

  const a = sub.awaiting;
  const title =
    a?.who === "them" ? `With ${a.from}` : a?.who === "you" ? "This one is with you" : "This step has started";
  const detail =
    a?.who === "them" ? (
      // No date we can stand behind — say what we are waiting for and stop.
      a.eta ? <>They have {a.what}. Expected by <DateFig iso={a.eta} />.</> : <>They have {a.what}.</>
    ) : a?.who === "us" ? (
      <>Expected by <DateFig iso={a.eta} />.</>
    ) : a?.who === "you" ? (
      "Your tasks list has what we need."
    ) : null;

  return (
    <div className="rm2-stepstat">
      <span className="rm2-stepstat__mark" aria-hidden>
        <Clock size={16} strokeWidth={2.25} />
      </span>
      <div>
        <div className="rm2-stepstat__title">{title}</div>
        {detail && <div className="rm2-stepstat__sub">{detail}</div>}
      </div>
    </div>
  );
}

/* ── Mentor call card — phases 3 and 4 ────────────────────────────────── */

type MentorCallState = "not_required_yet" | "required" | "booked" | "completed" | "missed";

function MentorCallCard({
  call,
  mentor,
  blurb,
  callName,
  blockers,
  nowMs,
  locationId,
  userToken,
  wallet,
  freeSessions,
  fixtureMode,
  purchaseConfirmation,
  onGoTo,
  greyOutWhileLocked = false,
}: {
  call: V3Call | null;
  mentor: V3Payload["mentor"];
  blurb: string;
  callName: string;
  blockers: Blocker[];
  /** The page's single clock stamp — a card must not read the clock while
   *  rendering, and both should agree on "now" anyway. */
  nowMs: number;
  locationId: string;
  userToken: string | null;
  wallet: V3Payload["wallet"];
  freeSessions: number;
  fixtureMode: boolean;
  /** The payload's `purchaseConfirmation`: a paid call shows the pilot terms box. */
  purchaseConfirmation: boolean;
  onGoTo: (phaseIndex: number, subId: string) => void;
  /**
   * While `blockers` stand and nothing is booked, the Book button is shown
   * greyed out and cannot be pressed (owner, 30 Sep 2026: the Digital
   * Compliance booking waits for the Positioning Call). A call already booked
   * is never locked (`hasBooking`), so she can still change it. Off for every
   * other call, which keeps its old behaviour.
   */
  greyOutWhileLocked?: boolean;
}) {
  const memberDate = useMemberDate();
  const [booking, setBooking] = useState(false);
  const [bookedAt, setBookedAt] = useState<string | null>(null);
  /**
   * The prerequisite gate answers "is it time to book this?" — so it stops
   * applying the moment she HAS booked. It used to hide the booking entirely:
   * a member with three compliance calls on the calendar was told to go and
   * finish an earlier step first, with no sign the calls existed
   * (`EdiFCSSuzN1b2FDGIFwa`, 2026-08-29). Anything still outstanding is listed
   * under the booking instead of in place of it.
   */
  const hasBooking = !!call?.startTime || bookedAt != null;
  const locked = blockers.length > 0 && !hasBooking;
  const state: MentorCallState = locked ? "not_required_yet" : (call?.state ?? "required");
  const done = state === "completed";
  const booked = state === "booked" || bookedAt != null;
  // A booked time that has passed with no outcome recorded. `callState` is
  // right not to invent one — but "is booked for 20 August" reads wrong nine
  // days later, so the card says it in the past tense.
  const bookingPassed = booked && !!call?.startTime && new Date(call.startTime).getTime() < nowMs;
  const mentorName = mentor?.name ?? "Your mentor";

  return (
    <div className="rm2-mentor">
      <div className="rm2-mentor__eyebrow">Your mentor</div>
      <div className="rm2-mentor__head">
        <Avatar name={mentorName} src={mentor?.avatarUrl} size={48} />
        <div>
          <div className="rm2-mentor__name">{mentorName}</div>
          <div className="rm2-mentor__role">{mentor?.title ?? "Mentor"}</div>
        </div>
      </div>
      <p className="rm2-mentor__say">{blurb}</p>
      {mentor?.email && (
        <a href={`mailto:${mentor.email}`} className="rm2-mentor__mail">
          <Mail size={15} aria-hidden />
          <span>{mentor.email}</span>
        </a>
      )}

      {/* State first, then the action. */}
      {bookedAt ? (
        <div className="rm2-mentor__state">
          <Check size={13} strokeWidth={3} aria-hidden />
          <span>Booked for {bookedAt}.</span>
        </div>
      ) : null}

      {locked ? (
        <div className="rm2-mentor__gate">
          <p className="rm2-mentor__gate-title">Finish these before your call:</p>
          <ul className="rm2-mentor__gate-list">
            {blockers.map((b) => (
              <li key={b.subId}>
                <button type="button" onClick={() => onGoTo(b.phaseIndex, b.subId)}>
                  {b.label}
                </button>
                <span className="rm2-mentor__gate-phase">Phase {b.phaseIndex}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {/* Prerequisites she has not finished, once a booking exists: still
              worth naming, but no longer standing in front of the call. */}
          {blockers.length > 0 && (
            <div className="rm2-mentor__gate">
              <p className="rm2-mentor__gate-title">Still to finish:</p>
              <ul className="rm2-mentor__gate-list">
                {blockers.map((b) => (
                  <li key={b.subId}>
                    <button type="button" onClick={() => onGoTo(b.phaseIndex, b.subId)}>
                      {b.label}
                    </button>
                    <span className="rm2-mentor__gate-phase">Phase {b.phaseIndex}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(booked || done || state === "missed") && (
          <div className={`rm2-mentor__state${done ? " is-done" : ""}`}>
            <Check size={13} strokeWidth={3} aria-hidden />
            <span>
              {done
                ? "This call is done."
                : state === "missed"
                  ? "The last booking did not happen — pick a new time."
                  : call?.startTime
                    ? bookingPassed
                      ? `This call was booked for ${memberDate(call.startTime)}.`
                      : `This call is booked for ${memberDate(call.startTime)}.`
                    : "This call is booked."}
            </span>
          </div>
          )}
        </>
      )}

      {call?.bookable && greyOutWhileLocked && locked ? (
        <button
          type="button"
          className="rm2-btn rm2-btn--green"
          disabled
          aria-disabled="true"
          title={`Book this after your ${blockers.map((b) => b.label).join(" and ")} is complete`}
          style={{ opacity: 0.45, cursor: "not-allowed", filter: "grayscale(1)" }}
        >
          {(call?.price ?? 0) <= 0 ? "Book your free call" : "Book Your Call"} <ArrowRight size={14} />
        </button>
      ) : call?.bookable ? (
        <button type="button" className="rm2-btn rm2-btn--green" onClick={() => setBooking(true)}>
          {bookingPassed
            ? "Book another time"
            : booked
              ? "Change your booking"
              : done
                ? "Book another call"
                : state === "missed"
                  ? "Re-schedule the call"
                  : /* A free call says so on the button. Digital Compliance is
                       the one she earns by filling in the audit form, and free
                       is the whole reason to click — leaving it to the blurb
                       wastes it. */
                    (call?.price ?? 0) <= 0
                    ? "Book your free call"
                    : "Book Your Call"}{" "}
          <ArrowRight size={14} />
        </button>
      ) : (
        <p className="rm2-mentor__say">Booking is not available right now — email your mentor instead.</p>
      )}

      {call?.bookable && (
        <BookingSheet
          open={booking}
          onOpenChange={setBooking}
          locationId={locationId}
          mode={{ kind: "call", stepId: call.stepId, userToken }}
          title="Book a call with your mentor"
          whoName={mentorName}
          whoRole={mentor?.title ?? "Mentor"}
          callName={callName}
          price={call.price}
          freeSessions={freeSessions}
          wallet={wallet}
          disabled={fixtureMode}
          purchaseConfirmation={purchaseConfirmation}
          onBooked={setBookedAt}
        />
      )}
    </div>
  );
}

/* ── The scenario switcher — QA only, present only when a fixture is on ── */

function ScenarioBar({ id, locationId }: { id: string; locationId: string }) {
  const router = useRouter();
  const current = SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]!;
  return (
    <div className="rmdev" title={current.note}>
      <span className="rmdev__tag">Test state</span>
      <select
        className="rmdev__pick"
        aria-label="Roadmap test state"
        value={current.id}
        onChange={(e) => router.replace(`/${locationId}/roadmap/v3?scenario=${e.target.value}`)}
      >
        {SCENARIOS.map((sc) => (
          <option key={sc.id} value={sc.id}>
            {sc.name}
          </option>
        ))}
      </select>
      <Link href={`/${locationId}/roadmap/v3`} className="rmdev__all">
        Exit
      </Link>
    </div>
  );
}

function AutoCheckNote({ locationId }: { locationId: string }) {
  return (
    <p className="rm2-autonote">
      We used an automated check tool that will check your tasks completion. Please click{" "}
      {/* The GHL custom-menu Tasks page — target="_top" walks out of the
          portal iframe into the dashboard shell. */}
      <a
        href={`https://app.govpreneurs.com/v2/location/${locationId}/custom-menu-link/d699ca66-cfea-463b-bfe5-6eb444c9412b`}
        target="_top"
        className="rm2-autonote__link"
      >
        here
      </a>{" "}
      if a task has not been updated as complete.
    </p>
  );
}

const AUTO_CHECK_PHASES = [1, 2];
/** Which program call a bound call step books by default. */
const DEFAULT_CALL_KEY: Record<string, "positioning" | "targeting"> = {
  "p3-positioning-call": "positioning",
};

/* ── The page ─────────────────────────────────────────────────────────── */

export function RoadmapV3Client({
  payload,
  locationId,
  initialStep,
}: {
  payload: V3Payload;
  locationId: string;
  /** ?step=<sub-step id> — opens straight onto that step, the QA affordance
   *  ?scenario= is. Read on the server so there is nothing to hydrate. */
  initialStep?: string;
}) {
  return (
    <PortalAuthGate iframeOnly={payload.iframeOnly}>
      {/* Every date below reads in the MEMBER's zone, not the reader's. */}
      <MemberTimeZoneProvider timeZone={payload.timeZone}>
        {/* Keyed on the scenario so switching fixtures remounts the page —
            local selection must not outlive the data it was chosen from. */}
        <RoadmapPage
          key={payload.scenarioId ?? "live"}
          payload={payload}
          locationId={locationId}
          initialStep={initialStep}
        />
      </MemberTimeZoneProvider>
    </PortalAuthGate>
  );
}

function RoadmapPage({
  payload,
  locationId,
  initialStep,
}: {
  payload: V3Payload;
  locationId: string;
  initialStep?: string;
}) {
  const roadmap = payload.roadmap;
  /* Both mean the same thing to every child that reads it: nothing on this
     page may take money or write. See V3Payload.previewMode for why the
     preview cannot be allowed to transact even though the state is real. */
  const fixtureMode = payload.scenarioId != null || payload.previewMode;
  const userToken = useGhlUserToken();
  const next = findNextSubStep(roadmap);
  // Stamped once per mount — render-pure, and a countdown does not need to
  // tick while she reads the page.
  const [nowMs] = useState(() => Date.now());

  /* ?step= names a sub-step to open on. Resolved once, here, from a value the
     server already read — so the first client render matches the server's and
     there is no hydration mismatch to flash through. An unknown id resolves to
     nothing and the normal "next step" pick stands. */
  const initial = initialStep
    ? roadmap.steps
        .flatMap((s) => s.subSteps.map((x) => ({ phase: s.index, id: x.id })))
        .find((x) => x.id === initialStep)
    : undefined;
  const [selectedPhase, setSelectedPhase] = useState(initial?.phase ?? roadmap.currentStepIndex);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(initial?.id ?? null);
  /* Every row starts shut; only a click — or ?step= — opens one. */
  const [collapsed, setCollapsed] = useState(!initial);
  /* ?step=<sub-step id> opens straight onto that step, expanded — the same QA
     affordance ?scenario= is. Applied on mount rather than in the state
     initialiser so the server and the first client render agree; an unknown
     id changes nothing and the normal "next step" pick stands. */
  const [dfyOpen, setDfyOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const router = useRouter();
  /* Self-tick answers, shown before the server confirms them:
     `${subId}::${title}` -> ticked. Cleared per line if the save fails. */
  const [pendingTicks, setPendingTicks] = useState<Record<string, boolean>>({});
  const [tickError, setTickError] = useState<string | null>(null);

  const activePhase = roadmap.steps.find((s) => s.index === selectedPhase) ?? roadmap.steps[0];
  const activeSub =
    activePhase.subSteps.find((s) => s.id === selectedSubId) ??
    activePhase.subSteps.find((s) => s.id === next?.subStep.id) ??
    activePhase.subSteps[0];
  // Static spec copy first, admin-configured items/why (payload.detail, from
  // /admin/roadmapv3) on top — static help/handoff/note survive for bound
  // ids; an admin-added custom step gets DEFAULT_DETAIL plus its own copy.
  const detail = { ...(SUB_STEP_DETAIL[activeSub.id] ?? DEFAULT_DETAIL), ...payload.detail[activeSub.id] };
  // One checklist shape everywhere: static entries are plain strings, admin
  // entries carry {title, description}. The description shows in the drawer.
  const checklist: { title: string; description?: string; done?: boolean }[] = (detail.items ?? []).map(
    (it: string | { title: string; description?: string; done?: boolean }) =>
      typeof it === "string" ? { title: it } : it,
  );
  const timing = stepTiming(activeSub);
  /*
   * DIGITAL COMPLIANCE WAITS FOR THE POSITIONING CALL — a WARNING, not a gate
   * (owner, 28 Sep 2026: "they should still be able to expand and book, we
   * are just adding a warning, a lock symbol, just UI"). Until the Positioning
   * Call step is done, the Digital Compliance row carries an amber lock and its
   * panel opens under a banner. The row still opens, the form still sends and
   * the call still books. Gone once either step is done.
   */
  const stepById = (id: string) => roadmap.steps.flatMap((p) => p.subSteps).find((x) => x.id === id);
  const dcStep = stepById(DC_STEP_ID);
  const positioningStep = stepById(POSITIONING_STEP_ID);
  /* No Positioning step on this roadmap = nothing to wait for. */
  const positioningDone = !positioningStep || positioningStep.state === "done";
  const dcWaitsForPositioning = !!dcStep && dcStep.state !== "done" && !!positioningStep && positioningStep.state !== "done";
  /* A step she finishes herself, line by line, while it is still open. Once
     every line is in the server marks it done and the normal ticked list
     comes back. */
  const selfTickOpen = !!detail.selfTick && activeSub.state !== "done";

  /* Her answer for one line, before the server has confirmed it. Absent = show
     what the server said. Checkboxes, not radios: every line is its own
     answer and she may tick any number of them. */
  const tickedNow = (item: { title: string; done?: boolean }) =>
    pendingTicks[`${activeSub.id}::${item.title}`] ?? item.done === true;

  async function toggleTick(title: string, next: boolean) {
    const key = `${activeSub.id}::${title}`;
    setTickError(null);
    setPendingTicks((prev) => ({ ...prev, [key]: next }));
    if (fixtureMode) return;
    const res = await fetch(`/api/portal/${locationId}/roadmap-v3/item-tick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subStepId: activeSub.id, itemTitle: title, ticked: next }),
    }).catch(() => null);
    if (!res?.ok) {
      // Put it back the way it was — a tick she can see but we did not store
      // is the one failure this control must never leave behind.
      setPendingTicks((prev) => {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      });
      setTickError("Could not save that. Please try again.");
      return;
    }
    router.refresh();
  }

  function onTabKey(e: React.KeyboardEvent, index: number) {
    const order = roadmap.steps.map((st) => st.index);
    const at = order.indexOf(index);
    const to =
      e.key === "ArrowRight"
        ? order[(at + 1) % order.length]
        : e.key === "ArrowLeft"
          ? order[(at - 1 + order.length) % order.length]
          : e.key === "Home"
            ? order[0]
            : e.key === "End"
              ? order[order.length - 1]
              : undefined;
    if (to === undefined) return;
    e.preventDefault();
    selectPhase(to);
    document.getElementById(`rm2-tab-${to}`)?.focus();
  }

  function selectPhase(index: number) {
    setSelectedPhase(index);
    setSelectedSubId(null);
    setCollapsed(true);
  }

  /** Jump to a sub-step AND open it — "Do this next" lands on the work. */
  /**
   * Open a sub-step.
   *
   * `toTop` is for a move to a DIFFERENT part of the roadmap — the results
   * card's "go here next" button. Scrolling the opened panel into view leaves
   * the phase tabs and the step list off-screen above, so she lands mid-page
   * with no sense of where she has been taken. The on-page nudges ("do this
   * next", the mentor-call gate) keep the in-place scroll: she can already see
   * where they moved her to.
   */
  function goToSubStep(phaseIndex: number, subId: string, opts?: { toTop?: boolean }) {
    setSelectedPhase(phaseIndex);
    setSelectedSubId(subId);
    setCollapsed(false);
    setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
      if (opts?.toTop) {
        window.scrollTo({ top: 0, behavior });
        return;
      }
      document.getElementById(`rm2-detail-${subId}`)?.scrollIntoView({
        behavior,
        block: "nearest",
      });
    }, 0);
  }

  /* The member task "Do this next: …" calls the same function (see
     lib/tasks/adapters/nextStep.ts), so the two always name one step. */
  const todo = nextActionFor(payload);
  // Derived, not stored: the Positioning Call is where a mentor goes through
  // the business and hands over a strategy, so a completed call IS the
  // approval — there is no second fact to record. Same source
  // MentorCallCard reads for its own "completed" state.
  const mentorApproved = payload.calls.positioning?.state === "completed";
  const offer = payload.offers[activeSub.id] ?? null;
  const dfyBought = offer ? payload.purchasedSlugs.includes(offer.slug) : false;
  const notStarted = activeSub.state === "todo";
  const dfyDuration = detail.dfyDuration ?? offer?.turnaround ?? null;

  // The right column: an explicit admin cardType (from /admin/roadmapv3)
  // beats the binding's static help; "auto" (absent) keeps today's logic.
  const stepCfg = payload.detail[activeSub.id];
  const effectiveHelp: "dfy" | "mentor-call" | "pursuit" | "confirm" | "none" | undefined =
    stepCfg?.cardType === "call"
      ? "mentor-call"
      : stepCfg?.cardType === "dfy"
        ? "dfy"
        : stepCfg?.cardType === "pursuit"
          ? "pursuit"
          : stepCfg?.cardType === "none"
            ? "none"
            : detail.help;

  // A pre-purchase form the admin configured, still outstanding. While this is
  // true the service is not offered: the point of the card is to collect what
  // our team needs BEFORE she can buy, which is the order the audit form uses.
  const pendingForm = stepCfg?.form && !stepCfg.form.submitted ? stepCfg.form : null;

  /**
   * Which of Digital Compliance's three stages the panel is showing.
   *
   *   "form" → nothing submitted. The audit form is the ONLY thing on the panel.
   *   "call" → submitted. The booking card is the only thing on the panel.
   *   "open" → the call happened. Checklist, ticks and offers come back.
   *
   * The two closed stages hide the checklist AND the done-for-you pair: a
   * twelve-item list she cannot act on yet is twelve things she appears to be
   * behind on, and an offer shown before the call pre-empts the call — the
   * package is what the specialist is there to talk her through.
   *
   * A step with no `audit` flag, and a step already finished, are "open":
   * neither has an intake left to take. Unlike the prototype's stub flag, the
   * call stage reads the REAL compliance booking — "completed" is a
   * MentorBooking the specialist actually showed up to.
   */
  const auditStage: "form" | "call" | "open" =
    !detail.audit || activeSub.state === "done"
      ? "open"
      : !stepCfg?.form?.submitted
        ? "form"
        : payload.calls.compliance?.state !== "completed"
          ? "call"
          : "open";

  const callKey = stepCfg?.callKey ?? DEFAULT_CALL_KEY[activeSub.id];
  const call =
    callKey === "positioning" ? payload.calls.positioning
    : callKey === "targeting" ? payload.calls.targeting
    : callKey === "compliance" ? payload.calls.compliance
    : null;
  // Which call's name and blurb to use. Keyed on the phase these calls sit
  // in, which is also how MENTOR_CALL_NAME is indexed.
  const callIdx = callKey === "targeting" ? 4 : callKey === "compliance" ? 2 : 3;
  const callBlockers =
    effectiveHelp === "mentor-call" ? unmetPrereqs(roadmap, activeSub.id, payload.earlyRelease) : [];

  // Where the verified card goes.
  //
  // On a DONE step the record of what was verified IS the status — it says
  // everything "This step is done" says and then the facts as well — so it
  // takes that slot in the left-hand column rather than sitting under the
  // checklist on the right, where the member had to look in two places.
  // The call, Hunter and form cards keep priority: those steps carry no
  // member-run check today, and a card that answers a different question
  // should not be displaced by this one.
  const verifiedPass =
    !!stepCfg?.verifyKey && payload.verify.latest[stepCfg.verifyKey]?.status === "pass";
  const verifiedInStatusSlot =
    verifiedPass &&
    activeSub.state === "done" &&
    effectiveHelp !== "mentor-call" &&
    effectiveHelp !== "pursuit" &&
    !pendingForm;
  // A step we delivered keeps its one door — the place the record lives and
  // can be corrected — since this card is standing in for the service panel.
  const verifiedDoneLink = dfyBought
    ? (stepCfg?.doneLink ?? { label: "See it in My Business", url: `/${locationId}/business` })
    : undefined;

  // Once she has bought the work AND our team can actually start (intake in,
  // or no intake needed), the checklist reads as the team's worklist.
  const activeEnr = offer ? payload.enrollmentsBySlug[offer.slug] : undefined;
  const teamWorking = dfyBought && !!activeEnr && (!activeEnr.hasIntakeForm || !!activeEnr.intakeSubmittedAt);

  const allSubSteps = roadmap.steps.flatMap((s) => s.subSteps);
  const stepsDone = allSubSteps.filter((s) => s.state === "done").length;
  const stepsNeedingHer = allSubSteps.filter((s) => needsHer(roadmap, s, payload.earlyRelease)).length;

  function openDrawer() {
    setDfyOpen(true);
    if (offer && !fixtureMode) {
      // Fire-and-forget exploration metric — v1 roadmap parity.
      fetch(`/api/portal/${locationId}/dfy-explored`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapStepId: offer.stepId }),
      }).catch(() => null);
    }
  }


  /* The open row's panel — hoisted, it is large. */
  const detailPanel = (
    <div className="rm2-detailwrap" id={`rm2-detail-${activeSub.id}`}>
      {dcWaitsForPositioning && activeSub.id === DC_STEP_ID && <WaitBanner />}
      {/* One column while an intake stage owns the panel — two columns is a
          layout for two things, and during the form and the call there is
          only one. */}
      <section className={`rm2-detail${auditStage === "open" ? "" : " rm2-detail--solo"}`}>
        <div className="rm2-detail-left">
          {/* The name is sr-only, not deleted: the row she clicked to open
              this is directly above and still open, the group heading sorted
              it, and the phase tab is up top — a sighted reader is told it
              four times. A screen-reader user landing inside the panel is
              told it once, here, so deleting it outright would be an
              accessible-name regression dressed up as a tidy-up. */}
          <h2 className="sr-only">{activeSub.label}</h2>
          {timing && (
            <div className="rm2-h2row">
              <span className={`rm2-timing badge ${timing.tone}`}>{timing.content}</span>
            </div>
          )}
          {/* Why this matters sits under the step's own title: it is the context
              for the checklist below it, and at the bottom of the panel it was
              read last, if at all. */}
          <aside className="rm2-why">
            <span className="rm2-why-icon">
              <Star size={16} fill="currentColor" />
            </span>
            <div>
              <div className="rm2-why-title">Why this matters:</div>
              <div className="rm2-why-text">{detail.why}</div>
            </div>
          </aside>
          {/* Held back until an `audit` step has been through its intake and
              its call — see auditStage. Every other step shows it immediately,
              which is what `auditStage === "open"` reduces to when
              `detail.audit` is unset. */}
          {auditStage === "open" && (
          <>
          {selfTickOpen ? (
          <div className="rm2-group">
            <div className="rm2-selftick-title">Complete this step</div>
            {/* One checkbox per line — any number may be ticked, and a line
                ticked by mistake unticks on a second click. The whole row is
                the control, circle included, so there is no small target. */}
            <ul className="rm2-selftick-list" role="group" aria-label="Complete this step">
              {checklist.map((item) => {
                const ticked = tickedNow(item);
                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={ticked}
                      className={`rm2-selftick${ticked ? " is-ticked" : ""}`}
                      onClick={() => toggleTick(item.title, !ticked)}
                    >
                      <span className="rm2-selftick__ring" aria-hidden>
                        {ticked ? <Check size={13} strokeWidth={4} /> : null}
                      </span>
                      <span className="rm2-selftick__label">{item.title}</span>
                      {!ticked && (
                        <>
                          <span className="rm2-selftick__dash" aria-hidden>
                            —
                          </span>
                          <span className="rm2-selftick__hint" aria-hidden>
                            Click here if completed
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {tickError && (
              <p className="rm2-selftick__error" role="alert">
                {tickError}
              </p>
            )}
          </div>
          ) : (
          <>
          <div className="rm2-inside-label">
            {teamWorking ? "Our team is working on:" : "Inside this step:"}
            {/* Says where the list comes from — these are the member's own
                mentor-set plan steps, not our template copy. */}
            {detail.itemsSource === "action-plan" && (
              <span className="badge badge-blue no-dot" style={{ marginLeft: 8, verticalAlign: "middle" }}>
                Your Action Plan
              </span>
            )}
          </div>
          <div className="rm2-group">
            <ul className={`rm2-check-list${detail.itemsSource === "action-plan" ? " rm2-check-list--plain" : ""}`}>
              {/* A finished step ticks its whole list. Individual lines can
                  also tick on their own: a line an admin wired to a form
                  answer is done once she has given us that answer (resolved
                  server-side — see `checklistTicks`). */}
              {checklist.map((item) => {
                const itemDone = activeSub.state === "done" || item.done === true;
                return (
                <li key={item.title} className={`rm2-check ${itemDone ? "is-done" : "is-todo"}`}>
                  <span className="rm2-check-bullet" aria-hidden>
                    {itemDone ? <Check size={11} strokeWidth={4} /> : null}
                  </span>
                  <span className="rm2-check-label">{item.title}</span>
                </li>
                );
              })}
            </ul>
            {detail.note && (
              <p className="rm2-note">
                <span className="rm2-note__mark" aria-hidden>
                  *
                </span>
                <Link href={`/${locationId}${detail.note.href}`} className="rm2-note__link">
                  {detail.note.label}
                </Link>
              </p>
            )}
            {/* Member-run verification. On an OPEN step this is the "already
                did this yourself?" path; on a DONE one it is the record of
                what was verified — the fields, and the way to re-verify. A
                step finished some other way (service delivered, checklist
                ticked) has no pass on record and shows nothing. */}
            {stepCfg?.verifyKey &&
              !verifiedInStatusSlot &&
              (activeSub.state !== "done" || verifiedPass) && (
              <VerifyPanel
                key={`${activeSub.id}-verify`}
                verifyKey={stepCfg.verifyKey}
                locationId={locationId}
                verify={payload.verify}
                fixtureMode={fixtureMode}
              />
            )}
            {AUTO_CHECK_PHASES.includes(activePhase.index) && <AutoCheckNote locationId={locationId} />}
          </div>
          </>
          )}
          </>
          )}
        </div>

        <div className="rm2-detail-right">
          {/* One stage at a time. While an `audit` step is still taking its
              intake the panel holds the form, or the call the form earned, and
              NOTHING else — no offer, no course, no panel arguing with the
              specialist she is about to speak to. */}
          {auditStage === "form" && stepCfg?.form ? (
            <DigitalComplianceAudit
              form={stepCfg.form}
              locationId={locationId}
              fixtureMode={fixtureMode}
            />
          ) : auditStage === "call" ? (
            <MentorCallCard
              key={`${activeSub.id}-audit-call`}
              call={payload.calls.compliance}
              mentor={payload.stepMentors[activeSub.id] ?? payload.mentor}
              blurb={MENTOR_CALL_BLURB[2] ?? MENTOR_CALL_BLURB[3]!}
              callName={MENTOR_CALL_NAME[2] ?? "Digital Compliance Call"}
              /* BOOKING WAITS FOR THE POSITIONING CALL (owner, 30 Sep 2026:
                 "grey out the Digital Compliance booking … only for people who
                 haven't yet booked; if they have, let them change booking").
                 The form above still sends; only a NEW booking is held. */
              blockers={positioningDone ? [] : positioningBlocker(roadmap)}
              greyOutWhileLocked
              nowMs={nowMs}
              locationId={locationId}
              userToken={userToken}
              wallet={payload.wallet}
              freeSessions={payload.freeSessionsLeft}
              fixtureMode={fixtureMode}
              purchaseConfirmation={payload.purchaseConfirmation}
              onGoTo={goToSubStep}
            />
          ) : effectiveHelp === "mentor-call" ? (
            <MentorCallCard
              // Keyed by sub-step: without it, switching from one mentor call
              // to another (Positioning → Targeting) reuses this component
              // instance, and its local `bookedAt` — set by BookingSheet's
              // onBooked right after a booking, cleared by nothing — keeps
              // showing "Booked for X" on whichever call renders through it
              // next. The real per-call state (`call.startTime`) always comes
              // fresh from the server payload; this only resets the optimistic
              // bridge BookingSheet's own router.refresh() is about to replace.
              key={activeSub.id}
              call={call}
              mentor={payload.stepMentors[activeSub.id] ?? payload.mentor}
              blurb={MENTOR_CALL_BLURB[callIdx] ?? MENTOR_CALL_BLURB[3]!}
              callName={MENTOR_CALL_NAME[callIdx] ?? "Mentor call"}
              blockers={callBlockers}
              nowMs={nowMs}
              locationId={locationId}
              userToken={userToken}
              wallet={payload.wallet}
              freeSessions={payload.freeSessionsLeft}
              fixtureMode={fixtureMode}
              purchaseConfirmation={payload.purchaseConfirmation}
              onGoTo={goToSubStep}
            />
          ) : effectiveHelp === "pursuit" ? (
            /* Two boxes and nothing else: how the AI team works, then what one
               of them has already found. The course comes first because the
               step is "Meet Your AI Agents" — she is being introduced to three
               of them, and Hunter's own panel below is the introduction to one.

               Neither is a service. Nothing on this step is sold, which is why
               the done-for-you pair never reaches it.

               Code-fixed, not DB-configurable: exactly one agent card, here,
               always Hunter. */
            <>
              <div className="rm2-panel rm2-panel--blue">
                <div className="rm2-panel-row">
                  <span className="rm2-panel-icon rm2-panel-icon--blue">
                    <PlayCircle size={18} />
                  </span>
                  <div>
                    <div className="rm2-panel-title rm2-panel-title--blue">
                      How your AI team works
                    </div>
                    <div className="rm2-panel-desc">
                      Short videos on what each agent does for you.
                    </div>
                  </div>
                </div>
                <a
                  href={HUB_LESSON_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rm2-btn rm2-btn--blue-outline"
                >
                  Watch the course <ArrowRight size={14} />
                </a>
              </div>
              {/* Hunter, not a service. Planning a pursuit is not something we
                  sell her — it is what the agent already does every morning, so
                  the panel hands off to him instead of quoting a price. It is an
                  .ai-surface with the agent named and his portrait shown,
                  because anything an agent authors has to say so on its face. */}
              <div className="rm2-panel rm2-panel--ai ai-surface">
                <div className="rm2-panel-row">
                  <AgentAvatar size={32} />
                  <div>
                    <div className="rm2-panel-title rm2-panel-title--ai">
                      Hunter
                      <span className="rm2-panel-isai">AI</span>
                    </div>
                    <div className="rm2-panel-desc rm2-panel-desc--ai">
                      Finds the work. Explains why it fits.
                    </div>
                  </div>
                </div>
                <p className="rm2-panel-say">
                  Hunter reads every new federal and state notice each morning. The jobs that fit
                  your business go to the top, with a reason.
                </p>
                {/* The prototype routes this to its own /opportunities page. We
                    have no such route — opportunities live in the GHL shell, so
                    this is that custom-menu link, and target="_top" walks out of
                    the portal iframe into the dashboard rather than nesting it. */}
                <a
                  href={`https://app.govpreneurs.com/v2/location/${locationId}/custom-menu-link/dba1b23c-dd3e-4ade-b95e-295eeaa795c5`}
                  target="_top"
                  className="rm2-btn rm2-btn--ai"
                >
                  See what Hunter found <ArrowRight size={14} />
                </a>
              </div>
            </>
          ) : pendingForm ? (
            /* The form comes BEFORE the offer: our team needs these answers to
               quote the work at all, so showing "buy this" first would ask her
               to pay for something we cannot yet scope. The service card takes
               this slot back the moment the form is in. */
            <div className="rm2-panel rm2-panel--blue">
              <div className="rm2-panel-row">
                <span className="rm2-panel-icon rm2-panel-icon--blue">
                  <Mail size={18} />
                </span>
                <div>
                  <div className="rm2-panel-title rm2-panel-title--blue">{pendingForm.title}</div>
                  <div className="rm2-panel-desc">{pendingForm.description}</div>
                </div>
              </div>
              {/* Our own form, so it opens in a drawer beside the roadmap —
                  she never leaves the step she is reading. */}
              <button
                type="button"
                className="rm2-btn rm2-btn--blue-outline"
                onClick={() => setFormOpen(true)}
              >
                {pendingForm.buttonLabel} <ArrowRight size={14} />
              </button>
            </div>
          ) : verifiedInStatusSlot && stepCfg?.verifyKey ? (
            <VerifyPanel
              key={`${activeSub.id}-verify`}
              verifyKey={stepCfg.verifyKey}
              locationId={locationId}
              verify={payload.verify}
              fixtureMode={fixtureMode}
              completedByTeam={dfyBought}
              doneLink={verifiedDoneLink}
            />
          ) : (
            offer &&
            (dfyBought ? (
              <DfyStatusPanel
                offer={offer}
                /* A repeat purchase still in progress: the panel follows that
                   purchase, while the step itself stays done. */
                sub={stepCfg?.repeat?.working ? { ...activeSub, ...stepCfg.repeat.working } : activeSub}
                handoff={detail.handoff ?? "form"}
                record={payload.record}
                enrollment={payload.enrollmentsBySlug[offer.slug]}
                locationId={locationId}
                doneLink={stepCfg?.doneLink}
                fixtureMode={fixtureMode}
              />
            ) : !notStarted ? (
              <StepStatusPanel sub={activeSub} />
            ) : (
              <div className="rm2-panel rm2-panel--dark">
                <div className="rm2-panel-row">
                  <span className="rm2-panel-icon rm2-panel-icon--dark">
                    <Users size={18} />
                  </span>
                  <div>
                    <div className="rm2-panel-title rm2-panel-title--dark">
                      Done for you
                      <span className="rm2-panel-rec">(Recommended)</span>
                    </div>
                  </div>
                </div>
                {/* The prototype's proof block is deliberately not ported —
                    its figures are marked PLACEHOLDER, and a claim we cannot
                    stand behind is worse than no claim. Wire real ones here
                    when the record exists. */}
                <div className="rm2-panel-desc rm2-panel-desc--dark">
                  We strongly suggest our team does this for you. One wrong detail on a government
                  record is slow to fix. It can also cost you work later.
                </div>
                <button type="button" className="rm2-btn rm2-btn--dark rm2-btn--pop" onClick={openDrawer}>
                  Learn more <ArrowRight size={14} />
                </button>
              </div>
            ))
          )}

          {/* A finished step whose service she may buy again (Prime
              Registration): the count, and the same purchase drawer. */}
          {stepCfg?.repeat && offer && activeSub.state === "done" && (
            <RepeatPurchaseCard
              count={stepCfg.repeat.count}
              inProgress={stepCfg.repeat.inProgress}
              onRegister={openDrawer}
            />
          )}

          {/* What her submitted form turned up, UNDER the service or call
              card: the card is the action she came here to take, the findings
              are the detail behind it. Above the DIY card, which is the
              cheapest option and belongs last. */}
          {stepCfg?.form?.submitted && stepCfg.form.results && (
            <FormResultsCard
              title={stepCfg.form.title}
              results={stepCfg.form.results}
              button={stepCfg.form.doneButton}
              onGoTo={goToSubStep}
            />
          )}

          {/* A step's own `selfServe` outranks both the course fallback and
              the DIY tick-box rules below it: her mentor's plan (or a video)
              is not half of an offer pair the way "do it yourself" is, so it
              renders regardless of purchase/started state, wherever the step
              declares one. */}
          {effectiveHelp !== "mentor-call" && effectiveHelp !== "pursuit" && (
            detail.selfServe ? (
              <div className="rm2-panel rm2-panel--blue">
                <div className="rm2-panel-row">
                  <span className="rm2-panel-icon rm2-panel-icon--blue">
                    {detail.selfServe.icon === "course" ? <BookOpen size={18} /> : <ClipboardList size={18} />}
                  </span>
                  <div>
                    <div className="rm2-panel-title rm2-panel-title--blue">{detail.selfServe.title}</div>
                    <div className="rm2-panel-desc">{detail.selfServe.desc}</div>
                  </div>
                </div>
                {/* An http(s) href leaves the app, so it gets an anchor and a
                    new tab; anything else is an in-app route. */}
                {/^https?:\/\//.test(detail.selfServe.href) ? (
                  <a href={detail.selfServe.href} target="_blank" rel="noreferrer" className="rm2-btn rm2-btn--blue-outline">
                    {detail.selfServe.cta} <ArrowRight size={14} />
                  </a>
                ) : (
                  <Link href={`/${locationId}${detail.selfServe.href}`} className="rm2-btn rm2-btn--blue-outline">
                    {detail.selfServe.cta} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ) : (
              /* The tick box decides whether this card is WANTED; the picker
                 beside it governs the service/call/agent card only. See
                 `showDiyCard` for why that separation exists. */
              showDiyCard({
                diyEnabled: stepCfg?.diyEnabled,
                pendingForm: !!pendingForm,
                dfyBought,
                notStarted,
              }) && (
                <div className="rm2-panel rm2-panel--blue">
                  <div className="rm2-panel-row">
                    <span className="rm2-panel-icon rm2-panel-icon--blue">
                      <BookOpen size={18} />
                    </span>
                    <div>
                      <div className="rm2-panel-title rm2-panel-title--blue">
                        {stepCfg?.diyTitle ?? DIY_CARD_DEFAULTS.title}
                      </div>
                      <div className="rm2-panel-desc">
                        {stepCfg?.diyDescription ?? DIY_CARD_DEFAULTS.description}
                      </div>
                    </div>
                  </div>
                  <a href={stepCfg?.diyLink ?? COURSE_URL} target="_blank" rel="noreferrer" className="rm2-btn rm2-btn--blue-outline">
                    Use the resources <ArrowRight size={14} />
                  </a>
                </div>
              )
            )
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className="rm2">
      {/* Header */}
      <header className="rm2-header">
        <div className="rm2-header__row">
          <div>
            <div className="rm2-titlerow">
              <h1 className="rm2-title">Roadmap</h1>
              {/* Three channels — words, tone, mark — so the state does not
                  depend on colour, and role="status" so the flip from "Not"
                  to "Mentor Approved" announces without stealing focus. */}
              <span
                className={`badge rm2-approval ${mentorApproved ? "badge-pos no-dot" : "badge-neutral"}`}
                role="status"
                aria-atomic="true"
              >
                {mentorApproved ? (
                  <>
                    <Check size={12} strokeWidth={3} aria-hidden /> Mentor Approved
                  </>
                ) : (
                  "Not Mentor Approved"
                )}
              </span>
              {/* The "New customer intake offers" chip lived here. Removed
                  2 Sep 2026 (matching the prototype) — the mentor-approval
                  badge took its slot: the header's one status line is now
                  about whether the plan has been signed off rather than
                  about a promotion. IntakeOfferModal, setIntakeOpen and
                  payload.intake are left intact and unreferenced-from-here,
                  same as the prototype's own choice, if the offer is ever
                  wanted back. */}
            </div>
            <p className="rm2-subtitle">
              Customized for where you are. Your mentor refines this with you in the program.
            </p>
            {todo && (
              <button type="button" className="rm2-next" onClick={() => goToSubStep(todo.phaseIndex, todo.sub.id)}>
                <span className="rm2-next__lead">Do this next</span>
                <span className="rm2-next__what">{todo.sub.label}</span>
                <ArrowRight size={15} strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
          <div className="rm2-header__right">
            <div className="rm2-program">GovPreneurs Program</div>
            {/* Opens the Intercom widget on the GHL parent frame — the same
                cross-iframe path the Program Specialist card has used since
                June (src/lib/intercom.ts).

                Brand red, filled: brand red is reserved for brand moments, and
                this is one — GovPreneurs itself offering help, not a step in
                her roadmap. It composes .rm2-btn--brand rather than repainting
                the blue outline, so no class name lies about its colour. */}
            <button
              type="button"
              className="rm2-btn rm2-btn--brand rm2-help"
              onClick={() => openIntercomChat()}
            >
              Need help <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Done, or not done. Two states, nothing else — and the fill is a
            COUNT, not a map: one done step lights the first bar, wherever
            in the programme it happened. Bars stop naming specific steps
            for the same reason (the aria-label carries the count). */}
        <div className="rm2-steps" role="img" aria-label={`${stepsDone} of ${allSubSteps.length} steps done.`}>
          {allSubSteps.map((sub, i) => (
            <span key={sub.id} className={`rm2-steps__bit${i < stepsDone ? " is-done" : ""}`} />
          ))}
        </div>
        <p className="rm2-steps__caption">
          {stepsNeedingHer > 0 ? (
            <>
              <strong>
                {stepsNeedingHer} {stepsNeedingHer === 1 ? "step needs" : "steps need"} you.
              </strong>{" "}
              About {roadmap.estWeeksRemaining} weeks left.
            </>
          ) : (
            <>Nothing needs you today. About {roadmap.estWeeksRemaining} weeks left.</>
          )}
        </p>
      </header>

      {/* Phase tracker */}
      <div className="rm2-tracker" role="tablist" aria-label="Roadmap phases">
        {roadmap.steps.map((s) => {
          // "Not started" was answering the wrong question: it's true of any
          // phase she hasn't begun, INCLUDING ones she could begin right now
          // (Search, Save & Send opens on day one). A phase with an unblocked
          // step says "Start this" instead — readyToStart() is the same test
          // the work-list rows use, so the tab can never invite her into a
          // phase whose steps all show a padlock.
          const canStart =
            s.state !== "current" &&
            s.state !== "complete" &&
            s.subSteps.some((x) => readyToStart(roadmap, x, payload.earlyRelease));
          const status = s.state === "current" ? "current" : s.state === "complete" ? "done" : canStart ? "open" : "not_started";
          const statusLabel =
            s.state === "current" ? "You're here" : s.state === "complete" ? "Done" : canStart ? "Start this" : "Not started";
          const done = s.subSteps.filter((x) => x.state === "done").length;
          const isOpen = s.index === activePhase.index;
          const phaseNeedsHer = s.subSteps.some((x) => owesUsInput(x) && !waitsForPositioning(roadmap, x));
          const phasePastGrace = s.subSteps.some((x) => isPastGrace(x) && !waitsForPositioning(roadmap, x));
          return (
            <button
              key={s.index}
              type="button"
              role="tab"
              id={`rm2-tab-${s.index}`}
              aria-selected={isOpen}
              aria-controls="rm2-phase-panel"
              tabIndex={isOpen ? 0 : -1}
              onKeyDown={(e) => onTabKey(e, s.index)}
              className={`rm2-tcell rm2-tcell--${status}${isOpen ? " is-open" : ""}`}
              onClick={() => selectPhase(s.index)}
            >
              <span className="rm2-tcell__body">
                <span className="rm2-tkicker">
                  <span className="rm2-tdot" aria-hidden />
                  {/* The name is the label below; the number said nothing she
                      needed — "Phase 2 · In progress" over a heading reading
                      "Visibility & Credibility" spent its first two words
                      telling her where she was in a list she was already
                      looking at. */}
                  <span>{statusLabel}</span>
                </span>
                <span className="rm2-ttitle">{s.label}</span>
                <span className="rm2-tsub">{done} of {s.subSteps.length} sub-steps</span>
              </span>
              {phaseNeedsHer && (
                <span className={`rm2-talert${phasePastGrace ? " rm2-talert--late" : ""}`}>
                  <CircleAlert size={40} strokeWidth={1.75} aria-hidden />
                  <span className="sr-only">Needs your attention.</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The open phase's work, grouped by who it is waiting on. */}
      <div className="rm2-work" id="rm2-phase-panel" role="tabpanel" aria-labelledby={`rm2-tab-${activePhase.index}`}>
        {WORK_GROUPS.map((group) => {
          const rows = activePhase.subSteps
            .map((n) => ({ n, bucket: workBucket(roadmap, n, payload.earlyRelease) }))
            .filter((r) => group.buckets.includes(r.bucket))
            .sort((a, b) => group.buckets.indexOf(a.bucket) - group.buckets.indexOf(b.bucket));
          if (rows.length === 0) return null;
          const herCount = rows.filter((r) => r.bucket === "you").length;
          return (
            <section key={group.key} className={`rm2-wgroup rm2-wgroup--${group.key}`}>
              <h3 className="rm2-wgroup__head">
                <span className="rm2-wgroup__title">{group.title}</span>
                <span className="rm2-wgroup__count">{rows.length}</span>
                {herCount > 1 && (
                  <span className="rm2-wgroup__note">Do these in any order</span>
                )}
              </h3>
              <ul className="rm2-wlist">
                {rows.map(({ n, bucket }) => {
                  const isOpen = n.id === activeSub.id;
                  const expanded = isOpen && !collapsed;
                  const late = isPastGrace(n);
                  const blockers = bucket !== "later" ? []
                    : waitsForPositioning(roadmap, n) ? positioningBlocker(roadmap)
                      : unmetPrereqs(roadmap, n.id, payload.earlyRelease);
                  const mark =
                    bucket === "done"
                      ? "done"
                      : bucket === "later"
                        ? "gated"
                        : bucket === "you"
                          ? owesUsInput(n)
                            ? late
                              ? "action-late"
                              : "action"
                            : "ready"
                          : "current";
                  const noteTone = bucket === "us" || bucket === "them" ? "waiting" : mark;
                  return (
                    <li key={n.id} className={expanded ? "is-open" : undefined}>
                      <button
                        type="button"
                        className={`rm2-wrow${expanded ? " is-open" : ""}`}
                        onClick={() => {
                          if (isOpen) {
                            setCollapsed((c) => !c);
                          } else {
                            setSelectedSubId(n.id);
                            setCollapsed(false);
                          }
                        }}
                        aria-expanded={expanded}
                        aria-controls={expanded ? `rm2-detail-${n.id}` : undefined}
                      >
                        <span className={`rm2-node rm2-node--${mark}`}>
                          {bucket === "done" ? (
                            <Check size={16} strokeWidth={3} aria-hidden />
                          ) : bucket === "later" ? (
                            /* Before the "!" below: a row held in "Next"
                               (the soft Positioning wait) reads as the gated
                               rows around it, even with its form half done. */
                            <Lock size={16} strokeWidth={2.25} aria-hidden />
                          ) : owesUsInput(n) ? (
                            /* Drawn rather than borrowed: a circle inside this
                               circle would be a shape fighting a shape. */
                            <>
                              <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.75"
                                strokeLinecap="round"
                                aria-hidden
                              >
                                <path d="M12 6v8" />
                                <path d="M12 18.4v.01" />
                              </svg>
                              <span className="sr-only">Action needed. </span>
                            </>
                          ) : bucket === "you" ? (
                            <span className="rm2-node-dot" aria-hidden />
                          ) : (
                            <Clock size={16} strokeWidth={2.25} aria-hidden />
                          )}
                        </span>
                        <span className="rm2-wrow__body">
                          <span className="rm2-wrow__name">{n.label}</span>
                          <span className={`rm2-wrow__note is-${noteTone}`}>
                            {bucket === "done" ? (
                              n.doneOn ? (
                                <>Finished <DateFig iso={n.doneOn} /></>
                              ) : (
                                "Complete"
                              )
                            ) : bucket === "later" ? (
                              blockerSummary(blockers)
                            ) : bucket === "them" && n.awaiting?.who === "them" ? (
                              <>
                                Waiting for {n.awaiting.what} from {n.awaiting.from}.
                                {n.awaiting.eta ? <> Expected by <DateFig iso={n.awaiting.eta} /></> : null}
                              </>
                            ) : bucket === "us" ? (
                              n.awaiting?.who === "us" ? (
                                <>Expected by <DateFig iso={n.awaiting.eta} /></>
                              ) : (
                                "In progress"
                              )
                            ) : owesUsInput(n) ? (
                              "We need something from you"
                            ) : (
                              "Please start this!"
                            )}
                          </span>
                        </span>
                        <ChevronDown className="rm2-wrow__chev" size={18} aria-hidden />
                      </button>
                      {expanded && detailPanel}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Dev control — present only while a fixture is applied. Keyed on the
          scenario itself, not on fixtureMode: the preview sets that too and
          has no fixture to switch between. */}
      {payload.scenarioId != null && (
        <div className="rm2-devfoot">
          <ScenarioBar id={payload.scenarioId!} locationId={locationId} />
        </div>
      )}

      {payload.intake && (
        <IntakeOfferModal
          open={intakeOpen}
          onOpenChange={setIntakeOpen}
          intake={payload.intake}
          locationId={locationId}
          userToken={userToken}
          wallet={payload.wallet}
          scopeItems={[...new Set(Object.values(payload.offers).map((o) => o!.serviceTitle))]}
          fixtureMode={fixtureMode}
          purchaseConfirmation={payload.purchaseConfirmation}
        />
      )}

      <DfyDrawer
        offer={dfyOpen ? offer : null}
        subStepLabel={activeSub.label}
        includes={checklist}
        duration={dfyDuration}
        drawer={stepCfg?.drawer}
        locationId={locationId}
        userToken={userToken}
        wallet={payload.wallet}
        walletVideoUrl={payload.walletRechargeVideoUrl}
        fixtureMode={fixtureMode}
        purchaseConfirmation={payload.purchaseConfirmation}
        onClose={() => setDfyOpen(false)}
      />

      {pendingForm && (
        <FormDrawer
          form={pendingForm}
          open={formOpen}
          locationId={locationId}
          fixtureMode={fixtureMode}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
