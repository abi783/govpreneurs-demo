// "Can you get this part?" — the guard against the one mistake she cannot undo.
//
// Every other gate on this surface asks whether she is ALLOWED to bid. Not one
// asked whether she can SUPPLY the thing — and a default on a DLA contract can
// be a termination for cause that attaches to her seller number permanently. A
// first-timer who wins an order she cannot fill is worse off than one who never
// bid.
//
// The question splits in two, and only one half is ours:
//   Is this gettable by someone who is not the manufacturer?  → data answers it
//   Can SHE get it, at a price that wins?                     → only she knows
//
// We answer the first and ASK the second. The tap gates nothing — a hard block
// would be a lie, because we have no idea where she buys.
//
// There is deliberately NO supplier directory here. The API gives us a list of
// companies that have WON this stock number from DLA; it tells us nothing about
// where anyone can buy it. Presenting past winners as places to shop was a
// straight category error, and it lived on this panel as "Call one and ask
// their price". Who has won before is market research and now sits in its own
// block beside what DLA paid, where it belongs.
// It records an `attested` fact, one of the nine states we already have, and it
// is the training signal that makes tomorrow's list better.
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, HelpCircle, X, Package, AlertTriangle } from "lucide-react";
import type { MicroOrder } from "../../lib/microPurchases/order";
import { approvedSourceNote, isCommercial, resellerRule } from "../../lib/microPurchases/relevance";
import { attest, attestationFor, getMicroState } from "../../lib/state/microPurchases";
import { fetchSupplierNames } from "../../lib/microPurchases/api";

