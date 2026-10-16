// Verbatim from the GovPreneurs funnel's reg-checklist.js `gpSteps` array.
export interface ChecklistStep {
  title: string;
  why: string;
}

export const REGISTRATION_STEPS: ChecklistStep[] = [
  {
    title: "Make sure your business is legally registered",
    why: "Government agencies and prime contractors verify your business is real. If your legal registration is expired or inconsistent across systems, it creates problems down the line.",
  },
  {
    title: "Get your EIN",
    why: "You cannot move forward in the federal registration process without one. It also appears on contracts, invoices, and tax documents.",
  },
  {
    title: "Register on SAM.gov and get your UEI",
    why: "Every federal opportunity requires your UEI. Without it, you do not officially exist in the federal marketplace. SAM also requires annual renewal — missing that window can disqualify you from active opportunities.",
  },
  {
    title: "Know your NAICS codes",
    why: "Government buyers search for vendors by NAICS code. If you are using the wrong codes or missing important ones, you will not show up in the searches that matter.",
  },
  {
    title: "Set up your DSBS profile",
    why: "Registering in SAM.gov does not automatically make you visible to buyers. An incomplete DSBS profile means buyers pass right over you — even if you are registered.",
  },
  {
    title: "Create a capability statement",
    why: "When a government buyer or prime contractor looks you up, this is what represents your business. Without one, you look unprepared — even if your company is well-established.",
  },
  {
    title: "Understand set-aside certifications",
    why: "If you qualify, you have access to contracts your larger competitors cannot touch. Most business owners do not know they qualify until someone tells them.",
  },
  {
    title: "Look into state and local registrations",
    why: "Many small businesses find state and local contracts easier to win early on. The competition is lower and they help build the past performance you need for larger federal opportunities.",
  },
  {
    title: "Make sure your digital presence supports your registration",
    why: "A weak digital presence can cost you opportunities even after your paperwork is complete. Buyers and primes vet vendors before reaching out — a professional website, business email, and dedicated phone number are part of how you get taken seriously.",
  },
];

// Original funnel had no persistence key of its own — this is the tool's own key.
export const REGISTRATION_CHECKLIST_STORAGE_KEY = "tools:reg-checklist";
