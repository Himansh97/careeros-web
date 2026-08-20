"use client";

import * as React from "react";

/**
 * Dictation for practising an answer out loud.
 *
 * The Web Speech API is Chrome and Safari only, and in Chrome the recognition
 * runs on Google's servers. Both facts are surfaced rather than hidden: the
 * caller gets `supported`, and the UI says which browser this needs instead of
 * showing a record button that silently does nothing.
 *
 * `continuous` plus `interimResults` is what makes it usable for a
 * ninety-second answer — without them recognition stops at the first pause,
 * which for an interview answer is about six words in.
 *
 * The transcript accumulates in a ref and is mirrored to state only when a
 * result is final. Mirroring every interim result would re-render on every
 * syllable, and the React Compiler is strict about where state may be written
 * from in any case.
 */

interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function ctor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Module scope so the references are stable; a new function each render makes
// useSyncExternalStore resubscribe forever.
const subscribeNever = () => () => {};
const getSpeechSupported = () => ctor() !== null;
const getSpeechSupportedOnServer = () => false;

export function useSpeech() {
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  const recognition = React.useRef<SpeechRecognitionLike | null>(null);
  const finalText = React.useRef("");
  const startedAt = React.useRef<number | null>(null);

  // Whether the browser can transcribe at all. `window` does not exist during
  // the server render, so this cannot be read in a state initialiser without a
  // hydration mismatch — and the React Compiler rejects setState from an
  // effect, which is the other obvious way to do it. useSyncExternalStore is
  // the pattern this codebase already uses for exactly this shape: a value
  // that lives outside React and differs between server and client.
  const supported = React.useSyncExternalStore(
    subscribeNever,
    getSpeechSupported,
    getSpeechSupportedOnServer,
  );

  // A wall clock rather than a count of results: the duration that matters is
  // how long the candidate spoke for, which is not the same as how much of it
  // was recognised.
  React.useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      if (startedAt.current !== null) {
        setElapsed((Date.now() - startedAt.current) / 1000);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [listening]);

  const start = React.useCallback(() => {
    const Ctor = ctor();
    if (!Ctor) {
      setError("This browser cannot transcribe speech. Chrome or Safari can.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText.current = `${finalText.current} ${text}`.trim();
        } else {
          pending += text;
        }
      }
      setInterim(pending);
      setTranscript(finalText.current);
    };
    rec.onerror = (event) => {
      const code = event.error ?? "unknown";
      setError(
        code === "not-allowed"
          ? "Microphone access was refused."
          : `Speech recognition stopped: ${code}`,
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);

    finalText.current = "";
    startedAt.current = Date.now();
    setTranscript("");
    setInterim("");
    setError(null);
    setElapsed(0);
    setListening(true);
    rec.start();
    recognition.current = rec;
  }, []);

  const stop = React.useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const reset = React.useCallback(() => {
    finalText.current = "";
    startedAt.current = null;
    setTranscript("");
    setInterim("");
    setElapsed(0);
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    elapsed,
    start,
    stop,
    reset,
    setTranscript,
  };
}
