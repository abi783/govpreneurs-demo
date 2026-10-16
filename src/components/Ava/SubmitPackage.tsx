// The package: every file, what it covers, what is in it, and what Ava
// measured on it. A file that is not complete says what it waits on — never a
// percentage, never a "compliant" badge (Ava-Build-Spec §10).
//
// "Complete" is earned, not assumed: nothing the file contains may be open.
// A section with a statement that has no proof, a promise not approved, a page
// count over the limit or a promise an addendum changed is open. The price is
// open until it is complete and approved at the total the buyer evaluates. An
// upload or a form is open while its ask is.

import { CircleAlert, CircleCheck } from "lucide-react";
import { exactChecks, findingState, reviewerChecks } from "../../lib/ava/checks";
import {
  askResolved,
  claimView,
  commitmentStatus,
  sectionClaims,
  sectionPages,
} from "../../lib/ava/derive";
import { approvalTotal, missingPriceAsks, usd0, priceOf } from "../../lib/ava/price";
import type { PackageFile } from "../../lib/ava/types";
import type { AvaContext } from "./useAva";

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

interface FileFacts {
  contents: string[];
  measured: { text: string; ok: boolean }[];
  waitingOn: string[];
}

function factsFor(ctx: AvaContext, pf: PackageFile): FileFacts {
  const { bid, s } = ctx;
  const askTitle = (askId: string) =>
    bid.asks.find((a) => a.id === askId)?.title ?? "an answer from you";
  const contents: string[] = [];
  const measured: { text: string; ok: boolean }[] = [];
  const waitingOn: string[] = [];

  // Exact findings that point at a section and are still open.
  const exact = exactChecks(bid, s).findings.filter((f) => findingState(bid, s, f) === "open");
  const reviewer = bid.sections.length > 0 ? reviewerChecks(bid) : [];

  let forms = 0;
  let toSign = 0;
  let notary = 0;
  let avaWrote = 0;
  let memberFiles = 0;

  for (const c of pf.contains) {
    if (c.kind === "section") {
      const sec = bid.sections.find((x) => x.id === c.id);
      if (!sec) continue;
      avaWrote++;
      contents.push(sec.title);
      const pages = sectionPages(s, sec);
      if (sec.pageLimit) {
        measured.push({
          text: `${sec.title} · ${pages} of ${sec.pageLimit} ${plural(sec.pageLimit, "page", "pages")}`,
          ok: pages <= sec.pageLimit,
        });
        if (pages > sec.pageLimit && exact.some((f) => f.id === `pages:${sec.id}`)) {
          waitingOn.push(
            `${sec.title} cut to ${sec.pageLimit} ${plural(sec.pageLimit, "page", "pages")}`,
          );
        }
      } else {
        measured.push({
          text: `${sec.title} · ${pages} ${plural(pages, "page", "pages")}`,
          ok: true,
        });
      }
      const claims = sectionClaims(s, sec);
      const gaps = claims.filter((cl) => claimView(bid, s, cl).tag === "unsupported").length;
      if (gaps > 0) {
        waitingOn.push(
          `proof for ${gaps} ${plural(gaps, "statement", "statements")} in ${sec.title}`,
        );
      }
      const promiseIds = new Set(
        claims.flatMap((cl) => (cl.commitmentId ? [cl.commitmentId] : [])),
      );
      const unapproved = bid.commitments.filter((cm) => {
        if (!promiseIds.has(cm.id)) return false;
        const st = commitmentStatus(s, cm);
        return st === "needs-approval" || st === "reopened";
      }).length;
      if (unapproved > 0) {
        waitingOn.push(
          `your approval of ${unapproved} ${plural(unapproved, "promise", "promises")} in ${sec.title}`,
        );
      }
      const stale = exact.filter(
        (f) =>
          f.id.startsWith("stale-promise:") && promiseIds.has(f.id.slice("stale-promise:".length)),
      ).length;
      if (stale > 0) waitingOn.push(`the new wording of a changed promise in ${sec.title}`);
      const review = reviewer.filter(
        (f) => f.sectionId === sec.id && findingState(bid, s, f) === "open",
      );
      if (review.length > 0 && review.some((f) => f.severity !== "minor")) {
        waitingOn.push(`a reviewer finding on ${sec.title}`);
      }
    }
    if (c.kind === "form") {
      const form = bid.forms.find((f) => f.id === c.id);
      // A form for an addendum that has not arrived is not in the package yet.
      if (!form) continue;
      forms++;
      if (form.handling.includes("ava-fills")) avaWrote++;
      else memberFiles++;
      if (form.handling.includes("you-sign")) toSign++;
      if (form.handling.includes("notary")) notary++;
      contents.push(form.name);
      if (form.askId && !askResolved(bid, s, form.askId)) waitingOn.push(askTitle(form.askId));
    }
    if (c.kind === "price") {
      avaWrote++;
      contents.push(priceOf(bid).sheetName);
      const total = approvalTotal(bid, s);
      const across = bid.price?.periods ? "across every period" : "for year one";
      if (total !== null) {
        measured.push({ text: `Totals recalculated: ${usd0(total)} ${across}`, ok: true });
        const approved = !!s.priceApproval && Math.abs(s.priceApproval.total - total) <= 0.005;
        if (!approved) {
          waitingOn.push(
            s.priceApproval ? "your approval of the new price" : "your approval of the price",
          );
        }
      } else {
        const missing = missingPriceAsks(bid, s);
        if (missing[0]) waitingOn.push(askTitle(missing[0]));
        if (missing.length > 1) {
          waitingOn.push(
            `${missing.length - 1} more price ${plural(missing.length - 1, "answer", "answers")}`,
          );
        }
        if (missing.length === 0) waitingOn.push("a price Ava can total");
      }
    }
    if (c.kind === "upload") {
      memberFiles++;
      const ask = bid.asks.find((a) => a.id === c.id);
      contents.push(ask?.title ?? "A file you supply");
      if (!askResolved(bid, s, c.id)) {
        waitingOn.push(askTitle(c.id));
      } else {
        const name = s.answers[c.id]?.fileName;
        measured.push({ text: name ? `Your file: ${name}` : "From your answer", ok: true });
      }
    }
  }

  if (forms > 0) {
    const parts = [`${forms} ${plural(forms, "form", "forms")}`];
    if (toSign > 0) parts.push(`${toSign} ${plural(toSign, "needs", "need")} your signature`);
    if (notary > 0) parts.push(`${notary} ${plural(notary, "needs", "need")} a notary`);
    measured.push({ text: parts.join(" · "), ok: true });
  }
  // Ava can vouch only for pages it wrote, and only once nothing in the file
  // is open. A file the member brings back is theirs to check.
  const unique = [...new Set(waitingOn)];
  if (unique.length === 0 && avaWrote > 0) {
    measured.push({
      text:
        memberFiles > 0
          ? "No comments or tracked changes in the pages Ava wrote"
          : "No comments or tracked changes",
      ok: true,
    });
  }

  return { contents, measured, waitingOn: unique };
}

