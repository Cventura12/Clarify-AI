import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import JobApplicationsClient from "@/components/JobApplicationsClient";

export default async function JobApplicationsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const applications = await prisma.jobApplication.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Job applications</p>
        <h1 className="font-display text-3xl text-slate-900">Applications tracker</h1>
        <p className="text-sm text-slate-500">Manual tracking plus Gmail import.</p>
      </header>

      <JobApplicationsClient />

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 text-sm text-slate-500 shadow-soft">
            No job applications yet.
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                  {app.status}
                </span>
                <span className="text-slate-400">
                  {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "No date"}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                {app.role} · {app.company}
              </h3>
              {app.portalUrl ? (
                <p className="mt-1 text-xs text-slate-500">{app.portalUrl}</p>
              ) : null}
              {app.notes ? <p className="mt-2 text-sm text-slate-600">{app.notes}</p> : null}
              <p className="mt-3 text-xs text-slate-400">Source: {app.source}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