export function SourcingPanel({
  order: o,
  now,
}: {
  order: MicroOrder;
  /** The served corpus's day. The reseller rule needs the order's value to say
   *  which side of the threshold it falls on, and that value is aged against
   *  this day. See `corpusNow()`. */
  now: Date | null;
}) {
  const answer = attestationFor(o.nsn);
  const supplied = getMicroState().suppliedNsns.includes(o.nsn);
  // Which part number was just copied — not a boolean, because there can be
  // more than one row and only the one she tapped should say "Copied".
  const [copied, setCopied] = useState<string | null>(null);

  /**
   * Company names for this order's CAGE codes, fetched AFTER the table renders.
   *
   * They are not on the order because the two have different costs: the order
   * arrives with the board's corpus, which already answers in 9-21 seconds,
   * while a name can reach HigherGov at ~310 ms a code. One order carries two
   * to seven codes, so this is bounded — and the table shows the codes
   * immediately and swaps in names when they land, rather than holding the
   * whole panel behind a courtesy.
   *
   * A failure leaves the map empty, which renders exactly what rendered before
   * names existed.
   */
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    void fetchSupplierNames(o.id).then((n) => {
      if (live) setNames(n);
    });
    return () => {
      live = false;
    };
  }, [o.id]);

  /**
   * One row per approved source: who DLA has cleared, and the number they call
   * the part.
   *
   * `approvedSources` is the structured pair and is preferred. Where the record
   * carries only the raw `partNumbers` string it becomes a single row with no
   * supplier — that string is NOT split, because its delimiter is unverified
   * and a wrong split invents a part number that does not exist.
   *
   * Deduped on the pair rather than on the number: two suppliers approved for
   * one part are two real rows, and collapsing them would delete a supplier.
   */
  const rows = useMemo(() => {
    if (o.approvedSources.length === 0) {
      return o.partNumbers ? [{ cage: null, partNumber: o.partNumbers, name: undefined }] : [];
    }
    const seen = new Set<string>();
    const out: {
      cage: string | null;
      partNumber: string;
      name: string | undefined;
    }[] = [];
    for (const source of o.approvedSources) {
      if (!source.partNumber) continue;
      const cage = source.cage ? source.cage.trim().toUpperCase() : null;
      const key = `${cage ?? ""}-${source.partNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        cage,
        partNumber: source.partNumber,
        name: cage ? names[cage] : undefined,
      });
    }
    return out;
  }, [o.approvedSources, o.partNumbers, names]);

  return (
    <section className="mp-source">
      <h2 className="mp-h2">Can you get this item?</h2>

      {supplied ? (
        <p className="mp-source__known">
          <Check size={16} aria-hidden className="mp-ic-ok" />
          You have supplied this exact item before.
        </p>
      ) : isCommercial(o) ? (
        <p className="mp-source__known">
          <Package size={16} aria-hidden />
          This one is sold openly. It is a commercial item, so you do not have to be the maker.
        </p>
      ) : (
        <p className="mp-source__known">
          <Package size={16} aria-hidden />
          Check where you can get it, and at what price, before you quote.
        </p>
      )}

      {/* THE TERMINATION WARNING IS NOT HERE ANY MORE. Word for word the same
          sentence now heads the order page in its own card, level with Hunter's
          price, which is where the decision it governs is actually made — the
          choice to quote at all. Repeating it inside "Can you get this part?"
          made it the second-loudest thing in a card about sourcing, and two
          copies of one sentence on one page is how they drift. */}

      {(o.partNumbers || o.approvedSources.length > 0) && (
        <div className="mp-source__group">
          <span className="mp-source__label">Who DLA has approved</span>
          {/* THE COUNT, AND IT RENDERS BESIDE EVERY VERDICT (owner, 2026-09-16).
              The table under it lists the companies and the member has to count
              the rows to learn how many there are — and on an order whose codes
              carry no ruling, the number of firms DLA has already cleared is the
              one actionable fact on the page. It is the government's record, the
              same for everyone, so no permission verdict gates it.
              It NAMES NO MEMBER. No profile on this surface holds her CAGE code,
              so "you are one of them" and "you are not" are both unsupported.
              `relevance.ts` owns the words; a raw `rows.length` here would count
              the part-number fallback row as a company. */}
          {approvedSourceNote(o) != null && (
            <p className="mp-source__count">{approvedSourceNote(o)}</p>
          )}
          {/* A TABLE, because these are rows of one shape and the eye reads down
              a column. It was a list of part numbers with the supplier thrown
              away, so the answer to "who sells this" was a number she had to
              take somewhere else to find out.
              ONE RAW STRING, deliberately not split. `nsn.part_numbers` is a
              single string whose delimiter is still unverified — splitting on a
              guess can turn one part number containing a comma or a slash into
              two, and she would search for a number that does not exist.
              Structured pairs exist on `approvedSources[]`, so they are
              preferred and the raw string is the fallback. */}
          <table className="mp-source__table">
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col">CAGE</th>
                {/* The supplier's own part code. "ID" because the column beside
                    it is also an identifier and the two must be told apart at a
                    glance, not read to be told apart. */}
                <th scope="col">ID</th>
                {/* Named for a screen reader and blank on screen: the word
                    "Copy" over a column of 44px controls reads as a column of
                    buttons rather than a column of parts. */}
                <th scope="col">
                  <span className="mp-sr-only">Copy the ID</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.cage ?? ""}-${row.partNumber}`}>
                  <td>
                    {/* No name resolved is not an apology: some CAGE codes name
                        a standardisation body rather than a company — 81349 is
                        a Defense code — so there is nothing to find. The CAGE
                        beside it is what she would search with either way. */}
                    {row.name ? (
                      <span className="mp-source__co">{row.name}</span>
                    ) : (
                      /* A DASH, not "Not named". Half of these resolve to
                         nothing — measured 23 of 46 across twelve live orders —
                         and five rows reading "Not named" report a broken
                         column rather than a missing courtesy. The CAGE beside
                         it carries the identity either way, and some of these
                         are not companies at all. */
                      <span
                        className="mp-source__co mp-source__co--none"
                        aria-label="No name found"
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    {row.cage ? (
                      <span className="mp-source__cage mono">{row.cage}</span>
                    ) : (
                      <span className="mp-source__co--none">—</span>
                    )}
                  </td>
                  <td>
                    <b className="mono">{row.partNumber}</b>
                  </td>
                  <td className="mp-source__copycell">
                    <button
                      type="button"
                      className="mp-copy"
                      aria-label={
                        copied === row.partNumber
                          ? `Copied ${row.partNumber}`
                          : `Copy ${row.partNumber}`
                      }
                      onClick={async () => {
                        // Awaited and caught: "Copied" must confirm a copy that
                        // actually happened, and writeText rejects where the
                        // page is not permitted. Silence beats a false
                        // confirmation.
                        try {
                          await navigator.clipboard.writeText(row.partNumber);
                          setCopied(row.partNumber);
                          window.setTimeout(() => setCopied(null), 1600);
                        } catch {
                          /* say nothing */
                        }
                      }}
                    >
                      {copied === row.partNumber ? (
                        <Check size={13} aria-hidden />
                      ) : (
                        <Copy size={13} aria-hidden />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mp-source__hint">Search this number to find who sells it.</p>
        </div>
      )}

      {/* THE DISQUALIFIER OUR OWN ADVICE CREATES.
          Two lines above we tell a price-sensitive first-timer to ring round for
          the cheapest price. For military parts the cheapest source is very
          often surplus or reconditioned stock — and DLA states that quoting
          "a used, reconditioned, remanufactured item, or unused former
          Government surplus property" makes a quotation INELIGIBLE for automated
          award. On a repeat contract, surplus and alternate offers are barred
          outright. Warning her here, at the moment she is about to go shopping,
          is the only place this lands in time.

          THE RULE IS TWO RULES AND THE SENTENCE STATED NEITHER. It rendered
          "Used, repaired or government surplus stock is not allowed" — a
          federal prohibition that does not exist. Surplus is an offer type with
          its own certification and a contracting officer's review (DLAD Subpart
          11.3); it is ineligible for the AUTOMATIC award, which is not the same
          as rejected. Used and surplus stock is a main channel for small parts
          resellers, so a ban we invented closes a door she is entitled to walk
          through, on a decision she makes with her own money.
          The strong rule survives where it is TRUE — a year-long order, where
          surplus and alternate offers really are barred — and `repeats` is
          `boolean | null`, so an unknown gets the general rule and does not
          claim the year rule is absent (D-A7, D-B1). Same three-state read as
          winValueText(), same words as the page's own "This job lasts a year." */}
      <p className="mp-source__surplus">
        <AlertTriangle size={15} aria-hidden />
        <span>
          <b>Buy new items for this one.</b>
          <em>
            {o.repeats === true
              ? "This job lasts a year. Used, repaired or government surplus stock is not allowed."
              : "Used, repaired or government surplus stock stops DLA picking your price automatically. A person has to check it by hand, and you sign extra paper."}
          </em>
        </span>
      </p>

      {/* THE NONMANUFACTURER RULE (13 CFR 121.406(b)). A set-aside does not only
          ask whether SHE is small — if she did not make the part, it must be
          made by a small United States company. The set-aside box above says
          "there is no certificate to get", which reads as a complete account of
          what the set-aside asks of her, and the sourcing help directly below
          sends her to whichever distributor is cheapest. That is the award she
          cannot lawfully fill.
          It sits HERE, beside the surplus warning, because both are rules about
          what she is allowed to buy and this is the moment she goes shopping.
          `resellerRule()` was written and asserted last round and called from
          nowhere — a whole function green in the gate and absent from the
          screen, which is the same class as a guard computed and never read. */}
      {resellerRule(o, now) && (
        <p className="mp-source__surplus">
          <AlertTriangle size={15} aria-hidden />
          <span>
            <b>Who made it matters on this one.</b>
            <em>{resellerRule(o, now)}</em>
          </span>
        </p>
      )}

      <div className="mp-source__answer">
        {/* THE QUESTION IS BACK ON THE CONTROL, and the removal that put it
              here was the more expensive of the two mistakes. The heading does
              ask it — 890px above these buttons at 390px, more than two phone
              screens, with a termination warning, three part numbers, a surplus
              rule and the non-manufacturer rule in between. What sits directly
              above them is "Who made it matters on this one. If you buy this
              part to resell, a small United States company must make it." — a
              government rule shaped like a question — so "Your answer / Yes"
              read as attesting to THAT. Being wrong about a federal rule is the
              thing she is most afraid of.
              The heading's own words, verbatim: one question, asked twice in
              one place, is cheaper than three unlabelled buttons. */}
        <span className="mp-source__q">Can you get this item?</span>
        <div className="mp-source__btns">
          <button
            type="button"
            className={`btn btn-secondary${answer === "yes" ? " is-picked" : ""}`}
            aria-pressed={answer === "yes"}
            onClick={() => attest(o.nsn, "yes")}
          >
            <Check size={15} aria-hidden /> Yes
          </button>
          {/* Same picked state and aria-pressed as Yes and No. "I don't know"
              is always a real answer, and a real answer looks answered. */}
          <button
            type="button"
            className={`btn btn-secondary${answer === "unsure" ? " is-picked" : ""}`}
            aria-pressed={answer === "unsure"}
            onClick={() => attest(o.nsn, "unsure")}
          >
            <HelpCircle size={15} aria-hidden /> Not sure
          </button>
          <button
            type="button"
            className={`btn btn-secondary${answer === "no" ? " is-picked" : ""}`}
            aria-pressed={answer === "no"}
            onClick={() => attest(o.nsn, "no")}
          >
            <X size={15} aria-hidden /> No
          </button>
        </div>
        {/* SINGULAR, and that is the whole point. `attest()` writes the stock
            number and nothing else, and both readers of `attestedNsns` in
            relevance.ts match that exact number — the +400 in relevanceScore
            and the card sentence in whyThisOrder. Nothing generalises to the
            category, the Federal Supply Class or the maker's part number, so a
            plural here promised a ranking behaviour that does not exist. */}
        {answer === "yes" && (
          <p className="mp-source__saved">
            Saved. Hunter will put this one nearer the top for you.
          </p>
        )}
        {answer === "no" && (
          <p className="mp-source__saved">
            Saved. Hunter will keep this one at the bottom of your list.
          </p>
        )}
        {/* The abstention gets an acknowledgement too, and an honest one: it
            changes nothing about her board, and saying so is the answer to
            "did I do something wrong?" */}
        {answer === "unsure" && (
          <p className="mp-source__saved">Saved. Nothing changes on your list.</p>
        )}
      </div>
    </section>
  );
}
