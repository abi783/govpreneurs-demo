// DEMO: the "One business day later" card the presenter controls show before
// Sarah's reply (C1) or an award (C2). It says out loud that the demo moved the
// clock, so nobody takes an instant reply for the product's real turnaround.

import { useEffect, useState } from "react";

const EVENT = "gp-demo:time-jump";
const SHOW_MS = 1700;

interface TimeJumpDetail {
  text: string;
  done: () => void;
}

/** Show the card and resolve when it has faded. */
export function showTimeJump(text: string): Promise<void> {
  return new Promise((done) => {
    window.dispatchEvent(new CustomEvent<TimeJumpDetail>(EVENT, { detail: { text, done } }));
  });
}

export function TimeJumpHost() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    const onJump = (e: Event) => {
      const { text: next, done } = (e as CustomEvent<TimeJumpDetail>).detail;
      window.clearTimeout(timer);
      setText(next);
      timer = window.setTimeout(() => {
        setText(null);
        done();
      }, SHOW_MS);
    };
    window.addEventListener(EVENT, onJump);
    return () => {
      window.removeEventListener(EVENT, onJump);
      window.clearTimeout(timer);
    };
  }, []);

  if (!text) return null;
  return (
    <div className="demo-timejump" role="status" aria-live="polite" data-qa-skip>
      <div className="demo-timejump__card">
        <span className="demo-timejump__clock" aria-hidden />
        {text}
      </div>
    </div>
  );
}
