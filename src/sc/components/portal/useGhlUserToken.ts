// DEMO SHIM. Do not overwrite this file when you lift Success Center code.
// The real hook asks the GoHighLevel parent frame for a user token. The demo has no
// parent frame, and the demo API accepts any token.

import { DEMO_TOKEN } from "../../../demo/session";

export function useGhlUserToken(): string | null {
  return DEMO_TOKEN;
}
