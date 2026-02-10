import Link from "next/link";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

type SearchParams = { q?: string; type?: string };

const snippet = (value?: string | null) => {
  if (!value) return "No preview available.";
  return value.length > 180 ? `${value.slice(0, 177)}...` : value;
};

export default async function FilesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = searchParams.q?.trim() ?? "";
  const type = searchParams.type?.trim() ?? "";
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view files.
      </div>
    );
  }

  const where = {
    ...(type ? { type } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { contentText: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    step: {
      plan: {
        task: {
          request: {
            userId,
          },
        },
      },
    },
  };

  const files = await prisma.fileArtifact.findMany({
    where,
    include: {
      step: {
        include: {
          plan: {
            include: {
              task: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Files</p>
        <h1 className="font-display text-3xl text-slate-900">Stored artifacts</h1>
        <p className="text-sm text-slate-500">Search across generated drafts, documents, and forms.</p>
      </header>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Search</label>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by keyword"
            className="min-w-[240px] rounded-xl border border-[#e6e4e1] bg-white px-3 py-2 text-sm text-slate-700"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Type</label>
          <select
            name="type"
            defaultValue={type}
            className="min-w-[160px] rounded-xl border border-[#e6e4e1] bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="document">Document</option>
            <option value="form">Form</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl border border-[#d8d4cf] bg-[#f7f5f2] px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
        >
          Search
        </button>
        {(query || type) && (
          <Link className="text-sm text-slate-400 underline" href="/files">
            Clear
          </Link>
        )}
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {files.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
            No files found yet. Run a step to generate and store artifacts.
          </div>
        ) : (
          files.map((file) => {
            const task = file.step?.plan?.task;
            return (
              <div key={file.id} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{file.type}</p>
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  </div>
                  <p className="text-xs text-slate-400">{file.createdAt.toLocaleString()}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600">{snippet(file.contentText)}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  {task ? (
                    <Link className="underline" href={`/request/${task.requestId}`}>
                      {task.title}
                    </Link>
                  ) : (
                    <span>Unlinked artifact</span>
                  )}
                  {file.url.startsWith("http") ? (
                    <a className="underline" href={file.url} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  ) : (
                    <span>Stored locally</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
