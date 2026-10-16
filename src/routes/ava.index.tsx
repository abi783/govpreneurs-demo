import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/ava/")({
  head: () => ({ meta: [{ title: "Ava · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="Ava" owner="the Ava page agent" />,
});
