import { searchTerms } from "../../lib/search/match";

/**
 * The line above search results: "6 awards for "catering"", and, when the word list
 * widened the search, what it also covered — the way Google says "Including results for".
 */
export function SearchHead({
  count,
  total,
  more = false,
  noun,
  nouns,
  q,
}: {
  count: number;
  /** The exact number of matches in all pages. When it is set, the head shows it. */
  total?: number;
  /** True when there are more pages and no total, so the count is a floor. */
  more?: boolean;
  noun: string;
  nouns: string;
  q: string;
}) {
  const { including } = searchTerms(q);
  const n = total ?? count;
  return (
    <div className="search-head">
      <h2 className="search-head__count">
        {n}
        {total === undefined && more ? "+" : ""} {n === 1 ? noun : nouns} for <q>{q.trim()}</q>
      </h2>
      {including.length > 0 && (
        <p className="search-head__incl">Including {including.join(", ").toLowerCase()}</p>
      )}
    </div>
  );
}
