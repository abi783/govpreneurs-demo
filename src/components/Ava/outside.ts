// DEMO: a link that would leave the app. The live product opens the buyer's
// website, SAM.gov or the mail program here. A sales call must never leave the
// app, so the demo says what the link does and stays on the page.

import { showDemoNotice } from "../../demo/ui/notice";

export function openOutside(what: string): void {
  showDemoNotice({
    title: what,
    message:
      "In the live product this opens that website in a new tab. This sample stays inside the demo.",
  });
}
