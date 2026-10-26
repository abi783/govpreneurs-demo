// What Ava says to words she cannot act on. The demo has no language model, so
// the answers are scripted for what a person on a call asks: when it is due, what
// it costs, how to send it, whether it wins, and about the mentor. Every answer
// is true of the bid on screen. None promises a win, and none says Ava sends.

import { dueWords } from "../../lib/ava/flow";
import type { AvaBid } from "../../lib/ava/types";
import type { MentorReview } from "../../demo/ava/mentorReviews";

const WINS = /\bwin\b|chance|odds|good enough|likely|score|strong/;
const WIN_REPLY =
  "I cannot tell you if it wins. The buyer decides, and nobody can promise it. I checked every rule I can, and a mentor can give you a second opinion.";

function mentorReply(review: MentorReview | null, noun: string): string {
  return review
    ? `${review.mentorName?.split(" ")[0] ?? "Your mentor"}'s review of your ${noun} is on this page. The button at the top opens it.`
    : "Press the mentor button at the top. A review costs $97 from your wallet, and the mentor usually replies within 1 business day.";
}

/** Her words in the read of the bid (phase 2), when no sentence is tapped. */
export function readerReply(text: string, bid: AvaBid, review: MentorReview | null): string {
  const t = text.toLowerCase();
  const noun = bid.kind === "reply" ? "reply" : "bid";
  if (WINS.test(t)) return WIN_REPLY;
  if (/download|pdf|word|excel|file/.test(t))
    return `Press Download in the bar over your ${noun}. I build every file on your device, so nothing leaves it.`;
  if (/send|email|submit|deliver|portal/.test(t))
    return `After you download your ${noun}, How to send it shows your steps, in order. I never send anything for you.`;
  if (/due|deadline|when|date|late/.test(t))
    return `Your ${noun} is due ${dueWords(bid)}. Send it a day early.`;
  if (/mentor|diana|review|second opinion/.test(t)) return mentorReply(review, noun);
  if (/price|cost|total|how much/.test(t))
    return bid.price
      ? "Open the price part of your bid to see every line. If you change a cost, I ask you to approve the price again."
      : "This is a reply, not a bid. It has no price and nothing to sign.";
  if (/who are you|\bhello\b|\bhi\b|\bhelp\b|what do you do/.test(t))
    return `I am Ava. I built this ${noun} from your answers. You read it, change anything you like, then download it and send it yourself.`;
  return "You can ask me about the due date, the files, how to send it, the price or a mentor. To change a sentence, tap it first.";
}

/** Her words while Ava builds (phase 1), when they do not answer the question
 *  on screen. Null when Ava has nothing scripted for them. */
export function buildReply(text: string, bid: AvaBid, review: MentorReview | null): string | null {
  const t = text.toLowerCase();
  const noun = bid.kind === "reply" ? "reply" : "bid";
  if (WINS.test(t)) return WIN_REPLY;
  if (/due|deadline|when|date|late/.test(t))
    return `Your ${noun} is due ${dueWords(bid)}. Send it a day early.`;
  if (/mentor|diana|second opinion/.test(t)) return mentorReply(review, noun);
  if (/price|cost|total|how much/.test(t))
    return bid.price
      ? "I build your price from your own costs. I ask you for them one at a time, and you approve the total at the end."
      : "This is a reply, not a bid. It has no price and nothing to sign.";
  if (/download|send|email|submit|deliver|portal|file/.test(t))
    return `When your ${noun} is built, I show it to you to read. Then you download it, and I show you how to send it. I never send anything for you.`;
  if (/who are you|\bhello\b|\bhi\b|\bhelp\b|what do you do/.test(t))
    return "I am Ava. I ask you one question at a time, and I write your bid from your answers. You read it before anything is sent.";
  return null;
}
