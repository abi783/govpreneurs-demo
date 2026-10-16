// The views a step workspace can send the member to, and the props every
// view receives. The route maps each view onto the three pages.

import type { AvaContext } from "./useAva";

export type AvaView =
  | "brief"
  | "list"
  | "writing"
  | "price"
  | "forms"
  | "check"
  | "addenda"
  | "submit"
  | "requirements";

export interface Focus {
  /** Open this ask in the list. */
  ask?: string;
  /** Scroll to this draft section. */
  section?: string;
}

export interface ViewProps {
  ctx: AvaContext;
  /** Move to another view, optionally focused on an ask or a section. */
  go: (view: AvaView, focus?: Focus) => void;
  focus: Focus;
}
