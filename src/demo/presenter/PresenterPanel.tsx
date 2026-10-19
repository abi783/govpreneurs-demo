// DEMO: the presenter's controls. Members never see this; it exists only in the demo build.
//
// How it stays out of the way (the practices it follows):
//   - Hidden until called: a faint handle at the bottom of the dark menu, or Shift+Alt+P
//     (the same family as Ava's Shift+Alt+A). Never over the page; the chat boxes are bottom-right.
//   - Shows only what fits now: "Sarah answers" only when a review is waiting, "Award" only
//     when a bid was sent and not yet decided.
//   - Keyboard-first: while open, 1–9, 0 and − jump to a segment, so Tim never hunts for a
//     corner on a projector. Digits are ignored while the cursor is in a text box.
//   - Closes itself after any action, on Escape, and on a click elsewhere.
//   - The audience sees the product, not the tooling: a time jump shows a short
//     "One business day later" card, then the product's own screens.
//   - Booth mode is off unless switched on. After 3 minutes with no input it warns for
//     10 seconds ("touch anything to keep going"), then rests on Hunter's feed.
//   - `data-qa-skip`: the QA crawl clicks every button, but not these.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useDemoState } from "@/demo/runtime/store";
import { avaSentAt } from "@/demo/ava/progress";
import { OPPORTUNITIES } from "@/demo/story/opportunities";
import { answerReview, pendingReviews } from "@/demo/state/mentorReviews";
import { awardOutcome, setAwardOutcome, type AwardOutcome } from "@/demo/state/outcomes";
import type { MentorVerdict } from "@/demo/story/mentorReplies";
import { refreshMentorReviews } from "@/lib/mentorReviewsApi";
import { IDLE_ROUTE, SEGMENTS, jumpTo } from "./segments";
import { showTimeJump } from "./TimeJump";

const IDLE_MS = 3 * 60_000;
const WARN_SECONDS = 10;

const VERDICTS: { v: MentorVerdict; label: string }[] = [
  { v: "pursue", label: "Pursue" },
  { v: "discuss", label: "Discuss" },
  { v: "pass", label: "Pass" },
];

/** The key that jumps to segment n while the panel is open. */
function keyFor(n: number): string {
  return n <= 9 ? String(n) : n === 10 ? "0" : "−";
}

function segmentForKey(key: string) {
  const n = key === "0" ? 10 : key === "-" || key === "−" ? 11 : Number(key);
  return SEGMENTS.find((s) => s.n === n) ?? null;
}

function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)));
}

