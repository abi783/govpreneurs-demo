// The prerequisite gate — SOFT, and collapsed to one line.
//
// To quote on DIBBS she needs four things, not two: an active SAM registration,
// a CAGE code, a DIBBS account, and a PIEE/WAWF account to invoice. The first
// draft of this feature said "two things" and would have revealed the third
// after she had already shipped product — which is exactly the trust-destroying
// move the whole design exists to prevent.
//
// Soft, not hard: she can browse, open, read and save everything. Only the send
// button changes. Emptying the page for the member the page was built for would
// mean she never learns that $1,600 orders exist for parts she can already buy.
//
// Collapsed to one line because expanded it stacked four full-width bands above
// the first card at 390px — worst in the first-run state, which is the only
// state this member sees first.
import { useState, type ReactNode } from "react";
import { Check, ChevronDown, AlertTriangle, Pointer, ExternalLink } from "lucide-react";
import {
  samStatus,
  daysUntilSamExpiry,
  type MicroState,
  SAM_EXPIRED,
} from "../../lib/state/microPurchases";

type StepKey = keyof MicroState["registrations"];

const STEPS: {
  key: keyof MicroState["registrations"];
  title: string;
  body: string;
  term: string;
  /** Where the errand is actually done, when there is a place to do it.
   *  Every row here says "open an account" or "register", and until now not one
   *  of them said WHERE — she was told to go to a government website by name and
   *  left to find it, which for someone who has never bought from the government
   *  is the step that ends the attempt. Optional because one of the four has no
   *  destination: the seller number arrives WITH the SAM registration and is not
   *  applied for, so a link there would send her somewhere to do nothing. */
  href?: string;
}[] = [
  {
    key: "sam",
    // NO NUMBER HERE, and that is deliberate. This used to read "It takes about
    // two weeks" — a figure the PRD forbids stating (line 669) because §15 N17
    // records that its only source is this sentence. It then fed the PRD's own
    // time-to-first-value arithmetic and metric 1's thirty-day window as if it
    // were evidence. A new entity going through SAM entity validation routinely
    // takes considerably longer, and it is the one number on this surface that
    // tells her when she can start earning: set that expectation, miss it, and
    // she is gone. "Weeks, not days" is true, is useful, and cites nothing we
    // do not have. One owner for the timeline — the foot no longer repeats it.
    // "Register your business with the government." is a sentence Amira would
    // use for the LLC she already has. Read the label alone — which is how a
    // checklist row IS read — and she taps "I did this", and that tick feeds
    // the guard that turns the send preview into a real send. The two words
    // that carry the meaning are "to sell": this is a seller registration, and
    // it is with the federal government, not her state.
    title: "Register to sell to the US government.",
    body: "It takes weeks, not days.",
    term: "SAM.gov",
    href: "https://sam.gov",
  },
  {
    key: "cage",
    // NOT "Get your seller number." — an imperative for the one thing on this
    // list she cannot do, and the row's own body said so. The same fact was
    // told in three steps in three sets of words (step 1's body claimed it,
    // step 3 reinforced the wrong reading), and the one written as an
    // instruction was the one that is not an instruction. One fact, one owner:
    // step 1 is now about the registration and its timeline, this step owns the
    // seller number, and "I did this" here is a question she can answer.
    title: "Your seller number comes with that registration.",
    body: "You do not apply for it separately.",
    term: "CAGE code",
  },
  {
    key: "dibbs",
    title: "Open a free DLA account.",
    body: "You need your seller number first.",
    term: "DIBBS",
    href: "https://www.dibbs.bsm.dla.mil/",
  },
  {
    key: "piee",
    title: "Open a free account to send your bill.",
    body: "This is how the government pays you. Without it you cannot get paid.",
    term: "PIEE",
    href: "https://piee.eb.mil/",
  },
];

