import type { ReactNode } from "react";

export interface ChatMsgAction {
  label: string;
  variant: "primary" | "ghost";
  onClick: () => void;
}

export interface ChatMsg {
  id: string;
  role: "agent" | "user";
  text: string;
  stamp?: string;
  actions?: ChatMsgAction[];
}

export interface CompanionApi {
  appendUserMessage: (text: string) => void;
  appendAgentMessage: (text: string, opts?: { actions?: ChatMsgAction[]; stamp?: string }) => void;
  setTyping: (on: boolean) => void;
}

export type CompanionHandle = CompanionApi;

export interface CompanionSuggestion {
  id: string;
  label: string;
  onSelect: (api: CompanionApi) => void;
}

export interface AgentIdentity {
  id: "hunter" | "grant" | "ava";
  name: string;
  role: string;
  accentVar: string;
  avatar: ReactNode;
  seedMessage: string;
  placeholder: string;
  footerNote: string;
  suggestions: CompanionSuggestion[];
  onFreeMessage?: (text: string, api: CompanionApi) => void;
}
