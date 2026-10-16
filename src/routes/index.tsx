import { createFileRoute } from "@tanstack/react-router";
import { ScPage } from "../demo/sc/ScPage";
import { ScHomePage } from "../demo/sc/home/ScHomePage";

// DEMO: the Success Center home, the page the demo opens on. The page and its
// cards are lifted from the Success Center (src/sc/components/portal/*).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Success Center · GovPreneurs" }] }),
  component: SuccessCenterHome,
});

function SuccessCenterHome() {
  return (
    <ScPage legacy>
      <ScHomePage />
    </ScPage>
  );
}
