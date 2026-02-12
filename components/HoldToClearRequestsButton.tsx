"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const HOLD_MS = 2000;

type Scope = "completed" | "all";

export default function HoldToClearRequestsButton({
  scope = "completed",
}: {
  scope?: Scope;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const label = scope === "completed" ? "Hold to Clear Completed" : "Hold to Clear All";

  const clear = async () => {
    const endpoint = scope === "completed" ? "/api/requests?scope=completed" : "/api/requests";
    const response = await fetch(endpoint, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error?.message ?? "Failed to clear requests.");
      return;
    }
    const deleted = typeof data?.deletedCount === "number" ? data.deletedCount : 0;
    setMessage(deleted > 0 ? `Cleared ${deleted} request${deleted === 1 ? "" : "s"}.` : "Nothing to clear.");
    router.refresh();
  };

  const cancelHold = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    startRef.current = null;
    setRunning(false);
    setProgress(0);
  };

  const startHold = () => {
    if (running) return;
    setMessage(null);
    setRunning(true);
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (!startRef.current) return;
      const elapsed = now - startRef.current;
      const nextProgress = Math.min(1, elapsed / HOLD_MS);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        cancelHold();
        void clear();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        className="relative inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300"
        style={{
          backgroundImage:
            progress > 0
              ? `conic-gradient(rgba(244,63,94,0.38) ${progress * 360}deg, rgba(30,41,59,0.12) 0deg)`
              : undefined,
        }}
      >
        <span className="relative z-10">{running ? "Keep Holding..." : label}</span>
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

