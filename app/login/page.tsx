"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <img src="/clarify-logo.svg" alt="Clarify logo" className="mx-auto h-10 w-auto" />
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in to continue</h1>
        <p className="mt-2 text-sm text-slate-500">
          Connect your Google account to unlock Gmail and Calendar execution.
        </p>
      </div>
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Sign in with Google
      </button>
    </div>
  );
}
