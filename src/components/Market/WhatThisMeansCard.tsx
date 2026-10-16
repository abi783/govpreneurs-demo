import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

export function WhatThisMeansCard({
  title = "What this means for you",
  children,
  caveat,
}: {
  title?: string;
  children: ReactNode;
  caveat?: ReactNode;
}) {
  return (
    <section className="market-what" aria-label={title}>
      <header className="market-what-head">
        <Lightbulb size={14} aria-hidden />
        <span>{title}</span>
      </header>
      <div className="market-what-body">{children}</div>
      {caveat ? <div className="market-what-caveat">{caveat}</div> : null}
    </section>
  );
}
