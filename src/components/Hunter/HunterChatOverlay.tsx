import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { HunterMessageFeedback } from "./HunterMessageFeedback";
import { HunterTypewriter } from "./HunterTypewriter";
import {
  postHunterMessage,
  resetHunterSession,
  type ComparePayload,
  type DiscoveryPayload,
  type EligibilityPayload,
  type FeedTab,
  type HunterFilterDelta,
  type HunterSurface,
  type SwitchTabPayload,
  type SaveOpportunityPayload,
  type MatchesPayload,
  type ActPayload,
  type ProfilePayload,
  type ProfileUpdatePayload,
  type WebResearchPayload,
  type VisibleOpp,
} from "../../lib/hunterChat";
import { CapabilityConflictHint } from "./CapabilityConflictHint";
import { EnrichmentJourney } from "./EnrichmentJourney";
import type { OrganicFilters } from "../../lib/enrichment";
import { useBusinessProfile, naicsLabel, type BusinessProfile } from "../../lib/businessProfile";
import { useGhlUser } from "../../lib/ghlUser";
import { getMockLocationId } from "../../lib/api";
import type { StageArtifactInput } from "../../lib/hunter/stageArtifact";
import { restateChips } from "../../lib/hunter/restateChips";
import { StageMiniCard } from "./Stage/StageMiniCard";
import { MAX_PERSISTED_MESSAGES, MAX_PERSISTED_TEXT_CHARS } from "../../lib/renderLimits";
import { ErrorBoundary } from "../ui/ErrorBoundary";

/** What a page did with Hunter's filters: the filters it applied, and one line
 *  that names the filters it did not apply (null when it applied every one). */
export type HunterFiltersApplied = { applied: HunterFilterDelta; note: string | null };

type Msg = {
  id: string;
  from: "hunter" | "user";
  text: string;
  stamp?: string;
  /** Structured comparison + recommendation rendered under the reply. */
  compare?: ComparePayload;
  /** Single-opportunity eligibility verdict rendered under the reply. */
  eligibility?: EligibilityPayload;
  /** Ranked best-matches shortlist rendered under the reply. */
  matches?: MatchesPayload;
  /** Gap-resolution offers (act agent) rendered under the reply. */
  act?: ActPayload;
  /** Web-research answer + citations rendered under the reply. */
  research?: WebResearchPayload;
  /** The member's record as `get_profile` read it. */
  profile?: ProfilePayload;
  /** The profile changes that wait for her Save, as `update_profile` proposed them. */
  profileUpdate?: ProfileUpdatePayload;
  /** What this turn narrowed by, rendered ABOVE the reply as the "Using" row.
   *  Derived from the discovery payload the server sent — never scripted, and
   *  empty when the turn applied nothing the member can see. */
  restate?: string[];
  /** The filters this turn asked for that the page's list did not apply, as one
   *  line. The page returns it from `onApplyFilters`; it shows under the reply. */
  filterNote?: string;
  /** Profile facts learned this turn + any conflicts to confirm. */
  /** Server session id for the turn — attached to feedback analytics events. */
  sessionId?: string;
  /** Id of the persisted chat-log document for this turn — sent with feedback
   *  so the backend can attach the rating to the right exchange. */
  turnId?: string | null;
};

/**
 * Which artifact this turn produced, if any. `uiPayload.kind` maps one-to-one
 * onto a stage artifact for six of its values; the rest (`discovery`,
 * `switch_tab`, `save`, `reset`, `none`) change the FEED and are handled below.
 *
 * The chained act payload is deliberately NOT considered here. It rides beside
 * an eligibility card rather than replacing it, and the stage holds one thing
 * at a time — so the primary answer takes the stage and the chained one takes a
 * compact reference the member can click.
 */