/** "the price" → "The price": each wait reads as its own item. */
function cap(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function PackageTable({ ctx }: { ctx: AvaContext }) {
  const { bid } = ctx;
  const files = bid.submission.files;
  const inAFile = new Set(
    files.flatMap((pf) => pf.contains.filter((c) => c.kind === "form").map((c) => c.id)),
  );
  const extraForms = bid.forms.filter((f) => !inAFile.has(f.id));
  const paper = bid.submission.method === "paper";

  return (
    <>
      <div className="ava-s-tablewrap">
        <table className="ava-table ava-s-table">
          <caption className="ava-s-caption">
            {paper ? "The sets you hand in" : "The files you submit"}, and what Ava measured on each
          </caption>
          <thead>
            <tr>
              <th scope="col">{paper ? "Set" : "File"}</th>
              <th scope="col">Covers</th>
              <th scope="col">What is in it</th>
              <th scope="col">Measured</th>
            </tr>
          </thead>
          <tbody>
            {files.map((pf) => {
              const f = factsFor(ctx, pf);
              return (
                <tr key={pf.id} className={f.waitingOn.length > 0 ? "is-waiting" : undefined}>
                  <td>
                    {/* A file name is a code-like string; a paper set is described in words. */}
                    <span className={`ava-s-fname${paper ? "" : " mono"}`}>{pf.name}</span>
                    {f.waitingOn.length > 0 ? (
                      <span className="ava-s-wait">
                        <CircleAlert size={13} strokeWidth={2} aria-hidden />
                        <span>
                          Not complete. Waiting on:{" "}
                          {f.waitingOn.map((w, i) => (
                            <span key={`${i}:${w}`} className="ava-s-wait__item">
                              {i > 0 ? " · " : ""}
                              {i === 0 ? cap(w) : w}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : (
                      <span className="ava-s-complete">
                        <CircleCheck size={13} strokeWidth={2} aria-hidden /> Complete
                      </span>
                    )}
                  </td>
                  <td className="ava-s-covers mono">{pf.covers}</td>
                  <td>
                    <ul className="ava-s-cells">
                      {f.contents.map((c, i) => (
                        <li key={`${i}:${c}`}>{c}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <ul className="ava-s-cells">
                      {f.measured.map((m, i) => (
                        <li key={`${i}:${m.text}`} className={m.ok ? undefined : "is-over"}>
                          {m.ok ? null : <CircleAlert size={12} strokeWidth={2} aria-hidden />}
                          {m.text}
                          {m.ok ? null : " · over the limit"}
                        </li>
                      ))}
                      {f.measured.length === 0 ? (
                        <li className="ava-s-none">Nothing to measure yet</li>
                      ) : null}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {extraForms.length > 0 ? (
        <p className="ava-s-extra">
          Also in the package: {extraForms.map((f) => f.name).join(", ")}.
        </p>
      ) : null}
    </>
  );
}
