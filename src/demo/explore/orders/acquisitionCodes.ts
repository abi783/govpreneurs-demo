/**
 * The DLA acquisition codes as reference data, transcribed from the primary source.
 *
 * **THE SOURCE IS DFARS PGI 217.75, EFFECTIVE 05/07/2026**, published free at
 * `https://www.acquisition.gov/dfarspgi/pgi-217.75-acquisition-replenishment-parts`
 * and read on 10 September 2026. Section 2-201.1 defines the acquisition method
 * codes (AMC), section 2-201.2 defines the acquisition method suffix codes
 * (AMSC), and Exhibit I lists which pairs are valid.
 *
 * Every `meaning` below is the paragraph VERBATIM. The document's own spelling
 * stands, including `AMCS 3, 4, or 5 are valid.` in 2-201.2(d), `AMCs 1 or 2 or
 * valid.` in 2-201.2(k) and `Only AMC O is valid.` in 2-201.2(o) — where the
 * letter `O` stands for the digit `0` that Exhibit I marks valid on that row.
 * A reader who compares this file with the regulation must find no difference,
 * so nothing here is tidied.
 *
 * **THIS FILE HOLDS NO VERDICT.** It says what each code means and which
 * counterpart codes it may appear beside. Whether a member may bid an order is
 * decided in `frontend-v2/src/lib/microPurchases/relevance.ts`, which owns that
 * question alone. Two owners of one verdict is a defect this repository has
 * already paid for once.
 */

/** Which half of the AMC/AMSC pair a document describes. */
export type AcquisitionCodeKind = 'amc' | 'amsc';

/**
 * What the PGI does with the code.
 *
 * A stored `reserved` or `not-authorized` code is the point of the field: it
 * separates a code the regulation refuses from a code this collection is
 * missing. 2-201.2 marks E, F, J and W `(Reserved)` and I and X
 * `(Not authorized)`, and Exhibit I gives none of the six a row.
 */
export type AcquisitionCodeStatus = 'defined' | 'reserved' | 'not-authorized';

/** Where the meaning was read, precise enough to check by hand. */
export interface AcquisitionCodeCitation {
  /** The publication, as it names itself. */
  document: string;
  /** The paragraph the meaning was read from, e.g. `2-201.2(d)`. */
  section: string;
  /** The change effective date the published page carried when it was read. */
  effectiveDate: string;
  /** The page the transcription came from. */
  url: string;
  /** The day a person read that page. Not the day the seed ran. */
  retrievedAt: string;
}

/** One acquisition code, its official meaning and its lawful counterparts. */
export interface AcquisitionCodeDocument {
  /** The code as DLA prints it: `0`-`5` for an AMC, `A`-`Z` for an AMSC. */
  code: string;
  kind: AcquisitionCodeKind;
  /** The PGI paragraph, verbatim. */
  meaning: string;
  status: AcquisitionCodeStatus;
  /** The counterpart codes Exhibit I marks valid beside this one. An AMC
   *  document lists AMSC letters; an AMSC document lists AMC digits. Empty
   *  when the regulation authorises no pair at all. */
  validCounterparts: string[];
  citation: AcquisitionCodeCitation;
}

/** The seeded collection, named after the `naics_taxonomy` / `psc_taxonomy` pair. */
export const ACQUISITION_CODE_TAXONOMY_COLLECTION = 'acquisition_code_taxonomy';

const SOURCE_DOCUMENT = 'DFARS PGI 217.75';
const SOURCE_URL =
  'https://www.acquisition.gov/dfarspgi/pgi-217.75-acquisition-replenishment-parts';
const EFFECTIVE_DATE = '05/07/2026';
const RETRIEVED_AT = '2026-09-10';
const AMC_SECTION = '2-201.1';
const AMSC_SECTION = '2-201.2';

/** The two meanings that are a status rather than a definition. */
const RESERVED_MEANING = '(Reserved)';
const NOT_AUTHORIZED_MEANING = '(Not authorized)';

/** A paragraph of the PGI: its letter, the code it defines, and its text. */
type CodeParagraph = readonly [
  paragraph: string,
  code: string,
  meaning: string,
];

