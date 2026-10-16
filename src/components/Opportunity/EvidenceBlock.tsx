import * as Accordion from "@radix-ui/react-accordion";
import {
  Award,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Hash,
  Layers,
  Mail,
  MapPin,
  Phone,
  Tag,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { agencySource } from "../../lib/sourceLink";
import type { SolicitationDetail } from "../../lib/mock/grantAnalysis";
import type { SummarySection } from "../../lib/summarySections";
import type { KeyInfoRow } from "../../lib/keyInfo";
import { usePostHog } from "posthog-js/react";
import { API_BASE_URL } from "../../lib/api";
import { useGhlUser } from "../../lib/ghlUser";
import { JargonGloss } from "../Hunter/JargonGloss";

/** Icon per Key-information label (matches the labels from buildKeyInfo). */
const KEY_INFO_ICONS: Record<string, LucideIcon> = {
  "Opportunity type": Layers,
  "Notice type": FileText,
  "Set-aside": Award,
  "NAICS code": Hash,
  Classification: Tag,
  "Estimated Contract Value": CircleDollarSign,
  "Place of Performance": MapPin,
  Agency: Building2,
  "Solicitation #": Hash,
};

/** Key-info rows whose value should render as tabular/monospace figures. */
const NUM_LABELS = new Set(["Estimated Contract Value"]);

/** A single point of contact. Any field may be blank when the notice omits it. */
export type ContactInfo = { name?: string; role?: string; phone?: string; email?: string };

/** True when a contact carries at least a name or an email worth showing. */
function hasContact(c?: ContactInfo): c is ContactInfo {
  return !!c && (!!c.name?.trim() || !!c.email?.trim());
}

/** The Name / Phone / Email grid for one contact, with per-field null fallbacks. */
function ContactGrid({ contact }: { contact: ContactInfo }) {
  return (
    <dl className="key-info-grid key-info-grid--contact">
      <div className="key-info-row">
        <dt className="key-info-label">
          <User size={12} aria-hidden />
          <span className="key-info__label">Name</span>
        </dt>
        <dd className="key-info-value">
          {contact.name?.trim() || <span className="key-info-value--muted">Not listed on the notice</span>}
          {contact.role?.trim() && <span className="key-info-value__sub">{contact.role}</span>}
        </dd>
      </div>
      <div className="key-info-row">
        <dt className="key-info-label">
          <Phone size={12} aria-hidden />
          <span className="key-info__label">Phone</span>
        </dt>
        <dd className="key-info-value">
          {(() => {
            const phone = contact.phone?.trim();
            if (!phone) return <span className="key-info-value--muted">Not listed on the notice</span>;
            const digits = phone.replace(/[^\d]/g, "");
            // A placeholder-scrubbed value ("NA") has no dialable digits — show it as plain text.
            return digits ? (
              <a className="contact-link contact-link--mono" href={`tel:${digits}`}>
                {phone}
              </a>
            ) : (
              <span>{phone}</span>
            );
          })()}
        </dd>
      </div>
      <div className="key-info-row">
        <dt className="key-info-label">
          <Mail size={12} aria-hidden />
          <span className="key-info__label">Email</span>
        </dt>
        <dd className="key-info-value">
          {contact.email?.trim() ? (
            <a className="contact-link" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          ) : (
            <span className="key-info-value--muted">Not listed on the notice</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

export function EvidenceBlock({
  detail,
  summaryCaption,
  summarySections,
  keyInfo,
  officialTitle,
  contact,
  secondaryContact,
  openSections,
  onOpenChange,
  documents,
  oppKey,
  sourcePath,
}: {
  detail: SolicitationDetail;
  /**
   * One-line note on where the quick summary came from (the notice text, the
   * posting's own fields). Null for a document-backed summary, which is the
   * expected case and needs no note.
   */
  summaryCaption?: string | null;
  /** Real RAG-summary sections rendered as the "Detailed summary" accordion. */
  summarySections: SummarySection[];
  /** Real Key information rows built from the opportunity fields. */
  keyInfo: KeyInfoRow[];
  /** Real official solicitation title. */
  officialTitle: string;
  /**
   * Primary point of contact from the HigherGov notice. Any field may be blank
   * when the notice omits it; the Contact section is hidden entirely when there
   * is no primary name or email to show.
   */
  contact?: ContactInfo;
  /** Secondary point of contact, shown below the primary when the notice lists one. */
  secondaryContact?: ContactInfo;
  openSections: string[];
  onOpenChange: (values: string[]) => void;
  documents?: Array<{ fileName: string; downloadUrl: string; fileSize?: number }>;
  oppKey?: string;
  /** Canonical source URL for the opportunity (HigherGov `sourcePath`). */
  sourcePath?: string | null;
}) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const posthog = usePostHog();
  const { session } = useGhlUser();

  /** The agency posting we may show as "the source", or null when there is none. */
  const agency = agencySource(sourcePath);

  // A Grant reference pin whose source lives on-page (a §-clause, an FPDS id, a
  // profile field) dispatches `grant:jump-to-source`; we scroll this block into
  // view and briefly flash it so the reader lands on the underlying evidence.
  // (URL-backed pins open externally and never reach here — see EvidencePin.)
  const rootRef = useRef<HTMLElement>(null);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    function onJump() {
      const el = rootRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1200);
    }
    window.addEventListener("grant:jump-to-source", onJump);
    return () => window.removeEventListener("grant:jump-to-source", onJump);
  }, []);

  // Mirrors v1's DetailedSummary flow. Rating fires immediately; a "not helpful"
  // rating then opens an optional comment box. `oppKey` is the v2 equivalent of
  // v1's solicitation id.
  const rateSummary = (helpful: boolean) => {
    posthog?.capture("ai_summary_rated", {
      feature: "detailed_summary",
      solicitation_id: oppKey,
      rating: helpful ? "helpful" : "not_helpful",
      source: "web_widget",
      user_id: session?.userId,
      email: session?.email,
    });
    if (helpful) {
      setFeedback("up");
    } else {
      // Defer the final "down" state until the user submits or skips the comment.
      setShowComment(true);
    }
  };

  const submitComment = () => {
    const text = comment.trim();
    setFeedback("down");
    setShowComment(false);
    if (text) {
      posthog?.capture("ai_summary_feedback_comment", {
        feature: "detailed_summary",
        solicitation_id: oppKey,
        comment_text: text,
        linked_rating: "not_helpful",
        source: "web_widget",
        user_id: session?.userId,
        email: session?.email,
      });
    }
    setComment("");
  };

  const skipComment = () => {
    setFeedback("down");
    setShowComment(false);
    setComment("");
  };

  return (
    <section
      ref={rootRef}
      className={`evidence-block${flash ? " evidence-block--flash" : ""}`}
      aria-label="Full solicitation"
    >
      <div className="evidence-divider">
        <span className="evidence-divider__line" />
        <span className="evidence-divider__label">The details behind my read</span>
        <span className="evidence-divider__line" />
      </div>

      <div className="evidence-section">
        <h3 className="evidence-section__title">Quick summary</h3>
        <p className="evidence-section__body">{detail.quickSummary}</p>
        {summaryCaption && <p className="evidence-section__caption">{summaryCaption}</p>}
      </div>

      {(keyInfo.length > 0 || officialTitle) && (
      <div className="evidence-section">
        <h3 className="evidence-section__title">Key information</h3>
        <dl className="key-info-grid">
          {officialTitle && (
            <div className="key-info-row">
              <dt className="key-info-label">
                <FileText size={12} aria-hidden />
                <span className="key-info__label">Official title</span>
              </dt>
              <dd className="key-info-value key-info-value--mono">{officialTitle}</dd>
            </div>
          )}
          {keyInfo.map((kv) => {
            const Icon = KEY_INFO_ICONS[kv.label];
            const valueClass = NUM_LABELS.has(kv.label)
              ? "key-info-value key-info-value--num"
              : "key-info-value";
            return (
              <div key={kv.label} className="key-info-row">
                <dt className="key-info-label">
                  {Icon && <Icon size={12} aria-hidden />}
                  <span className="key-info__label">
                    {kv.label}
                    {kv.gloss && <JargonGloss gloss={kv.gloss} />}
                  </span>
                </dt>
                <dd className={valueClass}>{kv.value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
      )}

      {hasContact(contact) && (
      <div className="evidence-section">
        <h3 className="evidence-section__title">Contact</h3>
        {hasContact(secondaryContact) && <div className="contact-subhead">Primary contact</div>}
        <ContactGrid contact={contact} />
        {hasContact(secondaryContact) && (
          <>
            <div className="contact-subhead">Secondary contact</div>
            <ContactGrid contact={secondaryContact} />
          </>
        )}
      </div>
      )}

      {summarySections.length > 0 && (
      <div className="evidence-section">
        <div className="evidence-section__head">
          <h3 className="evidence-section__title">Detailed summary</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              onOpenChange(
                openSections.length === summarySections.length
                  ? []
                  : summarySections.map((s) => s.id),
              )
            }
          >
            {openSections.length === summarySections.length ? "Collapse all" : "Expand all"}
          </button>
        </div>
        <Accordion.Root
          type="multiple"
          className="evidence-accordion"
          value={openSections}
          onValueChange={onOpenChange}
        >
          {summarySections.map((s) => (
            <Accordion.Item key={s.id} value={s.id} id={s.id} className="evidence-accordion__item">
              <Accordion.Header>
                <Accordion.Trigger className="evidence-accordion__trigger">
                  <span>{s.title}</span>
                  <ChevronDown size={16} className="evidence-accordion__chev" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="evidence-accordion__content">
                <ul className="evidence-accordion__body evidence-accordion__bullets">
                  {s.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        {feedback === null && !showComment && (
          <div className="feedback-row">
            <span className="feedback-row__label">Was this summary helpful?</span>
            <button
              type="button"
              className="feedback-btn"
              onClick={() => rateSummary(true)}
            >
              <ThumbsUp size={14} /> Yes
            </button>
            <button
              type="button"
              className="feedback-btn"
              onClick={() => rateSummary(false)}
            >
              <ThumbsDown size={14} /> Not quite
            </button>
          </div>
        )}

        {showComment && (
          <div className="feedback-comment">
            <div className="feedback-comment__head">
              <ThumbsDown size={14} aria-hidden />
              <span className="feedback-comment__title">What could be improved?</span>
              <span className="feedback-comment__optional">(optional)</span>
            </div>
            <textarea
              className="feedback-comment__input"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Tell us how we can make this summary more helpful…"
              maxLength={500}
              aria-label="Summary feedback comment"
            />
            <div className="feedback-comment__actions">
              <span className="feedback-comment__count">{comment.length}/500</span>
              <div className="feedback-comment__buttons">
                <button type="button" className="btn btn-ghost btn-sm" onClick={skipComment}>
                  Skip
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={submitComment}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {feedback !== null && !showComment && (
          <div className="feedback-row">
            <span className="feedback-row__thanks">
              {feedback === "up"
                ? "Thanks — noted."
                : "Thanks, we'll work on improving this."}
            </span>
          </div>
        )}
      </div>
      )}

      {documents && documents.length > 0 && (
      <div className="evidence-section">
        <h3 className="evidence-section__title">Reference documents</h3>
        <ul className="ref-doc-list" role="list">
          {documents.map((d) => (
            <li key={d.fileName} className="ref-doc">
              <a
                href={`${API_BASE_URL}/opportunities/discover/v2/${oppKey}/documents?fileName=${encodeURIComponent(d.fileName)}`}
                target="_blank"
                rel="noreferrer"
                className="ref-doc__link"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}
              >
                <FileText size={14} />
                <span className="ref-doc__name">{d.fileName}</span>
                {d.fileSize && <span className="ref-doc__size">{(d.fileSize / 1024).toFixed(0)} KB</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
      )}

      {/* The issuing agency's posting — never HigherGov, our data vendor, and
          never a URL synthesised from an id. Absent posting ⇒ absent section. */}
      {agency && (
      <div className="evidence-section">
        <h3 className="evidence-section__title">Reference links</h3>
        <ul className="ref-link-list" role="list">
          <li>
            <a className="ref-link" href={agency.url} target="_blank" rel="noreferrer">
              <ExternalLink size={12} /> {agency.label}
            </a>
          </li>
        </ul>
      </div>
      )}
    </section>
  );
}
