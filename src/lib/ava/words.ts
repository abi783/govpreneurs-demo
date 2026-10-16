// Words she types, matched to the answers on screen. Pure, so it is tested
// without a page. The talk box uses it: "yes", "the second one" or "I can get
// it in time" pick the answer they mean, as a tap would.

/** What an answer needs to be matched: its words, and whether it is the main one. */
export interface AnswerLike {
  label: string;
  kind?: "primary" | "secondary" | "ghost";
}

const YES =
  /^(y|yes|yeah|yep|yup|sure|ok|okay|correct|right|agreed|approve|confirm|absolutely|definitely|of course|go ahead|do it|sounds good|that is right|that's right|i can|i do|i have|i will|we can|we do|we have)\b/;
const NO =
  /^(n|no|nope|nah|not really|i cannot|i can't|i cant|i do not|i don't|i dont|we cannot|we can't)\b/;
const UNSURE = /\b(not sure|unsure|don'?t know|do not know|maybe|later|skip|leave it)\b/;

const tokens = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9$%\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

/** The answer on screen that her typed words mean, or null. Words match an
 *  answer's own words ("the first one", "I can get it in time"), or say yes,
 *  no or not sure. */
export function matchReply<R extends AnswerLike>(text: string, replies: R[]): R | null {
  const said = text.trim().toLowerCase();
  if (!said || replies.length === 0) return null;
  const first = (re: RegExp) => replies.find((r) => re.test(r.label.toLowerCase()));
  // "the second one", "option 3", "number two": the answer in that place.
  const PLACES: [RegExp, number][] = [
    [/\b(first|1st)\b/, 0],
    [/\b(second|2nd)\b/, 1],
    [/\b(third|3rd)\b/, 2],
    [/\b(fourth|4th)\b/, 3],
    [/\b(?:option|number|answer|choice)\s*(?:1|one)\b/, 0],
    [/\b(?:option|number|answer|choice)\s*(?:2|two)\b/, 1],
    [/\b(?:option|number|answer|choice)\s*(?:3|three)\b/, 2],
    [/\b(?:option|number|answer|choice)\s*(?:4|four)\b/, 3],
  ];
  const place = PLACES.find(([re]) => re.test(said));
  if (place) return replies[place[1]] ?? null;
  // Her words and an answer's words overlap most.
  const want = new Set(tokens(said));
  let best: { r: R; score: number } | null = null;
  for (const r of replies) {
    const have = tokens(r.label);
    if (have.length === 0) continue;
    const hit = have.filter((w) => want.has(w)).length;
    const score = hit / have.length;
    if (hit > 0 && (!best || score > best.score)) best = { r, score };
  }
  if (best && best.score >= 0.6) return best.r;
  if (UNSURE.test(said)) return first(/not sure|don't know|leave it|later|not yet/) ?? null;
  if (YES.test(said))
    return (
      replies.find((r) => r.kind === "primary" && !/^no\b/i.test(r.label)) ??
      first(/^yes|^i (do|have|can|will)|^approve|^use|^that/) ??
      null
    );
  if (NO.test(said)) return first(/^no\b|not yet|^i (do not|don't|can't|cannot)/) ?? null;
  return best ? best.r : null;
}
