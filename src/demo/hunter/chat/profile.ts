// DEMO (Hunter chat): "I also do ..." and "update my ...".
//
// Hunter never writes to the profile on his own. He proposes one change per fact,
// and the member taps Save or Cancel on the card. A saved change stays in the
// demo store, so it survives a reload.

import type { ProfileUpdateCard, ProfileUpdatePayload } from "../../../lib/hunterChat";
import { money } from "../../../lib/money";
import { PERSONA } from "../../story/persona";
import { naicsDescription } from "../naicsData";
import { readSession, updateSession } from "./session";
import type { Turn } from "./types";

interface Proposal {
  label: string;
  line: { label: string | null; text: string };
  value: string;
}

function readProposal(text: string, norm: string): Proposal | null {
  const radius = norm.match(/\b(\d{2,3})\s*miles?\b/);
  if (radius && /\b(radius|service area|travel|drive|deliver|serve|area)\b/.test(norm)) {
    return {
      label: "Service area",
      line: { label: "Now", text: `Up to ${radius[1]} miles from ${PERSONA.hqCity}` },
      value: `Up to ${radius[1]} miles from ${PERSONA.hqCity}`,
    };
  }
  const meals = norm.match(/\b(\d[\d.]*)\s*(k)?\s*meals?\s*(a|per|each|every)?\s*day\b/);
  if (meals) {
    const n = Math.round(Number(meals[1]) * (meals[2] ? 1000 : 1));
    return {
      label: "Daily meal capacity",
      line: { label: "Now", text: `${n.toLocaleString("en-US")} meals a day from one kitchen` },
      value: `${n.toLocaleString("en-US")} meals a day`,
    };
  }
  const team = norm.match(/\b(\d{1,3})\s*(employees|staff|people|cooks|workers|team members)\b/);
  if (team) {
    return {
      label: "Team size",
      line: { label: "Now", text: `${team[1]} ${team[2]}` },
      value: `${team[1]} ${team[2]}`,
    };
  }
  const code = norm.match(/\b(\d{6})\b/);
  if (code) {
    const name = naicsDescription(code[1]);
    return {
      label: "NAICS codes",
      line: { label: "Add", text: name ? `${code[1]} — ${name}` : code[1] },
      value: name ? `${code[1]} — ${name}` : code[1],
    };
  }
  const revenue = norm.match(/\b(?:revenue|sales)\b.*?\$?(\d+(?:\.\d+)?)\s*(k|m|million)?/);
  if (revenue) {
    const n = Number(revenue[1]) * (revenue[2] === "k" ? 1_000 : revenue[2] ? 1_000_000 : 1);
    return {
      label: "Annual revenue",
      line: { label: "Now", text: money(n) },
      value: money(n),
    };
  }
  const offer = text.match(/\b(?:i|we)\s+(?:also\s+|now\s+)?(?:offer|do|provide|cook|serve|make|run|have|can)\s+(.{4,80})$/i);
  if (offer) {
    const what = offer[1].replace(/[.?!]+$/, "").trim();
    return {
      label: "Capabilities",
      line: { label: "Add", text: what },
      value: what,
    };
  }
  const add = text.match(/\badd\s+(.{4,80}?)\s+(?:to|in)\s+my\s+(?:profile|capabilit\w+|business)/i);
  if (add) {
    return { label: "Capabilities", line: { label: "Add", text: add[1] }, value: add[1] };
  }
  return null;
}

/** A proposed change that waits for Save, or null when the words propose none. */
export function proposeProfileChange(text: string, norm: string): Turn | null {
  const says =
    /\b(i|we)\s+(also |now |just |recently )?(offer|do|provide|cook|serve|make|run|have|can|hired|added|got)\b/.test(norm) ||
    /\b(update|change|set|correct|fix)\s+my\b|\badd\b.*\bto my (profile|capabilit\w+|business)\b|\bmy (radius|capacity|team|staff|employees|revenue|service area)\b.*\b(is|are|now)\b/.test(norm);
  if (!says) return null;
  // A question about the feed ("can I see ...") is not a fact.
  if (/\?\s*$/.test(text.trim()) && !/\bcan now\b|\bnow\b/.test(norm)) return null;
  const proposal = readProposal(text, norm);
  if (!proposal) return null;

  const id = `prop-${readSession().turns + 1}-${Math.random().toString(36).slice(2, 6)}`;
  updateSession((s) => ({
    ...s,
    proposals: { ...s.proposals, [id]: { label: proposal.label, heard: text.trim(), value: proposal.value } },
  }));
  const card: ProfileUpdateCard = {
    proposalId: id,
    label: proposal.label,
    lines: [proposal.line],
    heard: text.trim(),
    choice: null,
  };
  const data: ProfileUpdatePayload = { cards: [card], notes: [] };
  return {
    reply: `Thank you. I can add that to your My Business page under ${proposal.label}. Nothing changes until you tap Save on the card. I rank matches with what is on that page, so a true fact helps.`,
    kind: "profile_update",
    data,
    chips: ["What do you know about my business?", "What's out there for me right now?", "How do you pick my matches?"],
  };
}

/** Save on a proposal. Returns the label of the saved row, or null for an unknown id. */
export function confirmProposal(id: string): string | null {
  const proposal = readSession().proposals[id];
  if (!proposal) return null;
  updateSession((s) => {
    const { [id]: _gone, ...rest } = s.proposals;
    void _gone;
    return { ...s, proposals: rest, savedChanges: [...s.savedChanges, { label: proposal.label, value: proposal.value }] };
  });
  return proposal.label;
}

/** Cancel on a proposal. Nothing is saved. */
export function rejectProposal(id: string): void {
  updateSession((s) => {
    const { [id]: _gone, ...rest } = s.proposals;
    void _gone;
    return { ...s, proposals: rest };
  });
}
