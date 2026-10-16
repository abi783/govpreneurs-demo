// One forecast — the Forecasts v5 page: one job per box, one home per fact.
//   1 Page header · 2 The opportunity · 4–8 Grant's read (the call, the two columns,
//   Still unknown, How to win it) · Forecast source · 9 Get ready · The details behind my
//   read (3 Timeline, the last bid request, what the record says, documents, sources) ·
//   13 Grant's chat.
// It keeps the order and parts of the Grant page on Opportunities where they mean the
// same thing (src/routes/opportunities.$noticeId.tsx). Hunter owns the list and Grant
// owns this page, so Hunter's fit is not shown here. The forecast is a live record from
// `opportunities`, read for the signed-in member (lib/forecasts/useForecasts.ts).

import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Send } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { ForecastEvidence } from "../components/Forecast/ForecastEvidence";
import { ForecastGrantRail } from "../components/Forecast/ForecastGrantRail";
import { ForecastGrantTake } from "../components/Forecast/ForecastGrantTake";
import { ForecastJobCard } from "../components/Forecast/ForecastJobCard";
import { ForecastMeetGrant } from "../components/Forecast/ForecastMeetGrant";
import { ForecastPlan } from "../components/Forecast/ForecastPlan";
import { ForecastSource } from "../components/Forecast/ForecastSource";
import { ForecastWatchChanges } from "../components/Forecast/ForecastWatchChanges";
import type { RailFocus } from "../components/Forecast/StepAction";
import { SendToMentorModal } from "../components/Opportunity/SendToMentorModal";
import { FeedErrorNotice } from "../components/Hunter/FeedErrorNotice";
import { FeedLoadingState } from "../components/Hunter/FeedLoadingState";
import { DETAIL, LIST_COPY } from "../lib/forecasts/copy";
import type { ScoredForecast } from "../lib/forecasts/engine";
import { useForecast } from "../lib/forecasts/useForecasts";
import { firmFromMember } from "../lib/forecasts/live";
import { useForecastTake } from "../lib/forecasts/useForecastTake";
import type { ForecastMemberDto } from "../lib/forecastsApi";
import { canRaiseConfidence, readForecast, readSignature } from "../lib/forecasts/grant";
import { CALL, MENTOR, RAIL } from "../lib/forecasts/grantCopy";
import { toggleStep, useDoneSteps } from "../lib/forecasts/readiness";
import { useLiveSlice } from "../lib/eventBus";
import { useMentorSend } from "../lib/mentorSend";
import { MENTOR_REVIEW_MIN_LEAD_MS, isTooCloseToDeadline } from "../lib/entitlements";
import { formatUSD } from "../lib/wallet";
import {
  markOrderMentorSent,
  useMentorReviewFor,
  useOrderMentorSent,
} from "../lib/microPurchases/mentorSent";
import { MentorUpsellModal } from "../components/Opportunity/MentorUpsellModal";
import { MET_GRANT_FORECAST_KEY, readFlag, writeFlag } from "../lib/onboardingStorage";
import { isTracked, toggleTracked, useTrackedForecasts } from "../lib/trackedForecasts";
import { crossPageClick } from "../lib/ghlNav";
import { useForecastWatch, watchCopyState } from "../lib/forecasts/watch";
import { WATCH_PROMISE } from "../lib/forecasts/watchCopy";

export const Route = createFileRoute("/forecasts/$forecastId")({
  head: () => ({
    meta: [
      { title: "Forecast — Forecasts · GovPreneurs" },
      {
        name: "description",
        content: "Work the government plans to buy, and how to get ready for it.",
      },
    ],
  }),
  component: ForecastPage,
});

function NotFound() {
  return (
    <div className="fc-empty">
      <p>{DETAIL.notFound}</p>
      <Link to="/forecasts" className="btn btn-secondary btn-sm">
        {DETAIL.notFoundBack}
      </Link>
    </div>
  );
}

type Focus = (RailFocus & { nonce: number }) | null;

/** "Not sure" leaves a question open, so the link to answer it stays. */
function stillOpen(answer: string | undefined): boolean {
  return answer === undefined || answer === RAIL.notSure;
}

