// DEMO: the in-app chat panel that replaces Intercom.
// `openDemoChat()` opens it. `ScChatHost` (mounted by the shell) draws it.

export const DEMO_CHAT_EVENT = "gp-demo:chat";

export function openDemoChat(opts?: { message?: string }): void {
  window.dispatchEvent(new CustomEvent(DEMO_CHAT_EVENT, { detail: opts ?? {} }));
}
