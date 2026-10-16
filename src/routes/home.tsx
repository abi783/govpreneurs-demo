import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Target,
  UserSquare,
  MessagesSquare,
  Sparkles,
  Check,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { NOW } from "../lib/format";
import { currentMember, useJourney, findNextSubStep } from "../lib/mock/currentMember";
import { useMentorUnread } from "../lib/mentorReviewsApi";
import { NEXT_STEP_COPY } from "../lib/mock/nextStep";
import { StayReadyHomeStrip } from "../components/StayReady/StayReadyHomeStrip";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — GovPreneurs" },
      {
        name: "description",
        content:
          "Your federal contracting workspace — your next step, where you are on the roadmap, and what needs you today.",
      },
    ],
  }),
  component: HomePage,
});

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const WHATS_NEW: { text: string; href: string }[] = [
  {
    text: "Hunter found 12 new matches in your area this week.",
    href: "/opportunities",
  },
];

function statusLine(
  currentStepLabel: string,
  complete: number,
  total: number,
  overallPercent: number,
  stepIndex: number,
  totalSteps: number,
): string {
  if (stepIndex === totalSteps && complete === total) {
    return "You're roadmap-complete.";
  }
  if (complete === total - 1) {
    return `You're almost through ${currentStepLabel} — one step to go.`;
  }
  return `You're ${complete} of ${total} through ${currentStepLabel} — ${overallPercent}% overall.`;
}

function HomePage() {
  usePageMeta({});
  const journey = useJourney();
  const { roadmap, readiness, tasksUnread, previewMatchCount } = journey;
  const mentorUnread = useMentorUnread();
  const first = currentMember.ownerName.split(" ")[0];
  const hello = greeting(NOW);

  const next = findNextSubStep(roadmap);
  const nextCopy = next ? NEXT_STEP_COPY[next.subStep.id] : null;

  const status = statusLine(
    roadmap.currentStepLabel,
    roadmap.currentStepSub.complete,
    roadmap.currentStepSub.total,
    roadmap.overallPercent,
    roadmap.currentStepIndex,
    roadmap.steps.length,
  );

  const needsYou = tasksUnread > 0 || mentorUnread > 0;
  const showPreview = readiness.status === "preview";

  return (
    <div className="home2">
      {/* Greeting */}
      <header className="home2-head">
        <h1 className="home2-greeting">
          {hello}, {first}.
        </h1>
        <p className="home2-status">{status}</p>
      </header>

      <StayReadyHomeStrip />

      {/* Next Step hero */}
      {nextCopy && (
        <section className="brand-card home2-next">
          <div>
            <div className="brand-kicker">Your Next Step</div>
            <h3>{nextCopy.title}</h3>
            <p>{nextCopy.body}</p>
            <div className="home2-next-actions">
              <Link to={nextCopy.primaryHref} className="btn btn-primary btn-sm">
                {nextCopy.primaryLabel} <ArrowRight size={13} />
              </Link>
              {nextCopy.dfy && (
                <Link to={nextCopy.dfy.href} className="btn btn-ghost btn-sm">
                  {nextCopy.dfy.label}
                </Link>
              )}
              {nextCopy.secondary && (
                <Link to={nextCopy.secondary.href} className="btn btn-ghost btn-sm">
                  {nextCopy.secondary.label}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Roadmap tracker */}
      <section className="home2-rmap">
        <div className="home2-rmap-head">
          <div className="t-label">Your Roadmap</div>
          <div className="home2-rmap-meta">
            <span>
              {roadmap.overallPercent}% · ~{roadmap.estWeeksRemaining} weeks
            </span>
          </div>
        </div>
        <div className="home2-rmap-grid">
          {roadmap.steps.map((s, i) => {
            const stateMod =
              s.state === "complete"
                ? "is-done"
                : s.state === "current"
                  ? "is-current"
                  : "is-upcoming";
            const isLast = i === roadmap.steps.length - 1;
            const subCaption =
              s.state === "current"
                ? `${roadmap.currentStepSub.complete} of ${roadmap.currentStepSub.total} sub-steps`
                : s.state === "complete"
                  ? "Done"
                  : `${s.subSteps.length} step${s.subSteps.length === 1 ? "" : "s"}`;
            return (
              <div key={s.index} className={`home2-rmap-cell ${stateMod}`}>
                <div className="home2-rmap-dot-wrap">
                  {!isLast && <span className="home2-rmap-rail" aria-hidden />}
                  <span className="home2-rmap-dot">
                    {s.state === "complete" ? (
                      <Check size={13} strokeWidth={3} />
                    ) : (
                      s.index
                    )}
                  </span>
                </div>
                <div className="home2-rmap-label">{s.label}</div>
                <div className="home2-rmap-sub">{subCaption}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Summary cards */}
      <section className="home2-summary-grid">
        <div className={`home2-card ${needsYou ? "" : "is-calm"}`}>
          {needsYou ? (
            <>
              <div className="home2-card-title">Needs you</div>
              <div className="home2-card-body">
                {tasksUnread > 0 && (
                  <>
                    {tasksUnread} task{tasksUnread === 1 ? "" : "s"}
                  </>
                )}
                {tasksUnread > 0 && mentorUnread > 0 && " · "}
                {mentorUnread > 0 && (
                  <>
                    {mentorUnread} mentor repl{mentorUnread === 1 ? "y" : "ies"}
                  </>
                )}
              </div>
              <div className="home2-card-actions">
                {tasksUnread > 0 && (
                  <Link to="/tasks" className="home2-card-link">
                    Go to Tasks <ArrowRight size={12} />
                  </Link>
                )}
                {mentorUnread > 0 && (
                  <Link to="/mentors" className="home2-card-link">
                    Open Mentors <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="home2-card-title is-muted">
                You're all caught up.
              </div>
              <div className="home2-card-body">
                No tasks or mentor replies waiting.
              </div>
            </>
          )}
        </div>

        {showPreview && (
          <div className="home2-card">
            <div className="home2-card-title">In preview</div>
            <div className="home2-card-body">
              <strong>{previewMatchCount} matches waiting.</strong>{" "}
              Hunter's found work you can pursue once you're ready.
            </div>
            <div className="home2-card-actions">
              <Link to="/opportunities" className="home2-card-link">
                See preview <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Jump back in */}
      <section className="home2-jump-sect">
        <div className="t-label home2-jump-label">Jump back in</div>
        <div className="home2-jump">
          <Link to="/opportunities" className="home2-jump-item">
            <Target size={15} />
            <span>Opportunities</span>
          </Link>
          <Link to="/my-business" className="home2-jump-item">
            <UserSquare size={15} />
            <span>My Business</span>
          </Link>
          <Link to="/mentors" className="home2-jump-item">
            <MessagesSquare size={15} />
            <span>Mentors</span>
          </Link>
        </div>
      </section>

      {/* What's new */}
      {WHATS_NEW.length > 0 && (
        <section className="home2-whatsnew">
          <Sparkles size={13} className="home2-whatsnew-icon" />
          <ul>
            {WHATS_NEW.map((item) => (
              <li key={item.text}>
                <span>{item.text}</span>
                <Link to={item.href} className="home2-whatsnew-link">
                  <ArrowRight size={11} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
