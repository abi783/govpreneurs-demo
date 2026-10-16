"use client";

import { useEffect, useMemo, useState } from "react";
// DEMO: the type only. lib/billing/walletUsage.ts holds Prisma code, so it does not come across.
import type { WalletUsageItem } from "@/demo/sc/home/types";
import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";
import { chargeDetail, type ChargeDetailLine, type ChargeReference } from "@sc/lib/billing/chargeDetail";
import {
  DEFAULT_USAGE_FILTER,
  filterUsage,
  usageTotal,
  USAGE_RANGE_OPTIONS,
  USAGE_TYPE_OPTIONS,
  type FilterOption,
  type UsageFilter,
} from "@sc/lib/billing/usageFilter";
import {
  COPIED_LABEL,
  COPY_FAILED_LABEL,
  COPY_LABEL,
  copyValueLabel,
  HIDE_CHARGE_DETAIL_LABEL,
  PAYMENT_METHOD_LABEL,
  RECEIPT_FAILED_LABEL,
  RECEIPT_LABEL,
  RECEIPT_PREPARING_LABEL,
  RECEIPT_UNAVAILABLE_LABEL,
  RECEIPT_UNAVAILABLE_NOTE,
  SHOW_CHARGE_DETAIL_LABEL,
  USAGE_NO_MATCH,
  USAGE_RANGE_FILTER_LABEL,
  USAGE_TYPE_FILTER_LABEL,
  VIEW_RECEIPT_LABEL,
} from "@sc/lib/walletCopy";
import { copyText } from "./copyText";

