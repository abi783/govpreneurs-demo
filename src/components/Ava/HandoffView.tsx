// A bid Ava has not read yet: the handoff from Grant (ava-two-phase.html 7.1),
// in the two-phase frame.
//
// A federal notice: Ava is reading the buyer's files. A state or local notice:
// the buyer keeps its files on its own website, often behind a vendor login, so
// Ava asks for them first, and builds nothing until it has them
// (build-progression.md, item 3). Everything Grant found carries over, shown
// as his.
//
// DEMO: the four bids in the story are fully built. Every other opportunity
// lands here, and the page has to look finished, not broken. So each action
// works and keeps its result in the demo store (key "ava.handoff"): the files
// she adds, and whether Ava should tell her when she has a first question.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellOff, Check, FileUp } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import {
  AgentMsg,
  AgentTurn,
  ChatCard,
  Composer,
  QuickReplies,
  YouMsg,
  type Reply,
} from "../ds/AgentChat";
import { FoldedSide, FoldRail, ShowPanel, SideFold } from "../ds/AgentWorkspace";
import { useDemoState } from "../../demo/runtime/store";
import { currentMember } from "../../demo/ava/member";
import type { AvaOpportunity } from "../../demo/ava/opportunity";
import { grantHandoff } from "../../lib/ava/handoff";
import { avaFace, TALK_LINE } from "./Asking";
import { AvaBadge, AvaSteps, useRailOpen, useSideOpen } from "./Frame2";
import { RefChip } from "./GrantPrimitives";
import { ReqMark } from "./primitives";

interface HandoffState {
  files: string[];
  notify: boolean;
}

const NONE: HandoffState = { files: [], notify: false };

/** Ava's own word for the buyer in a sentence: "the Army's files". */
function theirs(opp: AvaOpportunity): string {
  if (/county/i.test(opp.agency)) return "the county's";
  if (/school|district|\bisd\b/i.test(opp.agency)) return "the district's";
  if (/^city\b/i.test(opp.agency)) return "the city's";
  if (/\barmy\b/i.test(opp.agency)) return "the Army's";
  if (/air force/i.test(opp.agency)) return "the Air Force's";
  if (/veterans/i.test(opp.agency)) return "the VA's";
  return "the buyer's";
}

interface Exchange {
  you: string;
  voice: boolean;
  ava: string;
}

