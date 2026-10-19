import { createFileRoute } from "@tanstack/react-router";
import { ScPage } from "../demo/sc/ScPage";
import { ScMentorsPage } from "../demo/sc/mentors/ScMentorsPage";

// DEMO: the Mentors page (the mentor directory). Lifted from the Success Center.
export const Route = createFileRoute("/find-a-mentor")({
  head: () => ({ meta: [{ title: "Mentors · GovPreneurs" }] }),
  component: MentorsDirectory,
});

function MentorsDirectory() {
  return (
    <ScPage legacy>
      <ScMentorsPage />
    </ScPage>
  );
}
