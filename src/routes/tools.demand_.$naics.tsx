import { createFileRoute } from "@tanstack/react-router";
import { toolsHead } from "@/lib/tools/toolsHead";
import { DemandPage } from "./tools.demand";

// Client-side shim for /tools/demand/<code> — the server (tools-host.ts)
// renders the real SEO title/meta/JSON-LD for crawlers; this generic title
// is just a reasonable placeholder before the stat fetch resolves.
export const Route = createFileRoute("/tools/demand_/$naics")({
  head: ({ params }) => toolsHead(`Federal demand for NAICS ${params.naics}`, ""),
  component: DemandByNaicsPage,
});

function DemandByNaicsPage() {
  const { naics } = Route.useParams();
  return <DemandPage key={naics} naicsFromPath={naics} />;
}
