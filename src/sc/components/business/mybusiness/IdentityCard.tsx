/**
 * IdentityCard — who this record is about, above the figures that score it.
 *
 * The source design opens the record with the business itself: its mark, its
 * name as the heading, what it does and where, and the address a mentor would
 * reply to. The page had gone straight from "My business" to three counters,
 * which reads as a dashboard about a company rather than as the company's own
 * record.
 *
 * IT INVENTS NOTHING. Every line is a stored answer or the uploaded logo, and
 * a line she has not answered is not rendered — no placeholder name, no "not
 * provided", no sample town. On a day-zero record this is the mark and the
 * heading and nothing else, which is honest and still opens the page.
 *
 * THE NAME IS THE PAGE'S HEADING. The shell used to carry "My business" above
 * this card, so the first two things on the screen said the same thing. The
 * rail says which page this is; the business says who it is about.
 *
 * THE META LINE IS DERIVED, NOT THE ADDRESS. "Event catering · Fayetteville"
 * answers "what is this business, and where" in five words; the postal address
 * answers "where do I post things", which is a question for a row further down
 * the record.
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import type { RecordFieldPayload } from "@sc/lib/businessProfile/payload";
import { valueLines } from "@sc/lib/businessProfile/rowContract";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

/** The stored row for a catalog id, or undefined when she has not answered it. */
function rowFor(
  fields: readonly RecordFieldPayload[],
  catalogId: string,
): RecordFieldPayload | undefined {
  return fields.find((f) => f.catalogId === catalogId);
}

/**
 * A row's value as one readable string, or null when there is nothing to say.
 *
 * `valueLines`, NOT `describeFieldValue`: the payload's rows already hold an
 * `MbValue`, and `describeFieldValue` takes the RAW stored shape — handed a
 * converted value it reported every text row empty and rendered an address as
 * "Not sure".
 *
 * `unknown` and `none` return null. "She told us she does not know" is an
 * honest answer on its own row, but it is not a name, a place or an address,
 * and printing it as this card's heading would state it as a fact about the
 * business.
 */
function textOf(row: RecordFieldPayload | undefined): string | null {
  if (!row) return null;
  if (row.value.kind === "unknown" || row.value.kind === "none") return null;
  const text = valueLines(row.fieldKey, row.value)
    .map((part) => part.text)
    .join(" · ")
    .trim();
  return text === "" || text === "—" ? null : text;
}

/**
 * The line under the name: her first service and the town she works out of.
 *
 * Both come from answers she has already given, and either half may be missing
 * — with neither there is no line at all rather than a stray separator.
 */
function derivedLine(fields: readonly RecordFieldPayload[]): string | null {
  const service = firstItem(rowFor(fields, "coreCapabilities"));
  const town = basedIn(rowFor(fields, "geographicPreference"));
  const parts = [service, town].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** The first thing in a list answer, for a row that holds several. */
function firstItem(row: RecordFieldPayload | undefined): string | null {
  if (!row || row.value.kind !== "list") return null;
  const text = row.value.items[0]?.text?.trim();
  return text ? text : null;
}

/** The town an area answer is worked out of. */
function basedIn(row: RecordFieldPayload | undefined): string | null {
  if (!row || row.value.kind !== "area") return null;
  const text = row.value.area.basedIn?.trim();
  return text ? text : null;
}

export interface IdentityCardProps {
  /** Where the logo is changed — the part screen that holds the two images. */
  editHref: string;
  /** The page-level action, which rides on this card because this card is the
   *  top of the screen. Passed in so the card imports no route of its own. */
  action?: ReactNode;
}

export function IdentityCard({ editHref, action }: IdentityCardProps): ReactElement | null {
  const { payload } = useRecord();
  const fields = payload.fields;

  // The registered name leads — it is the one a buyer and a mentor both look
  // for. Her trading name is the fallback, for a record that has one and no
  // filing yet.
  const name = textOf(rowFor(fields, "legalName")) ?? textOf(rowFor(fields, "dbaName"));
  const email = textOf(rowFor(fields, "primaryContactEmail"));
  const where = derivedLine(fields);
  const logo = payload.media.logoUrl;

  // Nothing stored and no logo: the shell's own heading is already saying
  // "My business", so an empty card would be a border around a blank.
  if (!name && !email && !where && !logo) return null;

  return (
    <section className="mb-id" aria-label="Your business">
      <span className="mb-id__mark">
        {/* `unoptimized`, like `ImageUploadCard`: the logo is a member upload on
            an external origin, not a build-time asset. */}
        {logo ? (
          <Image className="mb-id__logo" src={logo} alt="" width={80} height={80} unoptimized />
        ) : (
          <span className="mb-id__glyph" aria-hidden>
            <BuildingIcon />
          </span>
        )}
        {/* The change is offered ON the thing it changes, not only in the card
            further down the screen. It goes to the upload rather than opening a
            file picker here, so there is one place a logo is replaced. */}
        <Link className="mb-id__edit" href={editHref} aria-label="Change your business logo">
          <PencilIcon />
        </Link>
      </span>

      <div className="mb-id__text">
        {name ? <h1 className="mb-id__name">{name}</h1> : null}
        {where ? <p className="mb-id__meta">{where}</p> : null}
        {email ? <p className="mb-id__mail">{email}</p> : null}
      </div>

      {/* The one hatch rides here rather than in a page header: it is what she
          can do to all of this, and this card is what "all of this" is. */}
      {action ? <div className="mb-id__acts">{action}</div> : null}
    </section>
  );
}

/** The pencil on the mark. */
function PencilIcon(): ReactElement {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The stand-in mark, for a record with no logo uploaded yet. One inline SVG,
 *  the drawing convention the rest of this folder follows. */
function BuildingIcon(): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M3 21h18M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 10h4a1 1 0 0 1 1 1v10M8 8h3M8 12h3M8 16h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
