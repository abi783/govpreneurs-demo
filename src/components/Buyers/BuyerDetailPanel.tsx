// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { useMemo, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Mail,
  Phone,
  Star,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  MapPin,
  FileText,
} from "lucide-react";
import {
  getOpenOppsForBuyer,
  getFoodAwardsForBuyer,
  type GovBuyer,
  type BuyerOfficer,
  type OfficerRole,
} from "@/lib/mock/governmentBuyers";
import { JargonGloss } from "@/components/Layout/JargonGloss";
import { awardedAgo, usd } from "@/lib/awardsApi";
import { DraftIntroModal } from "./DraftIntroModal";
import { showDemoNotice } from "@/demo/ui/notice";

// DEMO: a mail or phone link would open a program on the visitor's computer. These contacts
// are sample data, so a click copies the address and says so.
function copyContact(e: { preventDefault: () => void }, value: string) {
  e.preventDefault();
  try {
    void navigator.clipboard?.writeText(value).catch(() => undefined);
  } catch {
    // The notice below still tells the visitor what happened.
  }
  showDemoNotice({
    title: "Copied",
    message: `${value} is copied. This contact is sample data, so nothing is sent.`,
  });
}
import { BuyerPursueAnalysis } from "./BuyerPursueAnalysis";

const ROLE_GLOSS: Record<OfficerRole, string> = {
  "Small-Business Liaison":
    "The agency's front door for small businesses — they route you to the right contracting officer.",
  "Contracting Officer":
    "The person legally authorized to sign a contract on behalf of the government.",
  "Contract Specialist":
    "Works under a contracting officer; often the first person actually reading your emails.",
  "Food Program Manager":
    "Runs the dining program day to day, and tells the contracting office what the meals must be like.",
};

