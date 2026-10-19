// DEMO: the self-serve start screen (D98). A visitor says who they are and picks a
// trade, then explores the sample member for that trade. Pattern: the demo-request
// form every SaaS uses, with one-tap tiles instead of a dropdown (TurboTax).

import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { MEMBER_KEY, MEMBERS } from "@/demo/member";
import { NICHES, saveVisitor, sendLead, type Visitor } from "@/demo/visitor";
import "@/demo/shell/start.css";

interface StartSearch {
  next?: string;
  member?: string;
}

export const Route = createFileRoute("/start")({
  head: () => ({ meta: [{ title: "See GovPreneurs with a business like yours" }] }),
  validateSearch: (s: Record<string, unknown>): StartSearch => ({
    next: typeof s.next === "string" ? s.next : undefined,
    member: typeof s.member === "string" ? s.member : undefined,
  }),
  component: StartScreen,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The page to open after the form: the one they asked for, without a member override. */
function landing(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/start") || next.startsWith("/admin"))
    return "/opportunities";
  const url = new URL(next, window.location.origin);
  url.searchParams.delete("member");
  const path = url.pathname + (url.search || "");
  return path === "/" ? "/opportunities" : path;
}

function StartScreen() {
  const { next, member } = Route.useSearch();
  // A link from Tim with ?member= arrives with that trade already picked.
  const fromLink = (member ?? new URL(next ?? "/", "http://x").searchParams.get("member")) || "";
  const [niche, setNiche] = useState(NICHES.some((n) => n.id === fromLink) ? fromLink : "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // a field only bots fill
  const [tried, setTried] = useState(false);

  const nameError = tried && !name.trim() ? "Add your name." : null;
  const emailError = tried && !EMAIL.test(email.trim()) ? "Add an email like name@company.com." : null;
  const nicheError = tried && !niche ? "Pick the closest one, or Other." : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || !EMAIL.test(email.trim()) || !niche) return;
    const choice = NICHES.find((n) => n.id === niche)!;
    const visitor: Visitor = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      niche: choice.id,
      member: choice.member,
      at: new Date().toISOString(),
    };
    saveVisitor(visitor);
    window.sessionStorage.setItem(MEMBER_KEY, choice.member);
    if (!website) sendLead(visitor);
    window.location.assign(landing(next));
  }

  return (
    <div className="start-page">
      <div className="brand-stripe" />
      <main className="start-card">
        <img src="/brand/govpreneurs-logo.svg" alt="GovPreneurs" className="start-logo" />
        <h1 className="t-display-lg start-title">See GovPreneurs with a business like yours</h1>
        <p className="t-body-lg start-lead">
          Pick your trade. You will explore a sample business that does the same work.
        </p>

        <form onSubmit={submit} noValidate className="start-form">
          <div className="start-field">
            <Input label="Your name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} />
            {nameError && <p className="start-error">{nameError}</p>}
          </div>
          <div className="start-field">
            <Input label="Work email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} />
            {emailError && <p className="start-error">{emailError}</p>}
          </div>
          <div className="start-field">
            <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="start-trap" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <fieldset className="start-niches" aria-invalid={!!nicheError}>
            <legend className="t-subheading">What does your business do?</legend>
            <div className="start-tiles">
              {NICHES.map((n) => (
                <label key={n.id} className={`start-tile${niche === n.id ? " is-on" : ""}`}>
                  <input type="radio" name="niche" value={n.id} checked={niche === n.id} onChange={() => setNiche(n.id)} />
                  <span>{n.label}</span>
                </label>
              ))}
            </div>
            {nicheError && <p className="start-error">{nicheError}</p>}
          </fieldset>

          <Button type="submit" variant="primary" className="start-go">
            Show me my demo
          </Button>
          <p className="t-caption start-note">
            We use these details only to follow up about GovPreneurs. Everything in the demo is sample data.
          </p>
        </form>
      </main>
    </div>
  );
}

// Every member the tiles can open must exist (member.ts).
if (import.meta.env?.DEV) {
  for (const n of NICHES) if (!MEMBERS.some((m) => m.id === n.member)) console.error(`[demo] start screen: no member ${n.member}`);
}
