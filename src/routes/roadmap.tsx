import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="Roadmap" owner="the Roadmap page agent" />,
});
