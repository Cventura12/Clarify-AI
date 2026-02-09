"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    if (!result || result.error) {
      setError(result?.error || "Unable to sign up");
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-ink/10 bg-surface/80 p-8 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
        <h1 className="text-3xl font-semibold text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Demo signup uses credentials provider. Configure demo creds in
          <code>.env</code> or replace with a real provider.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-ink">Email</label>
          <input
            className="rounded-2xl border border-ink/10 bg-surface/90 p-3 text-sm text-ink"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
          <label className="text-sm font-semibold text-ink">Password</label>
          <input
            className="rounded-2xl border border-ink/10 bg-surface/90 p-3 text-sm text-ink"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
          />
          <button
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Creating..." : "Create account"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {status === "success" ? (
          <p className="mt-4 text-sm text-emerald-700">
            Demo account ready. Head to <Link href="/dashboard">dashboard</Link>.
          </p>
        ) : null}
        <p className="mt-6 text-sm text-muted">
          Already have an account? <Link href="/login">Sign in</Link>.
        </p>
      </div>
    </main>
  );
}
