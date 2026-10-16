// "My partners list" — saved outreach list. In-memory, resets on reload.

import { bus } from "../eventBus";

export type OutreachStatus = "not_contacted" | "intro_sent" | "in_talks";

export interface PartnersListEntry {
  companyId: string;
  companyName: string;
  status: OutreachStatus;
  addedAt: string;
  updatedAt: string;
}

let list: PartnersListEntry[] = [];

function commit(next: PartnersListEntry[]) {
  list = next;
  bus.publish("partnersList");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("partners-list:change"));
  }
}

export function listPartnersList(): PartnersListEntry[] {
  return list;
}

export function isOnPartnersList(companyId: string): boolean {
  return list.some((e) => e.companyId === companyId);
}

export function addToPartnersList(companyId: string, companyName: string): void {
  if (list.some((e) => e.companyId === companyId)) return;
  const now = new Date().toISOString();
  commit([
    { companyId, companyName, status: "not_contacted", addedAt: now, updatedAt: now },
    ...list,
  ]);
}

export function removeFromPartnersList(companyId: string): void {
  commit(list.filter((e) => e.companyId !== companyId));
}

export function setPartnerStatus(companyId: string, status: OutreachStatus): void {
  const idx = list.findIndex((e) => e.companyId === companyId);
  if (idx === -1) return;
  const next = [...list];
  next[idx] = { ...next[idx], status, updatedAt: new Date().toISOString() };
  commit(next);
}

export const STATUS_LABEL: Record<OutreachStatus, string> = {
  not_contacted: "Not contacted",
  intro_sent: "Intro sent",
  in_talks: "In talks",
};
