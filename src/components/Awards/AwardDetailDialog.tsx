import type { ReactNode } from "react";
import { highlight, makeHighlighter } from "../Search/Highlight";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, ChevronDown, Clock3, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPartnerCompany, type PrimeCandidate } from "../../lib/partnersApi";
import {
  awardedAgo,
  collapseAwardMoney,
  competitionSummary,
  fetchAward,
  hasSubcontractingPlan,
  isSoleSource,
  usd,
  whatHappensNext,
  type AwardRecord,
} from "../../lib/awardsApi";
import { stripBasepath } from "../../lib/basepath";
import { dateWords } from "../../lib/format";
import { whoCouldBid } from "../../lib/filters/smallBusinessPrograms";
import { plainDescription, plainNaics, plainPricing, plainPsc } from "../../lib/vocab/plainCodes";
import { AMIRA_FIRM, CAROLINA_DINING } from "../../demo/explore/firms";
import { KEY_PARTNER } from "../../demo/story/persona";
// DEMO: how the member knows the partner, and what to ask (D85).
import { byMember, own } from "@/demo/member";

const demoCopy = own(
  import.meta.glob<typeof import("../../demo/members/agency/copy")>("/src/demo/members/*/copy.tsx", {
    eager: true,
  }),
);
const KNOWN_PARTNER_NOTE = byMember({
  caterer: "from your 2024 subcontract. Ask him about the recompete.",
  pack: demoCopy.KNOWN_PARTNER_NOTE,
});

/**
 * One award, in full: the detail behind an award card.
 *
 * The dialog copies the partner dialog (PrimeDetailPanel). It is a centred
 * dialog over a dimmed page. The header and the footer stay fixed. The body
 * scrolls. On a phone, the dialog fills the screen.
 *
 * The dialog shows every fact that we hold about the award, so that each
 * search match is visible here. Each fact appears one time only. The money
 * shows as one tile, or as two tiles when the figures differ. One footnote
 * holds all the caveats.
 *
 * Layout: the key facts, the work, how it was bought and what to do next are
 * always open. The subcontracts, the winner's firms and the record numbers are
 * in sections that open on a tap. While she searches, a section that holds a
 * match opens by itself.
 *
 * The dialog is open when `awardId` is set. The dialog loads the award itself.
 */
