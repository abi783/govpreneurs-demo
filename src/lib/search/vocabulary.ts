// Everyday words -> government codes.
//
// A small-business owner types "catering" or "hvac". Government records say "Food Service
// Contractors" (NAICS 722310) or "Plumbing, Heating, and Air-Conditioning Contractors"
// (NAICS 238220). This list joins the two. Each group has the words that a member types, the
// NAICS (North American Industry Classification System) codes, the PSC (product and service
// code) codes, and a plain label for the match reason. All codes are real: NAICS 2022 and the
// current PSC manual. One word can be in more than one group, e.g. "kitchen".

export interface VocabTarget {
  naics: string[];
  psc: string[];
  /** The plain name in the match reason, e.g. "Type of work: food service". */
  label: string;
}

interface VocabGroup extends VocabTarget {
  words: string[];
}

const GROUPS: VocabGroup[] = [
  {
    label: "food service",
    naics: ["722310", "722320", "722330", "722514"],
    psc: ["S203"],
    words: [
      "catering",
      "caterer",
      "cater",
      "meals",
      "meal",
      "food",
      "food service",
      "foodservice",
      "cook",
      "cooking",
      "chef",
      "culinary",
      "cafeteria",
      "dining",
      "dining hall",
      "dfac",
      "galley",
      "mess hall",
      "mess attendant",
      "kitchen",
      "kitchen staff",
      "lunch",
      "lunches",
      "school lunch",
      "feeding",
      "restaurant",
      "concessions",
      "banquet",
    ],
  },
  {
    label: "food supply",
    naics: ["424410", "424420", "424470", "424480", "424490"],
    psc: ["8905", "8910", "8915", "8920", "8970"],
    words: [
      "food",
      "grocery",
      "groceries",
      "food supply",
      "food distributor",
      "food distribution",
      "produce",
      "fresh produce",
      "meat",
      "fruit",
      "vegetables",
      "subsistence",
      "prime vendor",
      "wholesale food",
    ],
  },
  // No PSC code here: S203 ("Housekeeping - Food") is every food service award, so it would
  // make "coffee" find all of them.
  {
    label: "coffee and snack bars",
    naics: ["722515"],
    psc: [],
    words: ["coffee", "coffee service", "coffee shop", "cafe", "snack bar", "snacks"],
  },
  {
    label: "vending",
    naics: ["445132"],
    psc: [],
    words: ["vending", "vending machine"],
  },
  {
    label: "kitchen equipment repair",
    naics: ["811310", "811412"],
    psc: ["J073"],
    words: [
      "kitchen",
      "kitchen repair",
      "kitchen equipment",
      "kitchen equipment repair",
      "commercial kitchen",
      "food equipment",
      "equipment repair",
      "appliance repair",
      "oven repair",
      "fryer repair",
      "dishwasher repair",
    ],
  },
  {
    label: "kitchen equipment supply",
    naics: ["423440"],
    psc: ["7310", "7320"],
    words: ["kitchen equipment", "restaurant equipment", "food equipment"],
  },
  {
    label: "heating and air-conditioning",
    naics: ["238220"],
    psc: ["J041", "4120"],
    words: [
      "hvac",
      "heating",
      "air conditioning",
      "air conditioner",
      "ac",
      "ac repair",
      "hvac repair",
      "furnace",
      "heat pump",
      "ventilation",
      "refrigeration",
      "walk in cooler",
      "cooler repair",
      "freezer repair",
      "boiler",
    ],
  },
  {
    label: "plumbing",
    naics: ["238220"],
    psc: ["J045"],
    words: ["plumbing", "plumber", "pipes", "water heater", "drain", "drain cleaning", "backflow"],
  },
  {
    label: "grease trap and septic pumping",
    naics: ["562991"],
    psc: ["S222"],
    words: [
      "grease trap",
      "grease",
      "septic",
      "septic tank",
      "pumping",
      "portable toilet",
      "porta potty",
      "porta john",
    ],
  },
  {
    label: "trash removal",
    naics: ["562111", "562119"],
    psc: ["S205"],
    words: ["trash", "garbage", "waste", "waste removal", "dumpster", "recycling", "junk removal"],
  },
  {
    label: "cleaning",
    naics: ["561720"],
    psc: ["S201"],
    words: [
      "cleaning",
      "cleaner",
      "janitor",
      "janitorial",
      "custodial",
      "custodian",
      "housekeeping",
      "maid",
      "floor care",
      "window cleaning",
      "office cleaning",
    ],
  },
  {
    label: "carpet cleaning",
    naics: ["561740"],
    psc: ["S214"],
    words: ["carpet cleaning", "carpet", "upholstery"],
  },
  {
    label: "pest control",
    naics: ["561710"],
    psc: ["S207"],
    words: [
      "pest",
      "pest control",
      "exterminator",
      "exterminating",
      "bug",
      "bugs",
      "insect",
      "termite",
      "rodent",
      "rats",
      "mice",
      "ipm",
    ],
  },
  {
    label: "lawn and grounds care",
    naics: ["561730"],
    psc: ["S208"],
    words: [
      "lawn",
      "lawn care",
      "landscaping",
      "landscaper",
      "landscape",
      "mowing",
      "grass cutting",
      "grounds",
      "groundskeeping",
      "tree trimming",
    ],
  },
  {
    label: "security guards",
    naics: ["561612"],
    psc: ["S206"],
    words: ["security", "guard", "security guard", "patrol", "armed guard"],
  },
  {
    label: "security systems",
    naics: ["561621"],
    psc: ["N063"],
    words: ["security", "security cameras", "alarm", "alarms", "access control"],
  },
  {
    label: "locksmith",
    naics: ["561622"],
    psc: [],
    words: ["locksmith", "rekey", "rekeying", "locks"],
  },
  {
    label: "painting",
    naics: ["238320"],
    psc: [],
    words: ["painting", "painter", "paint"],
  },
  {
    label: "roofing",
    naics: ["238160"],
    psc: [],
    words: ["roofing", "roofer", "roof", "roof repair"],
  },
  {
    label: "electrical work",
    naics: ["238210"],
    psc: [],
    words: ["electrical", "electrician", "wiring", "lighting"],
  },
  {
    label: "flooring",
    naics: ["238330"],
    psc: [],
    words: ["flooring", "floors", "tile"],
  },
  {
    label: "building construction",
    naics: ["236220"],
    psc: [],
    words: ["construction", "general contractor", "renovation", "remodeling", "build out"],
  },
  {
    label: "building maintenance",
    naics: ["561210"],
    psc: ["S216"],
    words: ["building maintenance", "facility maintenance", "facilities support", "handyman"],
  },
  {
    label: "IT support",
    naics: ["541519", "541513", "541512"],
    psc: [],
    words: ["it support", "help desk", "computer repair", "tech support", "it services", "network"],
  },
  {
    label: "moving",
    naics: ["484210"],
    psc: [],
    words: ["moving", "movers", "mover", "relocation", "office move", "furniture moving"],
  },
  {
    label: "trucking",
    naics: ["484110", "484121"],
    psc: ["V112"],
    words: ["trucking", "truck", "freight", "hauling", "shipping"],
  },
  {
    label: "delivery",
    naics: ["492210", "492110"],
    psc: [],
    words: ["delivery", "deliveries", "courier", "messenger", "food delivery"],
  },
  {
    label: "laundry",
    naics: ["812320", "812332"],
    psc: ["S209"],
    words: ["laundry", "dry cleaning", "linen", "linens"],
  },
  {
    label: "uniforms",
    naics: ["424350", "315250"],
    psc: [],
    words: ["uniform", "uniforms", "work clothes"],
  },
  {
    label: "signs",
    naics: ["339950"],
    psc: ["9905"],
    words: ["sign", "signs", "signage", "banners"],
  },
  {
    label: "printing",
    naics: ["323111"],
    psc: [],
    words: ["printing", "print shop", "copies", "brochures"],
  },
  {
    label: "translation",
    naics: ["541930"],
    psc: ["R608"],
    words: ["translation", "translator", "interpreter", "interpreting", "sign language"],
  },
  {
    label: "staffing",
    naics: ["561320", "561311"],
    psc: [],
    words: ["staffing", "temp", "temps", "temporary help", "temp agency"],
  },
  {
    label: "event planning",
    naics: ["561920"],
    psc: [],
    words: ["event planning", "events", "conference planning"],
  },
  {
    label: "training",
    naics: ["611430"],
    psc: [],
    words: ["training", "trainer", "instructor"],
  },
  {
    label: "management consulting",
    naics: ["541611"],
    psc: [],
    words: ["consulting", "consultant", "management consulting"],
  },
  {
    label: "marketing and design",
    naics: ["541810", "541613", "541430"],
    psc: [],
    words: ["marketing", "advertising", "graphic design"],
  },
  {
    label: "vehicle repair",
    naics: ["811111"],
    psc: [],
    words: ["auto repair", "vehicle repair", "mechanic", "fleet maintenance"],
  },
  {
    label: "cleanup and remediation",
    naics: ["562910"],
    psc: [],
    words: ["asbestos", "mold", "remediation", "abatement"],
  },
];

