import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  HandCoins,
  Package,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import {
  getGrantVerdict,
  getSolicitation,
  type GrantVerdict,
  type FitRow,
  type FitMarker,
  type VerdictCall,
  type WinTier,
} from "../lib/mock/grantAnalysis";
import { Companion } from "../components/Companion/Companion";
import type { CompanionHandle } from "../components/Companion/types";
import { buildGrantIdentity } from "../components/Companion/identities/grantIdentity";
import { GrantsTakeCard } from "../components/Opportunity/GrantsTakeCard";
import { fetchGrantsTake, type GrantTake } from "../lib/grantsTakeApi";
import { GrantCanvas, GrantCanvasSkeleton } from "../components/Grant/GrantCanvas";
import { MeetGrant } from "../components/Grant/MeetGrant";
import { hasMetGrant, markMetGrant } from "../lib/grant/metGrant";
import { GrantRail } from "../components/Grant/GrantRail";
import { loadGrantAnalysis } from "../lib/grant";
import type { GrantAnalysis } from "../lib/grant/types";
import { EvidenceBlock } from "../components/Opportunity/EvidenceBlock";
import { SendToMentorModal } from "../components/Opportunity/SendToMentorModal";
import type { MentorRequest } from "../components/Mentors/MentorSendModal";
import { MentorUpsellModal } from "../components/Opportunity/MentorUpsellModal";
import { OpportunityTimeline } from "../components/Opportunity/OpportunityTimeline";
import { fetchWorkspace, addSavedOpp, removeSavedOpp } from "../lib/workspace";
import { sendForReview, type MentorReviewStatus } from "../lib/mentorApi";
import {
  attachFileToSentReview,
  MENTOR_ATTACH_FAILED,
  refreshMentorReviews,
} from "../lib/mentorReviewsApi";
import { fetchWalletBalance } from "../lib/walletApi";
import { allowSendToMentor, isTooCloseToDeadline, MENTOR_DEADLINE_TOO_CLOSE_MESSAGE } from "../lib/entitlements";
import { buildSummarySections } from "../lib/summarySections";
import { buildKeyInfo } from "../lib/keyInfo";
import { fetchOpportunityV2, type DiscoverV2DetailDto } from "../lib/discoverApi";
import { useGhlUser } from "../lib/ghlUser";
import { requestCrossPageNav, isEmbeddedInGhl } from "../lib/ghlNav";
import { isPilotPlan } from "../lib/plans";
import { PilotUpsellGate } from "../components/Hunter/PilotUpsellGate";
import { LockedOpportunitiesBackdrop } from "../components/Hunter/LockedOpportunitiesBackdrop";
import type { Dibbs, OppCategory, Opportunity } from "../lib/mock/opportunities";
import { termGloss } from "../lib/filterGlosses";
import { summaryCaption, summaryText } from "../lib/summaryProvenance";
import { JargonGloss } from "../components/Hunter/JargonGloss";
import { matchTierToVerdict, scoreToVerdict, type Verdict } from "../lib/verdict";
import { TIER_MAP, type DiscoverTier } from "../lib/discoverMapper";
// DEMO: the story knows which opportunities Ava builds. The header action reads it.
import { getOpportunity as getStoryOpportunity } from "../demo/story/opportunities";

export const Route = createFileRoute("/opportunities/$noticeId")({
  head: () => ({
    meta: [
      { title: "Opportunity detail — Grant · GovPreneurs" },
      {
        name: "description",
        content:
          "Grant analyzes this opportunity end-to-end and gives you a clear bid recommendation.",
      },
    ],
  }),
  component: OpportunityDetail,
});

const SHOW_SEND_TO_MENTOR = true;

