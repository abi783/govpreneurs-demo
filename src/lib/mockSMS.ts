// Mock SMS outbox — in-memory. Resets on reload.

import { useSyncExternalStore } from "react";
import { bus } from "./eventBus";

export interface SMSMessage {
  id: string;
  to: string;
  body: string;
  sentAt: string;
  relatedItemId?: string;
}

export const SMS_CHANGED_EVENT = "mock-sms-changed";
export const MOCK_PHONE = "(910) ***-4421";

let outbox: SMSMessage[] = [];

export function sendMockSMS(body: string, relatedItemId?: string): SMSMessage {
  const msg: SMSMessage = {
    id: `sms_${Date.now()}`,
    to: MOCK_PHONE,
    body,
    sentAt: new Date().toISOString(),
    relatedItemId,
  };
  outbox = [...outbox, msg];
  bus.publish("mockSMS");
  return msg;
}

function recompute(): SMSMessage[] {
  return [...outbox].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
}

let cachedSorted: SMSMessage[] = recompute();
let cachedFrom: SMSMessage[] = outbox;

export function listSMS(): SMSMessage[] {
  if (cachedFrom !== outbox) {
    cachedFrom = outbox;
    cachedSorted = recompute();
  }
  return cachedSorted;
}

function snapshot(): SMSMessage[] {
  return listSMS();
}

export function useSMSOutbox(): SMSMessage[] {
  return useSyncExternalStore(
    (cb) => bus.subscribe("mockSMS", cb),
    snapshot,
    snapshot,
  );
}

export function clearSMS() {
  outbox = [];
  bus.publish("mockSMS");
}
