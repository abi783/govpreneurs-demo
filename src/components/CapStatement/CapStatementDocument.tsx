import type { CapStatementDraft } from "../../lib/capStatementBuilder";

// A clean, federal-credible one-page layout.
// Single column for prose sections, two-column for competencies / differentiators.
export function CapStatementDocument({ draft }: { draft: CapStatementDraft }) {
  const findSection = (id: string) =>
    draft.sections.find((s) => s.id === id);

  const overview = findSection("overview");
  const competencies = findSection("competencies");
  const differentiators = findSection("differentiators");
  const past = findSection("past_performance");
  const certs = findSection("certifications");
  const contact = findSection("contact");

  return (
    <article className="cs-doc">
      <header className="cs-doc-head">
        <div className="cs-doc-logo" aria-hidden>
          WC
        </div>
        <div className="cs-doc-title-wrap">
          <h1 className="cs-doc-title">{draft.companyName}</h1>
          <div className="cs-doc-tag">{draft.tagline}</div>
        </div>
      </header>

      <div className="cs-doc-codes">
        <span>
          <strong>UEI</strong> {draft.codes.uei ?? "—"}
        </span>
        <span>
          <strong>CAGE</strong> {draft.codes.cage ?? "—"}
        </span>
        <span>
          <strong>NAICS</strong> {draft.codes.primaryNaics}
        </span>
        <span>
          <strong>SAM</strong> {draft.codes.samStatus}
          {draft.codes.samVerifiedAt ? ` · verified ${draft.codes.samVerifiedAt}` : ""}
        </span>
      </div>

      {overview && (
        <section className="cs-doc-sect">
          <h2>{overview.title}</h2>
          <p>{overview.body}</p>
        </section>
      )}

      <div className="cs-doc-two">
        {competencies && (
          <section className="cs-doc-sect">
            <h2>{competencies.title}</h2>
            <BodyList body={competencies.body} />
          </section>
        )}
        {differentiators && (
          <section className="cs-doc-sect">
            <h2>{differentiators.title}</h2>
            <BodyList body={differentiators.body} />
          </section>
        )}
      </div>

      {past && (
        <section className="cs-doc-sect">
          <h2>{past.title}</h2>
          <BodyList body={past.body} />
        </section>
      )}

      {certs && (
        <section className="cs-doc-sect">
          <h2>{certs.title}</h2>
          <BodyList body={certs.body} />
        </section>
      )}

      {contact && (
        <footer className="cs-doc-foot">
          <div className="cs-doc-foot-label">{contact.title}</div>
          <BodyList body={contact.body} />
        </footer>
      )}
    </article>
  );
}

function BodyList({ body }: { body: string }) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const allBullets = lines.length > 1 && lines.every((l) => /^[•\-*]/.test(l));
  if (allBullets) {
    return (
      <ul className="cs-doc-ul">
        {lines.map((l, i) => (
          <li key={i}>{l.replace(/^[•\-*]\s*/, "")}</li>
        ))}
      </ul>
    );
  }
  if (lines.length > 1) {
    return (
      <ul className="cs-doc-ul cs-doc-ul--plain">
        {lines.map((l, i) => (
          <li key={i}>{l.replace(/^[•\-*]\s*/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p>{body}</p>;
}
