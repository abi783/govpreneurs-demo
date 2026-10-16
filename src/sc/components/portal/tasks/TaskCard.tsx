"use client";

import { useEffect, useRef, useState } from "react";
import type { TaskSourceView, TaskView } from "@sc/lib/tasks/read";
import {
  isFramed, portalNavigate, myBusinessUrl, PLAN_CTA_ENABLED, requestGhlPage, ROADMAP_PAGE_KEY,
} from "@sc/lib/portalNavigate";
import { PROGRAM_TZ } from "@sc/lib/businessProfile/deadline";
import { COMPLIANCE_GUIDE_IMG } from "@sc/lib/businessProfile/onboardingGuides";
import { menuLinkHref, ROADMAP_MENU_LINK_ID } from "@sc/lib/businessProfile/menuLink";
import { SourceSheet } from "./SourceSheet";
import {
  CheckIcon, XIcon, FlagIcon, MoreIcon, PlayIcon,
  RouteIcon, MicIcon, ClipboardIcon, FlagStartIcon, CogIcon, UserIcon,
  PaperclipIcon, LinkIcon,
} from "./Icon";

/**
 * One task.
 *
 * Two rules the markup enforces rather than merely follows: an `auto` task
 * offers no completion control at all — we never let the interface imply the
 * member asserted something we are watching for ourselves — and a due date
 * always renders its reason, so a deadline can never appear without a cause.
 */

const SRC: Record<string, { cls: string; Icon: (p: { className?: string }) => React.JSX.Element; label: string }> = {
  ROADMAP: { cls: "s-roadmap", Icon: RouteIcon, label: "Roadmap" },
  MEETING: { cls: "s-call", Icon: MicIcon, label: "From calls" },
  ACTION_PLAN: { cls: "s-plan", Icon: ClipboardIcon, label: "Action plan" },
  ONBOARDING: { cls: "s-start", Icon: FlagStartIcon, label: "Getting started" },
  SYSTEM: { cls: "s-system", Icon: CogIcon, label: "Automatic" },
  MENTOR: { cls: "s-mentor", Icon: UserIcon, label: "From Mentor" },
};

/**
 * The verb for a getting-started step.
 *
 * The ledger stores only the href, so these labels — which the v1 checklist
 * carried — have to be restated. Keyed by the onboarding task id, which the
 * adapter writes as the source's refId. An unrecognised step still gets a
 * button; a member should never be told to go somewhere with no way to go.
 */
const ONBOARDING_CTA: Record<string, string> = {
  llc: "Upload it",
  "book-call": "Book the call",
  profile: "Open my profile",
  compliance: "Open my roadmap",
};

/**
 * The verb for a roadmap milestone, read off the source's refId prefix
 * (`call:` / `intake:` / `delivery:`). Keyed on the prefix rather than imported
 * from the adapter so no server module reaches the browser bundle.
 */
/** The refId prefix of a "Do this next" task's roadmap source (adapters/nextStep.ts). */
const NEXT_STEP_REF_PREFIX = "next-step:";

/** The onboarding step whose button opens the roadmap. */
const ROADMAP_ONBOARDING_REF = "compliance";

/**
 * Open the roadmap from a click on a roadmap link.
 *
 * Framed, the GHL parent must change its page: a `target="_top"` link reloads
 * the whole shell, and a plain link moves only this iframe. So the click asks
 * the parent to open its "roadmap" page. Not framed, or on a modified click,
 * the anchor's own href does the work.
 */
function openRoadmapInParent(e: React.MouseEvent<HTMLAnchorElement>): void {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (!isFramed()) return;
  e.preventDefault();
  requestGhlPage(ROADMAP_PAGE_KEY);
}

function milestoneCta(refId: string | null): string | null {
  if (!refId) return null;
  if (refId.startsWith("call:") || refId.startsWith("delivery:")) return "Book the call";
  if (refId.startsWith("intake:")) return "Submit the form";
  return null;
}

