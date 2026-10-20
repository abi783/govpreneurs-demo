// DEMO: presenter sign-in (D98). The right password turns on presenter mode in this
// browser: the presenter panel shows and the start screen is skipped. The password
// is checked in the browser, so it hides demo controls; it does not protect data.

import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { presenterPasswordMatches, setPresenter } from "@/demo/visitor";
import "@/demo/shell/start.css";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Presenter mode · GovPreneurs demo" }] }),
  component: AdminScreen,
});

function AdminScreen() {
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!presenterPasswordMatches(password)) {
      setWrong(true);
      return;
    }
    setPresenter(true);
    window.location.assign("/");
  }

  return (
    <div className="start-page">
      <div className="brand-stripe" />
      <main className="start-card start-card--narrow">
        <img src="/brand/govpreneurs-logo.svg" alt="GovPreneurs" className="start-logo" />
        <h1 className="t-heading start-title">Presenter mode</h1>
        <p className="t-body start-lead">
          Shows the presenter panel in this browser: jump to any part of the story and switch the sample business.
        </p>
        <form onSubmit={submit} className="start-form">
          <div className="start-field">
            <Input
              label="Presenter password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setWrong(false);
              }}
              aria-invalid={wrong}
            />
            {wrong && <p className="start-error">That password is not right.</p>}
          </div>
          <Button type="submit" variant="primary" className="start-go">
            Open presenter mode
          </Button>
        </form>
      </main>
    </div>
  );
}
