import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/my-business/$part")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  component: MyBusinessPart,
});

function MyBusinessPart() {
  const { part } = Route.useParams();
  return <DemoPlaceholder title={`My Business: ${part}`} owner="the My Business page agent" />;
}