/** Forecast dates are expected postings, not deadlines — render as "Month yyyy". */
function expectedPostLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** DIBBS quantity/delivery facts for the detail meta row. */
function dibbsDetailFacts(dibbs: Dibbs): string {
  return [
    dibbs.quantity != null ? `${dibbs.quantity.toLocaleString()} units` : null,
    dibbs.deliverDays != null ? `deliver in ${dibbs.deliverDays} days` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Per-category context strip under the detail header (PRD CAT-5). Informative,
 * not an alarm — explains what a non-contract category means for the member.
 */
function CategoryNote({
  category,
  expectedLabel,
}: {
  category?: OppCategory;
  expectedLabel: string;
}) {
  if (!category || category === "contract") return null;
  if (category === "forecast") {
    return (
      <div className="category-note">
        <CalendarClock size={16} aria-hidden />
        <span>
          <strong>This is a forecast — not open for bids yet.</strong>
          {expectedLabel ? ` Expected to post around ${expectedLabel}.` : ""} Track it and Hunter
          will flag you when it goes live.
        </span>
      </div>
    );
  }
  if (category === "grant") {
    return (
      <div className="category-note">
        <HandCoins size={16} aria-hidden />
        <span>
          <strong>This is a grant, not a contract</strong> — the government funds a project instead
          of buying work. You apply with a plan; the application process is different from bidding.
        </span>
      </div>
    );
  }
  return (
    <div className="category-note">
      <Package size={16} aria-hidden />
      <span>
        <strong>Quick-turnaround product order</strong> from DLA's bid board (DIBBS). Quote your
        price for the listed items — small orders are often awarded automatically, sometimes within
        days.
      </span>
    </div>
  );
}

/**
 * Maps the real backend `mentorReviewStatus` enum to the detail-page status
 * pill's label + class. `null`/absent → no pill (caller shows the Send button).
 *   - `pending` → "Mentor reviewing" (pending pill)
 *   - `pursue | reject | discuss` → "Mentor responded" (responded pill)
 * The pill click (handleViewInMentor) deep-links into the Mentors menu-link
 * page and opens this opp's specific review conversation via mentorReviewId.
 */
export function mentorPillFromStatus(
  status: MentorReviewStatus | undefined,
): { label: string; className: string } | null {
  if (!status) return null;
  if (status === "pending") {
    return {
      label: "Mentor reviewing · view in Mentors →",
      className: "mentor-status-pill mentor-status-pill--pending",
    };
  }
  // pursue | reject | discuss — the mentor has responded.
  return {
    label: "Mentor responded · view in Mentors →",
    className: "mentor-status-pill mentor-status-pill--responded",
  };
}

/** Build a minimal Opportunity-shaped object from the API response for components that need it. */
function toOpportunityAdapter(dto: DiscoverV2DetailDto): Opportunity {
  const location = [dto.placeOfPerformance.city, dto.placeOfPerformance.state]
    .filter(Boolean)
    .join(", ");
  return {
    noticeId: dto.id,
    title: dto.title,
    agency: dto.agency.name,
    workType: "",
    valueLow: 0,
    valueHigh: 0,
    location,
    closesAt: dto.responseDeadline,
    postedAt: dto.postedDate,
    matchTier: "good",
    matchScore: 0,
    hunterReasoning: "",
    eligibility: null,
    setAside: dto.setAside || undefined,
    mode: "prime",
    scope: dto.scope,
  };
}

function buildVerdictFromApi(opp: DiscoverV2DetailDto): GrantVerdict {
  const score = opp.finalScore ?? 0;
  // Backend tier is the source of truth for the verdict (priority|strong → bid,
  // stretch → Review, low → No Bid), mapped through the same TIER_MAP/matchTier
  // the feed card uses so both surfaces agree. Fall back to the score only if a
  // record somehow has no tier.
  const verdict: Verdict = opp.tier
    ? matchTierToVerdict(TIER_MAP[opp.tier as DiscoverTier])
    : scoreToVerdict(score);
  const breakdown = opp.matchBreakdown as Record<string, unknown> | null;

  const call: VerdictCall = verdict === "bid" ? "Bid" : verdict === "lean" ? "Review" : "No Bid";
  const winTier: WinTier =
    verdict === "bid" ? "Open" : verdict === "lean" ? "Competitive" : "Long shot";

  const fitPoints = (breakdown?.fitPoints as number) ?? 0;
  const setAsidePoints = (breakdown?.setAsidePoints as number) ?? 0;
  const eligible = (breakdown?.eligible as boolean) ?? true;
  // True when ineligibility is fixable by obtaining the required niche cert.
  const certifiable = (breakdown?.certifiable as boolean) ?? false;

  const fitMatrix: FitRow[] = [];

  fitMatrix.push({
    marker: (score >= 75 ? "ok" : score >= 40 ? "warn" : "bad") as FitMarker,
    dimension: "Match score",
    line: `${score}/100 — ${verdict === "bid" ? "strong match" : verdict === "lean" ? "moderate match" : "low match"}`,
  });

  fitMatrix.push({
    marker: (fitPoints >= 30 ? "ok" : fitPoints >= 15 ? "warn" : "bad") as FitMarker,
    dimension: "Capability fit",
    line: `${fitPoints}/40 capability points`,
  });

  if (setAsidePoints > 0) {
    fitMatrix.push({
      marker: "ok",
      dimension: "Set-aside eligibility",
      line: `+${setAsidePoints} set-aside bonus — you qualify`,
    });
  }

  if (!eligible) {
    if (certifiable) {
      // Fixable gap: the opp is reserved for a niche cert the firm can pursue.
      fitMatrix.push({
        marker: "warn",
        dimension: "Eligibility",
        line: "Needs Cert",
      });
    } else {
      // Hard restriction (e.g. size) — certifying can't unlock it.
      fitMatrix.push({
        marker: "bad",
        dimension: "Eligibility",
        line: "Set-aside or size restriction applies — verify eligibility before bidding",
      });
    }
  }

  for (const reason of opp.matchReasons ?? []) {
    fitMatrix.push({ marker: "ok", dimension: "Match signal", line: reason });
  }

  const rationale =
    verdict === "bid"
      ? `Score ${score}/100 — strong overall fit. Scope, eligibility, and location align.`
      : verdict === "lean"
        ? `Score ${score}/100 — moderate fit. Worth a closer look before committing.`
        : `Score ${score}/100 — limited fit. Focus on higher-scoring opportunities first.`;

  const nextStep =
    verdict === "bid"
      ? "Strong match — review the solicitation closely and move quickly."
      : verdict === "lean"
        ? "Moderate match — identify the gaps and decide whether to pursue."
        : "Low fit — consider passing and focusing on better-matched opportunities.";

  return {
    call,
    rationale,
    winTier,
    winTierReason:
      verdict === "bid"
        ? "High score — you are well-positioned relative to typical competition."
        : verdict === "lean"
          ? "Competitive field — some gaps to close before bid day."
          : "Significant gaps suggest other opportunities are better uses of your time.",
    fitMatrix,
    nextStep,
    seedMessage: `This opportunity scored ${score}/100 — it's a ${call}.`,
    suggestions: [],
    authored: false,
  };
}

/**
 * Route component. Same Pilot wall as the feed: a Pilot-plan user who navigates
 * straight to an opportunity-detail URL never mounts `OpportunityDetailContent`
 * (which fetches the real opportunity + Grant's Take), so there is no API call
 * to intercept and no real data in the DOM. They get the upsell gate instead.
 */
function OpportunityDetail() {
  const { session } = useGhlUser();
  usePageMeta({ layout: "wide" });
  const locked = isPilotPlan(session?.productId ?? null);

  if (locked) {
    return (
      <PilotUpsellGate unlocked={false}>
        <LockedOpportunitiesBackdrop />
      </PilotUpsellGate>
    );
  }
  return <OpportunityDetailContent />;
}

function OpportunityDetailContent() {
  const { noticeId } = Route.useParams();
  usePageMeta({ layout: "wide" });
  const { session } = useGhlUser();
  const router = useRouter();

  const [opp, setOpp] = useState<DiscoverV2DetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Grant's Take — fetched independently so the page renders while Grant loads.
  const [grantTake, setGrantTake] = useState<GrantTake | null>(null);
  const [grantLoading, setGrantLoading] = useState(true);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantReload, setGrantReload] = useState(0);

  // Grant v2 (the live board) — only for the grant_v2 cohort. The full GrantCanvas
  // + rail render from ONE GrantAnalysis object; everyone else keeps the v1 take.
  const grantV2 = session?.grantV2 === true;
  const [grantAnalysis, setGrantAnalysis] = useState<GrantAnalysis | null>(null);
  // Open on arrival for the grant_v2 cohort. It used to start collapsed, so the
  // member landed on a page with a "Ask Grant" launcher and had to discover the
  // rail before it rendered anything — read in UAT as "the chatbot doesn't load".
  // The rail IS the second zone of the surface, not an optional overlay.
  const [grantRailOpen, setGrantRailOpen] = useState(true);
  // Bumped when the member answers an open question — re-runs the analysis fetch
  // so the canvas + rail regenerate from the new answer (§9.6).
  const [grantAnalysisReload, setGrantAnalysisReload] = useState(0);
  // Grant introduces himself before the verdict, on EVERY opportunity — each
  // one fetches its own analysis, so each one has its own latency to cover.
  // The intro renders immediately on arrival (before the analysis fetch has
  // even returned); "Show me the analysis" reveals the canvas underneath,
  // which is still a skeleton for the instant the fetch is still in flight.
  // Persisted per (member, opportunity) (metGrant.ts) so a reload of the SAME
  // opportunity doesn't show the introduction again — starts false for a
  // deterministic first render, then the effect below re-checks it whenever
  // the member or the opportunity changes.
  const [metGrant, setMetGrant] = useState(false);
  useEffect(() => {
    // DEMO: `?met=1` passes the introduction without remembering it. The QA crawl
    // uses it, because the crawl clears storage before every load and would
    // otherwise only ever see the introduction.
    const skip = new URLSearchParams(window.location.search).get("met") === "1";
    setMetGrant(skip || hasMetGrant(session?.locationId, noticeId));
  }, [session?.locationId, noticeId]);
  // Stable "today" for the live deadline countdown — computed once so the
  // GrantCanvas deadline memo doesn't churn on every render (day-granularity, so
  // it needn't refresh as the member moves between opps in one session).
  const grantNow = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!session?.locationId) return;
    setLoading(true);
    fetchOpportunityV2(noticeId, session.locationId)
      .then(setOpp)
      .catch((err) =>
        setFetchError(err instanceof Error ? err.message : "Failed to load opportunity"),
      )
      .finally(() => setLoading(false));
  }, [noticeId, session?.locationId]);

  // Independent Grant's-Take request: fires once the opp has loaded and the
  // session is known. Retry bumps grantReload. Cancels on unmount / opp change.
  useEffect(() => {
    // The grant_v2 cohort renders the live canvas, never the v1 card — so skip
    // the v1 (LLM-backed, rate-limited) take request for them entirely.
    if (grantV2 || !session?.locationId || !opp) return;
    let cancelled = false;
    setGrantLoading(true);
    setGrantError(null);
    fetchGrantsTake(noticeId)
      .then((t) => {
        if (!cancelled) setGrantTake(t);
      })
      .catch((err) => {
        if (!cancelled)
          setGrantError(err instanceof Error ? err.message : "Failed to load Grant's Take");
      })
      .finally(() => {
        if (!cancelled) setGrantLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noticeId, session?.locationId, opp, grantReload, grantV2]);

  // Adapter for components that still expect the mock Opportunity shape.
  const oppAdapter = useMemo(() => (opp ? toOpportunityAdapter(opp) : null), [opp]);

  // Grant v2 analysis: fetch the live GrantAnalysis. When the backend has none
  // (no score record for this member + opp) the loader returns the *unanalyzed*
  // take — an honest empty state, not the local synthesize, which is a fixture
  // generator and used to render invented checks, sources and credentials here.
  useEffect(() => {
    if (!grantV2 || !session?.locationId || !oppAdapter) return;
    let cancelled = false;
    loadGrantAnalysis(oppAdapter, { grantV2: true, oppKey: noticeId })
      .then((a) => {
        if (!cancelled) setGrantAnalysis(a);
      })
      .catch(() => {
        /* loader returns the unanalyzed take on failure — never a fabricated one */
      });
    return () => {
      cancelled = true;
    };
  }, [grantV2, session?.locationId, oppAdapter, noticeId, grantAnalysisReload]);

  const verdict = useMemo(() => {
    if (opp?.finalScore !== null && opp?.finalScore !== undefined) return buildVerdictFromApi(opp);
    return oppAdapter ? getGrantVerdict(oppAdapter) : null;
  }, [opp, oppAdapter]);
  const detail = useMemo(() => {
    if (!oppAdapter) return null;
    const sol = getSolicitation(oppAdapter);
    // Our own summary from whichever tier could source it — never the mock
    // synthesizer's fabricated sentence, and never HigherGov's generated text.
    // With no summary at all we say we don't have the data, and why.
    const quickSummary = summaryText(opp?.quickSummary, opp?.summarySource);
    return {
      ...sol,
      quickSummary,
      summaryCaption: summaryCaption(opp?.summarySource, opp?.quickSummary, {
        hasDocuments: (opp?.documents?.length ?? 0) > 0,
        rewritePending: opp?.summaryRewritePending,
      }),
    };
  }, [oppAdapter, opp]);
  // Real RAG-summary sections (bulleted). Sections without content are dropped,
  // so the "Detailed summary" accordion shows only what the summary actually has.
  const summarySections = useMemo(() => buildSummarySections(opp?.accordions), [opp]);
  // Real Key information rows built from the opportunity fields (mock-free).
  const keyInfo = useMemo(
    () =>
      opp
        ? buildKeyInfo({
            noticeType: opp.noticeType,
            setAside: opp.setAside,
            naicsCode: opp.naicsCode,
            classificationCode: opp.classificationCode,
            valEstLow: opp.valEstLow,
            valEstHigh: opp.valEstHigh,
            placeOfPerformance: opp.placeOfPerformance,
            agencyName: opp.agency?.name,
            solNumber: opp.solNumber,
            scope: opp.scope,
            category: opp.category,
          })
        : [],
    [opp],
  );
  const chatRef = useRef<CompanionHandle>(null);

  // Hydrate-only state to avoid SSR mismatch on saved/mentor flags.
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  // Real mentor-review status for this opp/user. Seeded from the API response
  // and flipped optimistically to `pending` after a successful send.
  const [sentStatus, setSentStatus] = useState<MentorReviewStatus>(null);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Live wallet balance/charge from the backend; null until fetched.
  const [wallet, setWallet] = useState<{ balance: number; chargeAmount: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(true);

  // Expand "What the buyer needs" by default the first time the summary loads,
  // once per opp. A ref guards against re-opening it if the user collapses it.
  const seededOpenRef = useRef(false);
  useEffect(() => {
    seededOpenRef.current = false;
  }, [noticeId]);
  useEffect(() => {
    if (seededOpenRef.current) return;
    if (summarySections.some((s) => s.id === "what_the_buyer_needs")) {
      setOpenSections(["what_the_buyer_needs"]);
      seededOpenRef.current = true;
    }
  }, [summarySections]);

  // Elite-plan gating for the Send-to-Mentor feature.
  const canSendToMentor = allowSendToMentor(session?.productId);
  // Deadline gating: a mentor review can't turn around in time once the
  // opportunity is within 3 days of its deadline (or already past it). No
  // deadline on file is never gated.
  const sendToMentorTooLate = isTooCloseToDeadline(opp?.responseDeadline);

  // Optimistic save/un-save against the user's workspace; roll back on failure.
  const handleToggleSaved = useCallback(() => {
    setSaved((prev) => {
      const next = !prev;
      const persist = next ? addSavedOpp(noticeId) : removeSavedOpp(noticeId);
      persist.catch((err) => {
        console.error("Failed to update saved opportunity", err);
        setSaved(prev);
      });
      return next;
    });
  }, [noticeId]);

  useEffect(() => {
    setHydrated(true);
  }, [noticeId]);

  // Seed the mentor-status pill from the real backend field once the opp loads.
  useEffect(() => {
    setSentStatus(opp?.mentorReviewStatus ?? null);
  }, [opp?.mentorReviewStatus]);

  // Fetch the live wallet balance so the Send-to-Mentor modal shows real
  // numbers. Only for Elite users (others never open the modal).
  useEffect(() => {
    if (!canSendToMentor || !session?.locationId) return;
    let cancelled = false;
    setWalletLoading(true);
    setWalletError(null);
    fetchWalletBalance(session.locationId)
      .then((w) => {
        if (cancelled) return;
        setWallet(w);
        setWalletLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load wallet balance", err);
        if (cancelled) return;
        setWalletError(err instanceof Error ? err.message : "Failed to load wallet balance");
        setWalletLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canSendToMentor, session?.locationId]);

  // Hydrate saved state from the user's workspace (server-derived identity).
  useEffect(() => {
    if (!session?.locationId) return;
    fetchWorkspace()
      .then(({ savedOpps }) => setSaved(savedOpps.includes(noticeId)))
      .catch((err) => console.error("Failed to load saved state", err));
  }, [noticeId, session?.locationId]);

  // Command Bar event wiring (page-bound)
  useEffect(() => {
    function onAskGrant(e: Event) {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (!text) return;
      setChatOpen(true);
      requestAnimationFrame(() => {
        chatRef.current?.appendUserMessage(text);
        chatRef.current?.appendAgentMessage("Let me look at the solicitation for that.", {
          stamp: "just now",
        });
      });
    }
    function onSaveOpp() {
      handleToggleSaved();
    }
    function onSendMentor() {
      if (!canSendToMentor) {
        setUpsellOpen(true);
        return;
      }
      // No toast/notification system is wired in this app (sonner is an
      // unused dependency — no <Toaster/> mounted) to surface why this no-ops,
      // so this stays a silent return. The visible entry points (header
      // action button, GrantCanvas/GrantRail mentor CTAs) explain themselves
      // via a `title` tooltip on the disabled control.
      if (sendToMentorTooLate) return;
      setMentorModalOpen(true);
    }
    window.addEventListener("commandbar:ask-grant", onAskGrant);
    window.addEventListener("commandbar:save-opp", onSaveOpp);
    window.addEventListener("commandbar:send-to-mentor", onSendMentor);
    return () => {
      window.removeEventListener("commandbar:ask-grant", onAskGrant);
      window.removeEventListener("commandbar:save-opp", onSaveOpp);
      window.removeEventListener("commandbar:send-to-mentor", onSendMentor);
    };
  }, [noticeId, canSendToMentor, sendToMentorTooLate, handleToggleSaved]);

  const grantIdentity = useMemo(
    () => (oppAdapter ? buildGrantIdentity(oppAdapter) : null),
    [oppAdapter],
  );

  // Grant right-side rail hidden for now (all environments). Code below is kept
  // intact — flip this back to `false` to restore the rail.
  const hideGrantRail = true;

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "var(--s-8) var(--s-6)" }}>
        <Link to="/opportunities" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> All opportunities
        </Link>
        <p className="t-body-sm" style={{ marginTop: "var(--s-4)" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "var(--s-8) var(--s-6)" }}>
        <Link to="/opportunities" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> All opportunities
        </Link>
        <div className="card card-padded" style={{ marginTop: "var(--s-4)" }}>
          <h1 className="t-heading">Error loading opportunity</h1>
          <p className="t-body-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!opp || !oppAdapter) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "var(--s-8) var(--s-6)" }}>
        <Link to="/opportunities" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> All opportunities
        </Link>
        <div className="card card-padded" style={{ marginTop: "var(--s-4)" }}>
          <h1 className="t-heading">Opportunity not found</h1>
          <p className="t-body-sm">
            No opportunity with ID <code>{noticeId}</code>.
          </p>
          {/* DEMO: say what to do next, so the card is never a dead end. */}
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
            It may have closed, or the link may be old. Go back to your opportunities to pick another one, or ask Hunter
            for a new match.
          </p>
          <Link to="/opportunities" className="btn btn-primary btn-sm" style={{ marginTop: "var(--s-3)" }}>
            See your opportunities
          </Link>
        </div>
      </div>
    );
  }


  const handleSendClick = () => {
    setMentorModalOpen(true);
  };

  const handleMentorConfirm = ({ message: note, file }: MentorRequest) => {
    if (!session?.userId || !session?.locationId) return;
    // Backend keys primarily on opportunityId; fall back to the oppKey for the
    // solNumbers array when the opp has no solNumber.
    const solNumbers = [opp.solNumber ?? opp.id];
    const opportunityIds = [opp.id];
    const prevStatus = sentStatus;
    setIsSending(true);
    setSendError(null);
    // Optimistically flip the pill to "reviewing"; roll back on failure.
    setSentStatus("pending");
    sendForReview({
      userId: session.userId,
      locationId: session.locationId,
      solNumbers,
      opportunityIds,
      message: note,
    })
      .then(async () => {
        // The send is paid and the thread exists; a file that fails to
        // attach now is reported on its own, never as a failed send.
        if (file) {
          try {
            await attachFileToSentReview(opp.id, file);
          } catch (err) {
            console.error("Failed to attach file to mentor review", err);
            setSendError(MENTOR_ATTACH_FAILED);
          }
        }
        setMentorModalOpen(false);
        // DEMO: read the page data again, so the status pill opens this review's thread.
        fetchOpportunityV2(noticeId, session.locationId)
          .then(setOpp)
          .catch((err) => console.error("Failed to refresh the opportunity after send", err));
        // New thread now exists on the backend — refresh the shared store so
        // /mentors and the unread badges (Sidebar/home) pick it up.
        refreshMentorReviews().catch((err) =>
          console.error("Failed to refresh mentor reviews after send", err),
        );
      })
      .catch((err) => {
        setSentStatus(prevStatus);
        setSendError(err instanceof Error ? err.message : "Failed to send for review");
        console.error("Failed to send opportunity for review", err);
      })
      .finally(() => setIsSending(false));
  };

  const mentorPill = mentorPillFromStatus(sentStatus);

  // DEMO: Ava builds the bid. The header offers it where the story has Ava on the
  // bid, or where Grant says Bid as the prime. Fort Bragg dining is a Bid as a
  // subcontractor, so its next move is Partners and the header has no Ava action.
  const story = getStoryOpportunity(noticeId);
  const avaHref =
    story && (story.ava || (story.grant.verdict === "bid" && story.grant.prime === "go"))
      ? `/ava/${noticeId}`
      : null;
  const avaLabel = story?.ava?.kind === "reply" ? "Open your reply with Ava" : "Build this bid with Ava";
  const mentorBtn = avaHref ? "btn btn-sm btn-secondary detail-actions__icon" : "btn btn-sm btn-primary detail-actions__icon";

  // "View in Mentor" — open this opp's specific mentor conversation. The Mentors
  // page is a DIFFERENT GHL custom-menu-link, and this app runs inside a GHL
  // iframe. Setting window.location.href here would load GHL *nested inside the
  // current iframe* (a second SSO session), not switch the real top-level page.
  // So when embedded we use the parent relay: requestCrossPageNav posts a
  // REQUEST_NAVIGATION intent to window.parent (whose custom JS maps the
  // "mentors" page key to the Mentors menu-link and navigates the TOP frame),
  // and stashes the in-app route in shared-origin localStorage. The Mentors app
  // then boots and consumePendingNavIntent (__root.tsx) lands on that route.
  // Standalone (local dev, not iframed) an in-app router nav reaches it directly.
  // Missing review id degrades to the mentors list rather than dead-ending.
  //
  // Plain function (NOT useCallback): this sits after the loading/error/no-opp
  // early returns above, so a hook here would violate rules-of-hooks.
  const handleViewInMentor = () => {
    const reviewId = opp?.mentorReviewId ?? null;
    const route = reviewId ? `/mentors/${reviewId}` : "/mentors";
    if (isEmbeddedInGhl()) {
      requestCrossPageNav("mentors", route);
      return;
    }
    void router.navigate(
      reviewId ? { to: "/mentors/$reviewId", params: { reviewId } } : { to: "/mentors" },
    );
  };

  return (
    <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
      <section className="opp-detail-main opp-detail-main--opp">
        {/* Grant introduces himself before anything else on the page renders —
            not just the take card — so the whole latency of his analysis
            fetch is covered by one clear "the work hasn't started yet"
            moment instead of a page full of parts arriving piecemeal. The
            chat rail (GrantRail, below) is a sibling of this section, so it
            stays available throughout regardless. */}
        {grantV2 && !metGrant ? (
          <MeetGrant
            opportunityTitle={opp.geminiPlainEnglishTitle || opp.title}
            onDismiss={() => {
              markMetGrant(session?.locationId, noticeId);
              setMetGrant(true);
            }}
          />
        ) : (
          <>
            {/* One sticky row: back arrow, the notice's official title (mono/
                uppercase — a verbatim government record, not our prose), Save
                and Review with Mentor on the same line. */}
            <div className="opp-sticky">
              <Link
                to="/opportunities"
                className="opp-sticky__back btn btn-ghost btn-sm"
                aria-label="All opportunities"
              >
                <ArrowLeft size={16} />
              </Link>
              <h1 className="opp-sticky__heading" title={opp.title}>
                {opp.title}
              </h1>
              <div className="opp-sticky__actions">
                <button
                  type="button"
                  className={`btn btn-sm ${saved ? "btn-secondary" : "btn-ghost"} detail-actions__icon`}
                  onClick={handleToggleSaved}
                  aria-pressed={saved}
                  aria-label={saved ? "Unsave" : "Save"}
                >
                  {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {saved ? "Saved" : "Save"}
                </button>
                {/* The agency's own posting link lives at the bottom of the page
                    (EvidenceBlock's "Reference links" section) rather than up
                    here too — one place for it, not two. */}
                {avaHref ? (
                  <a className="btn btn-sm btn-primary detail-actions__icon opp-ava-btn" href={avaHref}>
                    <Sparkles size={14} aria-hidden /> {avaLabel}
                  </a>
                ) : null}
                {SHOW_SEND_TO_MENTOR &&
                  (hydrated && canSendToMentor && mentorPill ? (
                    <button
                      type="button"
                      className={mentorPill.className}
                      onClick={handleViewInMentor}
                    >
                      {mentorPill.label}
                    </button>
                  ) : hydrated && canSendToMentor && sendToMentorTooLate ? (
                    <span title={MENTOR_DEADLINE_TOO_CLOSE_MESSAGE}>
                      <button
                        type="button"
                        className={mentorBtn}
                        disabled
                      >
                        <Send size={14} /> Review with Mentor
                      </button>
                    </span>
                  ) : hydrated && canSendToMentor ? (
                    <button
                      type="button"
                      className={mentorBtn}
                      onClick={handleSendClick}
                    >
                      <Send size={14} /> Review with Mentor
                    </button>
                  ) : hydrated ? (
                    <button
                      type="button"
                      className={mentorBtn}
                      onClick={() => setUpsellOpen(true)}
                    >
                      <Send size={14} /> Review with Mentor
                    </button>
                  ) : null)}
              </div>
            </div>

            {/* DIBBS order facts + fast-award flag — unrelated to the Grant
                rework, left exactly as they were. */}
            {(opp.category === "product_buy" && opp.dibbs && dibbsDetailFacts(opp.dibbs)) ||
            opp.dibbs?.fastAward ? (
              <div className="detail-meta-row">
                {opp.category === "product_buy" && opp.dibbs && dibbsDetailFacts(opp.dibbs) && (
                  <span className="meta-chip">
                    <Package size={12} /> {dibbsDetailFacts(opp.dibbs)}
                  </span>
                )}
                {opp.dibbs?.fastAward && (
                  <JargonGloss gloss={termGloss("fastAward")!} inline>
                    <span className="fast-award-chip">
                      <Zap size={11} aria-hidden /> Fast award
                    </span>
                  </JargonGloss>
                )}
              </div>
            ) : null}

            <CategoryNote
              category={opp.category}
              expectedLabel={expectedPostLabel(opp.responseDeadline)}
            />

            {/* Grant's take — the grant_v2 cohort gets the live GrantCanvas
                (MeetGrant, above, already covers its own fetch latency), the
                skeleton only ever shows for the instant the fetch is still
                landing after dismissal; everyone else keeps the v1 six-field
                take, untouched. */}
            {grantV2 ? (
              grantAnalysis ? (
                <GrantCanvas
                  analysis={grantAnalysis}
                  now={grantNow}
                  sourcePath={opp.sourcePath}
                  saved={saved}
                  onSaveForLater={handleToggleSaved}
                  onReviewWithMentor={() =>
                    canSendToMentor ? setMentorModalOpen(true) : setUpsellOpen(true)
                  }
                  mentorDisabledReason={
                    canSendToMentor && sendToMentorTooLate
                      ? MENTOR_DEADLINE_TOO_CLOSE_MESSAGE
                      : null
                  }
                />
              ) : (
                <GrantCanvasSkeleton />
              )
            ) : (
              <GrantsTakeCard
                loading={grantLoading}
                error={grantError}
                take={grantTake}
                onRetry={() => setGrantReload((n) => n + 1)}
              />
            )}

            {oppAdapter && (
              <OpportunityTimeline
                opp={oppAdapter}
                keyDates={opp?.keyDates ?? []}
                dueNoun={
                  /sources sought/i.test(opp.noticeType)
                    ? "reply"
                    : /quote/i.test(opp.noticeType)
                      ? "quote"
                      : /invitation for bid/i.test(opp.noticeType)
                        ? "bid"
                        : "proposal"
                }
              />
            )}

            {detail && (
              <EvidenceBlock
                detail={detail}
                summaryCaption={detail.summaryCaption}
                summarySections={summarySections}
                keyInfo={keyInfo}
                officialTitle={opp.title}
                contact={
                  opp.pointOfContact && {
                    name: opp.pointOfContact.name,
                    role: opp.pointOfContact.title,
                    phone: opp.pointOfContact.phone,
                    email: opp.pointOfContact.email,
                  }
                }
                secondaryContact={
                  opp.secondaryContact && {
                    name: opp.secondaryContact.name,
                    role: opp.secondaryContact.title,
                    phone: opp.secondaryContact.phone,
                    email: opp.secondaryContact.email,
                  }
                }
                openSections={openSections}
                onOpenChange={setOpenSections}
                documents={opp?.documents}
                oppKey={opp?.id}
                sourcePath={opp?.sourcePath}
              />
            )}
          </>
        )}
      </section>

      {!hideGrantRail && chatOpen && grantIdentity && (
        <div className="hunter-rail">
          <Companion
            key={opp.id}
            ref={chatRef}
            identity={grantIdentity}
            onCollapse={() => setChatOpen(false)}
          />
        </div>
      )}
      {!hideGrantRail && !chatOpen && (
        <aside className="hunter-pane is-collapsed" aria-label="Grant (collapsed)">
          <div className="hunter-collapsed-rail">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              aria-label="Open Grant"
              title="Open Grant"
            >
              <div className="grant-avatar-32" aria-hidden>
                G
              </div>
            </button>
          </div>
        </aside>
      )}

      {grantV2 && grantAnalysis && (
        <GrantRail
          analysis={grantAnalysis}
          open={grantRailOpen}
          onOpenChange={setGrantRailOpen}
          sourcePath={opp.sourcePath}
          onAnswered={() => setGrantAnalysisReload((n) => n + 1)}
          onReviewWithMentor={() =>
            canSendToMentor ? setMentorModalOpen(true) : setUpsellOpen(true)
          }
          mentorDisabledReason={
            canSendToMentor && sendToMentorTooLate ? MENTOR_DEADLINE_TOO_CLOSE_MESSAGE : null
          }
        />
      )}

      {oppAdapter && verdict && (
        <SendToMentorModal
          opp={oppAdapter}
          verdict={verdict}
          open={mentorModalOpen}
          onOpenChange={setMentorModalOpen}
          onConfirm={handleMentorConfirm}
          balance={wallet?.balance ?? 0}
          chargeAmount={wallet?.chargeAmount ?? 0}
          sending={isSending}
          loading={walletLoading}
          error={walletError ? "Couldn't load your wallet balance — try again" : null}
          locationId={session?.locationId}
        />
      )}
      {sendError && (
        <div
          className="mentor-modal__shortfall"
          role="alert"
          style={{
            position: "fixed",
            bottom: "var(--s-4)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          {sendError}
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
