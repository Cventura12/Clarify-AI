import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { JsonValue } from "@prisma/client/runtime/library";

const isRecord = (value: JsonValue | null): value is Record<string, JsonValue> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

type DocumentEntry = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  templateName?: string;
};

const extractDocuments = (logs: Array<{ id: string; detail: JsonValue | null; createdAt: Date }>) => {
  const docs: DocumentEntry[] = [];
  logs.forEach((log) => {
    if (!isRecord(log.detail)) return;
    const detail = log.detail as Record<string, JsonValue>;
    const doc = detail.document as { title?: string; body?: string; templateName?: string } | undefined;
    if (!doc?.title || !doc?.body) return;
    docs.push({
      id: log.id,
      title: doc.title,
      body: doc.body,
      templateName: doc.templateName,
      createdAt: log.createdAt,
    });
  });
  return docs;
};

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view documents.
      </div>
    );
  }

  const logs = await prisma.executionLog.findMany({
    where: {
      step: {
        plan: {
          task: {
            request: {
              userId,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const docs = extractDocuments(logs);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Documents</p>
        <h1 className="font-display text-3xl text-slate-900">Generated documents</h1>
        <p className="text-sm text-slate-500">Templates and drafts created by Clarify.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {docs.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
            No documents yet. Execute a document step to generate one.
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{doc.templateName ?? "Document"}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">{doc.title}</h2>
              <p className="mt-1 text-xs text-slate-400">{doc.createdAt.toLocaleString()}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{doc.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
