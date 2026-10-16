// DEMO: the Roadmap's programme content, converted once from
// sc-main `prisma/roadmap-v3-content.yaml` (the file members' pages read in
// production). Same ids, titles, weeks, checklist lines, "why" text, card
// types and call keys. Nothing here is edited except where a line says DEMO.
// `mentorName` is kept as written; the demo shows Sarah Mitchell on every call.

export interface ContentSub {
  id: string;
  /** The phase this sub-step sits in: p1 to p4. */
  phase: string;
  title: string;
  weeks: number;
  items?: string[];
  why?: string;
  cardType?: "call" | "dfy" | "pursuit" | "none";
  callKey?: "positioning" | "targeting" | "compliance";
  callPrice?: number;
  formKey?: string;
  mentorName?: string;
  dfySlug?: string;
  diyLink?: string;
  diyTitle?: string;
  diyDescription?: string;
  diyEnabled?: boolean;
}

export const CONTENT: ContentSub[] = [
  {
    "id": "p1-business-setup",
    "title": "LLC Registration",
    "weeks": 2,
    "items": [
      "LLC / entity formation",
      "EIN",
      "Business bank account"
    ],
    "why": "These three make your business a legal thing the government can pay. Nothing else can start until they exist.",
    "phase": "p1"
  },
  {
    "id": "p1-digital-compliance",
    "title": "Digital Compliance",
    "weeks": 2,
    "items": [
      "Submit Audit Form",
      "Website/footer",
      "Domain",
      "Business email",
      "Business phone",
      "A2P Brand",
      "A2P Campaign",
      "Contact/Consent",
      "Government Page",
      "Letterhead",
      "Privacy Policy",
      "LinkedIn"
    ],
    "why": "Buyers and primes check before they call. A clean site on your own domain says you are real.",
    "cardType": "call",
    "callKey": "compliance",
    "callPrice": 0,
    "formKey": "digital_compliance_audit",
    "mentorName": "Sinan Murat",
    "phase": "p1"
  },
  {
    "id": "p1-federal-registration",
    "title": "Federal Registration",
    "weeks": 10,
    "items": [
      "Entity validation",
      "UEI",
      "SAM registration",
      "IRS/TIN validation",
      "CAGE"
    ],
    "why": "This is the registration that lets a federal buyer pay you. Until it is active, no one can award you anything.",
    "phase": "p1"
  },
  {
    "id": "p1-sled-registration",
    "title": "SLED Registration",
    "weeks": 5,
    "items": [
      "State Registration",
      "City Vendors",
      "County Vendors",
      "Local Agencies",
      "Prime Registrations"
    ],
    "why": "Only the registrations that open work you actually want. We will not send you chasing the rest.",
    "phase": "p1"
  },
  {
    "id": "p2-capability-statement",
    "title": "Capability Statement",
    "weeks": 2,
    "items": [
      "Company & Contact Information",
      "Core Competencies",
      "Past Performance",
      "Differentiators",
      "Company Data",
      "Government Codes & Credentials",
      "Targeting & Relevance Check",
      "Final Document Check"
    ],
    "why": "This is the one page every buyer asks for. It is also what unlocks your AI team.",
    "phase": "p2"
  },
  {
    "id": "p2-sbs-registration",
    "title": "SBS Registration",
    "weeks": 1,
    "items": [
      "Create SBA Profile (SBS)",
      "Optimize your SBA profile",
      "Verify the finished profile"
    ],
    "why": "This is how federal buyers find businesses like yours. A few minutes here, more visibility for months.",
    "phase": "p2"
  },
  {
    "id": "p2-cmmc-level-1",
    "title": "CMMC 2.0 Level 1",
    "weeks": 2,
    "items": [
      "CMMC 2.0 Level 1"
    ],
    "why": "CMMC 2.0 Level 1 (\"Foundational\") is the baseline cybersecurity standard for Department of Defense (DoD) contractors who handle Federal Contract Information (FCI) but do not process Controlled Unclassified Information (CUI). It requires the implementation of 17 basic cyber hygiene practices and an annual self-assessment.",
    "phase": "p2"
  },
  {
    "id": "p3-positioning-call",
    "title": "Positioning Call",
    "weeks": 1,
    "items": [
      "Book your positioning call",
      "Receive your strategy"
    ],
    "why": "Your mentor learns your business on this call. What you agree here shapes everything after it.",
    "cardType": "call",
    "callKey": "positioning",
    "phase": "p3"
  },
  {
    "id": "p3-planned-pursuit",
    "title": "Meet Your AI Agents",
    "weeks": 1,
    "items": [
      "Watch all the AI videos",
      "Interact with Hunter"
    ],
    "why": "Hunter finds the work. Using him is how he learns what to bring you.",
    "cardType": "pursuit",
    "phase": "p3"
  },
  {
    "id": "p3-send-to-mentor",
    "title": "Send to Mentor",
    "weeks": 1,
    "items": [
      "Send 5 opportunities you like to your mentor"
    ],
    "why": "Your mentor has seen what wins and what wastes a fortnight. Ask before you commit to one.",
    "phase": "p3"
  },
  {
    "id": "p3-prime-registration",
    "title": "Prime Registration",
    "weeks": 1,
    "items": [
      "Identify the primes that buy your work",
      "Register on each prime's supplier portal",
      "Submit your capability statement",
      "Confirm your registration is active"
    ],
    "why": "Primes subcontract most of what they win. Being on their vendor list is how they find you when they need what you do.",
    "diyEnabled": false,
    "phase": "p3"
  },
  {
    "id": "p4-proposal-building",
    "title": "Proposal Building",
    "weeks": 3,
    "items": [
      "Ava - Your Proposal Builder (Coming Soon!)",
      "You correct the work details",
      "Add past performance",
      "Price it"
    ],
    "why": "Ava will write the first draft, so you will be correcting a page instead of facing a blank one.",
    "phase": "p4"
  },
  {
    "id": "p4-review-submit",
    "title": "Review & Submit",
    "weeks": 1,
    "items": [
      "Make sure your prices, forms, signature and due date are all correct before you send.",
      "Mentor Reviewed (Before Submission)"
    ],
    "why": "A last read-through, with you deciding what is right. Once a bid is sent it cannot be taken back.",
    "phase": "p4"
  }
];
