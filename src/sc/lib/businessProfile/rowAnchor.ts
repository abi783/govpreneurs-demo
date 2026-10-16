/**
 * The DOM id a record row carries, so something can link straight to it.
 *
 * ONE DEFINITION, because a link and its target agreeing is the whole feature.
 * "Answer the next one" used to point at a row's PART and stop there — the
 * comment on `ScoreCard` said outright that "this app has no in-page
 * focus/scroll-to mechanism for a single row (unlike the prototype's
 * `.focus()`)", so she was landed on a screen and left to find the question
 * herself. This is that mechanism, and it is a plain element id rather than a
 * ref or a scroll call: the browser already knows how to reach `#id`, it
 * survives a full page load and a shared link, and it needs no JavaScript to
 * work.
 *
 * Prefixed, because `fieldKey` values are short words like `email` and `phone`
 * that could collide with an id anything else on the page might choose.
 */
export function rowAnchorId(fieldKey: string): string {
  return `row-${fieldKey}`;
}
