"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function VoiceButton({
  onTranscript,
  onListeningChange,
  lang = "en-US",
}: {
  onTranscript: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  lang?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastFinalRef = useRef("");

  useEffect(() => {
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const rec = new SpeechRecognitionCtor() as SpeechRecognitionInstance;
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event: any) => {
      let finalText = lastFinalRef.current;
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = (result[0]?.transcript ?? "").trim();
        if (!text) continue;

        if (result.isFinal) finalText = `${finalText} ${text}`.trim();
        else interimText = `${interimText} ${text}`.trim();
      }

      lastFinalRef.current = finalText;
      onTranscript(`${finalText}${interimText ? ` ${interimText}` : ""}`.trim());
    };

    rec.onend = () => {
      setListening(false);
      onListeningChange?.(false);
    };

    rec.onerror = () => {
      setListening(false);
      onListeningChange?.(false);
    };

    recognitionRef.current = rec;
    setSupported(true);

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [lang, onListeningChange, onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const rec = recognitionRef.current;
        if (!rec) return;

        if (!listening) {
          lastFinalRef.current = "";
          setListening(true);
          onListeningChange?.(true);
          try {
            rec.start();
          } catch {
            setListening(false);
            onListeningChange?.(false);
          }
        } else {
          setListening(false);
          onListeningChange?.(false);
          try {
            rec.stop();
          } catch {}
        }
      }}
      aria-label={listening ? "Stop recording" : "Start recording"}
      aria-pressed={listening}
      className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/35 hover:bg-white/10"
    >
      {listening ? "Stop" : "Voice"}
    </button>
  );
}

