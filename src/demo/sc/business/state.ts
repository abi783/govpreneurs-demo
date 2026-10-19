// DEMO: where the My Business record lives while the demo runs.
//
// One value in the demo store (`myBusiness.state`). It is written after every save,
// upload, confirm and send, so it survives a reload. "Reset demo" clears it and the
// seed (`seed.ts`) builds it again.

import { readDemoState, updateDemoState, writeDemoState } from "../../runtime/store";
import { buildSeed } from "./seed";
import type { DemoBusinessState } from "./types";

export const BUSINESS_STATE_KEY = "myBusiness.state";

export function readBusiness(): DemoBusinessState {
  return readDemoState<DemoBusinessState>(BUSINESS_STATE_KEY, buildSeed);
}

export function writeBusiness(next: DemoBusinessState): void {
  writeDemoState(BUSINESS_STATE_KEY, next);
}

export function updateBusiness(updater: (prev: DemoBusinessState) => DemoBusinessState): DemoBusinessState {
  return updateDemoState<DemoBusinessState>(BUSINESS_STATE_KEY, buildSeed, updater);
}
