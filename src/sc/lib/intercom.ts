// DEMO SHIM. Do not overwrite this file when you lift Success Center code.
// The real function asks the GoHighLevel parent frame to open Intercom. The demo
// opens its own small chat panel with a canned reply (src/demo/sc/ScChatHost.tsx).

import { openDemoChat } from "../../demo/sc/chat";

export function openIntercomChat(): void {
  openDemoChat();
}