/** Section 2-201.1, paragraphs (a) through (f), verbatim. */
const AMC_PARAGRAPHS: readonly CodeParagraph[] = [
  [
    'a',
    '0',
    'The part was not assigned AMC 1 through 5 when it entered the inventory, nor has it ever completed screening. Use of this code is sometimes necessary but discouraged. Maximum effort to determine the applicability of an alternate AMC is the objective. This code will never be used to recode a part that already has AMC 1 through 5 assigned, and shall never be assigned as a result of breakout screening. Maximum effort to determine the applicability of AMC 1 through 5 is the objective.',
  ],
  [
    'b',
    '1',
    'Suitable for competitive acquisition for the second or subsequent time.',
  ],
  ['c', '2', 'Suitable for competitive acquisition for the first time.'],
  [
    'd',
    '3',
    'Acquire, for the second or subsequent time, directly from the actual manufacturer.',
  ],
  [
    'e',
    '4',
    'Acquire, for the first time, directly from the actual manufacturer.',
  ],
  [
    'f',
    '5',
    'Acquire directly from a sole source contractor which is not the actual manufacturer.',
  ],
];

/** Section 2-201.2, paragraphs (a) through (z), verbatim. */
const AMSC_PARAGRAPHS: readonly CodeParagraph[] = [
  [
    'a',
    'A',
    "The Government's right to use data in its possession is questionable. This code is only applicable to parts under immediate buy requirements and for as long thereafter as rights to data are still under review for resolution and appropriate coding. This code is assigned only at the conclusion of limited screening, and it remains assigned until the full screening process resolves the Government's rights to use data and results in assignment of a different AMSC. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, or if the data is adequate for an alternate source to qualify in accordance with the design control activity's procedures, AMCs 1 or 2 are valid.",
  ],
  [
    'b',
    'B',
    'This part must be acquired from a manufacturing source(s) specified on a source control or selected item drawing as defined by the current version of DoD-STD-100. Suitable technical data, Government data rights, or manufacturing knowledge are not available to permit acquisition from other sources, nor qualification testing of another part, nor use of a second source part in the intended application. Although, by DoD-STD-100 definition, altered and selected items shall have an adequate technical data package, data review discloses that required data or data rights are not in Government possession and cannot be economically obtained. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  [
    'c',
    'C',
    "This part requires engineering source approval by the design control activity in order to maintain the quality of the part. Existing unique design capability, engineering skills, and manufacturing knowledge by the qualified source(s) require acquisition of the part from the approved source(s). The approved source(s) retain data rights, manufacturing knowledge, or technical data that are not economically available to the Government, and the data or knowledge is essential to maintaining the quality of the part. An alternate source must qualify in accordance with the design control activity's procedures, as approved by the cognizant Government engineering activity. The qualification procedures must be approved by the Government engineering activity having jurisdiction over the part in the intended application. If one source is approved, AMCs 3, 4, or 5 are valid. If at least two sources are approved or if data is adequate for an alternate source to qualify in accordance with the design control activity's procedures, AMCs 1 or 2 are valid.",
  ],
  [
    'd',
    'D',
    'The data needed to acquire this part competitively is not physically available, it cannot be obtained economically, nor is it possible to draft adequate specifications or any other adequate, economical description of the material for a competitive solicitation. AMCS 3, 4, or 5 are valid.',
  ],
  ['e', 'E', '(Reserved)'],
  ['f', 'F', '(Reserved)'],
  [
    'g',
    'G',
    'The Government has rights to the technical data, the data package is complete, and there are no technical data, engineering, tooling or manufacturing restrictions. (This is the only AMSC that implies that parts are candidates for full and open competition. Other AMSCs such as K, M, N, Q, and S may imply limited competition when two or more independent sources exist yet the technical data package is inadequate for full and open competition.) AMCs 1 or 2 are valid.',
  ],
  [
    'h',
    'H',
    'The Government physically does not have in its possession sufficient, accurate, or legible data to purchase this part from other than the current source(s). This code is applicable only to parts under immediate buy requirements and only for as long thereafter as the deficiency is under review for resolution and appropriate recoding. This code is only assigned at the conclusion of limited screening, and it remains assigned until the full screening process resolves physical data questions and results in assignment of a different AMSC. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  ['i', 'I', '(Not authorized)'],
  ['j', 'J', '(Reserved)'],
  [
    'k',
    'K',
    'This part must be produced from class 1 castings and similar type forgings as approved (controlled) by procedures contained in the current version of MIL-STD-2175. If one source has such castings and cannot provide them to other sources, AMCs 3, 4, or 5 are valid. If at least two sources have such castings or they can be provided to other sources AMCs 1 or 2 or valid.',
  ],
  [
    'l',
    'L',
    'The annual buy value of this part falls below the screening threshold established by DoD components and field activities. However, this part has been screened for additional known sources, resulting in either confirmation that the initial source exists or that other sources may supply the part. No additional screening was performed to identify the competitive or noncompetitive conditions that would result in assignment of a different AMSC. This code shall not be used when screening parts entering the inventory. This code shall be used only to replace AMSC O for parts under the established screening threshold. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  [
    'm',
    'M',
    'Manufacture of this part requires use of master or coordinated tooling. If only one set of tooling exists and cannot be made available to another source for manufacture of this part, AMCs 3, 4, or 5 are valid. When the availability of existent or refurbishable tooling is available to two or more sources, then AMCs 1 or 2 are valid.',
  ],
  [
    'n',
    'N',
    'Manufacture of this part requires special test and/or inspection facilities to determine and maintain ultra-precision quality for its function or system integrity. Substantiation and inspection of the precision or quality cannot be accomplished without such specialized test or inspection facilities. If the test cannot be made available for the competitive manufacture of the part, the required test or inspection knowledge cannot be documented for reliable replication, or the required physical test or inspection facilities and processes cannot be economically documented in a TDP, valid AMCs are 3, 4, or 5. If the facilities or tests can be made available to two or more competitive sources, AMCs 1 or 2 are valid.',
  ],
  [
    'o',
    'O',
    'The part was not assigned an AMSC when it entered the inventory, nor has it ever completed screening. Use of this code in conjunction with AMC 0 is sometimes necessary but discouraged. Maximum effort to determine the applicability of an alternate AMSC is the objective. Only AMC O is valid.',
  ],
  [
    'p',
    'P',
    'The rights to use the data needed to purchase this part from additional source(s) are not owned by the Government and cannot be purchased, developed, or otherwise obtained. It is uneconomical to reverse engineer this part. This code is used in situations where the Government has the data but does not own the rights to the data. If only one source has the rights or data to manufacture this item, AMCs 3, 4, or 5 are valid. If two or more sources have the rights or data to manufacture this item, AMCs 1 or 2 are valid.',
  ],
  [
    'q',
    'Q',
    'The Government does not have adequate data, lacks rights to data, or both needed to purchase this part from additional sources. The Government has been unable to economically buy the data or rights to the data, although the part has been undergoing full screening for 12 or more months. Breakout to competition has not been achieved, but current, continuing actions to obtain necessary rights to data or adequate, reprocurement technical data indicate breakout to competition is expected to be achieved. This part may be a candidate for reverse engineering or other techniques to obtain technical data. All AMSC Q items are required to be reviewed within the timeframes cited in 2-203(b). If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  [
    'r',
    'R',
    'The Government does not own the data or the rights to the data needed to purchase this part from additional sources. It has been determined to be uneconomical to buy the data or rights to the data. It is uneconomical to reverse engineer the part. This code is used when the Government did not initially purchase the data and/or rights. If only one source has the rights or data to manufacture this item, AMCs 3, 4, or 5 are valid. If two or more sources have the rights or data to manufacture this item, AMCs 1 or 2 are valid.',
  ],
  [
    's',
    'S',
    'Acquisition of this item is restricted to Government approved source(s) because the production of this item involves unclassified but militarily sensitive technology (see FAR Subpart 6.3). If one source is approved, AMCs 3, 4, or 5 are valid. If at least two sources are approved, AMCs 1 or 2 are valid.',
  ],
  [
    't',
    'T',
    'Acquisition of this part is controlled by qualified products list (QPL) procedures. Competition for this part is limited to sources which are listed on or are qualified for listing on the QPL at the time of award (see FAR Part 9 and DFARS Part 209). AMCs 1 or 2 are valid.',
  ],
  [
    'u',
    'U',
    'The cost to the Government to breakout this part and acquire it competitively has been determined to exceed the projected savings over the life span of the part. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  [
    'v',
    'V',
    'This part has been designated a high reliability part under a formal reliability program. Probability of failure would be unacceptable from the standpoint of safety of personnel and/or equipment. The cognizant engineering activity has determined that data to define and control reliability limits cannot be obtained nor is it possible to draft adequate specifications for this purpose. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources are available, AMCs 1 or 2 are valid.',
  ],
  ['w', 'W', '(Reserved)'],
  ['x', 'X', '(Not authorized)'],
  [
    'y',
    'Y',
    'The design of this part is unstable. Engineering, manufacturing, or performance characteristics indicate that the required design objectives have not been achieved. Major changes are contemplated because the part has a low process yield or has demonstrated marginal performance during tests or service use. These changes will render the present part obsolete and unusable in its present configuration. Limited acquisition from the present source is anticipated pending configuration changes. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources exist, AMCs 1 or 2 are valid.',
  ],
  [
    'z',
    'Z',
    'This part is a commercial product, nondevelopmental item, or commercially available off-the-shelf item. Commercial item descriptions, commercial vendor catalog or price lists, or commercial manuals assigned a technical manual number apply. If one source is available, AMCs 3, 4, or 5 are valid. If at least two sources are available, AMCs 1 or 2 are valid.',
  ],
];

/**
 * Exhibit I, transcribed: the AMC digits each AMSC letter may appear beside.
 *
 * The exhibit marks a valid combination `o` and an invalid one `X`. A letter
 * absent from this table has no row in the exhibit, so it pairs with no AMC.
 * The prose in 2-201.2 says the same thing letter by letter.
 */
const EXHIBIT_I: Readonly<Record<string, string>> = {
  A: '12345',
  B: '12345',
  C: '12345',
  D: '345',
  G: '12',
  H: '12345',
  K: '12345',
  L: '12345',
  M: '12345',
  N: '12345',
  O: '0',
  P: '12345',
  Q: '12345',
  R: '12345',
  S: '12345',
  T: '12',
  U: '12345',
  V: '12345',
  Y: '12345',
  Z: '12345',
};

/** Reads the status straight out of the paragraph, so no code is typed twice. */
function statusOf(meaning: string): AcquisitionCodeStatus {
  if (meaning === RESERVED_MEANING) return 'reserved';
  if (meaning === NOT_AUTHORIZED_MEANING) return 'not-authorized';
  return 'defined';
}

/** The AMC digits Exhibit I marks valid beside one AMSC letter. */
function methodsFor(letter: string): string[] {
  return (EXHIBIT_I[letter] ?? '').split('');
}

/** The AMSC letters Exhibit I marks valid beside one AMC digit. */
function suffixesFor(digit: string): string[] {
  return Object.keys(EXHIBIT_I).filter((letter) =>
    EXHIBIT_I[letter].includes(digit),
  );
}

/**
 * Builds one document per acquisition code, AMC first, in the PGI's own order.
 *
 * @returns 6 AMC documents and 26 AMSC documents, ready to upsert
 */
export function acquisitionCodeDocuments(): AcquisitionCodeDocument[] {
  const cite = (
    section: string,
    paragraph: string,
  ): AcquisitionCodeCitation => ({
    document: SOURCE_DOCUMENT,
    section: `${section}(${paragraph})`,
    effectiveDate: EFFECTIVE_DATE,
    url: SOURCE_URL,
    retrievedAt: RETRIEVED_AT,
  });

  const amc = AMC_PARAGRAPHS.map(([paragraph, code, meaning]) => ({
    code,
    kind: 'amc' as const,
    meaning,
    status: statusOf(meaning),
    validCounterparts: suffixesFor(code),
    citation: cite(AMC_SECTION, paragraph),
  }));

  const amsc = AMSC_PARAGRAPHS.map(([paragraph, code, meaning]) => ({
    code,
    kind: 'amsc' as const,
    meaning,
    status: statusOf(meaning),
    validCounterparts: methodsFor(code),
    citation: cite(AMSC_SECTION, paragraph),
  }));

  return [...amc, ...amsc];
}