/** One wallet charge. Built by `loadWalletUsage` (lib/billing/walletUsage.ts), for the portal and Members 360. */
export type { WalletUsageItem };

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function monthKey(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** How long the copy button shows its result before it reads "Copy" again. */
const COPY_FEEDBACK_MS = 2000;

/** The id of a charge's detail region, which its toggle names in `aria-controls`. */
function detailRegionId(chargeId: string): string {
  return `wallet-charge-${chargeId}`;
}

const KIND_STYLE: Record<WalletUsageItem["kind"], { label: string; bg: string; color: string; border: string }> = {
  service: { label: "DFY Service", bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  booking: { label: "Booking", bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
};

/**
 * One charge's receipt. A member sees ready, preparing or unavailable; staff
 * also see failed, with the reason the invoice row stores (lib/billing/walletReceipt.ts).
 */
function ReceiptLine({ receipt }: { receipt: UsageReceipt }) {
  const base = "text-[0.68rem] mt-1";
  if (receipt.state === "ready") {
    const label = receipt.number ? `${RECEIPT_LABEL} ${receipt.number}` : RECEIPT_LABEL;
    return (
      <p className={`${base} text-gray-600`}>
        {label}
        {receipt.url && (
          <>
            {" · "}
            <a href={receipt.url} target="_blank" rel="noopener noreferrer"
              className="font-semibold underline" style={{ color: "#1d4ed8" }}>
              {VIEW_RECEIPT_LABEL}
            </a>
          </>
        )}
      </p>
    );
  }
  if (receipt.state === "failed") {
    return (
      <p className={`${base} font-semibold`} style={{ color: "#b91c1c" }}>
        {RECEIPT_LABEL}: {RECEIPT_FAILED_LABEL}{receipt.reason ? ` — ${receipt.reason}` : ""}
      </p>
    );
  }
  if (receipt.state === "preparing") {
    return (
      <p className={`${base} text-gray-500`}>
        {RECEIPT_LABEL}: {RECEIPT_PREPARING_LABEL}{receipt.reason ? ` — ${receipt.reason}` : ""}
      </p>
    );
  }
  return (
    <p className={`${base} text-gray-400`} title={RECEIPT_UNAVAILABLE_NOTE}>
      {RECEIPT_LABEL}: {RECEIPT_UNAVAILABLE_LABEL}
    </p>
  );
}

/** One labelled select of the filter bar. */
function FilterSelect<V extends string>({ label, value, options, onChange }: {
  label: string;
  value: V;
  options: readonly FilterOption<V>[];
  onChange: (value: V) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.7rem] text-gray-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        className="text-[0.75rem] text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

type CopyState = "idle" | "copied" | "failed";

const COPY_STATE_TEXT: Record<CopyState, string> = {
  idle: COPY_LABEL,
  copied: COPIED_LABEL,
  failed: COPY_FAILED_LABEL,
};

/** Copies one reference. The live region reads "Copied" to a screen reader. */
function CopyButton({ reference }: { reference: ChargeReference }) {
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => setState((await copyText(reference.value)) ? "copied" : "failed");

  return (
    <button type="button" onClick={copy} aria-label={copyValueLabel(reference.label)}
      className="text-[0.65rem] font-semibold underline text-gray-600">
      <span aria-live="polite">{COPY_STATE_TEXT[state]}</span>
    </button>
  );
}

/** A money line: a discount reads as a deduction, the paid line is bold. */
function DetailMoneyLine({ line, currency }: { line: ChargeDetailLine; currency: string }) {
  const amount = formatMoney(line.amount, currency);
  return (
    <div className={`flex justify-between gap-3 ${line.kind === "paid" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
      <dt>{line.label}</dt>
      <dd>{line.kind === "discount" ? `−${amount}` : amount}</dd>
    </div>
  );
}

/** The expanded detail of one charge. Every value comes from `chargeDetail`. */
function ChargeDetailPanel({ item, open }: { item: WalletUsageItem; open: boolean }) {
  const detail = chargeDetail(item);
  return (
    <div id={detailRegionId(item.id)} hidden={!open} className="mt-2 pt-2 border-t border-gray-200 text-[0.7rem]">
      <dl className="flex flex-col gap-0.5">
        {detail.lines.map((line) => <DetailMoneyLine key={`${line.kind}-${line.label}`} line={line} currency={detail.currency} />)}
        <div className="flex justify-between gap-3 text-gray-600 mt-1">
          <dt>{PAYMENT_METHOD_LABEL}</dt>
          <dd>{detail.paymentMethod}</dd>
        </div>
        {detail.references.map((ref) => (
          <div key={ref.label} className="flex justify-between items-center gap-3 text-gray-600">
            <dt>{ref.label}</dt>
            <dd className="flex items-center gap-2 min-w-0">
              <span className="font-mono truncate">{ref.value}</span>
              <CopyButton reference={ref} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One charge: a toggle row (title, date, amount, chevron), its receipt, and its detail. */
function UsageRow({ item, open, onToggle }: { item: WalletUsageItem; open: boolean; onToggle: () => void }) {
  const ks = KIND_STYLE[item.kind];
  const dateLabel = new Date(item.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const hasOutstanding = (item.outstanding ?? 0) > 0;
  return (
    <div className="p-3 rounded-lg"
      style={hasOutstanding
        ? { background: "#fff7ed", border: "1px solid #fed7aa" }
        : { background: "#f9fafb", border: "1px solid #f3f4f6" }}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={detailRegionId(item.id)}
        className="w-full flex items-start justify-between gap-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border"
              style={{ background: ks.bg, color: ks.color, borderColor: ks.border }}>
              {ks.label}
            </span>
            <span className="text-[0.82rem] font-semibold text-gray-900 truncate">{item.title}</span>
          </div>
          <p className="text-[0.68rem] text-gray-500 mt-1">
            {dateLabel}
            {item.note ? ` · ${item.note}` : ""}
            {item.pending ? " · pending" : ""}
          </p>
        </div>
        <span className="text-[0.85rem] font-bold flex-shrink-0" style={{ color: item.pending ? "#9ca3af" : "#b91c1c" }}>
          −{formatMoney(item.amount, item.currency)}
        </span>
        <span className="flex-shrink-0 text-gray-400" title={open ? HIDE_CHARGE_DETAIL_LABEL : SHOW_CHARGE_DETAIL_LABEL}>
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {item.receipt && <ReceiptLine receipt={item.receipt} />}
      {hasOutstanding && (
        <p className="text-[0.68rem] font-semibold mt-0.5" style={{ color: "#c2410c" }}>
          ⚠ {formatMoney(item.outstanding!, item.currency)} outstanding — deducted when you add funds
        </p>
      )}
      <ChargeDetailPanel item={item} open={open} />
    </div>
  );
}

/** The newest charge first, grouped by month. */
function groupByMonth(items: WalletUsageItem[]): { key: string; items: WalletUsageItem[] }[] {
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  const groups: { key: string; items: WalletUsageItem[] }[] = [];
  for (const item of sorted) {
    const key = monthKey(item.at);
    const existing = groups.find((x) => x.key === key);
    if (existing) existing.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

/** The history has no charge at all. */
function NoSpend() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">No wallet spend yet.</p>
    </div>
  );
}

/** The filtered charges by month, or a sentence when the filters show none. */
function UsageGroups({ groups, expanded, onToggle }: {
  groups: { key: string; items: WalletUsageItem[] }[];
  expanded: string | null;
  onToggle: (id: string) => void;
}) {
  if (groups.length === 0) return <p className="text-sm text-gray-500 text-center py-16">{USAGE_NO_MATCH}</p>;
  return groups.map((group) => (
    <div key={group.key} className="mb-6 last:mb-0">
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3">
        {group.key}
      </div>
      <div className="flex flex-col gap-2">
        {group.items.map((item) => (
          <UsageRow key={item.id} item={item} open={expanded === item.id} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
    </div>
  ));
}

interface Props {
  open: boolean;
  onClose: () => void;
  usage: WalletUsageItem[];
}

/**
 * The wallet usage history: filters, one row per charge, and each row's detail.
 * The header count and total are those of the charges that the filters show.
 */
export function WalletUsageDrawer({ open, onClose, usage }: Props) {
  const [filter, setFilter] = useState<UsageFilter>(DEFAULT_USAGE_FILTER);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { shown, groups, total } = useMemo(() => {
    const filtered = filterUsage(usage, filter, new Date());
    return { shown: filtered, groups: groupByMonth(filtered), total: usageTotal(filtered) };
  }, [usage, filter]);

  if (!open) return null;

  const currency = usage[0]?.currency ?? "USD";
  const toggle = (id: string) => setExpanded((current) => (current === id ? null : id));

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]"
        style={{ width: "min(600px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Wallet Usage</h2>
            <p className="text-[0.7rem] text-gray-500 mt-0.5">
              {usage.length === 0
                ? "No wallet spend yet"
                : `${shown.length} charge${shown.length === 1 ? "" : "s"} · ${formatMoney(total, currency)} total`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 flex-shrink-0" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {usage.length > 0 && (
          <div className="flex flex-wrap gap-4 px-6 py-3 border-b border-gray-100">
            <FilterSelect label={USAGE_TYPE_FILTER_LABEL} value={filter.type} options={USAGE_TYPE_OPTIONS}
              onChange={(type) => setFilter((f) => ({ ...f, type }))} />
            <FilterSelect label={USAGE_RANGE_FILTER_LABEL} value={filter.range} options={USAGE_RANGE_OPTIONS}
              onChange={(range) => setFilter((f) => ({ ...f, range }))} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {usage.length === 0 ? <NoSpend /> : (
            <UsageGroups groups={groups} expanded={expanded} onToggle={toggle} />
          )}
        </div>
      </div>

      {/* DEMO: styled-jsx is not installed, so this is a plain <style> tag. */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
