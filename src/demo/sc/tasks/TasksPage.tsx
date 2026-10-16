// DEMO: the Tasks page. Renders the lifted TasksLedgerClient (as members see it)
// with the sample payload. The payload is built again each time the page asks to
// refresh (router.refresh() in the Success Center code), for example after the
// visitor books the quarterly targeting call.

import { useMemo } from "react";
import { TasksLedgerClient } from "@sc/components/portal/tasks/TasksLedgerClient";
import { useDemoRefresh } from "@/demo/runtime/refresh";
import { PERSONA } from "@/demo/story/persona";
import { ScPage } from "../ScPage";
import { DemoLinkBridge } from "../linkBridge";
import { buildTasksPayload } from "./payload";
import "../search";

export function TasksPage() {
  const refreshTick = useDemoRefresh();
  const payload = useMemo(() => buildTasksPayload(), [refreshTick]);

  return (
    <ScPage className="w-full">
      <div className="gpds-stripe" />
      <div className="w-full px-6 lg:px-12 pt-10 pb-20">
        <DemoLinkBridge>
          <TasksLedgerClient initial={payload} locationId={PERSONA.locationId} iframeOnly={false} />
        </DemoLinkBridge>
      </div>
    </ScPage>
  );
}
