"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Clarify AI</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in to continue</h1>
        <p className="mt-2 text-sm text-slate-500">
          Connect your Google account to unlock Gmail and Calendar execution.
        </p>
      </div>
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Sign in with Google
      </button>
    </div>
  );
}