// ── word helpers, shared with match.ts ─────────────────────────────────────

/**
 * Lower-case words. "A/C" becomes "ac". Punctuation splits words. Three certification names
 * stay one word: "8(a)" becomes "8a", "HUB Zone" becomes "hubzone", and "women" becomes
 * "woman", so "women-owned" finds "Woman-owned".
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\ba\/c\b/g, "ac")
    .replace(/\b8\s*\(\s*a\s*\)/g, "8a")
    .replace(/\bhub\s+zone\b/g, "hubzone")
    .replace(/\bwomen\b/g, "woman")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * A small stemmer, so that plural and verb forms of a word match: "caterers", "catering" and
 * "catered" all give "cater". It does not need to give real words. It must only give the
 * same stem for the forms of one word.
 */
export function stem(word: string): string {
  let s = word.toLowerCase();
  if (s.length > 4 && s.endsWith("ies")) s = `${s.slice(0, -3)}y`;
  else if (s.length > 4 && /(ss|x|ch|sh)es$/.test(s)) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !/(ss|us)$/.test(s)) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 5 && s.endsWith("er")) s = s.slice(0, -2);
  if (/([^aeiouls])\1$/.test(s)) s = s.slice(0, -1);
  return s;
}

/** The lookup key for a word or phrase: its stems, joined by one space. */
export function phraseKey(text: string): string {
  return tokenize(text).map(stem).join(" ");
}

