import { useEffect, useRef } from "react";
import { useToolsAnalytics } from "@/lib/tools/analytics";

interface SummitPitchProps {
  pitch: string;
  coupon: string;
  url: string;
}

/**
 * Tailored summit pitch shown under the scorecard verdict, ungated. Dates,
 * venue and pricing are deliberately NOT repeated here — SummitInvite.tsx is
 * the single source of truth for those (currently unverified); this only
 * carries the model-written paragraph + coupon + link.
 */
export function SummitPitch({ pitch, coupon, url }: SummitPitchProps) {
  const track = useToolsAnalytics();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    track("tools_summit_pitch_shown");
  }, [track]);

  return (
    <div className="summit-pitch">
      <p className="t-body summit-pitch__text">{pitch}</p>
      <div className="summit-pitch__footer">
        <span className="summit-pitch__coupon">
          <span className="summit-pitch__coupon-label">Code</span>
          <span className="summit-pitch__coupon-code">{coupon}</span>
        </span>
        <a
          className="btn btn-primary summit-pitch__cta"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("tools_summit_pitch_clicked")}
        >
          See the summit →
        </a>
      </div>
    </div>
  );
}
