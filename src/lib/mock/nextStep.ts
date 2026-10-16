// Copy + routes for each sub-step that could be the user's single Next Step.
// Keyed by RoadmapSubStep.id from currentRoadmap.

export type NextStepCopy = {
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  dfy?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export const NEXT_STEP_COPY: Record<string, NextStepCopy> = {
  entity: {
    title: "Register your entity.",
    body: "Lock in your business identity so every other registration has something to attach to.",
    primaryLabel: "Start registration",
    primaryHref: "/roadmap",
  },
  sam: {
    title: "Finish your SAM.gov registration.",
    body: "Federal buyers can't award you anything until SAM is active. This is the gate to every other step.",
    primaryLabel: "Open SAM checklist",
    primaryHref: "/roadmap",
  },
  sbs: {
    title: "Review your SBS profile.",
    body: "This is how federal buyers find SDVOSB roofers. A few minutes here, more visibility for months.",
    primaryLabel: "Review profile",
    primaryHref: "/business-profile",
    dfy: { label: "SBS Visibility Setup — $997", href: "/business-profile" },
  },
  capability: {
    title: "Add your capability statement.",
    body: "This is the one thing standing between you and unlocking your AI team and sending bids to a mentor.",
    primaryLabel: "Build it with Ava",
    primaryHref: "/cap-statement/builder",
    dfy: { label: "Want us to build it for you?", href: "/cap-statement/builder" },
    secondary: { label: "Upload yours instead", href: "/business-profile" },
  },
  sled: {
    title: "Finish your SLED registration.",
    body: "State and local buyers run on separate vendor portals. Each one unlocks a whole new pipeline.",
    primaryLabel: "Open SLED checklist",
    primaryHref: "/roadmap",
    dfy: { label: "SLED Enrollment — $2,497 / state", href: "/business-profile" },
  },
  website: {
    title: "Get a govcompliant website live.",
    body: "Buyers and primes check before they call. A clean .com on a custom domain says you're real.",
    primaryLabel: "Start setup",
    primaryHref: "/roadmap",
    dfy: { label: "GovCompliant Digital Setup — $2,997", href: "/business-profile" },
  },
  "biz-email": {
    title: "Switch to a business email.",
    body: "An @yourbusiness.com address is table stakes for federal correspondence.",
    primaryLabel: "Set it up",
    primaryHref: "/roadmap",
  },
  "biz-info": {
    title: "Review your business info.",
    body: "Quick once-over so nothing stale slips into a proposal.",
    primaryLabel: "Open review",
    primaryHref: "/business-profile",
  },
  "positioning-call": {
    title: "Book your positioning call.",
    body: "A 30-minute conversation that decides where you'll compete — and where you won't.",
    primaryLabel: "Book the call",
    primaryHref: "/roadmap",
  },
  "targeting-call": {
    title: "Book your targeting call.",
    body: "Lock in the agencies, NAICS, and set-asides Hunter should hunt against.",
    primaryLabel: "Book the call",
    primaryHref: "/roadmap",
  },
  tracking: {
    title: "Turn on tracking.",
    body: "So we can show you what's moving the needle, not just what you clicked.",
    primaryLabel: "Open setup",
    primaryHref: "/roadmap",
  },
  "custom-roadmap": {
    title: "Build your custom roadmap.",
    body: "Your generic checklist becomes your specific plan.",
    primaryLabel: "Build it",
    primaryHref: "/roadmap",
  },
  hunter: {
    title: "Meet Hunter.",
    body: "Your AI opportunity scout. Five minutes to introduce yourselves.",
    primaryLabel: "Meet Hunter",
    primaryHref: "/opportunities",
  },
  grant: {
    title: "Meet Grant.",
    body: "Your AI bid analyst. He'll help you decide which opportunities are worth your time.",
    primaryLabel: "Meet Grant",
    primaryHref: "/opportunities",
  },
  ava: {
    title: "Meet Ava.",
    body: "Your AI proposal writer. She turns a solicitation into a first draft.",
    primaryLabel: "Meet Ava",
    primaryHref: "/pipeline",
  },
  "bid-no-bid": {
    title: "Run your first bid/no-bid.",
    body: "Grant walks you through the call so you spend time only on bids worth winning.",
    primaryLabel: "Start bid/no-bid",
    primaryHref: "/opportunities",
  },
  prepare: {
    title: "Prepare your proposal.",
    body: "Ava drafts, you refine. A mentor reviews before you send.",
    primaryLabel: "Open proposal",
    primaryHref: "/pipeline",
  },
  submit: {
    title: "Submit your first bid.",
    body: "Final checks, signatures, and you're in the running.",
    primaryLabel: "Open submission",
    primaryHref: "/pipeline",
  },
  prime: {
    title: "Register as a prime contractor.",
    body: "Once you've subbed a few times, this is how you start winning your own.",
    primaryLabel: "Start registration",
    primaryHref: "/roadmap",
  },
  cmmc: {
    title: "Get CMMC 2.0 ready.",
    body: "Required for any DoD work touching controlled info. Worth doing before it's a blocker.",
    primaryLabel: "Open CMMC checklist",
    primaryHref: "/roadmap",
  },
};