function primaryArtifact(kind: string | undefined, data: unknown): StageArtifactInput | null {
  switch (kind) {
    case "eligibility":
      return { kind: "scorecard", payload: data as EligibilityPayload };
    case "compare":
      return { kind: "compare", payload: data as ComparePayload };
    case "act":
      return { kind: "checklist", payload: data as ActPayload };
    case "matches":
      return { kind: "matches", payload: data as MatchesPayload };
    case "web_research":
      return { kind: "research", payload: data as WebResearchPayload };
    case "profile":
      return { kind: "profile", payload: data as ProfilePayload };
    case "profile_update":
      return { kind: "profileUpdate", payload: data as ProfileUpdatePayload };
    default:
      return null;
  }
}

/**
 * Every artifact one turn produced, in the order the thread references them.
 * A turn carries at most two: its primary `uiPayload` and, on the chained
 * eligibility path, the act payload that arrived beside it.
 */
function turnArtifacts(msg: Msg): StageArtifactInput[] {
  const out: StageArtifactInput[] = [];
  if (msg.eligibility) out.push({ kind: "scorecard", payload: msg.eligibility });
  if (msg.compare) out.push({ kind: "compare", payload: msg.compare });
  if (msg.matches) out.push({ kind: "matches", payload: msg.matches });
  if (msg.research) out.push({ kind: "research", payload: msg.research });
  if (msg.profile) out.push({ kind: "profile", payload: msg.profile });
  if (msg.profileUpdate) out.push({ kind: "profileUpdate", payload: msg.profileUpdate });
  if (msg.act) out.push({ kind: "checklist", payload: msg.act });
  return out;
}

const SEED_TEXT =
  "Hi — I'm Hunter, your discovery agent. Tell me what kind of work you're looking for and I'll filter the feed to match.";

/** sessionStorage key prefixes — persist the visible conversation across route
 *  changes so navigating to a detail page and back doesn't wipe the chat.
 *  Session-scoped (not localStorage) to mirror the server session lifetime, which
 *  itself lives for the browser session. Cleared by "Start over".
 *
 *  Keys are namespaced by the account's GHL `locationId` so switching between two
 *  accounts in the same browser session never bleeds one account's conversation
 *  into the other. `locationId` arrives asynchronously (from the GHL session), so
 *  storage is only read/written once it's known — see the hydrate/persist effects. */
const STORE_MESSAGES_PREFIX = "hunter-chat-messages";
const STORE_SUGGESTIONS_PREFIX = "hunter-chat-suggestions";

const messagesKey = (locationId: string) => `${STORE_MESSAGES_PREFIX}:${locationId}`;
const suggestionsKey = (locationId: string) => `${STORE_SUGGESTIONS_PREFIX}:${locationId}`;

const seedMessages = (): Msg[] => [
  { id: "seed", from: "hunter", text: SEED_TEXT, stamp: "just now" },
];

/** Load the stored conversation for a given account. Returns the seed when the
 *  account is unknown (session not resolved yet) or has no stored history. */
