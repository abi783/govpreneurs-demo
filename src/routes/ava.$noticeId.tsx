import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/ava/$noticeId")({
  head: () => ({ meta: [{ title: "Ava · GovPreneurs" }] }),
  component: AvaNotice,
});

function AvaNotice() {
  const { noticeId } = Route.useParams();
  return <DemoPlaceholder title={`Ava: ${noticeId}`} owner="the Ava page agent" />;
}
