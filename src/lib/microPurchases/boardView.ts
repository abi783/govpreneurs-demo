// Small orders — the three tabs on the board.
//
// "For you" and "All orders" are two walks of the server's feed: `for-you` is
// the orders under her allied NAICS set (her profile codes and their allied
// codes), which holds every order the matching engine can have scored for her,
// narrowed to the orders she may bid by acquisition code (see `feed.ts`).
// "Saved" is not a walk. It is her saved list from the workspace, read by id,
// so an order she saved stays on it after it closes.

/** The tab she is on. */
export type BoardView = "for-you" | "all" | "saved";

/** The tabs the server walks. "Saved" is read by id instead. */
export type FeedView = Exclude<BoardView, "saved">;

/** The tab the board opens on. */
export const DEFAULT_BOARD_VIEW: BoardView = "for-you";

export const BOARD_VIEWS: readonly { id: BoardView; label: string }[] = [
  { id: "for-you", label: "Orders for you" },
  { id: "all", label: "All orders" },
  { id: "saved", label: "Saved" },
];

export function isBoardView(value: unknown): value is BoardView {
  return BOARD_VIEWS.some((v) => v.id === value);
}

/**
 * The tab the board shows when she arrives.
 *
 * If the address names a tab, she chose it, and the board shows it. If not,
 * and the For you walk answered with no matches, the board opens on All
 * orders. A failed walk (`null`) keeps For you, so its "did not load" state
 * shows. A walk that has not answered (`undefined`) keeps For you too.
 */
export function landingView({
  explicitView,
  forYou,
}: {
  explicitView: BoardView | undefined;
  forYou: { total: number } | null | undefined;
}): BoardView {
  if (explicitView != null) return explicitView;
  return forYou != null && forYou.total === 0 ? "all" : DEFAULT_BOARD_VIEW;
}