export function PrereqLine({
  registrations,
  onToggle,
  /** The steps whose tick came from her GovPreneurs profile rather than from a
   *  tap here. A box she did not tick, with no word about who did, is its own
   *  thinking tax — the row has to say where the fact came from (invariant 1:
   *  inference proposes, the authority writes, and the authority is named). */
  fromProfile = [],
}: {
  registrations: MicroState["registrations"];
  onToggle: (k: StepKey, v: boolean) => void;
  fromProfile?: readonly StepKey[];
}) {
  // Which step, if any, is waiting on a confirmation. Only ever the step whose
  // tap COMPLETES the set — see the comment on the button below.
  const [asking, setAsking] = useState<StepKey | null>(null);
  // A DONE STEP LEAVES THE LIST. Every row in this card is an errand on a
  // government website, and a finished errand is not a thing to do — it was
  // taking a full-height card, a title, a hint and a term line to say "nothing
  // here". With two of four done, half the checklist was answering a question
  // she had already answered, and the two rows that still needed her were the
  // two furthest down.
  // NOT DELETED, HIDDEN. She can tick a step she has not actually finished —
  // that is one tap, and on the last step it is the tap that turns the order
  // page's price preview into a real send to DLA. A checklist that swallows the
  // row the moment it is ticked has no undo, and "I tapped the wrong one" would
  // end the flow with nothing on screen to fix it. So the done rows stand down
  // behind one quiet line that says how many there are, and the undo that has
  // always been on them is still on them when she opens it.
  const [showDone, setShowDone] = useState(false);
  const todo = STEPS.filter((s) => !registrations[s.key]);
  const remaining = todo.length;
  const doneCount = STEPS.length - remaining;
  // HOW MANY OF THE DONE ONES SHE NEVER TICKED. `fromProfile` is Hunter reading
  // an active SAM registration off the member record and settling SAM and CAGE
  // himself. Each of those rows said so on its own face — "Hunter got this from
  // your profile." — and hiding the done rows hid the attribution with them,
  // which is the one thing on this card that must not be quiet: a box she did
  // not tick, ticked, with nothing on screen saying who ticked it. So the count
  // moves to the line that replaces the rows, and the per-row sentence stays
  // for when she opens them.
  const profileCount = STEPS.filter(
    (x) => registrations[x.key] && fromProfile.includes(x.key),
  ).length;
  const sam = samStatus();
  const days = daysUntilSamExpiry();

  // Renewal outranks setup. Everything can be ticked and she can still be
  // disqualified on every quote, because SAM lapses every twelve months and DLA
  // simply stops considering her. This is the most common way a small seller
  // loses work they had already won on price, and it is invisible from inside
  // DIBBS.
  // NOT AN EARLY RETURN ANY MORE. It returned the banner INSTEAD of the card,
  // which was right while the card held only registrations — with all four
  // done there was nothing else in it. There is now: a member whose SAM has
  // lapsed AND who has never told Hunter what she sells would have been shown
  // the lapse and nothing else, with the only invitation to name her trade
  // removed from the board on the same change. Both are true, so both render.
  let renew: ReactNode = null;
  if (remaining === 0 && (sam === "expired" || sam === "expiring")) {
    renew = (
      <div className={`mp-renew${sam === "expired" ? " is-expired" : ""}`}>
        <AlertTriangle size={16} aria-hidden />
        <span className="mp-renew__text">
          <b>
            {sam === "expired"
              ? SAM_EXPIRED.title
              : `Your government registration runs out in ${days} days.`}
          </b>
          <em>
            {sam === "expired"
              ? SAM_EXPIRED.body
              : // "lapses" is B2 vocabulary for an event this same sentence calls
                // "runs out" twenty words earlier, and "your prices stop
                // counting" is vaguer than the expired branch's own "DLA will
                // not look at your prices" — the harder, vaguer wording sat on
                // the branch that fires while she still has time to act.
                "Renew it now. It takes a few weeks. The day it runs out, DLA stops looking at your prices."}
          </em>
        </span>
        {/* An anchor, not a button: renewal happens at SAM.gov and nowhere
            else, so this control really does go somewhere. The label names the
            destination — "Renew it" on a button implies we renew it for her. */}
        <a
          className="btn btn-secondary btn-sm"
          href={SAM_EXPIRED.href}
          target="_blank"
          rel="noreferrer"
        >
          {SAM_EXPIRED.cta}
        </a>
      </div>
    );
  }

  if (remaining === 0) return renew;

  return (
    <>
      {renew}
      {/* OPEN, NOT COLLAPSED. It shipped shut, which was right when it was a
          hairline strip of chrome above the board and wrong now that it is the
          first thing on the page: a closed card asks her to tap something to
          find out whether she has to tap something. Every row inside it is a
          thing she has not done, and the count in the header is only meaningful
          if what it counts is visible. She can still shut it, and it stays shut
          for that visit — `details` keeps its own state. */}
      <details className="mp-prereq" open>
        <summary>
          <Pointer size={20} aria-hidden className="mp-prereq__mark" />
          <span className="mp-prereq__count">
            {remaining === 1 ? "One thing" : `${remaining} things`} to do before you can sell
          </span>
          {/* WHAT THE COUNT BUYS HER, on the row that states the count. The
            header was a number and a verb — "2 things to do before you can
            sell" — with nothing saying whether that meant she could not look,
            could not quote, or could not get paid. She can browse this board
            today and price every order on it; what is gated is the send.
            Reads off `remaining` so the pronoun agrees with the number beside
            it: "both" is wrong at one and wrong at four, and a header that
            miscounts itself is the first thing she sees on the page. */}
          <span className="mp-prereq__gate">
            {remaining === 1
              ? "Do this before you send a price"
              : remaining === 2
                ? "Do both before you send a price"
                : "Do all of these before you send a price"}
          </span>
          <ChevronDown size={15} aria-hidden className="mp-prereq__caret" />
        </summary>

        <ol className="mp-prereq__list">
          {/* Numbered over the OUTSTANDING steps, not over all four. The header
            counts what is left ("2 things to do"), so rows numbered 3 and 4
            under it were counting something else — the card stating two
            different totals about itself, in adjacent lines. `todo` is taken in
            STEPS order, so the sequence still runs in the order the
            registrations actually have to happen. */}
          {(showDone ? STEPS : todo).map((s) => {
            const done = registrations[s.key];
            const i = todo.indexOf(s);
            // The tap that finishes the set is the only one with a consequence:
            // registrationsComplete() is the `ready` guard that turns the order
            // page's preview into a real send. It confirms ONCE, here, and the
            // other three commit immediately — a confirmation on every step would
            // be four taxes for one decision.
            const completesTheSet = !done && remaining === 1;
            const confirming = asking === s.key && completesTheSet;
            return (
              <li key={s.key} className={`mp-prereq__step${done ? " is-done" : ""}`}>
                <span className="mp-prereq__num" aria-hidden>
                  {done ? <Check size={13} /> : i + 1}
                </span>
                <span className="mp-prereq__body">
                  {/* Plain sentence first, official term small underneath — the
                    acronym rule, never the reverse. */}
                  <span className="mp-prereq__title">{s.title}</span>
                  <span className="mp-prereq__hint">{s.body}</span>
                  <span className="mp-prereq__term">{s.term}</span>
                  {done && fromProfile.includes(s.key) && (
                    <span className="mp-prereq__hint">Hunter got this from your profile.</span>
                  )}

                  {confirming && (
                    <>
                      {/* SAY WHAT THE TAP DOES, not what it will stop doing.
                        "He will stop warning you." was falsified by the very
                        next render: completing the set stamps an expiry date
                        she never gave and the board answers her honest yes with
                        "Your government registration runs out in 40 days."
                        (that date is state/microPurchases.ts's to fix, and is
                        escalated). The promise itself was the wrong one to make
                        either way — the consequence of this tap is that the
                        price preview on every order becomes a real send, which
                        is the thing she is actually being asked to unlock. */}
                      <span className="mp-prereq__hint">
                        You are telling Hunter you are registered. After this you can send prices to
                        DLA. Only say yes if all four are done.
                      </span>
                      <span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setAsking(null);
                            onToggle(s.key, true);
                          }}
                        >
                          Yes, I did this
                        </button>{" "}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAsking(null)}
                        >
                          No
                        </button>
                      </span>
                    </>
                  )}
                </span>
                {/* A VERB IN HER VOICE, not a status word. This read "Done" —
                  identical to the status pills elsewhere on the board — on a
                  control that decides whether the app believes she is
                  registered with the US government. "Is this row asking me
                  something or telling me something?" is the thinking tax the
                  persona file names, and here it sat one silent tap away from
                  unlocking a control that writes a false send. */}
                <span className="mp-prereq__acts">
                  {/* THE ERRAND, THEN THE RECORD OF IT. Two controls, and not at
                      the same weight on purpose: the link is the thing she has to
                      go and do, the tick is her telling us afterwards that she
                      did it. Two secondary buttons side by side would have made
                      her choose between them.
                      An anchor, not a button: SAM, DIBBS and PIEE registration
                      happens on those sites and nowhere else, so this control
                      really does go somewhere — the same reading as the SAM
                      renewal control above. `target="_blank"` because losing this
                      page mid-errand loses the list of what is still left to do,
                      and `rel="noreferrer"` travels with it.
                      The label is built from `term`, the same string the row
                      already prints underneath, so the destination and the name
                      of the destination cannot drift apart. */}
                  {s.href && (
                    <a
                      className="btn btn-sm btn-primary"
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Go to {s.term}
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  )}
                  {!confirming && (
                    <button
                      type="button"
                      /* Different WEIGHT as well as different words. Both states
                       used to be first-person statements at the same secondary
                       weight — "I did this" / "I have not done this" — so the
                       only thing separating them was a 13px green tick, and read
                       on its own the undo parses as a report of her state rather
                       than as the action of undoing it. The tick is the state;
                       this is the action. */
                      className={`btn btn-sm ${done ? "btn-ghost" : "btn-secondary"}`}
                      onClick={() => {
                        if (completesTheSet) setAsking(s.key);
                        else {
                          setAsking(null);
                          onToggle(s.key, !done);
                        }
                      }}
                    >
                      {done ? "Undo" : "I did this"}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
          {doneCount > 0 && (
            <li className="mp-prereq__doneline">
              {profileCount > 0 && (
                <span className="mp-prereq__hint">
                  Hunter got {profileCount} of these from your profile.
                </span>
              )}
              <button type="button" className="mp-linkbtn" onClick={() => setShowDone(!showDone)}>
                {showDone
                  ? "Hide the ones you have done"
                  : `${doneCount} done. Show them if you need to change one`}
              </button>
            </li>
          )}
        </ol>

        {/* The $2,997 done-for-you offer was CUT from v1 (PRD 5.3, dead controls).
          A priced offer, shown to a member who has told us one fact about her
          business, inside a feature the PRD defines as "not a revenue feature",
          and appearing nowhere in that document — no scope, no copy, no
          trigger, no acceptance criterion. It also went nowhere when tapped.
          If it belongs anywhere it belongs in a decision of its own.
          What she actually needs here is the honest timeline. */}
        {/* The APEX Accelerators referral that sat here ("Find free help near
          you") was removed at the owner's request on 18 September 2026. */}
        {!registrations.sam && (
          <p className="mp-prereq__dfy">Start it today. You can look at orders while you wait.</p>
        )}
      </details>
    </>
  );
}