export function AwardDetailDialog({
  awardId,
  onClose,
  isSaved,
  onToggleSaved,
  q,
}: {
  /** The award to show. The dialog is open whenever this is set. */
  awardId: string | null;
  onClose: () => void;
  isSaved: (awardId: string) => boolean;
  onToggleSaved: (award: AwardRecord) => void;
  /** The search text, so the words that matched stand out here too. */
  q?: string;
}) {
  const hl = makeHighlighter(q);
  const [award, setAward] = useState<AwardRecord | null>(null);
  const [failed, setFailed] = useState(false);
  // A new value starts the fetch again. The "Try again" button uses it.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // When the dialog closes, keep the last award. The close animation then
    // shows the content, not an empty box.
    if (awardId === null) return;
    const ctrl = new AbortController();
    setAward(null);
    setFailed(false);
    fetchAward(awardId, ctrl.signal)
      .then((record) => {
        if (!ctrl.signal.aborted) setAward(record);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [awardId, attempt]);

  return (
    <Dialog.Root
      open={awardId !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="adm-overlay" />
        <Dialog.Content className="adm" aria-describedby={undefined}>
          {award ? (
            <AwardBody award={award} isSaved={isSaved} onToggleSaved={onToggleSaved} hl={hl} />
          ) : (
            <>
              <DialogHead title={failed ? "We could not load this award" : "Loading this award…"} />
              <div className="adm-body">
                <div className="adm-body__inner">
                  {failed ? (
                    <div className="adm-state">
                      <p className="adm-p">Check your connection, then try again.</p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setAttempt((n) => n + 1)}
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <div className="adm-state" aria-busy="true">
                      <div className="adm-skel adm-skel--wide" />
                      <div className="adm-skel" />
                      <div className="adm-skel adm-skel--short" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The fixed header: the title, an optional sub line and flag, and the close button. */
function DialogHead({
  title,
  sub,
  flag,
}: {
  title: ReactNode;
  sub?: ReactNode;
  flag?: "just" | "again" | null;
}) {
  return (
    <header className="adm-head">
      <div className="adm-head__text">
        {flag && (
          <span className={`award-flag adm-flag${flag === "just" ? " award-flag--hot" : ""}`}>
            {flag === "just" ? (
              <>
                <Clock3 size={12} aria-hidden /> Just awarded
              </>
            ) : (
              <>
                <RotateCcw size={12} aria-hidden /> Up for bid again
              </>
            )}
          </span>
        )}
        <Dialog.Title className="adm-title">{title}</Dialog.Title>
        {sub && <p className="adm-sub">{sub}</p>}
      </div>
      <Dialog.Close asChild>
        <button type="button" className="adm-close" aria-label="Close">
          <X size={18} aria-hidden />
        </button>
      </Dialog.Close>
    </header>
  );
}

/**
 * Who could bid, in plain words. With no set-aside and no competition, the buyer chose one
 * firm, so "any firm" would be false. The open choice has no official term to show.
 */
function whoBid(setAside: string | null, extent: string | null): { value: string; term?: string } {
  if (!setAside) {
    return isSoleSource(extent)
      ? { value: "One firm, chosen by the buyer" }
      : { value: "Any firm" };
  }
  return whoCouldBid(setAside);
}

/** Whether firms competed. When "Who could bid" already says one firm, a bare "No" is enough. */
function competed(setAside: string | null, extent: string | null): string | null {
  if (!extent) return null;
  if (!isSoleSource(extent)) return "Yes";
  return setAside ? "No. The buyer chose one firm." : "No";
}

/** The small business plan rule (FAR 19.702), in plain words. Null when the record is silent. */
function smallFirmPlan(plan: string | null): string | null {
  if (!plan) return null;
  return hasSubcontractingPlan(plan) ? "Yes. The winner must plan work for small firms." : "No";
}

/** A section that opens on a tap. `open` is the first state; she can always change it. */
function Fold({
  title,
  count,
  open,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <details className="adm-fold" open={open}>
      <summary className="adm-fold__sum">
        <span className="adm-fold__title">{title}</span>
        {count !== undefined && <span className="adm-fold__count mono">{count}</span>}
        <ChevronDown size={18} className="adm-fold__chev" aria-hidden />
      </summary>
      <div className="adm-fold__body">{children}</div>
    </details>
  );
}

type Row = {
  label: string;
  /** The government's word for the label, shown small under it. */
  term?: string;
  value: string;
  /** A code or short term, shown small and grey after the value. */
  code?: string | null;
  mono?: boolean;
};

/** Label and value rows. A row without a value does not show. */
function Rows({ rows, hl }: { rows: (Row | null)[]; hl: ((text: string) => ReactNode) | null }) {
  const shown = rows.filter((r): r is Row => r !== null && Boolean(r.value));
  if (shown.length === 0) return null;
  return (
    <dl className="adm-rows">
      {shown.map((row) => (
        <div key={row.label}>
          <dt>
            {row.label}
            {row.term && <span className="adm-term">{row.term}</span>}
          </dt>
          <dd className={row.mono ? "mono" : undefined}>
            {highlight(hl, row.value)}
            {row.code && <span className="adm-code mono"> {highlight(hl, row.code)}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AwardBody({
  award,
  isSaved,
  onToggleSaved,
  hl,
}: {
  award: AwardRecord;
  isSaved: (awardId: string) => boolean;
  onToggleSaved: (award: AwardRecord) => void;
  hl: ((text: string) => ReactNode) | null;
}) {
  // The award gives a short sample of the winner's firms. The company record has all of
  // them, with each firm's size and trade code, so the window reads it when it can.
  const [winnerCo, setWinnerCo] = useState<PrimeCandidate | null>(null);
  useEffect(() => {
    const k = award.winner.awardeeKey;
    if (k === null) return;
    const ctrl = new AbortController();
    fetchPartnerCompany(k, ctrl.signal)
      .then((r) => {
        if (!ctrl.signal.aborted) setWinnerCo(r?.company ?? null);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [award.winner.awardeeKey]);

  const where = [award.location.city, award.location.state].filter(Boolean).join(", ");
  const buyer = [award.agency.name, award.office].filter(Boolean).join(", ");
  const sub = (
    <>
      {buyer && <>Bought by {highlight(hl, buyer)}</>}
      {buyer && where && " · "}
      {where && highlight(hl, where)}
    </>
  );
  const flag =
    award.recency.justAwarded === true ? "just" : award.recency.comingUpAgain ? "again" : null;

  const money = collapseAwardMoney(award);
  // usd() treats 0 and null as "no figure". This check follows the same rule.
  const paid = award.obligated ? award.obligated : null;
  const ceiling = award.ceiling && (paid === null || paid < award.ceiling) ? award.ceiling : null;

  const ago = awardedAgo(award);
  const ends = dateWords(award.workEndsAt ?? award.recency.recompeteAt);
  // Option years: the buyer can make the job run longer than the current end date.
  const potential =
    award.potentialEndAt &&
    award.workEndsAt &&
    new Date(award.potentialEndAt).getTime() > new Date(award.workEndsAt).getTime()
      ? dateWords(award.potentialEndAt)
      : null;
  const next = whatHappensNext(award);
  const competition = competitionSummary(award);
  const bench = award.bench;
  const jobSubs = award.jobSubs ?? [];
  const winner = award.winner.name;
  const key = award.winner.awardeeKey;
  // DEMO: the member won some of these awards herself. Her own company has no partner file.
  const isMine = key === AMIRA_FIRM.key;
  const knowsContact = key === CAROLINA_DINING.key;
  const partnersSearch =
    key !== null && !isMine
      ? ({
          view: "find",
          company: String(key),
          // The way back: this exact award, with its own search and filters.
          from: `${stripBasepath(window.location.pathname)}${window.location.search}`,
          fromLabel: award.title,
        } as never)
      : undefined;

  const saved = isSaved(award.awardId);
  const saveLabel = saved ? "Remove this award from saved" : "Save this award";
  const lag = award.recency.reportingLagNote.trim();

  /** True when the search marks a word in one of these texts. */
  const hit = (...texts: (string | null | undefined)[]) =>
    hl !== null && texts.some((t) => t && typeof hl(t) !== "string");

  // A description that only repeats the title adds nothing, so the dialog skips it.
  const bought = plainDescription(award.description);
  const work: (Row | null)[] = [
    bought && bought.toLowerCase() !== award.title.trim().toLowerCase()
      ? { label: "What was bought", value: bought }
      : null,
    award.workType
      ? {
          label: "Type of work",
          value: plainNaics(award.naicsCode, award.workType),
          code: award.naicsCode,
        }
      : null,
    award.pscName || award.pscCode
      ? award.pscName
        ? { label: "Service", value: plainPsc(award.pscCode, award.pscName), code: award.pscCode }
        : // No plain name on file: show the code once, never "DF01 DF01".
          { label: "Service", value: award.pscCode ?? "" }
      : null,
  ];
  const who = whoBid(award.setAside, award.extentCompeted);
  const howBought: (Row | null)[] = [
    { label: "Who could bid", value: who.value, code: who.term },
    { label: "Competed", value: competed(award.setAside, award.extentCompeted) ?? "" },
    { label: "Price type", value: plainPricing(award.pricing) },
    { label: "Plan for small firms", value: smallFirmPlan(award.subcontractingPlan) ?? "" },
  ];
  const numbers: (Row | null)[] = [
    { label: "Contract number", value: award.contractNumber ?? "", mono: true },
    {
      label: "Bid request number",
      term: "Solicitation",
      value: award.solicitationId ?? "",
      mono: true,
    },
    { label: "Winner's ID", term: "UEI", value: award.winner.uei ?? "", mono: true },
  ];
  const numberCount = numbers.filter((r) => r && r.value).length;

  // The winner's firms: all of them from the company record, else the award's sample.
  // The trade comes as an official NAICS title. Its code turns it into the same plain
  // words that the company window uses.
  const codeOfTrade = new Map(
    (winnerCo?.tradesHired ?? []).map((t) => [t.name.toLowerCase(), t.naics]),
  );
  const tradeWords = (name: string | null | undefined) =>
    name ? plainNaics(codeOfTrade.get(name.toLowerCase()), name) : null;
  const firms: { name: string; trade: string | null; jobs: number; band: string | null }[] =
    winnerCo?.subsHired?.length
      ? winnerCo.subsHired.map((x) => ({
          name: x.name,
          trade: tradeWords(x.trade),
          jobs: x.jobs,
          band: x.employeeBand ?? null,
        }))
      : (bench?.sampleSubs ?? []).map((x) => ({
          name: x.name,
          trade: tradeWords(x.trade),
          jobs: x.awards,
          band: null,
        }));
  // Total and "went back to" must come from the SAME record, and the second can never
  // exceed the first (prod: "at least 294 firms ... went back to 734").
  const benchSrc = winnerCo ? winnerCo.bench : bench;
  const firmCount = Math.max(firms.length, benchSrc?.distinctSubs ?? 0);
  const repeat = Math.min(benchSrc?.repeatSubs ?? 0, firmCount);
  // "Small" only when SAM's size band says so. Without bands, the line says "firms".
  const banded = firms.some((f) => f.band !== null);
  const smallCount = firms.filter((f) => f.band === "<500").length;

  return (
    <>
      <DialogHead title={highlight(hl, award.title)} sub={sub} flag={flag} />

      <div className="adm-body">
        <div className="adm-body__inner">
          <section className="adm-section" aria-label="Key facts">
            <dl className="adm-facts">
              {money ? (
                <div className="adm-fact">
                  <dt>Worth</dt>
                  <dd className="mono">{usd(money.figure)}</dd>
                </div>
              ) : (
                <>
                  {paid !== null && (
                    <div className="adm-fact">
                      <dt>Paid so far</dt>
                      <dd className="mono">{usd(paid)}</dd>
                    </div>
                  )}
                  {ceiling !== null && (
                    <div className="adm-fact">
                      <dt>Could reach</dt>
                      <dd className="mono">{usd(ceiling)}</dd>
                    </div>
                  )}
                </>
              )}
              <div className="adm-fact">
                <dt>Winner</dt>
                <dd>
                  {partnersSearch ? (
                    <Link to="/partners" search={partnersSearch} className="adm-link">
                      {highlight(hl, winner)}
                    </Link>
                  ) : isMine ? (
                    <>{highlight(hl, winner)} (you)</>
                  ) : (
                    highlight(hl, winner)
                  )}
                </dd>
              </div>
              {ago && (
                <div className="adm-fact">
                  <dt>Work started</dt>
                  <dd>about {ago}</dd>
                </div>
              )}
              {ends && (
                <div className="adm-fact">
                  <dt>Work ends</dt>
                  <dd>{ends}</dd>
                  {potential ? (
                    <dd className="adm-fact__sub">Up to {potential} with all option years</dd>
                  ) : award.recency.comingUpAgain ? (
                    <dd className="adm-fact__sub">It can come up for bid again then.</dd>
                  ) : null}
                </div>
              )}
              {award.offersReceived !== null && (
                <div className="adm-fact">
                  <dt>Bids</dt>
                  <dd>
                    <span className="mono">{award.offersReceived}</span>{" "}
                    {award.offersReceived === 1 ? "firm" : "firms"}
                  </dd>
                </div>
              )}
            </dl>
            {competition && <p className="adm-note">{competition}</p>}
          </section>

          <section className="adm-section">
            <h3 className="adm-h">The work</h3>
            <Rows rows={work} hl={hl} />
          </section>

          <section className="adm-section">
            <h3 className="adm-h">How it was bought</h3>
            <Rows rows={howBought} hl={hl} />
          </section>

          {isMine ? (
            // DEMO: the member's own job. The advice is about her record, not about a partner.
            <section className="adm-section">
              <h3 className="adm-h">What to do next</h3>
              <p className="adm-p">
                This is your own job. Ask the contracting officer for a performance rating
                (CPARS) so the next buyer can read it.
              </p>
            </section>
          ) : (
            next && (
              <section className="adm-section">
                <h3 className="adm-h">What to do next</h3>
                <p className="adm-p">{next}</p>
                {knowsContact && (
                  // DEMO: the member already knows a person at this company.
                  <p className="adm-p">
                    You already know {KEY_PARTNER.contact}, {KEY_PARTNER.contactTitle}, at{" "}
                    {winner}, {KNOWN_PARTNER_NOTE}
                  </p>
                )}
              </section>
            )
          )}

          <div className="adm-folds">
            <Fold
              title="Subcontracts on this job"
              // No count when none are on record: a bare 0 reads as "hired nobody".
              count={jobSubs.length || undefined}
              open={jobSubs.some((x) => hit(x.name, x.trade, tradeWords(x.trade)))}
            >
              {jobSubs.length > 0 ? (
                <ul className="adm-subs">
                  {jobSubs.map((x) => (
                    <li key={x.name}>
                      <span className="adm-subs__name">
                        {highlight(hl, x.name)}
                        {x.trade && (
                          <span className="adm-subs__trade">
                            {highlight(hl, tradeWords(x.trade) ?? "")}
                          </span>
                        )}
                      </span>
                      <span className="adm-subs__count adm-subs__count--stack">
                        {x.dollars ? <span className="mono">{usd(x.dollars)}</span> : null}
                        {x.date && <span>{dateWords(x.date)}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-p">
                  None on record yet. Winners report their subcontracts to the government months
                  after they hire, so a new job rarely shows any.
                </p>
              )}
            </Fold>

            {firmCount > 0 && !isMine && (
              <Fold
                title={`Firms ${winner} hired`}
                count={firmCount}
                open={firms.some((x) => hit(x.name, x.trade))}
              >
                <p className="adm-p">
                  From all their jobs in the last 2 years: at least{" "}
                  <span className="mono">{firmCount}</span>{" "}
                  {banded && smallCount === firmCount ? "small " : ""}
                  {firmCount === 1 ? "firm" : "firms"}
                  {banded && smallCount > 0 && smallCount < firmCount && (
                    <>
                      , <span className="mono">{smallCount}</span> of them small
                    </>
                  )}
                  {repeat > 0 ? (
                    <>
                      . They went back to <span className="mono">{repeat}</span> of them.
                    </>
                  ) : (
                    "."
                  )}
                </p>
                {firms.length > 0 && (
                  <ul className="adm-subs">
                    {firms.map((x) => (
                      <li key={x.name}>
                        <span className="adm-subs__name">
                          <span className="adm-subs__line">
                            {highlight(hl, x.name)}
                            {x.band && (
                              <span
                                className={`adm-tag${x.band === "<500" ? " adm-tag--small" : ""}`}
                              >
                                {x.band === "<500" ? "Small" : "Large"}
                              </span>
                            )}
                          </span>
                          {x.trade && (
                            <span className="adm-subs__trade">{highlight(hl, x.trade)}</span>
                          )}
                        </span>
                        <span className="mono adm-subs__count">
                          at least {x.jobs} {x.jobs === 1 ? "job" : "jobs"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Fold>
            )}

            {numberCount > 0 && (
              <Fold
                title="Record numbers"
                count={numberCount}
                open={hit(award.contractNumber, award.solicitationId, award.winner.uei)}
              >
                <Rows rows={numbers} hl={hl} />
              </Fold>
            )}
          </div>
        </div>
      </div>

      <footer className="adm-foot">
        <div className="adm-actions">
          {partnersSearch ? (
            <Link to="/partners" search={partnersSearch} className="btn btn-primary adm-cta">
              See {winner} in Partners
            </Link>
          ) : award.sourceUrl ? (
            <a
              href={award.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary adm-cta"
            >
              Visit the public record
            </a>
          ) : null}
          <button
            type="button"
            className={`adm-save${saved ? " is-saved" : ""}`}
            aria-label={saveLabel}
            aria-pressed={saved}
            title={saveLabel}
            onClick={() => onToggleSaved(award)}
          >
            {saved ? <BookmarkCheck size={18} aria-hidden /> : <Bookmark size={18} aria-hidden />}
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
        <p className="adm-footnote">
          Based on contract awards published by the government. Firm and job counts are a minimum.
          {lag ? ` ${lag}` : ""}
        </p>
      </footer>
    </>
  );
}
