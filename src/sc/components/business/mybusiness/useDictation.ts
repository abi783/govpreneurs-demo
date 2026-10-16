"use client";

/**
 * useDictation — she says it out loud, and gets the words back to read.
 *
 * ── IT HANDS BACK TEXT, NOT FACTS ─────────────────────────────────────────
 * The transcript goes into the same textarea she would have typed into, and
 * she sends it — or fixes it first — down the ordinary path. Nothing here
 * proposes anything. `tellModel` quotes her own characters back as the evidence
 * for every fact it extracts, so a transcript that skipped her eyes would turn a
 * mis-heard word into "her words" on a card she is asked to confirm.
 *
 * ── THE RECORDING DOES NOT OUTLIVE THE REQUEST ────────────────────────────
 * Chunks are held in a ref while she speaks, posted once, and dropped. The
 * microphone track is stopped explicitly — not merely dereferenced — so the
 * browser's recording indicator goes out when she stops rather than whenever
 * garbage collection gets around to it.
 *
 * ── EVERY FAILURE ENDS IN "YOU CAN TYPE IT INSTEAD" ───────────────────────
 * No microphone, a refused permission, an unsupported browser, a provider that
 * will not answer: all of them leave the textarea exactly as it was. Dictation
 * is a second way in, never the only one, so nothing it can do may block her.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** What we ask the browser for, best first. Safari records `mp4`, which the
 *  transcription endpoint takes as `m4a`; everything else gives us `webm`. */
const PREFERRED: Array<{ mime: string; format: string }> = [
  { mime: "audio/webm", format: "webm" },
  { mime: "audio/mp4", format: "m4a" },
  { mime: "audio/ogg", format: "ogg" },
];

const NO_SUPPORT = "This browser cannot record. You can type it instead.";
const NO_MIC = "We could not reach your microphone. You can type it instead.";
const FAILED = "We could not turn that into words just now. You can type it instead.";

export type DictationState = "idle" | "recording" | "working";

/**
 * Where a recording stops being worth making.
 *
 * NOT a technical limit — it is `TELL_MAX_CHARS` in seconds. The route slices
 * the transcript to 5,000 characters, which is roughly five or six minutes of
 * speech, so everything said past this point is transcribed, paid for, and then
 * cut. She is told rather than stopped: interrupting someone mid-sentence is
 * worse than letting her finish one we cannot use.
 */
export const LONG_RECORDING_SECONDS = 5 * 60;

/**
 * How long the transcription request may hang before she gets her box back.
 *
 * WITHOUT THIS SHE COULD NOT SEND AT ALL. `state` stays `working` until the
 * fetch settles, and the send button is disabled while it is anything but
 * `idle` — so a stalled request (a dropped mobile connection, a hung server)
 * locked her out of submitting at all, with only a page reload to escape it.
 * Dictation is a second way in and must never be able to block the first one.
 *
 * Generous rather than tight: the route's own provider timeout is 15s, and the
 * rest of this budget is the upload, which on a poor connection is the slow
 * part for a recording of several megabytes.
 */
const REQUEST_TIMEOUT_MS = 60_000;

export interface Dictation {
  state: DictationState;
  /** Whole seconds recorded so far, so the pause afterwards is predictable
   *  rather than a surprise. Zero unless recording. */
  seconds: number;
  /** Undefined where the browser cannot record at all — the caller renders no
   *  button rather than one that apologises when pressed. */
  supported: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  dismissError: () => void;
}

function pick(): { mime: string; format: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  return PREFERRED.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? null;
}

export function useDictation(
  locationId: string,
  onTranscript: (text: string) => void,
): Dictation {
  const [state, setState] = useState<DictationState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const stream = useRef<MediaStream | null>(null);

  // Read once on the client: `MediaRecorder` does not exist while rendering on
  // the server, and asking during render would make this component's first
  // paint disagree with its second.
  useEffect(() => {
    // DEMO: the demo never asks for a microphone (a permission box on a sales call is a
    // risk), so dictation is always on. See `start` and `stop` below.
    setSupported(true);
  }, []);

  /** Stops the microphone itself, so the browser's indicator goes out. */
  const release = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    chunks.current = [];
  }, []);

  useEffect(() => release, [release]);

  // Counted from a wall-clock start rather than by adding one per tick: an
  // interval that fires late — a backgrounded tab, a busy main thread — would
  // otherwise under-count exactly the long recordings this warns about.
  useEffect(() => {
    if (state !== "recording") return;
    const startedAt = Date.now();
    setSeconds(0);
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  /* DEMO: no microphone. "Say it out loud" shows the recording state and clock, and "Stop"
     sends a tiny stand-in recording to the transcribe handler, which answers with a
     sample sentence about the business. The textbox fills as it does in production. */
  const transcribeNow = useCallback(async () => {
    setState("working");
    try {
      const form = new FormData();
      form.set("audio", new Blob(["demo"], { type: "audio/webm" }), "dictation.webm");
      form.set("format", "webm");
      const res = await fetch(`/api/portal/${locationId}/business-profile/tell/transcribe`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as { text?: string; error?: string } | null;
      if (!res.ok || typeof body?.text !== "string" || body.text === "") {
        setError(body?.error ?? FAILED);
        return;
      }
      onTranscript(body.text);
    } catch {
      setError(FAILED);
    } finally {
      setState("idle");
    }
  }, [locationId, onTranscript]);

  const start = useCallback(async () => {
    setError(null);
    setState("recording");
  }, []);

  const stop = useCallback(() => {
    void transcribeNow();
  }, [transcribeNow]);

  return { state, seconds, supported, error, start, stop, dismissError: () => setError(null) };
}
