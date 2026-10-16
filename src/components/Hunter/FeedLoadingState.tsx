/**
 * Centered loading indicator for the opportunities list area: our own CSS
 * spinner with a label beneath it (e.g. "Loading" on first load, "Searching"
 * while a filter/search refetch is in flight). Fills the list column's vertical
 * space so the spinner sits in the relative center of the feed rather than
 * hugging the top. Accessible via role="status".
 */
export function FeedLoadingState({ label }: { label: string }) {
  return (
    <div className="feed-loading" role="status" aria-label={label}>
      <span className="feed-loading__spinner" aria-hidden />
      <span className="feed-loading__label">{label}</span>
    </div>
  );
}
