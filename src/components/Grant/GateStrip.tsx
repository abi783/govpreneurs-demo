// Block ① — The Gate Strip. Two binary lights, computed before any reasoning
// (PRD 96 §3, §11.2). A hard fail fills and dominates — no pillar theater on a
// job the firm legally cannot bid. Hard gates never sell (§12.6): an unclosable
// block offers only the exit, never a service.
import type {
  GateLight,
  GateStrip as GateStripT,
  RealDeadline as RealDeadlineT,
} from "../../lib/grant/types";
import { EvidencePin, RichText, ToneGlyph } from "./primitives";
import { lineText } from "../../lib/grant/richText";
import { RealDeadline } from "./RealDeadline";

function LightRow({
  light,
  children,
  noticeId,
  sourcePath,
}: {
  light: GateLight;
  children?: React.ReactNode;
  noticeId?: string;
  sourcePath?: string | null;
}) {
  return (
    <div className={`grant-light grant-light--${light.tone}`}>
      <div className="grant-light__head">
        <ToneGlyph glyph={light.glyph} tone={light.tone} size={18} />
        <span className="grant-light__word">{light.word}</span>
        <span className="grant-light__q">{light.question}</span>
        {light.evidence.map((p, i) => (
          <EvidencePin
            key={i}
            pin={p}
            claim={lineText(light.reason)}
            noticeId={noticeId}
            sourcePath={sourcePath}
          />
        ))}
      </div>
      <p className="grant-light__reason">
        <RichText line={light.reason} />
      </p>
      {light.blocker ? (
        light.blocker.closableInWindow ? (
          // DEMO: this was a link to "#" that did nothing. It is plain text now.
          <p className="grant-light__unlock-note">
            {light.blocker.unlockPath}{" "}
            <span className="grant-light__time mono">{light.blocker.timeToClear}</span>
          </p>
        ) : (
          <p className="grant-light__noexit">Not something you can clear this cycle.</p>
        )
      ) : null}
      {children}
    </div>
  );
}

export function GateStrip({
  gates,
  deadline,
  noticeId,
  sourcePath,
}: {
  gates: GateStripT;
  deadline: RealDeadlineT;
  noticeId?: string;
  sourcePath?: string | null;
}) {
  return (
    <section
      className="grant-gates"
      data-dominated={gates.dominated ? "true" : "false"}
      aria-label="Can you bid this?"
    >
      <LightRow noticeId={noticeId} sourcePath={sourcePath} light={gates.legal} />
      <LightRow noticeId={noticeId} sourcePath={sourcePath} light={gates.submittable}>
        <RealDeadline deadline={deadline} />
      </LightRow>
    </section>
  );
}
