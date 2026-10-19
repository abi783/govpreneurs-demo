import { Sparkles, ArrowRight, Info } from "lucide-react";
import { useKnowledgeHub } from "../../lib/knowledgeHub";
import { byMember } from "../../demo/member";
import { PAST_PERFORMANCE, PERSONA } from "../../demo/story/persona";
import { fmtLong, fmtMoneyShort } from "../../demo/profile/dates";

// DEMO: what Hunter learned, from the files in the knowledge base and from the
// profile. Every fact comes from the story. A fact from a file shows only while the
// file is in the list, and links back to that file.
interface LearnedFact {
  text: string;
  /** Matches a file name; the fact is hidden when no file matches. */
  fromFile?: string;
}

const values = PAST_PERFORMANCE.map((p) => p.totalValue);
const FACTS: LearnedFact[] = [
  {
    text: `${PAST_PERFORMANCE.length} past jobs, from ${fmtMoneyShort(Math.min(...values))} to ${fmtMoneyShort(Math.max(...values))}.`,
    fromFile: "capability statement",
  },
  {
    text: `UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}. SAM.gov is active until ${fmtLong(PERSONA.samActiveUntil)}.`,
    fromFile: "sam.gov registration",
  },
  // DEMO: the facts each member's own files hold (lib/knowledgeBase.ts).
  ...byMember<LearnedFact[]>({
    caterer: [
      {
        text: `${PERSONA.foodHandlerCertified} of ${PERSONA.employeesW2} staff hold a current food-handler certificate.`,
        fromFile: "food-handler",
      },
      { text: "Menus and prices for event and contract catering.", fromFile: "menu" },
      { text: "Allergen labels and halal handling are standard on every tray.", fromFile: "allergen" },
      { text: `${PERSONA.kitchen}.`, fromFile: "kitchen" },
    ],
    pack: [
      { text: "Certified woman-owned (WOSB). The certification renews in 41 days.", fromFile: "wosb certification letter" },
      { text: "Rates for video, paid social and search, and print buying.", fromFile: "rate card" },
      { text: "Results from the NC Guard recruiting and stormwater campaigns.", fromFile: "campaign results" },
      { text: `${PERSONA.kitchen}.`, fromFile: "studio" },
    ],
  }),
  { text: `${PERSONA.businessName}, ${PERSONA.hqCity} ${PERSONA.hqState}. ${PERSONA.certifications.join(" · ")}.` },
  { text: `Targeting ${PERSONA.targetAgencies.join(", ")}.` },
];

export function WhatWeLearned() {
  const { files, missing } = useKnowledgeHub();

  const shown = FACTS.filter((f) => !f.fromFile || files.some((file) => file.name.toLowerCase().includes(f.fromFile!)));

  const goTo = (id: string) => {
    document.getElementById(`kn-file-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // The row gets a flash class through the DOM so the file list does not need to know.
    const el = document.getElementById(`kn-file-${id}`);
    el?.classList.add("is-flash");
    window.setTimeout(() => el?.classList.remove("is-flash"), 1600);
  };

  return (
    <section className="kh-block kh-learned" aria-label="What we learned">
      <header className="kh-block-head">
        <Sparkles size={14} aria-hidden />
        <h3 className="kh-block-title">What we learned</h3>
      </header>

      {shown.length === 0 ? (
        <p className="kh-empty">
          Once you connect a source or upload files, we list what we picked up here — with a link back to the
          document for every fact.
        </p>
      ) : (
        <ul className="kh-learned-list">
          {shown.map((fact) => {
            const file = fact.fromFile ? files.find((f) => f.name.toLowerCase().includes(fact.fromFile!)) : null;
            return (
              <li key={fact.text} className="kh-learned-row">
                <div>
                  <div>{fact.text}</div>
                  <div className="kh-learned-src">
                    {file ? (
                      <button
                        type="button"
                        className="kh-learned-src-btn"
                        onClick={() => goTo(file.id)}
                      >
                        {file.name} <ArrowRight size={10} aria-hidden />
                      </button>
                    ) : (
                      <span>from your profile</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {missing.length > 0 && (
        <p className="kh-learned-foot">
          <Info size={12} aria-hidden /> Not known yet: {missing.map((m) => m.label).join("; ")}.
        </p>
      )}
      <p className="kh-learned-foot">
        <Info size={12} aria-hidden /> We only use what you connect, upload, or enter. We never invent details about your
        business.
      </p>
    </section>
  );
}
