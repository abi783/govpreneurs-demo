import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/find-a-mentor")({
  head: () => ({ meta: [{ title: "Mentors · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="Mentors" owner="the Mentors page agent" />,
});