/**
 * A due date, in the programme's timezone.
 *
 * PINNED, AND THAT IS THE WHOLE POINT. Without `timeZone` this formats in
 * whatever zone the runtime happens to be in — UTC in the container, local in
 * the browser — so a deadline near midnight rendered "Fri, Jul 10" on the
 * server and "Sat, Jul 11" on the client, and React threw the tree away and
 * re-rendered it. Pinning makes the two agree by construction, and it is the
 * rule the rest of the app already follows: every date a member is shown is in
 * the program's own timezone.
 */
function fmtDue(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: PROGRAM_TZ,
  });
}

export function TaskCard({
  task, index, busy, onToggle, onDismiss, onRestore, onSnooze, mentorsHref, locationId, onBook,
}: {
  task: TaskView;
  /**
   * Position in the list being shown, from 1. Absent on the done and dismissed
   * lists, which are records rather than a queue and carry no number.
   */
  index?: number;
  busy: boolean;
  onToggle: () => void;
  onDismiss: (reason: string | null) => void;
  onRestore: () => void;
  onSnooze: () => void;
  mentorsHref: string;
  /** The GHL location id — the same segment this portal is served under. Used
   *  to build the dashboard's My Business link. */
  locationId: string;
  /**
   * Open the calendar in place. Returns false when this milestone has no
   * modal we can open — a delivery call with no section, say — and the card
   * should fall back to its deep link.
   */
  onBook: (refId: string) => boolean;
}) {
  // A fresh call-derived task opens its receipt on first view: the member sees
  // where it came from before wondering who added it.
  const [openProv, setOpenProv] = useState<string | null>(
    task.isNew && task.sources.some((s) => s.kind === "MEETING" && s.excerpt) ? task.sources.find((s) => s.excerpt)!.label : null,
  );
  /* A CALL RECEIPT OPENS A SHEET, not the inline drawer. What it carries is a
     sentence a person said, and that is a claim worth presenting at full size
     rather than folding under the chip that cites it. Other origins — a plan
     step, a roadmap link — are pointers, and a drawer is the right size for a
     pointer. */
  const [sheet, setSheet] = useState<TaskSourceView | null>(null);
  const [menu, setMenu] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");

  /* THE BODY IS CLAMPED, AND THE CONTROL ONLY APPEARS WHEN IT IS CLAMPING.
     An action-plan step can be twenty lines of imported checklist, which makes
     one row taller than the rest of the list together and buries the numbered
     order. Four lines is enough to say what the work is.

     WHY THIS IS MEASURED RATHER THAN GUESSED. A character count cannot tell
     you whether text wrapped — that depends on the width the card actually
     got. So the element is asked directly, and a body that fits gets no
     button. Guessing from length would put "Show more" on one-line rows. */
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    // Nothing to measure while open: the clamp is off, so the element is its
    // own full height and would report that it fits. `clamped` keeps the value
    // taken while it was shut, which is what "Show less" needs to stay up.
    if (!el || expanded) return;
    const measure = () => setClamped(el.scrollHeight - el.clientHeight > 1);
    measure();
    // The card is fluid, so the same text wraps differently as the window
    // changes. Without this a body clamped at 390px keeps its button after the
    // window widens enough to fit it.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [task.body, expanded]);

  const isAuto = task.completionMode === "auto";
  const done = task.status === "done";
  const dismissed = task.status === "dismissed";
  /* Every file on the task. A payload from before the file table carries only
     the single `attachmentUrl`, so that is read as a list of one. */
  const files = task.attachments?.length
    ? task.attachments.filter((f): f is typeof f & { url: string } => !!f.url)
    : task.attachmentUrl ? [{ id: null, name: task.attachmentName ?? "", url: task.attachmentUrl }] : [];
  // `soon` is the same seven-day window the order uses — the mark and the
  // position must not disagree about what counts as pressing.
  const alerting = task.due?.state === "soon" && !done && !dismissed;

  const tickClass = dismissed ? "t-dismissed" : "t-done";

  // A getting-started step or a roadmap milestone is an instruction to go
  // somewhere, so it gets a real button. Before this the href lived only inside
  // the provenance drawer, two clicks deep behind a chip, which is where these
  // steps went to die.
  const actionable = !done && !dismissed;
  const onboarding = actionable
    ? task.sources.find((s) => s.kind === "ONBOARDING" && !!s.deepLink) ?? null
    : null;
  const milestone = actionable && !onboarding
    ? task.sources.find((s) => s.kind === "ROADMAP" && !!s.deepLink && !!milestoneCta(s.refId)) ?? null
    : null;
  // An action-plan step's own card on the portal home, where the checkbox that
  // completes it lives. Only when nothing more specific already claimed the CTA,
  // and only while the CTA is switched on — see PLAN_CTA_ENABLED.
  const plan = PLAN_CTA_ENABLED && actionable && !onboarding && !milestone
    ? task.sources.find((s) => s.kind === "ACTION_PLAN" && !!s.deepLink) ?? null
    : null;
  /* "DO THIS NEXT" OPENS THE ROADMAP (owner, 2026-09-29). It is a roadmap
     step, so the fallback below sent it to My Business. Framed, the click asks
     the GHL parent to open its roadmap page (`openRoadmapInParent`). */
  const nextStep = actionable && !onboarding && !milestone && !plan
    && task.sources.some((s) => s.kind === "ROADMAP" && (s.refId ?? "").startsWith(NEXT_STEP_REF_PREFIX));
  /* PROGRAM WORK LANDS IN MY BUSINESS. "Your program" is the roadmap and the
     business papers, and My Business is where those papers are kept — so a
     programme row that has no more specific place to send the member sends
     them there rather than nowhere.
     LAST IN THE ORDER on purpose: an onboarding step, a roadmap milestone and
     an action plan each know a better destination than "the section this row
     is in", so any of them wins. */
  const myBusiness = actionable && !onboarding && !milestone && !plan && !nextStep && task.section === "govready";
  /* THE ROADMAP HREF IS BUILT HERE, not read off the source. A source keeps
     the deepLink it was written with, so an old menu-link id would survive in
     the ledger. */
  const roadmapHref = menuLinkHref(locationId, ROADMAP_MENU_LINK_ID);
  const onboardingOpensRoadmap = onboarding?.refId === ROADMAP_ONBOARDING_REF;

  return (
    <article className={`gpds-task${done ? " is-done" : ""}${dismissed ? " is-quiet" : ""}${task.due?.state === "overdue" && !done ? " is-over" : ""}${task.isNew && !done ? " is-new" : ""}`}>
      {/* A FINISHED OR DISMISSED ROW STILL SHOWS ITS MARK. The control on an
          open row is a button at the foot of the card now, but a record needs
          to say at a glance which of the two it is. */}
      {(done || dismissed) && (
        <span className={`gpds-tick ${tickClass}`} aria-hidden>
          {done ? <CheckIcon /> : <XIcon />}
        </span>
      )}

      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div className="thead">
          {index !== undefined && (
            // A position in a list is not a status, so this takes the design
            // system's `.pending` stepper dot rather than one of its coloured
            // variants. aria-hidden: the <ol> already gives a screen reader
            // the position, and reading it twice is noise.
            <span className="tnum" aria-hidden>{index}</span>
          )}
          <div className="tt">
            {task.isNew && !done && !dismissed && <span className="tdot" aria-label="New" />}
            {task.title}
            {/* WHICH LIST THIS ROW BELONGS TO, said on the row. The chips below
                name the exact origin — a call, a plan, a step — which answers a
                narrower question than "is a person waiting on me". This is the
                declared section, so it reads the same word the heading above it
                does. */}
            {/* The same word as the heading above it. "GovReady" named the
                programme; "Roadmap" names where the work actually lives, and a
                row and its list should not use two words for one thing. */}
            <span className="tpill">{task.section === "mentor" ? "Mentor" : "Roadmap"}</span>
            {alerting && (
              // DUE INSIDE THE WEEK, AND STILL HERS TO DO. A late task does not
              // get one: it is already the loudest row on the page, on a filled
              // pill, and an alarm on top of the line saying the mentor knows
              // would argue with it. An alert on work she can still finish is
              // pressure; on work she cannot undo it is anxiety.
              <span className="talert" role="img" aria-label="Due this week">!</span>
            )}
          </div>
          {/* THE DEADLINE SITS WITH THE TITLE, not down in the chips. It is the
              second thing a member needs off a row, and in the meta line it
              queued behind provenance. "Was due" rather than "Due" once the
              date has passed: the date is a fact, and the present tense reads
              as a demand for something that can no longer be met on time. */}
          {/* ROADMAP WORK SHOWS URGENCY WHEN IT HAS NO DATE — and the date
              when it has one. The rule used to be "govready never shows a
              date", written when none of this work carried a deadline: a date
              would have been invented, so the chip said why it was first
              instead.
              
              That premise is gone. Basic Info is due five days before the
              positioning call and each part of the record a week after it, both
              derived from a real booking — nothing invented. The old rule then
              hid a genuine date behind "As soon as possible", on the one task
              whose whole point is when it is due, and the member read the
              deadline only inside the title string. `task.due` is still what
              decides: absent, the urgency chip is exactly as correct as it
              always was. */}
          {!task.due && task.section === "govready" && !done && !dismissed && (
            <span className="gpds-duewrap">
              <span className="gpds-due d-asap">
                <FlagIcon /> As soon as possible
              </span>
            </span>
          )}

          {task.due && !done && !dismissed && (
            /* THE REASON SITS OUTSIDE THE PILL. A late deadline is a filled
               pill, and a cause reading "two weeks after the call" inside it
               makes the loudest element on the row also the widest. Keeping it
               alongside preserves the rule this file opens with — a deadline
               never appears without its cause — without inflating the badge. */
            <span className="gpds-duewrap">
              <span className={`gpds-due d-${task.due.state === "overdue" ? "over" : task.due.state === "soon" ? "soon" : "calm"}`}>
                <FlagIcon /> {task.due.state === "overdue" ? "Was due" : "Due"} {fmtDue(task.due.at)}
              </span>
              <span className="dwhy">{task.due.reason}</span>
            </span>
          )}

          {/* Top-right, beside the title: these actions are secondary, and at
              the foot of the card they cost every task a row of their own. */}
          {!done && !dismissed && (
            <div className="kebab-wrap">
              <button type="button" className="kebab" onClick={() => setMenu((m) => !m)} aria-label="More actions">
                <MoreIcon />
              </button>
              {menu && (
                <div className="gpds-menu">
                  <button type="button" onClick={() => { setMenu(false); setAsking(true); }}>Dismiss — not relevant</button>
                  <button type="button" onClick={() => { setMenu(false); onSnooze(); }}>Snooze for a week</button>
                  <a href={mentorsHref} className="block px-[10px] py-2 text-[0.78rem] no-underline text-inherit hover:bg-[var(--n-2)] rounded-[7px]">
                    Ask my mentor about this
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        {task.body && !done && (
          <>
            <div ref={bodyRef} className={`tb${expanded ? "" : " is-clamped"}`}>{task.body}</div>
            {clamped && (
              <button
                type="button"
                className="tb-more"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}

        

        <div className="meta">
          {task.isNew && !done && <span className="newbadge">New</span>}

          {task.sources
            /* A CALL CHIP IS SHOWN WHETHER OR NOT IT HAS A RECEIPT. 60% of
               them (443 of 741 fleet-wide) carry neither a verbatim excerpt nor
               a recording link, because the excerpt is the model's own output
               and it is often absent — but the chip's label comes from the CALL
               RECORD, so it still tells the member which conversation this came
               out of. That is worth more than the tidiness of hiding it.
               Without a receipt it renders as a plain span rather than a
               button, so nothing invites a click that would answer with
               silence — see `hasReceipt` below. */
            /* NO "GETTING STARTED" CHIP. Those rows already carry the GovReady
               pill beside the title, an "As soon as possible" mark and their
               own call to action; a fourth label naming the same thing a third
               time is furniture. */
            .filter((s) => s.kind !== "ONBOARDING")
            .map((s) => {
            const meta = SRC[s.kind] ?? SRC.SYSTEM;
            // A roadmap chip is a label, not a receipt: its drawer held only an
            // "Open it →" link, which the card's own CTA button now carries.
            // A call chip stays clickable — behind it sit the verbatim excerpt
            // and the recording, which are real evidence.
            // While the plan CTA is off, an action-plan chip must not turn into
            // a clickable receipt either: its drawer carries the same "Open
            // it →" link, so leaving it would move the navigation two clicks
            // deeper rather than remove it.
            const planLinkOff = !PLAN_CTA_ENABLED && s.kind === "ACTION_PLAN";
            const hasReceipt = !planLinkOff && s.kind !== "ROADMAP" && (!!s.excerpt || !!s.deepLink);
            const label = s.isPrimary ? s.label : `Also raised · ${s.label}`;
            return hasReceipt ? (
              <button
                key={`${s.kind}-${s.label}`}
                type="button"
                className={`gpds-src ${meta.cls}`}
                onClick={() =>
                  s.kind === "MEETING" && s.excerpt
                    ? setSheet(s)
                    : setOpenProv(openProv === s.label ? null : s.label)
                }
              >
                <meta.Icon />{label}
              </button>
            ) : (
              <span key={`${s.kind}-${s.label}`} className={`gpds-src ${meta.cls}`}>
                <meta.Icon />{label}
              </span>
            );
          })}

          {done && task.doneBy && (
            <span className="text-[0.68rem] text-gray-500">
              {task.doneBy.startsWith("auto:") ? "Ticked automatically" : task.doneBy.startsWith("mentor:") ? "Ticked by your mentor" : "You ticked this"}
            </span>
          )}
          {dismissed && (
            <span className="text-[0.68rem] text-gray-500">
              Dismissed{task.dismissedReason ? ` · ${task.dismissedReason}` : ""}
            </span>
          )}
        </div>

        {task.sources
          .filter((s) => s.label === openProv && !(s.kind === "MEETING" && s.excerpt))
          .map((s) => (
            <div className="prov" key={`prov-${s.label}`}>
              <div className="pl">{s.label}</div>
              {s.excerpt && <div className="pq">“{s.excerpt}”</div>}
              {s.deepLink && (
                <a href={s.deepLink} target={s.deepLink.startsWith("http") ? "_blank" : "_top"} rel="noreferrer">
                  {s.kind === "MEETING" ? <><PlayIcon /> Watch this moment in the recording</> : <>Open it →</>}
                </a>
              )}
              {/* Mandatory AI attribution: a model wrote this line off the
                  transcript, and the excerpt above is the receipt for it. */}
              {s.kind === "MEETING" && (
                <div className="ai-attr attrline">
                  <span className="dot" aria-hidden />
                  drafted from your call — tell your mentor if we got it wrong
                </div>
              )}
            </div>
          ))}
        {/* The Audit is the one step whose location needs showing rather
          than describing — it is a sub-step three levels into the
          roadmap. Same screenshot the v1 checklist carried. */}
        {onboarding && (onboarding.refId === "compliance" && (
          <a href={COMPLIANCE_GUIDE_IMG} target="_blank" rel="noopener noreferrer" title="Open the guide full size">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="gpds-guide" src={COMPLIANCE_GUIDE_IMG} alt={`Guide: ${task.title}`} />
          </a>)
        )}
        <div className="flex">
        {onboarding && (
          <>
            <a
              className="gpds-cta"
              href={onboardingOpensRoadmap ? roadmapHref : onboarding.deepLink!}
              // A portal page must replace the iframe, not nest inside it. A
              // GHL address that is not the roadmap opens in a new tab.
              target={onboardingOpensRoadmap || !onboarding.deepLink!.startsWith("http") ? "_top" : "_blank"}
              rel="noreferrer"
              onClick={onboardingOpensRoadmap ? openRoadmapInParent : undefined}
            >
              {ONBOARDING_CTA[onboarding.refId ?? ""] ?? "Open"}
            </a>
          </>
        )}
        {milestone && (
          // A call opens the same calendar the roadmap opens, right here — the
          // member should not have to go find the step. An intake goes to the
          // form, which is hosted outside the portal. The anchor is still the
          // real href, so it survives a middle-click and works if the modal
          // cannot open for this one.
          <a
            className="gpds-cta"
            href={milestone.deepLink!}
            target={milestone.deepLink!.startsWith("http") ? "_blank" : "_top"}
            rel="noreferrer"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              if (onBook(milestone.refId ?? "")) e.preventDefault();
            }}
          >
            {milestoneCta(milestone.refId)}
          </a>
        )}

        {plan && (
          // A real anchor, so the href is copyable and a middle-click still
          // opens a tab. The click is intercepted only when we are framed,
          // where a plain navigation would move the iframe out from under the
          // GHL shell instead of changing GHL's route.
          <a
            className="gpds-cta"
            href={plan.deepLink!}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              if (!isFramed()) return;
              e.preventDefault();
              portalNavigate(plan.deepLink!);
            }}
          >
            Open your action plan
          </a>
        )}

        {/* What the team attached to a hand-written task — EVERY file, each
            by its name (a task can carry several since Sep 2026). All open in
            a new tab — the portal lives in a GHL iframe, and a file replacing
            it would strand the member with no way back. */}
        {!done && (task.linkUrl || files.length > 0) && (
          <div className="gpds-taskfiles">
            {task.linkUrl && (
              <a className="gpds-cta ghost" href={task.linkUrl} target="_blank" rel="noreferrer">
                <LinkIcon /> Open link
              </a>
            )}
            {files.map((f, i) => (
              <a key={f.id ?? `${f.url}-${i}`} className="gpds-cta ghost" href={f.url} target="_blank" rel="noreferrer">
                <PaperclipIcon /> {f.name || "View attachment"}
              </a>
            ))}
          </div>
        )}
        {nextStep && (
          <a
            className="gpds-cta mr-2"
            href={roadmapHref}
            target="_top"
            rel="noreferrer"
            onClick={openRoadmapInParent}
          >
            Open my roadmap
          </a>
        )}
        {myBusiness && (
          // `_top`, not `_blank` and not the iframe. The destination is the GHL
          // dashboard itself, so replacing the whole window puts the member
          // inside the app at My Business — where opening the portal's own
          // iframe there would nest the dashboard inside the dashboard.
          <a
            className="gpds-cta mr-2"
            href={myBusinessUrl(locationId)}
            target="_top"
            rel="noreferrer"
          >
            Open My Business
          </a>
        )}
        {/* COMPLETION IS A SENTENCE, NOT A CHECKBOX.
            A tick beside the title read as a form control on a card that also
            carries a real call to action, and it said nothing about what
            ticking it meant. This says it.

            IT IS A GHOST BUTTON, DELIBERATELY. Where the row also has a "go and
            do it" action, that one is the primary and this must not compete
            with it: the member should do the work before claiming it. */}
        {!done && !dismissed && !isAuto && (
          <div className="acts">
            {/* FILLED WHEN IT IS THE ONLY THING TO DO, ghost when it is not.
                Most rows carry no "go and do it" action, and there the muted
                treatment made the row's one control look disabled. Where a
                primary action does exist, this steps back — the member should
                do the work before claiming it. */}
            <button
              type="button"
              className={`gpds-cta${onboarding || milestone || plan || myBusiness ? " ghost" : ""}`}
              onClick={onToggle}
              disabled={busy}
            >
              I&apos;ve completed this task
            </button>
          </div>
        )}
        </div>

        {/* An auto task gets no control at all: we never let the interface
            imply the member asserted something we are watching for ourselves. */}
        {!done && !dismissed && isAuto && (
          <div className="acts">
            <span className="text-[0.72rem] text-gray-500">We tick this for you when we see it done.</span>
          </div>
        )}

        {dismissed && (
          <div className="acts">
            <button type="button" className="ghost" onClick={onRestore} disabled={busy}>Restore</button>
          </div>
        )}

        {asking && (
          <div className="prov" style={{ borderLeftColor: "var(--due-soon)" }}>
            <div className="pl">Why is this not relevant? (optional)</div>
            <input
              className="w-full mt-1.5 px-2.5 py-2 rounded-lg border border-[var(--n-4)] text-[0.8rem]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Already handled, not applicable…"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" className="ghost" onClick={() => { setAsking(false); setReason(""); }}>Cancel</button>
              <button
                type="button"
                className="ghost"
                onClick={() => { onDismiss(reason.trim() || null); setAsking(false); setReason(""); }}
                disabled={busy}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {sheet && (
        <SourceSheet source={sheet} taskTitle={task.title} onClose={() => setSheet(null)} />
      )}
    </article>
  );
}
