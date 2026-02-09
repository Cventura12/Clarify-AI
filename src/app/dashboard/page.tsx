"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const initialTasks = useMemo(
    () => [
      { id: "t1", title: "Follow up with recruiter", status: "Queued", priority: 72 },
      {
        id: "t2",
        title: "Submit scholarship application",
        status: "In Progress",
        priority: 65
      },
      {
        id: "t3",
        title: "Update resume for internship",
        status: "Queued",
        priority: 48
      }
    ],
    []
  );

  const [tasks, setTasks] = useState(initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function moveTask(id: string, direction: -1 | 1) {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  }

  function startEdit(id: string, title: string) {
    setEditingId(id);
    setDraftTitle(title);
  }

  function saveEdit(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title: draftTitle } : task))
    );
    setEditingId(null);
    setDraftTitle("");
  }

  async function handleSignOut() {
    setError(null);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6">
        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-8 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
          <h1 className="text-3xl font-semibold text-ink">Dashboard</h1>
          {status === "loading" ? (
            <p className="mt-3 text-sm text-muted">Loading session...</p>
          ) : session?.user?.email ? (
            <div className="mt-4 grid gap-3 text-sm text-muted">
              <p>
                Signed in as <strong>{session.user.email}</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
                <Link
                  className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
                  href="/"
                >
                  Back home
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted">
              <p>You are not signed in.</p>
              <Link className="text-ember" href="/login">
                Go to login
              </Link>
            </div>
          )}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
          <h2 className="text-xl font-semibold text-ink">Priority Queue</h2>
          <p className="mt-2 text-sm text-muted">
            Dragging will be enabled after database storage. For now, reorder with
            arrows.
          </p>
          <div className="mt-4 grid gap-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ember">
                    Priority {task.priority}
                  </p>
                  {editingId === task.id ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        className="flex-1 rounded-full border border-ink/10 px-3 py-2 text-sm"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                      />
                      <button
                        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
                        onClick={() => saveEdit(task.id)}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-ink">{task.title}</p>
                  )}
                  <p className="text-xs text-muted">Status: {task.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-ink/20 px-3 py-2 text-xs"
                    onClick={() => moveTask(task.id, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    className="rounded-full border border-ink/20 px-3 py-2 text-xs"
                    onClick={() => moveTask(task.id, 1)}
                    disabled={index === tasks.length - 1}
                  >
                    Down
                  </button>
                  <button
                    className="rounded-full border border-ink/20 px-3 py-2 text-xs"
                    onClick={() => startEdit(task.id, task.title)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
