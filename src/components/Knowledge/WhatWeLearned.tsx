import { Sparkles, ArrowRight, Info } from "lucide-react";
import type { KnowledgeSource } from "../../lib/knowledgeBase";

interface LearnedFact {
  text: string;
  // Match against file name; if no file in state matches, the fact is hidden.
  sourceNameContains?: string;
  // Or marked as "from your profile" when no file backs it.
  fromProfile?: boolean;
}

const FACTS: LearnedFact[] = [
  {
    text: "4 past commercial roofing projects, up to $890K each.",
    sourceNameContains: "Past Projects",
  },
  {
    text: "Bonding capacity up to ~$890K per contract.",
    sourceNameContains: "Insurance & Bonding",
  },
  {
    text: "NC General Contractor license — active.",
    sourceNameContains: "NC GC License",
  },
  {
    text: "Service-disabled veteran-owned (DD-214 on file).",
    sourceNameContains: "DD-214",
  },
  {
    text: "Fort Bragg field experience documented in jobsite photos.",
    sourceNameContains: "Ft Bragg",
  },
  {
    text: "SDVOSB-eligible · Williams Construction LLC, Fayetteville NC.",
    fromProfile: true,
  },
  {
    text: "Targeting USACE, Fort Bragg-area federal, and VA work.",
    fromProfile: true,
  },
];

const MISSING: { text: string; cta: string }[] = [
  {
    text: "Add your insurance certificate so Grant can answer bonding questions on every match.",
    cta: "Attach insurance cert",
  },
  {
    text: "Add your most recent capability statement (or build one) so Hunter can hand it to buyers on first contact.",
    cta: "Build with Ava",
  },
];

export function WhatWeLearned({ files }: { files: KnowledgeSource[] }) {
  const shown = FACTS.filter((f) => {
    if (f.fromProfile) return true;
    return files.some((file) => file.name.toLowerCase().includes((f.sourceNameContains ?? "").toLowerCase()));
  });

  return (
    <section className="kn-learned">
      <header className="kn-learned-head">
        <Sparkles size={14} className="kn-learned-icon" />
        <h3>What we learned</h3>
      </header>

      {shown.length === 0 ? (
        <p className="kn-learned-empty">
          Once you connect a source or attach files, we'll list what we picked up
          here — with a link back to the document for every fact.
        </p>
      ) : (
        <ul className="kn-learned-list">
          {shown.map((fact) => {
            const file = fact.sourceNameContains
              ? files.find((f) =>
                  f.name.toLowerCase().includes(fact.sourceNameContains!.toLowerCase()),
                )
              : null;
            return (
              <li key={fact.text} className="kn-learned-row">
                <span className="kn-learned-bullet" aria-hidden />
                <div className="kn-learned-body">
                  <div className="kn-learned-text">{fact.text}</div>
                  <div className="kn-learned-src">
                    {fact.fromProfile ? (
                      <span className="kn-learned-src-profile">from your profile</span>
                    ) : file ? (
                      <a href={`#kn-file-${file.id}`} className="kn-learned-src-link">
                        {file.name} <ArrowRight size={10} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="kn-learned-missing">
        <div className="kn-learned-missing-label">Still missing — would help:</div>
        <ul>
          {MISSING.map((m) => (
            <li key={m.text}>
              <span className="kn-learned-missing-dot" aria-hidden />
              {m.text}
            </li>
          ))}
        </ul>
      </div>

      <p className="kn-learned-honesty">
        <Info size={12} /> We only use what you connect, upload, or enter — we
        never invent details about your business. If we don't know something,
        we'll say so.
      </p>
    </section>
  );
}
