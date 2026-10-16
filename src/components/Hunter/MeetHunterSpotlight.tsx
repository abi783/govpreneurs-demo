import { useEffect, useLayoutEffect, useState } from "react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { Card } from "../ui/Card";

const ANCHOR_ID = "hunter-lead-anchor";
const PAD = 8;
const GAP = 16;
const CARD_WIDTH = 420;

type Rect = { top: number; left: number; width: number; height: number };

export function MeetHunterSpotlight({ onDismiss }: { onDismiss: () => void }) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const el = document.getElementById(ANCHOR_ID);
      setVw(window.innerWidth);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  // Cut-out scrim: 4 dim panels around hero rect.
  const cut = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        right: Math.max(0, rect.left + rect.width + PAD),
        bottom: Math.max(0, rect.top + rect.height + PAD),
      }
    : null;

  // Card position: to the right of hero, vertically centered, clamped to viewport.
  let cardTop = 96;
  let cardLeft = vw - CARD_WIDTH - 60;
  if (rect) {
    cardLeft = Math.min(vw - CARD_WIDTH - 12, rect.left + rect.width + PAD + GAP);
    cardTop = Math.max(12, rect.top + rect.height / 2 - 80);
  }

  return (
    <div className="meet-hunter-spotlight" role="dialog" aria-labelledby="meet-hunter-title">
      {cut ? (
        <>
          <button
            type="button"
            className="meet-hunter-spotlight__panel"
            aria-label="Dismiss"
            onClick={onDismiss}
            style={{ top: 0, left: 0, right: 0, height: cut.top }}
          />
          <button
            type="button"
            className="meet-hunter-spotlight__panel"
            aria-label="Dismiss"
            onClick={onDismiss}
            style={{ top: cut.bottom, left: 0, right: 0, bottom: 0 }}
          />
          <button
            type="button"
            className="meet-hunter-spotlight__panel"
            aria-label="Dismiss"
            onClick={onDismiss}
            style={{ top: cut.top, left: 0, width: cut.left, height: cut.bottom - cut.top }}
          />
          <button
            type="button"
            className="meet-hunter-spotlight__panel"
            aria-label="Dismiss"
            onClick={onDismiss}
            style={{
              top: cut.top,
              left: cut.right,
              right: 0,
              height: cut.bottom - cut.top,
            }}
          />
          <div
            className="meet-hunter-spotlight__halo"
            aria-hidden="true"
            style={{
              top: cut.top,
              left: cut.left,
              width: cut.right - cut.left,
              height: cut.bottom - cut.top,
            }}
          />
        </>
      ) : (
        <button
          type="button"
          className="meet-hunter-spotlight__panel"
          aria-label="Dismiss"
          onClick={onDismiss}
          style={{ inset: 0 }}
        />
      )}
      <Card
        className="ui-card--meet-hunter ui-card--meet-hunter-anchored"
        style={{ top: cardTop, left: cardLeft, width: CARD_WIDTH }}
      >
        <div className="meet-hunter-card__avatar meet-hunter-card__avatar--portrait">
          <AgentAvatar agent="hunter" size={96} />
        </div>
        <div className="meet-hunter-card__body">
          <div className="meet-hunter-card__eyebrow">Meet your discovery agent</div>
          <h2 id="meet-hunter-title" className="meet-hunter-card__title">
            Hi, I'm Hunter.
          </h2>
          <p className="meet-hunter-card__copy">
            Every morning I read every federal and state/local (SLED) opportunity published
            overnight and surface the ones that fit you, with my reasoning on each. Here's what I'd
            look at first.
          </p>
          <div className="meet-hunter-card__actions">
            <button type="button" className="meet-hunter-card__btn" onClick={onDismiss} autoFocus>
              Show me
            </button>
          </div>
        </div>
        <div
          className="meet-hunter-card__pointer meet-hunter-card__pointer--left"
          aria-hidden="true"
        />
      </Card>
    </div>
  );
}
