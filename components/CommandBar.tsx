"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import gsap from "gsap";
import { VoiceButton } from "@/components/VoiceButton";
import styles from "./CommandBar.module.css";

export default function CommandBar() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const form = formRef.current;
    const textarea = inputRef.current;
    if (!form || !textarea) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleFocus = () => {
      gsap.to(form, {
        boxShadow: "0 24px 56px rgba(79, 70, 229, 0.18)",
        borderColor: "rgba(124, 141, 255, 0.45)",
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const handleBlur = () => {
      gsap.to(form, {
        boxShadow: "0 16px 34px rgba(15, 23, 42, 0.28)",
        borderColor: "rgba(148, 163, 184, 0.3)",
        duration: 0.25,
        ease: "power2.out",
      });
    };

    textarea.addEventListener("focus", handleFocus);
    textarea.addEventListener("blur", handleBlur);

    return () => {
      textarea.removeEventListener("focus", handleFocus);
      textarea.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError("Enter a request to interpret.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to interpret request.");
        return;
      }

      setInput("");
      router.refresh();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`${styles.command} ${styles.commandReady}`}>
      <div className={styles.commandInputRow}>
        <span className={styles.commandSpark}>
          <svg viewBox="0 0 24 24" className={styles.commandSparkIcon} fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3l2.2 5.2L19.5 10l-5.3 1.9L12 17l-2.2-5.1L4.5 10l5.3-1.8L12 3z" />
          </svg>
        </span>
        <textarea
          ref={inputRef}
          className={styles.commandInput}
          placeholder="What do you need to get done?"
          value={input}
          rows={1}
          onChange={(event) => setInput(event.target.value)}
        />
      </div>

      <div className={styles.commandActions}>
        <div className={styles.commandAssist}>
          <VoiceButton
            onTranscript={setInput}
            onListeningChange={setVoiceListening}
            className={styles.commandVoiceButton}
          />
          <span className={styles.commandFlow}>interpret -&gt; plan -&gt; authorize</span>
        </div>
        <button type="submit" disabled={isPending} className={styles.commandButton}>
          {isPending ? "Clarifying" : "Clarify"}
          <svg viewBox="0 0 24 24" className={styles.commandButtonIcon} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {voiceListening ? (
        <p className={styles.commandLive}>{input ? input : "Listening... Speak your request."}</p>
      ) : null}
      {error ? <p className={styles.commandError}>{error}</p> : null}
    </form>
  );
}
