// DEMO: show a small in-app message instead of leaving the app.
//
//   showDemoNotice({ title: "Billing", message: "This opens the billing page in the live product." });
//
// The host component `DemoNoticeHost` (mounted by the shell) listens for the
// event and shows a dialog. Never use `window.alert` or `window.confirm`.

export interface DemoNotice {
  title: string;
  message: string;
}

export const DEMO_NOTICE_EVENT = "gp-demo:notice";

export function showDemoNotice(notice: DemoNotice): void {
  window.dispatchEvent(new CustomEvent<DemoNotice>(DEMO_NOTICE_EVENT, { detail: notice }));
}
