import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "Pipeline" },
  { href: "/integrations", label: "Integrations" },
  { href: "/ai", label: "AI Diagnostics" },
  { href: "/docs/12-week-plan.md", label: "Plan" }
];

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <div className="mx-auto max-w-6xl fade-in">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_12px_40px_rgba(12,15,20,0.12)]">
            <p className="text-xs uppercase tracking-[0.35em] text-ember">Clarify</p>
            <h2 className="mt-3 text-lg font-semibold text-ink">Execution OS</h2>
            <nav className="mt-6 grid gap-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-full border border-ink/10 px-4 py-2 text-ink transition hover:border-ink/30"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 rounded-2xl border border-ink/10 bg-haze p-4 text-xs text-muted">
              <p className="font-semibold text-ink">Today</p>
              <p className="mt-2">3 tasks queued</p>
              <p>2 approvals pending</p>
            </div>
          </aside>

          <section className="grid gap-6">
            <header className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_12px_40px_rgba(12,15,20,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ember">
                    Workspace
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <button className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white">
                    New workflow
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  className="w-full flex-1 rounded-full border border-ink/10 bg-surface/90 px-4 py-3 text-sm text-ink"
                  placeholder="Ask Clarify to handle a task..."
                />
                <button className="rounded-full border border-ink/20 px-5 py-3 text-xs font-semibold text-ink">
                  Interpret
                </button>
              </div>
            </header>

            <section className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_12px_40px_rgba(12,15,20,0.12)]">
              {children}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
