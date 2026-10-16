import { ShieldCheck, Sparkles } from "lucide-react";

export function IntroStrip() {
  return (
    <section className="kh-intro">
      <div className="kh-intro-main">
        <span className="kh-intro-icon" aria-hidden>
          <Sparkles size={16} />
        </span>
        <p className="kh-intro-copy">
          The more Hunter knows about your business, the sharper your matches.
          Connect a source or upload a file — Hunter reads it, learns your
          business, and fills in your profile for you.
        </p>
      </div>
      <div className="kh-intro-honesty">
        <ShieldCheck size={12} />
        We only use what you connect or upload — we never make up details about
        your business.
      </div>
    </section>
  );
}
