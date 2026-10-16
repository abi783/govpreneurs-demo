import { useState } from "react";
import { Sparkles } from "lucide-react";

export function ColdStartWelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section className="cs-welcome" role="note">
      <Sparkles size={24} className="cs-welcome-icon" aria-hidden />
      <div className="cs-welcome-body">
        <h2 className="cs-welcome-title">Welcome to your Business Profile</h2>
        <p className="cs-welcome-text">
          This is what Hunter, Grant, and Ava know about you. The more complete
          it is, the better they can serve you. Let's start with positioning —
          three quick questions that change everything.
        </p>
        <button
          type="button"
          className="cs-welcome-cta"
          onClick={() => setDismissed(true)}
        >
          Walk me through it
        </button>
      </div>
    </section>
  );
}
