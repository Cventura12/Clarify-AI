"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };
type TaskOption = { id: string; label: string; requestId: string };

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

type FormsViewProps = {
  forms: FormEntry[];
  requests: Option[];
  tasks: TaskOption[];
  selectedRequest: string;
  selectedTask: string;
};

export default function FormsView({
  forms,
  requests,
  tasks,
  selectedRequest,
  selectedTask,
}: FormsViewProps) {
  const router = useRouter();
  const [requestId, setRequestId] = useState(selectedRequest);
  const [taskId, setTaskId] = useState(selectedTask);

  const taskOptions = useMemo(() => {
    if (!requestId) return tasks;
    return tasks.filter((task) => task.requestId === requestId);
  }, [tasks, requestId]);

  const filteredForms = useMemo(() => {
    if (taskId) return forms.filter((form) => form.taskId === taskId);
    if (requestId) return forms.filter((form) => form.requestId === requestId);
    return forms;
  }, [forms, requestId, taskId]);

  const hasFilters = Boolean(requestId || taskId);

  const updateQuery = (nextRequest: string, nextTask: string) => {
    const params = new URLSearchParams();
    if (nextRequest) params.set("request", nextRequest);
    if (nextTask) params.set("task", nextTask);
    const query = params.toString();
    router.push(query ? `/forms?${query}` : "/forms");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Request</label>
            <select
              value={requestId}
              onChange={(event) => {
                const nextRequest = event.target.value;
                setRequestId(nextRequest);
                setTaskId("");
                updateQuery(nextRequest, "");
              }}
              className="min-w-[220px] rounded-xl border border-[#e6e4e1] bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">All requests</option>
              {requests.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Task</label>
            <select
              value={taskId}
              onChange={(event) => {
                const nextTask = event.target.value;
                setTaskId(nextTask);
                updateQuery(requestId, nextTask);
              }}
              className="min-w-[240px] rounded-xl border border-[#e6e4e1] bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">All tasks</option>
              {taskOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setRequestId("");
                setTaskId("");
                updateQuery("", "");
              }}
              className="rounded-xl border border-[#d8d4cf] bg-[#f7f5f2] px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredForms.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
            No form fields yet. Execute a form step to generate one.
          </div>
        ) : (
          filteredForms.map((form) => (
            <div key={form.id} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Form</p>
              <p className="mt-1 text-sm text-slate-600">{form.taskTitle ?? form.context ?? "Application"}</p>
              <p className="text-xs text-slate-400">{new Date(form.createdAt).toLocaleString()}</p>
              {form.requestId && (
                <Link
                  className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400"
                  href={`/request/${form.requestId}`}
                >
                  {form.requestSnippet ?? "View request"}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7" />
                    <path d="M9 7h8v8" />
                  </svg>
                </Link>
              )}

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {form.fields.map((field) => (
                  <div key={field.id} className="rounded-lg border border-[#ece9e5] bg-[#fbfaf8] p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{field.label}</p>
                      <span className="text-xs text-slate-400">{field.type}</span>
                    </div>
                    <p className="text-xs text-slate-400">{field.required ? "Required" : "Optional"}</p>
                    {field.value ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Suggested: {field.value}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