export function HandoffView({ opp }: { opp: AvaOpportunity }) {
  const h = grantHandoff(opp);
  const w = theirs(opp);
  const needsFiles = opp.scope === "sled";
  const [all, setAll] = useDemoState<Record<string, HandoffState>>("ava.handoff", {});
  const mine = all[opp.noticeId] ?? NONE;
  const patch = (p: Partial<HandoffState>) =>
    setAll((prev) => ({ ...prev, [opp.noticeId]: { ...(prev[opp.noticeId] ?? NONE), ...p } }));
  const [talk, setTalk] = useState<Exchange[]>([]);
  const [dueOpen, setDueOpen] = useState(false);
  const [railOpen, toggleRail] = useRailOpen();
  const side = useSideOpen();
  const waiting = needsFiles && mine.files.length === 0;
  const first = currentMember.ownerFirstName;
  const readingWhat = needsFiles
    ? `${mine.files.length} ${mine.files.length === 1 ? "file" : "files"}`
    : "the notice and its files";

  const grantWords = `Grant says ${h.call}. ${h.rationale}`;
  const answerTyped = (text: string): string => {
    const t = text.toLowerCase();
    if (/grant|call|should i|bid or|worth/.test(t)) return grantWords;
    if (/how long|when|ready|soon|time/.test(t))
      return "About an hour after I have the files. I tell you here the moment I have my first question.";
    if (/file|upload|add|send/.test(t))
      return needsFiles
        ? `Use the button above to add ${w} files. Any file works for now.`
        : "I already have the notice. I am reading it and its attachments.";
    return `I have not read ${w} files yet, so I cannot answer that. I will ask you what I need when I have read them.`;
  };
  const ask = (you: string, voice = false) =>
    setTalk((x) => [...x, { you, voice, ava: answerTyped(you) }]);

  const replies: Reply[] = [
    ...(waiting
      ? []
      : [
          {
            label: mine.notify ? "Stop telling me" : "Tell me when you are ready",
            kind: "primary" as const,
            icon: mine.notify ? <BellOff size={16} aria-hidden /> : <Bell size={16} aria-hidden />,
            onClick: () => patch({ notify: !mine.notify }),
          },
        ]),
    { label: "What did Grant find?", onClick: () => ask("What did Grant find?") },
    { label: "How long will you take?", onClick: () => ask("How long will you take?") },
  ];

  return (
    <div className="ava2">
      <header className="ava2-top">
        <Link
          to="/opportunities/$noticeId"
          params={{ noticeId: opp.noticeId }}
          className="ava2-top__back"
          aria-label="Back to Grant's read of this bid"
        >
          <ArrowLeft size={20} aria-hidden />
        </Link>
        <AvaBadge av={waiting ? "still" : "live"} />
        <div className="ava2-top__t">
          <h1>{opp.title}</h1>
          <p>
            {opp.agency} · <span className="mono">{opp.noticeId}</span>
          </p>
        </div>
        <Link to="/ava" className="btn btn-ghost btn-sm ava2-top__bids">
          Your bids
        </Link>
        <div
          className={`ava2-top__days${dueOpen ? " is-open" : ""}`}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDueOpen(false);
          }}
        >
          {/* No due date before Ava reads the files: the listing's date can be
              wrong (PRD TD-09, 8 October 2026). */}
          <button
            type="button"
            className="ava2-top__left"
            aria-expanded={dueOpen}
            aria-controls="ava2-due"
            onClick={() => setDueOpen((v) => !v)}
          >
            <span className="ava2-top__dl">Due date</span>
            <span>not read yet</span>
          </button>
          <div className="ava2-top__duepop" id="ava2-due">
            <b>Ava shows the due date once she has read {w} files.</b>
            <span>The date on the listing can be wrong.</span>
          </div>
        </div>
      </header>
      <div className={`ava2-panes${railOpen ? " is-open" : ""}`}>
        <FoldRail
          open={railOpen}
          onToggle={toggleRail}
          title={`What ${w.replace(/'s$/, "")} asks for`}
          count=""
          empty={`Ava starts this list as soon as she has read ${w} files.`}
          groups={[]}
        />
        <section className="ava2-work" aria-label="Ava's workspace">
          <div className={`ava2-talk${side.open ? "" : " is-folded"}`}>
            <div className="ava2-talk__chat">
              <AvaSteps
                said={waiting ? `I need ${w} files first.` : `I am reading ${readingWhat}.`}
                phase={1}
                steps={[
                  { label: "Reading documents", state: "wait" },
                  { label: "Required details", state: "next" },
                  { label: "Answer Ava's questions", state: "next" },
                  { label: "Review bid", state: "next" },
                  { label: "Mentor review", state: "opt" },
                  { label: "Bid complete", state: "next" },
                ]}
              />
              <div className="ava2-talk__scroll">
                <div className="ds-chat ava2-thread">
                  <AgentTurn avatar={avaFace}>
                    <AgentMsg>
                      Hi {first}. I am Ava. I will build this bid with you, and show you everything
                      as I go.
                    </AgentMsg>
                  </AgentTurn>
                  {waiting ? (
                    <>
                      <AgentTurn avatar={avaFace}>
                        <AgentMsg>
                          I need {w} files first. {opp.agency} keeps them on its website. They are
                          often behind a vendor login, so I cannot get them myself.
                        </AgentMsg>
                        <ChatCard>
                          <h4>How to get them</h4>
                          <ol className="ava2-steps ava2-steps--plain">
                            <li>
                              Open {w} website, and sign in with the vendor account you made for it.
                            </li>
                            <li>Find bid number {opp.noticeId}.</li>
                            <li>Download every file, with every addendum.</li>
                            <li>Add them here. I start reading as soon as I have them.</li>
                          </ol>
                        </ChatCard>
                      </AgentTurn>
                      <div className="ds-replies">
                        <label className="btn btn-primary">
                          <FileUp size={16} aria-hidden /> Add {w} files
                          <input
                            type="file"
                            multiple
                            className="u-visually-hidden"
                            onChange={(e) => {
                              const names = [...(e.target.files ?? [])].map((f) => f.name);
                              if (names.length > 0) patch({ files: names });
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {mine.files.length > 0 ? (
                        <YouMsg>
                          Added {mine.files.length} {mine.files.length === 1 ? "file" : "files"}:{" "}
                          {mine.files.slice(0, 3).join(", ")}
                          {mine.files.length > 3 ? ` and ${mine.files.length - 3} more` : ""}.
                        </YouMsg>
                      ) : null}
                      <AgentTurn avatar={avaFace}>
                        <AgentMsg>
                          {needsFiles ? "Thank you. " : ""}I am reading {readingWhat} now. It takes
                          me about an hour.
                        </AgentMsg>
                        <AgentMsg>
                          When I have my first question for you, I show it here. Grant&apos;s read
                          is on the right: it is where I start.
                        </AgentMsg>
                        {mine.notify ? (
                          <p className="ava2-small ava2-notified" role="status">
                            <Check size={14} aria-hidden /> I will tell you here, and on your list
                            of bids, when I am ready.
                          </p>
                        ) : null}
                      </AgentTurn>
                    </>
                  )}
                  {talk.map((x, i) => (
                    <div key={i} className="ds-chat">
                      <YouMsg voice={x.voice ? "You said" : undefined}>{x.you}</YouMsg>
                      <AgentTurn avatar={avaFace}>
                        <AgentMsg>{x.ava}</AgentMsg>
                      </AgentTurn>
                    </div>
                  ))}
                  <QuickReplies replies={replies} />
                  <div className="ds-replies">
                    <Link
                      to="/opportunities/$noticeId"
                      params={{ noticeId: opp.noticeId }}
                      className="btn btn-ghost"
                    >
                      <ArrowLeft size={16} aria-hidden /> Back to Grant&apos;s read
                    </Link>
                  </div>
                </div>
              </div>
              <div className="ava2-talk__composer">
                <Composer
                  onSend={(text, how) => ask(text, how.voice)}
                  sample={() => "What did Grant find?"}
                  placeholder="Type to Ava, or press Talk"
                  typePlaceholder="Type to Ava"
                  note={TALK_LINE}
                />
              </div>
            </div>
            {side.open ? (
              <>
                <SideFold label="What Ava is showing you" onFold={side.toggle} />
                <ShowPanel label="Ava is showing you" title="What Grant already found">
                  <div className="ds-chatcard ava2-grantcard--side">
                    <div className="ds-msg__who">
                      <AgentAvatar agent="grant" size={24} />
                      <span>
                        <b>Grant says</b> {h.call}
                      </span>
                    </div>
                    <p>{h.rationale}</p>
                  </div>
                  {h.requirements.length > 0 ? (
                    <div className="ava2-list">
                      {h.requirements.map((r) => (
                        <div key={r.text} className="ava2-list__r">
                          <span />
                          <span>
                            <ReqMark status={r.status} /> {r.text} <RefChip label={r.ref} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="ds-show__note">
                    Grant&apos;s read is where I start. It is not the full list. I read every file
                    myself.
                  </p>
                </ShowPanel>
              </>
            ) : (
              <FoldedSide label="What Ava is showing you" onOpen={side.toggle} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
