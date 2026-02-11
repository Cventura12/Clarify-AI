"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import gsap from "gsap";
import styles from "./CommandBar.module.css";

export default function CommandBar() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
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
        boxShadow: "0 28px 70px rgba(79, 70, 229, 0.25)",
        borderColor: "rgba(124, 141, 255, 0.5)",
        duration: 0.25,
        ease: "power2.out",
      });
    };

    const handleBlur = () => {
      gsap.to(form, {
        boxShadow: "0 22px 48px rgba(15, 23, 42, 0.08)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        duration: 0.35,
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
    <form ref={formRef} onSubmit={handleSubmit} className={styles.command}>
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
        <span className={styles.commandFlow}>interpret → plan → authorize</span>
        <button type="submit" disabled={isPending} className={styles.commandButton}>
          {isPending ? "Clarifying" : "Clarify"}
          <svg viewBox="0 0 24 24" className={styles.commandButtonIcon} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {error ? <p className={styles.commandError}>{error}</p> : null}
    </form>
  );
}
