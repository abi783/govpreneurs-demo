// Ava — drafting agent identity. Used as identity tokens (name + accent +
// avatar) by the cap-statement builder.

import { AgentAvatar } from "../AgentAvatar";

export const AVA_IDENTITY = {
  id: "ava" as const,
  name: "Ava",
  role: "your drafting agent",
  accentVar: "--ava-accent",
  intro:
    "I draft the documents government buyers ask you for — capability statements, cover letters, past-performance summaries. I write from what's in your business knowledge, never from thin air.",
};

export function AvaAvatar({ size = 24 }: { size?: 20 | 24 | 28 | 32 | 40 }) {
  return <AgentAvatar agent="ava" size={size} />;
}
