// An award now opens in a window over the Awards list (AwardDetailDialog), not on a
// page of its own. Old links, bookmarks and the /opportunities/awarded redirect still
// point here, so this route sends them to the list with that award open.

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/awards/$awardId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/awards", search: { award: params.awardId } as never, replace: true });
  },
});
