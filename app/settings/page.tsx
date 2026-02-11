import Link from "next/link";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const baseSections = [
  {
    title: "Account",
    items: [
      { label: "Profile", description: "Personal details for auto-fill.", href: "/profile" },
      { label: "Onboarding", description: "Update initial intake preferences.", href: "/onboarding" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Drafts", description: "Email drafts and follow-ups.", href: "/drafts" },
      { label: "Documents", description: "Generated documents and templates.", href: "/documents" },
      { label: "Forms", description: "Inferred form fields and suggestions.", href: "/forms" },
      { label: "Files", description: "Stored artifacts and search.", href: "/files" },
      { label: "Deadlines", description: "Escalating reminders calendar.", href: "/deadlines" },
      { label: "Job applications", description: "Manual tracking + Gmail import.", href: "/job-applications" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Memory", description: "Saved context entries.", href: "/memory" },
      { label: "Context Graph", description: "Relationship map of key entities.", href: "/context" },
    ],
  },
];

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view settings.
      </div>
    );
  }

  const workspaceCount =
    (await prisma.fileArtifact.count({
      where: { step: { plan: { task: { request: { userId } } } } },
    })) +
    (await prisma.jobApplication.count({ where: { userId } }));

  const intelligenceCount =
    (await prisma.memoryEntry.count({ where: { userId } })) +
    (await prisma.contextNode.count({ where: { userId } }));

  const sections = [
    baseSections[0],
    ...(workspaceCount > 0 ? [baseSections[1]] : []),
    ...(intelligenceCount > 0 ? [baseSections[2]] : []),
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="h-0.5 w-8 rounded-full bg-[var(--accent)]" />
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">Settings</p>
        </div>
        <h1 className="font-display text-3xl text-[var(--text)]">Workspace settings</h1>
        <p className="text-sm text-[var(--muted)]">Manage your profile, data, and advanced tools.</p>
      </header>

      <div className="space-y-6">
        {workspaceCount === 0 && intelligenceCount === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)] shadow-[var(--shadow)]">
            Advanced sections will appear after you generate drafts, files, deadlines, or memory.
          </div>
        ) : null}
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">{section.title}</p>
              <span className="text-xs text-[var(--kicker)]">{section.items.length} items</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 transition hover:border-[var(--border-strong)]"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
                  <p className="text-xs text-[var(--muted)]">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
