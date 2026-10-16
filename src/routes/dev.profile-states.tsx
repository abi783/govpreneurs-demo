import { createFileRoute } from "@tanstack/react-router";
import { usePageMeta } from "../components/Layout/page-meta";
import { FieldRow, type FieldRowProps } from "../components/profile/FieldRow";

export const Route = createFileRoute("/dev/profile-states")({
  head: () => ({
    meta: [
      { title: "FieldRow states — Dev" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProfileStatesGallery,
});

type Section = { n: number; title: string; props: FieldRowProps };

const SECTIONS: Section[] = [
  {
    n: 1,
    title: "verified",
    props: {
      label: "Legal Name",
      state: "verified",
      value: "Williams Construction LLC",
      source: "SAM.gov on 2026-04-15",
      tier: "T1",
      whyItMatters: "Your registered business name as it appears on federal contracts.",
    },
  },
  {
    n: 2,
    title: "needs_review",
    props: {
      label: "Core Capabilities",
      state: "needs_review",
      value:
        "Commercial re-roofing · Modified bitumen & TPO systems · Roof repair & maintenance · Building envelope / weatherproofing",
      source: "your capability statement uploaded 2026-05-05",
      tier: "T1",
      whyItMatters: "Drives match quality across every opportunity Hunter shows you.",
    },
  },
  {
    n: 3,
    title: "attested",
    props: {
      label: "Target Agencies",
      state: "attested",
      value: "U.S. Army Corps of Engineers (USACE)",
      source: "You told Hunter on 2026-05-02",
      tier: "T2",
      chatEditable: true,
      whyItMatters: "Hunter prioritizes opps from agencies you actually want to work with.",
    },
  },
  {
    n: 4,
    title: "inferred",
    props: {
      label: "Concurrent Contract Capacity",
      state: "inferred",
      value: "1 contract at a time",
      source: "your team size of 3",
      tier: "T2",
      whyItMatters: "Helps Hunter avoid surfacing opps that would overload your team.",
    },
  },
  {
    n: 5,
    title: "stale",
    props: {
      label: "Secretary of State Status",
      state: "stale",
      value: "Active",
      staleAgeInDays: 16,
      staleConsequence: "verifying status takes a moment",
      tier: "T2",
      whyItMatters: "Your business must be in good standing with your state to bid.",
    },
  },
  {
    n: 6,
    title: "missing",
    props: {
      label: "EIN",
      state: "missing",
      helperMicrocopy:
        "Your federal tax ID — the IRS issued this when your business was formed. It's on your CP-575 letter.",
      tier: "T1",
      whyItMatters: "Required on every federal contract award.",
    },
  },
  {
    n: 7,
    title: "conflict",
    props: {
      label: "Mailing Address",
      state: "conflict",
      conflictValues: [
        { source: "SAM.gov", value: "201 Hay St, Fayetteville, NC 28301" },
        { source: "You typed this on 2026-04-20", value: "PO Box 5512, Fayetteville, NC 28302" },
      ],
      tier: "T2",
      whyItMatters: "Federal mail and award notifications go to the address on file.",
    },
  },
  {
    n: 8,
    title: "pending_dfy",
    props: {
      label: "SLED Vendor Registration — NC",
      state: "pending_dfy",
      pendingDfyMessage: "Delivery call booked May 13 with our SLED team",
      tier: "T1",
      whyItMatters: "Required to bid on state and local opps in NC.",
    },
  },
  {
    n: 9,
    title: "error",
    props: {
      label: "Custom Email Domain",
      state: "error",
      value: "marcus@williamsconstructionnc.com",
      errorMessage:
        "We couldn't verify williamsconstructionnc.com — no MX records found. Your domain may not have email set up yet, or DNS may be slow.",
      tier: "T2",
      dfy: { service: "GovCompliant Digital Setup", price: 2997 },
      whyItMatters: "Federal buyers expect contact email at your own domain, not a free webmail.",
    },
  },
];

function ProfileStatesGallery() {
  usePageMeta({ layout: "wide" });

  return (
    <div className="bp-shell">
      <div className="bp-shell-inner">
        <header className="bp-header">
          <div>
            <h1 className="bp-title">FieldRow states gallery</h1>
            <p className="dev-subtitle">Design QA — not in primary nav.</p>
          </div>
        </header>

        <div className="dev-gallery">
          {SECTIONS.map((s) => (
            <section key={s.n} className="dev-gallery-section">
              <div className="dev-gallery-label">
                State {s.n}: {s.title}
              </div>
              <div className="dev-gallery-row">
                <FieldRow {...s.props} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