/** Loads the forecast, then reads it. Each state has a way out. */
function ForecastPage() {
  usePageMeta({ layout: "wide" });
  const { forecastId } = Route.useParams();
  const { status, forecast, member, retry } = useForecast(forecastId);
  if (status === "loading") return <FeedLoadingState label={LIST_COPY.loading} />;
  if (status === "not_found") return <NotFound />;
  if (status === "error" || !forecast || !member)
    return <FeedErrorNotice message={DETAIL.loadError} onRetry={retry} />;
  return <ForecastRead key={forecast.id} f={forecast} member={member} />;
}

function ForecastRead({ f, member }: { f: ScoredForecast; member: ForecastMemberDto }) {
  const id = f.id;

  useTrackedForecasts();
  const done = useDoneSteps(id);
  const metGrant = useLiveSlice("onboarding", () => readFlag(MET_GRANT_FORECAST_KEY));

  // Answers from the rail layer onto Grant's read, so the page and the rail report on
  // one object. They reset when the member opens another forecast.
  const [answers, setAnswers] = useState({} as Record<string, string>);
  const [railOpen, setRailOpen] = useState(false);
  const [focus, setFocus] = useState(null as Focus);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  // The real review: the Mentors list, read by this forecast's oppKey.
  const review = useMentorReviewFor(f.id);
  const sentThisVisit = useOrderMentorSent(f.id);
  const mentor = useMentorSend({ oppKey: f.id, solNumber: f.record.sourceId });

  // The title shows in the header only once the job card's title scrolls away, so it is
  // never on screen twice (v5 box 1).
  const [titleInView, setTitleInView] = useState(true);
  useEffect(() => {
    const el = document.getElementById("fc-job-title");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setTitleInView(entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id, metGrant]);

  useEffect(() => {
    setAnswers({});
    setFocus(null);
  }, [id]);

  // Grant's take adds counted rows to How to win it and names to Sources. A failed take
  // is null, so the page reads as it does with none.
  const take = useForecastTake(f.id);
  // Answers apply before the call shapes the page, so the boxes always match the call.
  const read = useMemo(() => readForecast(f, answers, take), [f, answers, take]);

  const tracked = isTracked(f.id);
  // The watch box words who may bid for this member, as the page does.
  const watchContext = useMemo(() => ({ forecast: f, firm: firmFromMember(member) }), [f, member]);
  // What the page may promise about watching: nothing unless the server says it is on.
  const watchState = watchCopyState(useForecastWatch());
  const open = f.lifecycle === "open";
  // The mentor review is offered on every call, as on the opportunity page (owner,
  // 2026-09-23): a second opinion is worth offering on a Skip too. Inside the backend's
  // 3-day gate the button stays, disabled, with the reason on hover. On a forecast that
  // date is the expected posting date.
  const mentorTooLate = mentor.canSend && isTooCloseToDeadline(f.record.dueOn);

  const openRail = (next: RailFocus) => {
    setRailOpen(true);
    setFocus({ ...next, nonce: Date.now() });
  };
  const pending = read.rail.questions.filter((q) => stillOpen(answers[q.id]));
  const canRaise = canRaiseConfidence(read, pending);

  const pill =
    review?.status === "responded"
      ? { text: MENTOR.responded, cls: "mentor-status-pill mentor-status-pill--responded" }
      : review?.status === "closed"
        ? { text: MENTOR.closed, cls: "mentor-status-pill mentor-status-pill--closed" }
        : { text: MENTOR.reviewing, cls: "mentor-status-pill mentor-status-pill--pending" };

  return (
    <div className="fc-detail-shell">
      <section className="opp-detail-main fc-detail">
        <div className="opp-sticky">
          <Link
            to="/forecasts"
            className="opp-sticky__back btn btn-ghost btn-sm"
            aria-label={DETAIL.back}
          >
            <ArrowLeft size={16} />
          </Link>
          <h1
            className={`opp-sticky__heading fc-sticky__title${titleInView ? " is-quiet" : ""}`}
            title={f.facts.title}
          >
            {f.facts.title}
          </h1>
          <div className="opp-sticky__actions">
            <button
              type="button"
              className={`btn btn-sm btn-secondary fc-trackbtn${tracked ? " is-tracked" : ""}`}
              aria-pressed={tracked}
              title={WATCH_PROMISE[watchState].trackTooltip}
              onClick={() => toggleTracked(f.id)}
            >
              <Bookmark size={14} aria-hidden fill={tracked ? "currentColor" : "none"} />
              {tracked ? DETAIL.tracked : DETAIL.track}
            </button>
            {review ? (
              <Link
                to="/mentors/$reviewId"
                params={{ reviewId: review.id }}
                className={pill.cls}
                onClick={crossPageClick(`/mentors/${review.id}`)}
              >
                {pill.text}
              </Link>
            ) : sentThisVisit ? (
              // Sent in this visit: the review is not in the Mentors list until it is
              // read again, so the pill opens the list.
              <Link to="/mentors" className={pill.cls} onClick={crossPageClick("/mentors")}>
                {pill.text}
              </Link>
            ) : (
              <span
                title={mentorTooLate ? DETAIL.mentorTooLate(MENTOR_REVIEW_MIN_LEAD_MS) : undefined}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-primary opp-sticky__mentor"
                  disabled={mentorTooLate}
                  onClick={() => (mentor.canSend ? setMentorOpen(true) : setUpsellOpen(true))}
                >
                  <Send size={14} /> {MENTOR.button}
                  {/* The price is the wallet's own charge, shown once it has loaded. */}
                  {mentor.wallet && (
                    <span className="opp-sticky__price">
                      {" "}
                      · {formatUSD(mentor.wallet.chargeAmount)}
                    </span>
                  )}
                </button>
              </span>
            )}
          </div>
        </div>

        {!metGrant && (
          <ForecastMeetGrant
            title={f.facts.title}
            watchState={watchState}
            onDismiss={() => writeFlag(MET_GRANT_FORECAST_KEY, true)}
          />
        )}

        <ForecastJobCard f={f} read={read} />
        <ForecastGrantTake
          read={read}
          asks={open && pending.length > 0}
          canRaise={canRaise}
          tracked={tracked}
          watchState={watchState}
          onAnswerGrant={() => openRail({ question: pending[0]?.id })}
        />
        <ForecastWatchChanges oppKey={f.id} tracked={tracked} context={watchContext} />
        <ForecastSource f={f} />
        <ForecastPlan
          read={read}
          done={done}
          onToggle={(stepId) => toggleStep(f.id, stepId)}
          onRail={openRail}
        />
        <ForecastEvidence f={f} read={read} />
      </section>

      <ForecastGrantRail
        oppKey={f.id}
        read={read}
        open={railOpen}
        onOpenChange={setRailOpen}
        focus={focus}
        answers={answers}
        onAnswer={(questionId, value) => setAnswers((a) => ({ ...a, [questionId]: value }))}
        pageChanged={(questionId, value) =>
          readSignature(readForecast(f, answers, take)) !==
          readSignature(readForecast(f, { ...answers, [questionId]: value }, take))
        }
        canRaise={canRaise}
        sender={{ name: member.businessName, address: member.address }}
      />

      <SendToMentorModal
        opp={{ title: f.facts.title }}
        verdict={{ call: CALL[read.call].word, rationale: read.summary.replace(/\*\*/g, "") }}
        balance={mentor.wallet?.balance ?? 0}
        chargeAmount={mentor.wallet?.chargeAmount ?? 0}
        sending={mentor.sending}
        loading={mentor.walletLoading}
        error={mentor.walletError ? DETAIL.walletError : null}
        locationId={mentor.locationId}
        open={mentorOpen}
        onOpenChange={setMentorOpen}
        onConfirm={({ message, file }) => {
          void mentor.send(message, file).then((ok) => {
            if (!ok) return;
            setMentorOpen(false);
            markOrderMentorSent(f.id);
          });
        }}
      />
      {mentor.sendError && (
        <div className="mentor-modal__shortfall fc-mentor-error" role="alert">
          {mentor.sendError}
        </div>
      )}
      <MentorUpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        onContinueSelfQualification={() => setUpsellOpen(false)}
      />
    </div>
  );
}
