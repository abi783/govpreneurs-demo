// Outreach logs for buyer / partner intro drafts. In-memory, resets on reload.

export interface OutreachLogEntry {
  buyerId?: string;
  officerId?: string;
  partnerId?: string;
  kind: "saved" | "lead";
  at: string;
}

const buyerLog: OutreachLogEntry[] = [];
const partnerLog: OutreachLogEntry[] = [];

export function logBuyerOutreach(entry: OutreachLogEntry): void {
  buyerLog.push(entry);
}

export function logPartnerOutreach(entry: OutreachLogEntry): void {
  partnerLog.push(entry);
}

export function listBuyerOutreach(): OutreachLogEntry[] {
  return [...buyerLog];
}

export function listPartnerOutreach(): OutreachLogEntry[] {
  return [...partnerLog];
}
