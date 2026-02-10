import Link from "next/link";

const sections = [
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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Settings</p>
        <h1 className="font-display text-3xl text-slate-900">Workspace settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, data, and advanced tools.</p>
      </header>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{section.title}</p>
              <span className="text-xs text-slate-400">{section.items.length} items</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-xl border border-[#ece9e5] bg-[#fbfaf8] p-4 transition hover:border-[#d8d4cf]"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