export function BuyerDetailPanel({
  buyer,
  onClose,
  focus,
  ref,
}: {
  buyer: GovBuyer;
  onClose: () => void;
  focus: "people" | "approach" | null;
  ref?: RefObject<HTMLElement | null>;
}) {
  const opps = useMemo(() => getOpenOppsForBuyer(buyer), [buyer]);
  const awards = useMemo(() => getFoodAwardsForBuyer(buyer), [buyer]);

  const [showAll, setShowAll] = useState(false);
  const [openAwards, setOpenAwards] = useState(false);
  const [openOpps, setOpenOpps] = useState(false);
  const [draftFor, setDraftFor] = useState<BuyerOfficer | null>(null);

  const firstContact =
    buyer.officers.find((o) => o.recommendedFirstContact) ?? buyer.officers[0];
  const visibleOfficers = showAll ? buyer.officers : buyer.officers.slice(0, 4);
  const glossSeen = new Set<OfficerRole>();

  return (
    <aside className="gov-buyer-detail" ref={ref}>
      <div className="gov-buyer-detail-head">
        <div>
          <div className="t-label" style={{ marginBottom: 4 }}>
            {buyer.type === "federal" ? "Federal buyer" : "State / local buyer"}
          </div>
          <h2 className="t-heading">{buyer.name}</h2>
          <div className="gov-buyer-detail-sub">
            <MapPin size={11} /> {buyer.location}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <p className="t-body-sm" style={{ color: "var(--text-2)", marginTop: "var(--s-2)" }}>
        <strong>What they buy:</strong> {buyer.whatTheyBuy}
      </p>

      {/* SHOULD YOU PURSUE THIS BUYER — verdict-led analysis */}
      <BuyerPursueAnalysis buyer={buyer} openOppsCount={opps.length} />


      {/* YOUR MOVE — first-timer coaching layer */}
      <section
        className={`gov-your-move${focus === "approach" ? " is-focus" : ""}`}
        data-sec="approach"
        aria-label="Your move"
      >
        <header className="gov-your-move-head">
          <span className="gov-your-move-eyebrow">Your move</span>
          <h3 className="gov-your-move-title">Start with the liaison, not the CO.</h3>
        </header>
        <ul className="gov-your-move-list">
          <li>
            <strong>Who to contact first:</strong> the{" "}
            <JargonGloss term="Small-Business Liaison">
              {ROLE_GLOSS["Small-Business Liaison"]}
            </JargonGloss>
            . At {buyer.name}, that's <strong>{firstContact.name}</strong>. They'll point you to
            the right{" "}
            <JargonGloss term="Contracting Officer">
              {ROLE_GLOSS["Contracting Officer"]}
            </JargonGloss>{" "}
            for food service work.
          </li>
          <li>
            <strong>Why:</strong> COs don't take cold pitches well — they're heads-down on active
            awards. Liaisons exist to triage outsiders. You'll get a faster, warmer route in.
          </li>
          <li>
            <strong>What to send:</strong> one short paragraph (who you are, where you're based,
            what you do, your set-asides) plus your capability statement. Lead with{" "}
            <strong>woman-owned (WOSB) + Fayetteville-local</strong> — both are concrete reasons to
            keep reading.
          </li>
        </ul>
        <div className="gov-your-move-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setDraftFor(firstContact)}
          >
            <FileText size={12} /> Draft the intro
          </button>
          <span className="t-caption">Pre-filled with your details — edit before sending.</span>
        </div>
      </section>

      {/* THE PEOPLE */}
      <section
        className={`gov-buyer-section${focus === "people" ? " is-focus" : ""}`}
        data-sec="people"
      >
        <header className="gov-buyer-section-head">
          <h3 className="gov-buyer-section-title">The people</h3>
          <span className="t-caption">{buyer.officers.length} on file</span>
        </header>

        <ul className="officer-list">
          {visibleOfficers.map((o) => {
            const showGloss = !glossSeen.has(o.role);
            glossSeen.add(o.role);
            return (
              <li key={o.id} className={`officer-row${o.recommendedFirstContact ? " is-first" : ""}`}>
                <div className="officer-row-main">
                  <div className="officer-row-line1">
                    <span className="officer-name">{o.name}</span>
                    {o.recommendedFirstContact && (
                      <span className="officer-first-pill">
                        <Star size={10} /> start here
                      </span>
                    )}
                  </div>
                  <div className="officer-row-line2">
                    {showGloss ? (
                      <JargonGloss term={o.role}>{ROLE_GLOSS[o.role]}</JargonGloss>
                    ) : (
                      <span className="officer-role">{o.role}</span>
                    )}
                    {o.notes ? <span className="officer-notes"> · {o.notes}</span> : null}
                  </div>
                </div>
                <div className="officer-row-contact">
                  <a className="officer-contact" href={`mailto:${o.email}`} onClick={(e) => copyContact(e, o.email)}>
                    <Mail size={11} /> <span className="fr-mono">{o.email}</span>
                  </a>
                  <a
                    className="officer-contact"
                    href={`tel:${o.phone.replace(/\s+/g, "")}`}
                    onClick={(e) => copyContact(e, o.phone)}
                  >
                    <Phone size={11} /> <span className="fr-mono">{o.phone}</span>
                  </a>
                </div>
                <div className="officer-row-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDraftFor(o)}
                  >
                    Draft intro
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {buyer.officers.length > 4 && (
          <button
            type="button"
            className="officer-list-more"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show fewer" : `See all ${buyer.officers.length}`}
            <ChevronDown
              size={12}
              style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 160ms" }}
            />
          </button>
        )}
        <p className="sample-data-note">Contact details shown are sample data for demo purposes.</p>
      </section>

      {/* Recent food service awards (collapsed) */}
      <section className="gov-buyer-section">
        <button
          type="button"
          className="gov-buyer-disclosure"
          aria-expanded={openAwards}
          onClick={() => setOpenAwards((v) => !v)}
        >
          {openAwards ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Trophy size={12} />
          <span>Recent food service awards by this buyer</span>
          <span className="gov-buyer-disclosure-count">{awards.length}</span>
        </button>
        {openAwards && (
          <div className="gov-buyer-disclosure-body">
            {awards.length === 0 ? (
              <p className="t-body-sm" style={{ color: "var(--text-3)" }}>
                None in our current award record. Check Awards for the full picture.
              </p>
            ) : (
              <ul className="gov-buyer-mini-list">
                {awards.slice(0, 6).map((a) => (
                  <li key={a.awardId}>
                    <Link
                      to="/awards/$awardId"
                      params={{ awardId: a.awardId }}
                      className="gov-buyer-mini-row"
                    >
                      <span className="gov-buyer-mini-title">{a.title}</span>
                      <span className="gov-buyer-mini-meta">
                        <span className="fr-mono">{usd(a.obligated)}</span> · {a.winner.name} ·{" "}
                        {[a.location.city, a.location.state].filter(Boolean).join(", ")}
                      </span>
                      <span className="gov-buyer-mini-sub">
                        Work started {awardedAgo(a) ?? "a while ago"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/awards" className="gov-buyer-disclosure-foot">
              Open Awards →
            </Link>
          </div>
        )}
      </section>

      {/* Open opportunities from this buyer (collapsed) */}
      <section className="gov-buyer-section">
        <button
          type="button"
          className="gov-buyer-disclosure"
          aria-expanded={openOpps}
          onClick={() => setOpenOpps((v) => !v)}
        >
          {openOpps ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Target size={12} />
          <span>Open opportunities from this buyer</span>
          <span className="gov-buyer-disclosure-count">{opps.length}</span>
        </button>
        {openOpps && (
          <div className="gov-buyer-disclosure-body">
            {opps.length === 0 ? (
              <p className="t-body-sm" style={{ color: "var(--text-3)" }}>
                Nothing open from them right now. Get on the liaison's radar so you hear about the next one.
              </p>
            ) : (
              <ul className="gov-buyer-mini-list">
                {opps.slice(0, 8).map((o) => (
                  <li key={o.noticeId}>
                    <Link
                      to="/opportunities/$noticeId"
                      params={{ noticeId: o.noticeId }}
                      className="gov-buyer-mini-row"
                    >
                      <span className="gov-buyer-mini-title">{o.title}</span>
                      <span className="gov-buyer-mini-meta">
                        <MapPin size={10} /> {o.location} ·{" "}
                        <span className="fr-mono">
                          {o.valueLow !== null && o.valueHigh !== null
                            ? `$${Math.round(o.valueLow / 1000)}K–$${Math.round(o.valueHigh / 1000)}K`
                            : "No value stated"}
                        </span>{" "}
                        · closes in {o.closesInDays}d
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/opportunities" className="gov-buyer-disclosure-foot">
              Open the Opportunities feed →
            </Link>
          </div>
        )}
      </section>

      {draftFor && (
        <DraftIntroModal buyer={buyer} officer={draftFor} onClose={() => setDraftFor(null)} />
      )}
    </aside>
  );
}
