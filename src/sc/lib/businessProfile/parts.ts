/**
 * The five parts of the record, and nothing else.
 *
 * Separate from `catalog.ts` on purpose: the route shell must answer "is this
 * segment a real part?" before it knows anything about fields, and the rail
 * renders five links before a payload arrives. Neither should drag the 75-row
 * catalog into a code path that only needs a string check.
 *
 * THE PART IDS ARE THE CROSS-REPO VOCABULARY — the prototype's `SectionId` and
 * `govpreneures`' catalog sections. Renaming one to read better in a URL breaks
 * that agreement, which is why `/{loc}/business/business` is accepted as ugly,
 * addressable and correct.
 */

/** The part ids. Declaration order here is the order the CATALOG authors its
 *  rows in — RENDER order lives on `PARTS` below and is deliberately different,
 *  for the reason recorded there. Nothing may assume the two are parallel.
 *
 *  `digital` is APPENDED, and is the one part with no catalog rows behind it:
 *  it renders the Digital Compliance Audit Form, which writes a
 *  `MemberValidation` row rather than `ProfileField`s (see
 *  components/business/mybusiness/DigitalIdentityPart.tsx). Its rail count is
 *  therefore always 0, which is correct — there are no questions here that the
 *  record could answer. */
export const PART_IDS = ["business", "sell", "capacity", "jobs", "papers", "digital"] as const;

export type PartId = (typeof PART_IDS)[number];

/**
 * The parts the CATALOG answers — every part except `digital`, which holds a
 * form rather than record rows.
 *
 * Worth a name of its own: "every part has rows in it" was a true and useful
 * invariant about the record, and `digital` does not break it so much as sit
 * outside it. Anything counting or walking catalog fields should use this;
 * anything about the rail or the URL space should use `PART_IDS`.
 */
export const CATALOG_PART_IDS = ["business", "sell", "capacity", "jobs", "papers"] as const;

export type CatalogPartId = (typeof CATALOG_PART_IDS)[number];

export interface Part {
  id: PartId;
  title: string;
  /** What the part is for. Never a count — counts live on the row. */
  note: string;
}

/**
 * The five parts in RAIL ORDER, ported verbatim from the prototype's
 * `SECTIONS`. Titles and notes are reviewed copy, not placeholders.
 *
 * THE ORDER IS BY WHAT A PART DOES FOR HER, NOT BY WHAT WE HOLD, and it is not
 * `PART_IDS` order. The prototype ran identity-first — the order the four source
 * authorities list their own fields in — and that put eighteen rows of legal and
 * compliance detail, ten of them government identifiers she cannot write
 * herself, in front of everything else. Measured, it was six viewports between
 * landing and "Work you have done", whose own note says buyers read it first.
 *
 * So: what you sell, what you have done, your papers, what you can take on, and
 * last the legal record — which is mostly filled from the government's own
 * registers and is the part she has least reason to open.
 */
export const PARTS: Part[] = [
  {
    id: "sell",
    title: "What you sell",
    note: "How a buyer finds you, and how we find work for you.",
  },
  {
    id: "jobs",
    title: "Work you have done",
    note: "Buyers read this part first, and they call the people you name.",
  },
  {
    id: "papers",
    title: "Your papers",
    note: "Insurance, licenses and permits. Buyers check these before they sign.",
  },
  {
    id: "capacity",
    title: "What you can take on",
    note: "The size of job you can deliver, and how far you will travel.",
  },
  {
    /* NOT "Your business". The page itself is called My business, and a part
       inside it carrying the same name made the nav read as if one of the five
       doors led back to the page you were standing on. Its own note already said
       what it actually holds. The ID stays `business` — that is the shared
       cross-repo vocabulary, and the `/{loc}/business/business` URL is accepted. */
    id: "business",
    title: "Your legal details",
    note: "Your registered details, and what the government's own records say.",
  },
  {
    /* Directly after the legal record, and last in the rail, because it asks
       the same kind of question — the registered facts about the business
       rather than what she sells — and because it is the one part that is not
       the record at all: it is the Digital Compliance Audit Form, and what she
       submits here appears on her roadmap. */
    id: "digital",
    title: "Digital identity",
    note: "Your website, email and phone — checked against what government buyers and carriers require.",
  },
];

/**
 * The route guard for `/[locationId]/business/[part]`. Frame, not feature: an
 * unrecognised segment must 404 rather than render an empty part, and there is
 * exactly one place that decision is made.
 */
export function isPartId(value: string): value is PartId {
  return (PART_IDS as readonly string[]).includes(value);
}
