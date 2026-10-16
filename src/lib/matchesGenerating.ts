/**
 * Whether to show the full-screen "matches generating" state in the feed.
 * True only for a user who is indexing AND has no matches yet (first-time
 * generation). A returning user mid-re-match keeps a non-empty list (matches
 * upsert in place), so `count > 0` keeps their ranked list on screen.
 */
export function shouldShowMatchesGenerating(args: {
  profileIndexing: boolean;
  loading: boolean;
  count: number;
}): boolean {
  return args.profileIndexing && !args.loading && args.count === 0;
}
