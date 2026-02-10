import { prisma } from "@/lib/db";
import FormsView from "@/components/FormsView";
import type { JsonValue } from "@prisma/client/runtime/library";

const isRecord = (value: JsonValue | null): value is Record<string, JsonValue> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

type FormEntry = {
  id: string;
  fields: Array<{ id: string; label: string; type: string; required: boolean; value?: string; source?: string }>;
  createdAt: string;
  context?: string;
  taskId?: string;
  taskTitle?: string;
  requestId?: string;
  requestSnippet?: string;
};

const asSnippet = (value?: string | null) => {
  if (!value) return undefined;
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
};

type LogWithContext = {
  id: string;
  detail: JsonValue | null;
  createdAt: Date;
  step: {
    plan: {
      task: {
        id: string;
        title: string;
        requestId: string;
        request: { rawInput: string };
      };
    };
  };
};

const extractForms = (logs: LogWithContext[]) => {
  const forms: FormEntry[] = [];
  logs.forEach((log) => {
    if (!isRecord(log.detail)) return;
    const detail = log.detail as Record<string, JsonValue>;
    const form = detail.form as { fields?: FormEntry["fields"] } | undefined;
    if (!form?.fields || form.fields.length === 0) return;
    const task = log.step?.plan?.task;
    forms.push({
      id: log.id,
      fields: form.fields,
      createdAt: log.createdAt.toISOString(),
      context: typeof detail.action === "string" ? detail.action : undefined,
      taskId: task?.id,
      taskTitle: task?.title,
      requestId: task?.requestId,
      requestSnippet: asSnippet(task?.request.rawInput),
    });
  });
  return forms;
};

export default async function FormsPage({
  searchParams,
}: {
  searchParams: { request?: string; task?: string };
}) {
  const selectedRequest = searchParams.request ?? "";
  const selectedTask = searchParams.task ?? "";

  const tasks = await prisma.task.findMany({
    include: {
      request: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const requestOptions = Array.from(
    new Map(tasks.map((task) => [task.requestId, task.request])).entries()
  ).map(([id, request]) => ({
    id,
    label: asSnippet(request.rawInput) ?? "Request",
  }));

  const taskOptions = tasks.map((task) => ({
    id: task.id,
    label: task.title,
    requestId: task.requestId,
  }));

  const logs = await prisma.executionLog.findMany({
    include: {
      step: {
        include: {
          plan: {
            include: {
              task: {
                include: {
                  request: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const forms = extractForms(logs);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Forms</p>
        <h1 className="font-display text-3xl text-slate-900">Inferred form fields</h1>
        <p className="text-sm text-slate-500">Fields Clarify detected for applications and portals.</p>
      </header>

      <FormsView
        forms={forms}
        requests={requestOptions}
        tasks={taskOptions}
        selectedRequest={selectedRequest}
        selectedTask={selectedTask}
      />
    </div>
  );
}
