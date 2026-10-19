// Before Ava starts: Grant's No Bid (8.1), a bid Ava does not build (7.6),
// and the simpler reply to a sources sought (5.8). Nothing is written until
// she decides.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { GrantAttr } from "./GrantPrimitives";
import { getGrantSummary } from "../../demo/ava/grantSummary";
import type { AvaOpportunity as Opportunity } from "../../demo/ava/opportunity";
import { REPLY_SIMPLE_KEY } from "../../lib/ava/scope";
import { dueDay } from "../../lib/ava/derive";
import { fullDate } from "../../lib/ava/dates";
import { ava } from "../../lib/ava/store";
import type { AvaBid } from "../../lib/ava/types";
import { AvaCard, RiskDialog } from "./primitives";
import { useAvaControls } from "./AvaControls";
import { EmailDraftDialog } from "./EmailDraft";
import { PERSONA } from "../../demo/story/persona";

/** The label a bid carries when the member builds it against Grant's No Bid. */
export const AGAINST_GRANT_LABEL = "Going ahead against Grant's No Bid";

export function StartView({ opp, bid }: { opp: Opportunity; bid: AvaBid | null }) {
  const grant = getGrantSummary(opp);
  const [against, setAgainst] = useState(false);
  // Grant said No Bid (ava-two-phase.html 8.1): only his card. No list and no
  // bid until she decides. Finding another bid is the main action; building
  // anyway is a deliberate choice with a reason, and the label stays on it.
  return (
    <div className="ava-page">
      <div className="ava-head__top">
        <Link
          to="/opportunities/$noticeId"
          params={{ noticeId: opp.noticeId }}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} aria-hidden /> Grant&apos;s read of this bid
        </Link>
      </div>
      <section className="ai-surface ava-start__nobid" aria-labelledby="ava-nobid-h">
        <GrantAttr subtitle="the bid call" />
        <h1 className="ava-start__h" id="ava-nobid-h">
          Grant says No Bid
        </h1>
        <p className="ava-start__opp">
          {bid?.officialTitle ?? opp.title} · {bid?.buyer ?? opp.agency}
        </p>
        <p className="ava-says">{grant.rationale}</p>
        <div className="ava-actions ava-start__nobidgo">
          <Link to="/opportunities" className="btn btn-primary">
            Find another bid
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => setAgainst(true)}>
            I decided to bid anyway
          </button>
        </div>
        <p className="ava-muted">
          If you bid anyway, Ava lists it in How to send it. The buyer never sees it.
        </p>
        <RiskDialog
          open={against}
          onOpenChange={setAgainst}
          what="Build this bid even though Grant says No Bid."
          severity="critical"
          label={AGAINST_GRANT_LABEL}
          onConfirm={(reason) => {
            ava.start(opp.noticeId);
            ava.acceptRisk(opp.noticeId, "grant-no-bid", {
              reason,
              severity: "critical",
              label: AGAINST_GRANT_LABEL,
            });
          }}
        />
      </section>
    </div>
  );
}

/** Ava says no, and why, before any work — never after (concept §11 "Out"). */
export function OutOfScopeView({
  opp,
  title,
  reason,
}: {
  opp: Opportunity;
  title: string;
  reason: string;
}) {
  return (
    <div className="ava-page">
      <div className="ava-head__top">
        <Link
          to="/opportunities/$noticeId"
          params={{ noticeId: opp.noticeId }}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} aria-hidden /> Grant&apos;s read of this notice
        </Link>
      </div>
      <section className="ava-card ava-start__out">
        <div className="ava-start__who">
          <AgentAvatar agent="ava" size={40} />
        </div>
        <h1 className="ava-empty__h">{title}</h1>
        <p className="ava-empty__p">{reason}</p>
        <p className="ava-empty__p">{opp.title}</p>
        <div className="ava-actions">
          <Link to="/opportunities" className="btn btn-secondary btn-sm">
            Find a bid on Opportunities
          </Link>
        </div>
      </section>
    </div>
  );
}

/** A reply to a sources sought, the simpler first version
 *  (docs/ava/build-progression.md, item 7, option A): no drafting. Two steps
 *  instead of a dead end: her capability statement, then an email to the
 *  buyer with the buyer's own addresses, subject line and due time. */
export function ReplyNextStepView({ opp, bid }: { opp: Opportunity; bid: AvaBid }) {
  const sub = bid.submission;
  const to = [...new Set(sub.account.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [])];
  const subject = sub.markings[0]?.match(/"([^"]+)"/)?.[1] ?? null;
  const [mailOpen, setMailOpen] = useState(false);
  const controls = useAvaControls();
  return (
    <div className="ava-page">
      <div className="ava-head__top">
        <Link
          to="/opportunities/$noticeId"
          params={{ noticeId: opp.noticeId }}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} aria-hidden /> Grant&apos;s read of this notice
        </Link>
      </div>
      <section className="ava-card ava-start__out">
        <div className="ava-start__who">
          <AgentAvatar agent="ava" size={40} />
        </div>
        <h1 className="ava-empty__h">The buyer is asking who can do this work</h1>
        <p className="ava-empty__p">
          This is not a bid. There is no price and nothing to sign. You reply by email.
        </p>
        <p className="ava-empty__p">{bid.officialTitle}</p>
      </section>

      <AvaCard label="1. Your capability statement">
        <p className="ava-muted">
          One page about your company: what you do, your past jobs and your registration numbers.
        </p>
        <div className="ava-actions">
          <Link to="/cap-statement/builder" className="btn btn-primary btn-sm">
            Open your capability statement
          </Link>
        </div>
      </AvaCard>

      <AvaCard label="2. Email it to the buyer">
        <dl className="ava-p3b-sheetnotes">
          <div>
            <dt>Send to</dt>
            <dd className="mono">{to.join(", ")}</dd>
          </div>
          {subject ? (
            <div>
              <dt>Subject line</dt>
              <dd>{subject}</dd>
            </div>
          ) : null}
          <div>
            <dt>Due</dt>
            <dd>
              {fullDate(dueDay(bid))}, {bid.deadline.time} {bid.deadline.zone ?? ""}
            </dd>
          </div>
        </dl>
        {bid.forms.length > 0 ? (
          <p className="ava-muted">
            The buyer also asks you to complete {bid.forms.map((f) => f.name).join(" and ")}. It is
            in the buyer&apos;s files. Attach it to the same email.
          </p>
        ) : null}
        <div className="ava-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMailOpen(true)}
          >
            <Mail size={14} aria-hidden /> See the email to write
          </button>
        </div>
      </AvaCard>
      <EmailDraftDialog
        open={mailOpen}
        onOpenChange={setMailOpen}
        to={to.join(", ")}
        subject={subject ?? `${bid.bidNumber} – ${PERSONA.businessName}`}
        body={[
          "Hello,",
          `Here is the reply from ${PERSONA.businessName} to ${bid.officialTitle} (${bid.bidNumber}).`,
          "Please confirm that you received it.",
          `Thank you,\n${PERSONA.ownerName}\n${PERSONA.phone} · ${PERSONA.email}`,
        ].join("\n\n")}
      />

      {controls ? (
        <aside className="ava-demo" aria-label="Prototype controls">
          <span className="ava-demo__label">Prototype controls</span>
          <span className="ava-demo__note">
            This is the simpler first version: a next step, with no drafting.
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => ava.unfix(opp.noticeId, REPLY_SIMPLE_KEY)}
          >
            Show Ava&apos;s drafted reply
          </button>
        </aside>
      ) : null}
    </div>
  );
}
