// DEMO: keeps three kinds of link inside the app on the Roadmap and Tasks pages.
//
//   1. "Add money to your wallet" (a GoHighLevel billing page in production).
//      The click adds money to the sample wallet and says so.
//   2. Course and lesson links (hub.govpreneurs.com) and other outside sites.
//      The click shows a short notice. Nothing opens.
//   3. Everything else is left alone. The link guard (src/demo/nav/linkGuard.ts)
//      already sends GoHighLevel menu links to the matching demo page.
//
// It wraps the page in a `display: contents` box, so the layout does not change.

import type { MouseEvent, ReactNode } from "react";
import { demoRefresh } from "@/demo/runtime/refresh";
import { getWalletBalance, topUpWallet } from "@/demo/state/wallet";
import { showDemoNotice } from "@/demo/ui/notice";

const GHL_HOSTS = new Set(["app.govpreneurs.com", "scv2.govpreneurs.com"]);

function dollars(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

/** How much to add: the amount on the link, else the shortfall named nearby, else $500. */
function topUpAmount(link: HTMLAnchorElement): number {
  const num = (text: string | null | undefined, re: RegExp) => {
    const m = text ? re.exec(text) : null;
    return m ? Number(m[1]!.replace(/,/g, "")) : null;
  };
  const own = num(link.textContent, /\$([\d,]+(?:\.\d+)?)/);
  if (own) return Math.ceil(own);
  const scope = link.closest("[role=dialog], .fixed") ?? link.parentElement;
  const short = num(scope?.textContent, /\$([\d,]+(?:\.\d+)?)\s+more/i) ?? num(scope?.textContent, /recharge\s+\$([\d,]+(?:\.\d+)?)/i);
  if (short) return Math.max(100, Math.ceil(short / 50) * 50);
  return 500;
}

function handleClick(e: MouseEvent<HTMLElement>): void {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!link) return;
  const raw = link.getAttribute("href") ?? "";

  if (/company-billing/.test(raw)) {
    e.preventDefault();
    e.stopPropagation();
    const amount = topUpAmount(link);
    topUpWallet(amount);
    demoRefresh();
    showDemoNotice({
      title: "Money added to your wallet",
      message: `We added ${dollars(amount)} to your sample wallet. Your balance is now ${dollars(getWalletBalance())}. If you see "I added money — check again", press it. Otherwise close this window and open it again.`,
    });
    return;
  }

  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.origin === window.location.origin || GHL_HOSTS.has(url.hostname)) return;

  e.preventDefault();
  e.stopPropagation();
  const course = url.hostname === "hub.govpreneurs.com";
  showDemoNotice({
    title: course ? "GovPreneurs course library" : "Outside website",
    message: course
      ? "In the live product, this opens the lesson in your course library. The video is not part of this sample."
      : "In the live product, this opens another website. It is not part of this sample.",
  });
}

export function DemoLinkBridge({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "contents" }} onClickCapture={handleClick}>
      {children}
    </div>
  );
}
