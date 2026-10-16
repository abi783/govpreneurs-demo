// DEMO: the React hook that gives the home page its data.
//
// The production page is a server component: `router.refresh()` makes the server
// send new props. Here `buildHomeData()` is the server. The hook builds the data
// again when `router.refresh()` runs (`useDemoRefresh`) and when any store that
// the home reads changes (a booking, a charge, a ticked step).

import { useEffect, useMemo, useReducer } from "react";
import { subscribeDemoState } from "@/demo/runtime/store";
import { useDemoRefresh } from "@/demo/runtime/refresh";
import { buildHomeData, type HomeData } from "./homeData";
import { HOME_STATE_KEYS } from "./store";

export function useHomeData(): HomeData {
  const tick = useDemoRefresh();
  const [version, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const offs = HOME_STATE_KEYS.map((key) => subscribeDemoState(key, bump));
    return () => offs.forEach((off) => off());
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildHomeData(), [tick, version]);
}