/** The id in /opportunities/:id, /ava/:id or /mentors/:id. */
function pageId(pathname: string): string | null {
  const m = /^\/(?:opportunities|ava|mentors)\/([^/?#]+)/.exec(pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

export function PresenterPanel() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [booth, setBooth] = useDemoState<boolean>("presenter.booth", false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  // What fits this screen. Read when the panel renders open.
  const here = pageId(pathname);
  const pending = open ? pendingReviews() : [];
  const review = pending.find((r) => r.id === here || r.oppKey === here) ?? pending[0] ?? null;
  const sent = open ? OPPORTUNITIES.filter((o) => o.ava && avaSentAt(o.id) && !awardOutcome(o.id)) : [];
  const bid = sent.find((o) => o.id === here) ?? sent[0] ?? null;

  const close = useCallback(() => setOpen(false), []);

  const sarahAnswers = async (reviewId: string, verdict: MentorVerdict) => {
    close();
    await showTimeJump("One business day later");
    answerReview(reviewId, verdict);
    await refreshMentorReviews().catch(() => undefined);
    void navigate({ to: "/mentors/$reviewId", params: { reviewId } });
  };

  const award = async (id: string, outcome: AwardOutcome) => {
    close();
    await showTimeJump("Three weeks later");
    setAwardOutcome(id, outcome);
    if (pathname === "/pipeline") window.location.reload();
    else void navigate({ to: "/pipeline" });
  };

  // Shift+Alt+P toggles; while open, Escape closes and digits jump.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // `code`, not `key`: on a Mac, Option+Shift+P types a different letter.
      if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyP") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      const seg = segmentForKey(e.key);
      if (seg) {
        e.preventDefault();
        jumpTo(seg);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // A click anywhere else closes the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || handleRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  // Booth mode: rest on Hunter's feed after a visitor leaves. The timer arms on the first
  // input after a reset, so an empty booth is not reloaded every three minutes.
  useEffect(() => {
    if (!booth) {
      setCountdown(null);
      return;
    }
    let armed = false;
    let idleTimer = 0;
    let tick = 0;
    const startCountdown = () => {
      let left = WARN_SECONDS;
      setCountdown(left);
      tick = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(tick);
          jumpTo(null, IDLE_ROUTE);
        } else setCountdown(left);
      }, 1000);
    };
    const onInput = () => {
      armed = true;
      window.clearInterval(tick);
      setCountdown(null);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => armed && startCountdown(), IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"] as const;
    events.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onInput));
      window.clearTimeout(idleTimer);
      window.clearInterval(tick);
    };
  }, [booth]);

  return (
    <>
      <button
        ref={handleRef}
        type="button"
        className={`demo-presenter-handle${open ? " is-open" : ""}`}
        aria-label="Presenter controls (Shift+Alt+P)"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-qa-skip
      >
        <span className="demo-presenter-handle__grip" aria-hidden />
        <span className="demo-presenter-handle__label">Presenter · ⇧⌥P</span>
      </button>

      {open && (
        <div ref={panelRef} className="demo-presenter" role="dialog" aria-label="Presenter controls" data-qa-skip>
          <div className="demo-presenter__head">
            <span>Presenter</span>
            {booth && <span className="demo-presenter__tag">Booth</span>}
            <button type="button" className="demo-presenter__x" aria-label="Close" onClick={close}>
              ×
            </button>
          </div>

          {review && (
            <section className="demo-presenter__sec">
              <div className="demo-presenter__label">Sarah answers</div>
              <div className="demo-presenter__what" title={review.title}>
                {review.title}
              </div>
              <div className="demo-presenter__row">
                {VERDICTS.map(({ v, label }) => (
                  <button key={v} type="button" className="demo-presenter__btn" onClick={() => void sarahAnswers(review.id, v)}>
                    {label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {bid && (
            <section className="demo-presenter__sec">
              <div className="demo-presenter__label">Award</div>
              <div className="demo-presenter__what" title={bid.plainTitle}>
                {bid.plainTitle}
              </div>
              <div className="demo-presenter__row">
                <button type="button" className="demo-presenter__btn" onClick={() => void award(bid.id, "won")}>
                  Won
                </button>
                <button type="button" className="demo-presenter__btn" onClick={() => void award(bid.id, "not_awarded")}>
                  Not awarded
                </button>
              </div>
            </section>
          )}

          <section className="demo-presenter__sec">
            <div className="demo-presenter__label">Jump to</div>
            <div className="demo-presenter__grid">
              {SEGMENTS.map((s) => (
                <button key={s.n} type="button" className="demo-presenter__jump" onClick={() => jumpTo(s)}>
                  <kbd>{keyFor(s.n)}</kbd>
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <label className="demo-presenter__switch">
            <input
              type="checkbox"
              checked={booth}
              onChange={(e) => setBooth(e.target.checked)}
            />
            <span>
              Booth mode
              <small>Back to Hunter's feed after 3 minutes idle</small>
            </span>
          </label>

          <div className="demo-presenter__foot">1–9, 0, − jump · Esc closes</div>
        </div>
      )}

      {countdown !== null && (
        <div className="demo-idle" role="status" aria-live="polite" data-qa-skip>
          Starting over in {countdown} s · touch anything to keep going
        </div>
      )}
    </>
  );
}