function loadMessages(locationId: string | null): Msg[] {
  if (!locationId) return seedMessages();
  try {
    const raw = sessionStorage.getItem(messagesKey(locationId));
    if (!raw) return seedMessages();
    const parsed = JSON.parse(raw) as Msg[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // corrupt/unavailable storage — fall through to a fresh seed
  }
  return seedMessages();
}

/** What actually goes to storage: the newest {@link MAX_PERSISTED_MESSAGES}
 *  turns, each text clamped. The VISIBLE conversation keeps the full reply — a
 *  1 MB reply is a payload defect, but truncating what Hunter said on screen is
 *  a bigger change than declining to carry it across a navigation. Unbounded,
 *  a handful of such turns exceeds the ~5 MB origin quota, after which the catch
 *  below swallows `QuotaExceededError` and persistence dies silently for the
 *  rest of the browser session. */
function persistable(messages: Msg[]): Msg[] {
  return messages
    .slice(-MAX_PERSISTED_MESSAGES)
    .map((m) =>
      m.text.length > MAX_PERSISTED_TEXT_CHARS
        ? { ...m, text: `${m.text.slice(0, MAX_PERSISTED_TEXT_CHARS)}…` }
        : m,
    );
}

function loadShowSuggestions(locationId: string | null): boolean {
  if (!locationId) return true;
  try {
    // Default true (show), only hide when explicitly persisted as "0".
    return sessionStorage.getItem(suggestionsKey(locationId)) !== "0";
  } catch {
    return true;
  }
}

// Fallback chips shown only when there's nothing personal to key off yet
// (no profile trade and an empty feed).
const SUGGESTIONS = ["Why does the top match fit?", "What's an SDVOSB set-aside?"] as const;

/** The user's primary trade as a human-readable label, or null when their
 *  profile has no NAICS or the code has no taxonomy title (naicsLabel returns
 *  the bare code in that case, which isn't a usable trade name for a chip). */
function profileTrade(profile: BusinessProfile | null): string | null {
  if (!profile?.primaryNaics) return null;
  const label = naicsLabel(profile, profile.primaryNaics);
  return label && label !== profile.primaryNaics ? label : null;
}

/** Tab-aware starter chips, personalised from the user's profile trade + current
 *  feed. For You leads with match explanation; Explore leans on broad discovery +
 *  objective fit; Saved leans on compare/decide. Returns [] only when there is
 *  nothing usable, so the caller can fall back to the generic suggestions. */
export function buildStarterChips(
  profile: BusinessProfile | null,
  visibleOpps: VisibleOpp[],
  tab: FeedTab,
): string[] {
  const trade = profileTrade(profile);
  const state = profile?.stateCodes?.[0]?.toUpperCase() ?? null;
  const topOpp = visibleOpps[0]?.title?.trim();
  const chips: string[] = [];

  if (tab === "saved") {
    if (visibleOpps.length >= 2) chips.push("Compare my saved opps — which should I pursue?");
    if (topOpp) chips.push(`Am I eligible for the ${topOpp}?`);
    if (!chips.length) chips.push("Which of my saved opportunities fits me best?");
    return chips;
  }

  if (tab === "all") {
    // Explore = broad discovery + objective fit.
    if (trade) chips.push(state ? `Find ${trade} work in ${state}` : `Find ${trade} work`);
    else chips.push("Find opportunities that fit my business");
    if (topOpp) chips.push(`Am I a good fit for the ${topOpp}?`);
    if (visibleOpps.length >= 3) chips.push("Which of these best fits me?");
    return chips;
  }

  // tab === "for_you" → For You (personalized matches).
  if (topOpp) chips.push(`Why does the ${topOpp} match me?`);
  else if (trade) chips.push(state ? `Show me ${trade} work in ${state}` : `Show me ${trade} work`);
  if (topOpp) chips.push(`Am I ready to bid the ${topOpp}?`);
  if (visibleOpps.length >= 3) chips.push("Compare my top 3 — which should I chase?");
  return chips;
}

export function HunterChatOverlay({
  open,
  onOpenChange,
  hideLauncher,
  onApplyFilters,
  onReset,
  onSaveChange,
  visibleOpps = [],
  tab,
  onSwitchTab,
  appliedFilters,
  askRequest,
  onStageArtifact,
  surface = "feed",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** The opportunities currently on the feed — sent so Hunter can resolve
   *  references like "compare the two remaining". */
  visibleOpps?: VisibleOpp[];
  /** The feed tab the user is on — drives starter chips and lets Hunter switch feeds. */
  tab: FeedTab;
  /** Applies a switch_tab payload from Hunter (changes the active feed tab). */
  onSwitchTab?: (tab: FeedTab) => void;
  /** TODO: provisioned for forward-compat; previously fed the scripted demo reply,
   *  now unused until a backend payload consumes it. */
  topReason?: string;
  /** TODO: provisioned for forward-compat, not yet wired. Re-activates when the
   *  backend emits a stretch/teaming uiPayload kind the overlay can act on. */
  onEnterStretches?: () => void;
  hideLauncher?: boolean;
  /** Applies a discovery payload to the page's list. A page that cannot apply
   *  every filter returns what it applied and a note; a page that applies every
   *  filter returns nothing. */
  onApplyFilters?: (p: DiscoveryPayload) => HunterFiltersApplied | void;
  /** Clears the caller's client-side filters/search after the server session
   *  is reset, so "Start over" lifts every accumulated narrowing at once. */
  onReset?: () => void;
  /** Syncs the feed's saved/bookmark state when Hunter saves or unsaves opps. */
  onSaveChange?: (saved: string[], unsaved: string[]) => void;
  /** The feed's current search — a state/NAICS/set-aside filter can imply a
   *  profile fact, surfacing one confirm-before-write organic offer. */
  appliedFilters?: OrganicFilters;
  /** A question asked from OUTSIDE the rail — a first-meeting opener, or the
   *  command bar. The rail submits it as if the member had typed it. `token`
   *  makes the same question askable twice; a null request asks nothing. */
  askRequest?: { text: string; token: number } | null;
  /** Puts a tool result on the stage above the feed. All five artifact kinds
   *  go here; the thread keeps only a compact reference back to each. */
  onStageArtifact?: (input: StageArtifactInput) => void;
  /** The page the member talks from. Every turn sends it. The feed gives none,
   *  so it is `feed`. */
  surface?: HunterSurface;
}) {
  // The current account. In prod this arrives asynchronously from the GHL
  // session; in dev/staging the `?locationId=` mock override is available
  // synchronously. On an in-app remount the session is already loaded (the
  // provider lives above the router), so this is known on the first render;
  // only a fresh full page load has a brief window where it's null.
  const { session } = useGhlUser();
  const locationId = session?.locationId ?? getMockLocationId() ?? null;

  const [messages, setMessages] = useState<Msg[]>(() => loadMessages(locationId));
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(() => loadShowSuggestions(locationId));
  // Tracks which account the in-memory conversation has been loaded for. Guards
  // persistence so we never write the seed to a real account's slot before its
  // stored history has been hydrated, and never write one account's chat under
  // another's key while the session is switching.
  const hydratedFor = useRef<string | null>(locationId);
  const { profile } = useBusinessProfile();
  /** Portal target for the idle enrichment dock, directly under the pane head.
   *  State rather than a ref: a ref's `.current` is null on the render that
   *  mounts it, so the portal would have nowhere to go on first paint. */
  const [enrichDockEl, setEnrichDockEl] = useState<HTMLDivElement | null>(null);
  // Dynamic starter chips, personalised from the profile trade + current feed;
  // the generic suggestions are only used when there's nothing personal yet.
  const starterChips = useMemo(() => {
    const chips = buildStarterChips(profile ?? null, visibleOpps, tab);
    return chips.length ? chips : [...SUGGESTIONS];
  }, [profile, visibleOpps, tab]);

  // Id of the just-arrived hunter reply currently animating in (typewriter).
  // Only the newest reply animates; reloaded/older messages render in full.
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  // `animatingId` is a dep so the list re-scrolls when it flips to null — that's
  // the moment the structured card mounts below the reply, so this keeps the
  // card in view (it was landing below the fold and animating unseen).
  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, open, animatingId]);

  // Hydrate this account's stored conversation once its locationId is known, and
  // re-hydrate if the account changes. In prod the id resolves a beat after mount
  // (async session); an account switch hard-reloads the app, but this also covers
  // any in-place change defensively. Loading the seed's account is a no-op.
  useEffect(() => {
    if (!locationId || hydratedFor.current === locationId) return;
    setMessages(loadMessages(locationId));
    setShowSuggestions(loadShowSuggestions(locationId));
    hydratedFor.current = locationId;
  }, [locationId]);

  // Persist the conversation so it survives navigation away from "/" and back.
  // Written in a layout effect (commit phase, synchronous) rather than a passive
  // useEffect so the newest message is flushed to storage before paint — leaving
  // no window where a fast navigation away could drop the latest turn. Guarded on
  // `hydratedFor === locationId` so we only write once this account's history has
  // been loaded, and only under this account's namespaced key.
  useLayoutEffect(() => {
    if (!locationId || hydratedFor.current !== locationId) return;
    try {
      sessionStorage.setItem(messagesKey(locationId), JSON.stringify(persistable(messages)));
    } catch {
      // storage full/unavailable — non-fatal, chat just won't persist this turn
    }
  }, [messages, locationId]);

  useLayoutEffect(() => {
    if (!locationId || hydratedFor.current !== locationId) return;
    try {
      sessionStorage.setItem(suggestionsKey(locationId), showSuggestions ? "1" : "0");
    } catch {
      // non-fatal
    }
  }, [showSuggestions, locationId]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setShowSuggestions(false);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, from: "user", text: t, stamp: "just now" }]);
    setTyping(true);
    try {
      const res = await postHunterMessage(t, visibleOpps, tab, surface);
      // The structured card is the OPTIONAL half of a turn. Reading
      // `res.uiPayload.kind` unguarded threw inside this try on a missing/null
      // uiPayload, and the catch below then discarded the reply Hunter had
      // actually produced and told the member the request had failed.
      const kind = res.uiPayload?.kind;
      const data = res.uiPayload?.data;
      const compare = kind === "compare" ? (data as ComparePayload) : undefined;
      const eligibility = kind === "eligibility" ? (data as EligibilityPayload) : undefined;
      const matches = kind === "matches" ? (data as MatchesPayload) : undefined;
      // Act appears either as the primary `act` uiPayload (direct ask) or on the
      // secondary `actPayload` channel when chained after an eligibility card.
      const act = kind === "act" ? (data as ActPayload) : res.actPayload;
      const research = kind === "web_research" ? (data as WebResearchPayload) : undefined;
      const profile = kind === "profile" ? (data as ProfilePayload) : undefined;
      const profileUpdate = kind === "profile_update" ? (data as ProfileUpdatePayload) : undefined;
      // The "Using" row states what the turn DID, for EVERY tool — not only a
      // feed filter. It is built from the same `uiPayload` every branch below
      // acts on, so the caption and the thing it captions cannot disagree.
      // The page applies the filters BEFORE the reply is added, so the line that
      // names what it did not apply is part of the reply message itself. When the
      // page reports what it applied, the row names only those filters: a filter
      // the page did not apply is not a thing Hunter did.
      const result =
        kind === "discovery" ? onApplyFilters?.(data as DiscoveryPayload) || undefined : undefined;
      const restate = restateChips(
        kind,
        result ? { ...(data as DiscoveryPayload), filters: result.applied } : data,
      );
      const filterNote = result?.note || undefined;
      const replyId = `h-${Date.now()}`;
      setMessages((m) => [
        ...m,
        {
          id: replyId,
          from: "hunter",
          text: res.chatReply ?? "",
          stamp: "just now",
          compare,
          eligibility,
          matches,
          act,
          research,
          profile,
          profileUpdate,
          restate,
          filterNote,
          sessionId: res.sessionId,
          turnId: res.turnId ?? null,
        },
      ]);
      setAnimatingId(replyId);
      // A tool result is big enough to belong on the stage above the feed, where
      // the member can read it beside the list. The store replaces whatever was
      // there, so a second question never stacks a second card, and the thread
      // keeps only the compact reference back to it.
      const artifact = primaryArtifact(kind, data);
      if (artifact && onStageArtifact) onStageArtifact(artifact);
      if (kind === "reset") {
        // Server already cleared the session; clear the client filters + search
        // so the feed returns to the full matched set. Conversation stays open.
        onReset?.();
      } else if (kind === "switch_tab") {
        onSwitchTab?.((data as SwitchTabPayload).tab);
      } else if (kind === "save") {
        const p = data as SaveOpportunityPayload;
        onSaveChange?.(p.saved, p.unsaved);
      }
    } catch (err) {
      console.error("Hunter chat error:", err);
      setMessages((m) => [
        ...m,
        {
          id: `h-${Date.now()}`,
          from: "hunter",
          text: "Something went wrong — try again.",
          stamp: "just now",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const send = () => {
    void submit(draft);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  // An opener is not a description, it is a question that gets asked. Tapping
  // one puts it in the rail as a real turn, so the introduction produces an
  // answer rather than an empty chat. Keyed on the token, never on the text, so
  // asking the same question twice still fires.
  const askToken = askRequest?.token;
  const askText = askRequest?.text;
  useEffect(() => {
    if (!askText) return;
    void submit(askText);
    // `submit` is re-created every render; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askToken]);

  const handleReset = async () => {
    try {
      await resetHunterSession();
    } catch (err) {
      console.error("Hunter reset error:", err);
    }
    setMessages(seedMessages());
    setShowSuggestions(true);
    onReset?.();
  };

  /** Puts a feedback note on a message Hunter never logged into the composer,
   *  so the member's objection can still reach him as a real turn. */
  const handOffToComposer = (text: string) => {
    setDraft(text);
    taRef.current?.focus();
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 24 * 4 + 20)}px`;
  };

  // Always-expanded: a docked right rail (sibling of the feed inside .app-main),
  // reusing the .hunter-rail/.hunter-pane pattern from the detail page. There is
  // no collapse/close affordance — the rail is permanently open at every size.
  return (
    <div className="hunter-rail">
      <aside className="hunter-pane" aria-label="Hunter chat">
        {/* The dock head reads as ONE line — "Hunter · your discovery agent" —
            with the role in the AI accent on a warm band. The `--agent`
            modifier scopes that look to this dock: `.hunter-pane-head` is also
            the header of Companion (Grant) and HunterChat, which keep the
            stacked neutral treatment. */}
        <header className="hunter-pane-head hunter-pane-head--agent">
          <AgentAvatar agent="hunter" size={32} />
          <div className="hunter-pane-heading">
            <div className="hunter-pane-name">
              Hunter <span className="hunter-pane-role">· your discovery agent</span>
            </div>
          </div>
          <button type="button" className="chip-inline-link" onClick={() => void handleReset()}>
            Start over
          </button>
        </header>

        {/* Where the IDLE enrichment dock (profile strength + its entry button)
            and the ACTIVE journey's milestone rail render — pinned at the top of
            the pane, under the head. `EnrichmentJourney` stays mounted in the
            conversation below and portals both up here, so there is still
            exactly ONE instance reading `/state`. The journey's QUESTIONS are
            unmoved: a profile question belongs in the message flow with
            everything else Hunter says. */}
        <div ref={setEnrichDockEl} className="hunter-pane-dock" />

        <div ref={listRef} className="hunter-msg-list">
          {messages.map((m) => {
            const isAnimating = m.from === "hunter" && m.id === animatingId;
            return (
              <Fragment key={m.id}>
                {/* WHAT HUNTER DID, in a row of its OWN above the reply that
                    reports it — never inside the reply's row. `.hunter-msg-row`
                    is a flex COLUMN, so nesting the two put both left rules in
                    one continuous bar and they read as a single block.
                    Rendered only when the turn has something to restate;
                    `restateChips` returns nothing otherwise, and an empty
                    "Using" would be a claim with nothing behind it. */}
                {m.restate && m.restate.length > 0 && (
                  <div className="hunter-msg-row from-hunter">
                    <div className="hunter-msg--restate">
                      <span className="hunter-msg__restate-lead">Using</span>
                      {m.restate.map((chip) => (
                        <span key={chip} className="hunter-msg__restate-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className={`hunter-msg-row from-${m.from}`}>
                  <div className={`hunter-bubble from-${m.from}`}>
                    {isAnimating ? (
                      <HunterTypewriter
                        text={m.text}
                        onTick={scrollToBottom}
                        onDone={() => setAnimatingId(null)}
                      />
                    ) : (
                      m.text
                    )}
                  </div>
                  {/* The compact reference + feedback appear once the reply finishes
                    writing. The FULL card is on the stage above the feed and is never
                    duplicated here — a thread whose every turn carries a table is not
                    a conversation. The boundary stays: these payloads are
                    model-shaped, and one malformed reference must cost that line, not
                    the reply it sits under and not the feed route this rail is docked
                    in. */}
                  <ErrorBoundary label="Hunter structured card">
                    {!isAnimating &&
                      turnArtifacts(m).map((a) => (
                        <StageMiniCard
                          key={`${m.id}-${a.kind}`}
                          artifact={a}
                          onShow={(input) => onStageArtifact?.(input)}
                        />
                      ))}
                  </ErrorBoundary>
                  {/* The SEED carries the row too. The hero two blocks up promises
                    "I get things wrong; tell me when I do", and the first message
                    on screen used to refuse it. The seed was never a backend turn,
                    so it has no `turnId` and cannot post feedback — the row hands
                    the member's note to the composer instead, where sending it
                    makes the objection a real turn. */}
                  {!isAnimating && m.from === "hunter" && (
                    <HunterMessageFeedback
                      content={m.text}
                      messageId={m.id}
                      sessionId={m.sessionId}
                      turnId={m.turnId}
                      onHandOff={handOffToComposer}
                    />
                  )}
                  {!isAnimating && m.filterNote && (
                    <p className="hunter-msg__filter-note" role="note">
                      {m.filterNote}
                    </p>
                  )}
                  {m.stamp && <div className="hunter-msg-stamp">{m.stamp}</div>}
                </div>
              </Fragment>
            );
          })}
          {/* THE WORKING LINE, with the prototype's pulsing amber dot. It sits
              where the prototype puts it — between the member's turn and the
              reply — and it is the honest half of that surface.

              The prototype's copy NAMES the action ("Adding a $500K floor to
              your list…") because its scenarios are scripted and already know
              the answer. We do not: this is one request and one response, and
              nothing is known about what Hunter will do until it has done it.
              So the line says only what is true while it shows — a turn is in
              flight. What it DID is stated afterwards, by the "Using" row, from
              the payload that comes back. */}
          {typing && (
            <div className="hunter-msg-row from-hunter">
              <div className="hunter-dock__status" role="status">
                <span className="hunter-dock__status-dot" aria-hidden />
                Working on it…
              </div>
            </div>
          )}
          {/* The enrichment journey is CONVERSATIONAL (Doc 141 Tasks 1/5: the chat
              drives the questions — this is not a form). Rendering it as the last
              turn keeps a profile question in the same flow as everything else
              Hunter says, instead of a panel pinned above the conversation. */}
          <ErrorBoundary label="Hunter enrichment journey">
            <EnrichmentJourney
              appliedFilters={appliedFilters}
              onAskHunter={(q) => void submit(q)}
              idleDockTarget={enrichDockEl}
            />
          </ErrorBoundary>

          {showSuggestions && (
            <div className="hunter-suggestion-chips">
              {starterChips.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="hunter-suggestion-chip"
                  onClick={() => void submit(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hunter-composer-wrap">
          {/* Sits beside the composer, so a throw here would cost the member the
              ability to type at all. */}
          <ErrorBoundary label="Hunter capability-conflict hint">
            <CapabilityConflictHint />
          </ErrorBoundary>
          {/* `--agent` puts the field and the send button on Hunter's amber,
              beside the amber suggestion chips. The modifier scopes that look
              to this dock: `.hunter-composer` and `.hunter-send-btn` are also
              Companion's (Grant), which keeps the action blue. */}
          <div className="hunter-composer hunter-composer--agent">
            {/* Two rows, not one: the placeholder wraps in this dock's width and
                a single row shears its second line. `autoGrow` still sizes the
                field to the draft once the member types. */}
            {/* No `⌘K` hint in the placeholder: the prototype's command bar
                answers that shortcut, but `CommandBarProvider`'s handler and
                modal are commented out here, so advertising it would promise
                nothing. */}
            <textarea
              ref={taRef}
              rows={2}
              placeholder="Ask Hunter — try 'what's out there for me?'"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                autoGrow(e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              type="button"
              className="hunter-send-btn"
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
