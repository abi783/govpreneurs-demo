"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Booking-modal timezone state: starts on the browser zone, then a
 * one-shot fetch of the center's main-contact timezone overrides it —
 * unless the customer has already picked one manually.
 */
export function useBookingTimezone(locationId: string): [string, (tz: string) => void] {
  const [tz, setTzState] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/portal/${locationId}/contact-timezone`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || touched.current) return;
        if (typeof d?.timezone === "string" && d.timezone) setTzState(d.timezone);
      })
      .catch(() => { /* keep browser zone */ });
    return () => { cancelled = true; };
  }, [locationId]);

  const setTz = (next: string) => {
    touched.current = true;
    setTzState(next);
  };
  return [tz, setTz];
}

interface Props {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

/** Compact IANA timezone picker for the booking modals. */
export function TimezoneSelect({ value, onChange, className }: Props) {
  const zones = useMemo(() => {
    let list: string[] = [];
    try {
      list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    } catch { /* older runtimes */ }
    if (list.length === 0) list = [Intl.DateTimeFormat().resolvedOptions().timeZone];
    if (value && !list.includes(value)) list = [value, ...list];
    return list;
  }, [value]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? "text-xs text-gray-600 bg-white px-1.5 py-1 rounded-md max-w-[210px]"}
      style={{ border: "1px solid #e5e7eb" }}
      aria-label="Timezone"
    >
      {zones.map((z) => (
        <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
