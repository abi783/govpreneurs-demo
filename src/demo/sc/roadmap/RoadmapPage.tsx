// DEMO: the Roadmap page. Renders the lifted Roadmap v3 client (as members see it)
// with the sample payload. The payload is built again each time the page asks to
// refresh (router.refresh() in the Success Center code) or the wallet changes.

import { useEffect, useMemo, useReducer } from "react";
import { useSearchParams } from "next/navigation";
import { RoadmapV3Client } from "@sc/components/portal/roadmap-v3/RoadmapV3Client";
import { useDemoRefresh } from "@/demo/runtime/refresh";
import { subscribeDemoState } from "@/demo/runtime/store";
import { PERSONA } from "@/demo/story/persona";
import { ScPage } from "../ScPage";
import { DemoLinkBridge } from "../linkBridge";
import { buildRoadmapPayload } from "./payload";
import "../search";
import "./rm2-isolation.css";

export function RoadmapPage() {
  const refreshTick = useDemoRefresh();
  const [walletTick, bumpWallet] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeDemoState("wallet.entries", bumpWallet), []);

  // The ticks are not read inside, but a new tick means "ask again".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const payload = useMemo(() => buildRoadmapPayload(), [refreshTick, walletTick]);
  const step = useSearchParams().get("step") ?? undefined;

  return (
    <ScPage scope={["gpds", "gpds-rm3"]} className="w-full">
      <div className="gpds-stripe" />
      <div className="w-full px-4 sm:px-6 lg:px-12 pt-8 pb-20">
        <DemoLinkBridge>
          <RoadmapV3Client
            key={step ?? "none"}
            payload={payload}
            locationId={PERSONA.locationId}
            initialStep={step}
          />
        </DemoLinkBridge>
      </div>
    </ScPage>
  );
}