const INDEX = new Map<string, VocabTarget[]>();
for (const { words, ...target } of GROUPS) {
  for (const w of words) {
    const key = phraseKey(w);
    const list = INDEX.get(key) ?? [];
    if (!list.includes(target)) list.push(target);
    INDEX.set(key, list);
  }
}

/** The longest phrase in the list, in words. The matcher tries phrases up to this length. */
export const MAX_PHRASE_WORDS = Math.max(...[...INDEX.keys()].map((k) => k.split(" ").length));

/** The code groups for a word or phrase (stems joined by a space), or an empty list. */
export function lookupPhrase(key: string): VocabTarget[] {
  return INDEX.get(key) ?? [];
}

/**
 * The edit distance between two words: one letter added, removed, changed, or two letters
 * swapped is one edit ("cateirng" to "catering" is one edit).
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** The number of edits that a typed word may have: none under 5 letters, 1 for 5 to 7
 *  letters, 2 for 8 or more. Codes (with a digit) get none. */
export const typoAllowance = (word: string): number =>
  /\d/.test(word) || word.length < 5 ? 0 : word.length < 8 ? 1 : 2;

/** The single words in the list, for typo matches. */
const SINGLE_WORDS = [...new Set(GROUPS.flatMap((g) => g.words).filter((w) => !w.includes(" ")))];

/**
 * The list word nearest to a typed word that is not in the list, within its typo allowance,
 * or null. "janitoral" gives "janitorial".
 */
export function nearestListWord(word: string): string | null {
  const allowed = typoAllowance(word);
  if (!allowed) return null;
  let best: { w: string; d: number } | null = null;
  for (const w of SINGLE_WORDS) {
    if (Math.abs(w.length - word.length) > allowed) continue;
    const d = editDistance(word, w);
    if (d <= allowed && (!best || d < best.d)) best = { w, d };
  }
  return best?.w ?? null;
}

/** The number of everyday words and phrases in the list, and the number of code groups. */
export const VOCABULARY_SIZE = { phrases: INDEX.size, groups: GROUPS.length };
