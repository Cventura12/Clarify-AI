import { notFound } from "next/navigation";
import TaskCard from "@/components/TaskCard";
import PlanTrigger from "@/components/PlanTrigger";
import TaskEditor from "@/components/TaskEditor";
import ExecutionLogList from "@/components/ExecutionLogList";
import PlanRunList from "@/components/PlanRunList";
import { prisma } from "@/lib/db";
import type { TaskInterpretation } from "@/lib/schemas/interpret";

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          plan: {
            include: { steps: true },
          },
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const logs = await prisma.executionLog.findMany({
    where: {
      step: {
        plan: {
          task: {
            requestId: params.id,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const planRuns = await prisma.planRun.findMany({
    where: {
      plan: {
        task: {
          requestId: params.id,
        },
      },
    },
    include: {
      plan: {
        include: {
          task: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tasksWithInterpretation = request.tasks.map((task) => ({
    task,
    interpretation: {
      task_id: task.id,
      title: task.title,
      summary: task.summary,
      domain: task.domain as TaskInterpretation["domain"],
      urgency: task.urgency as TaskInterpretation["urgency"],
      complexity: task.complexity as TaskInterpretation["complexity"],
      entities: task.entities as TaskInterpretation["entities"],
      dates: task.dates as TaskInterpretation["dates"],
      status: task.status as TaskInterpretation["status"],
      ambiguities: task.ambiguities as TaskInterpretation["ambiguities"],
      hidden_dependencies: task.hiddenDependencies as TaskInterpretation["hidden_dependencies"],
    },
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          Request Detail
        </p>
        <h1 className="font-display text-3xl text-slate-900">{request.rawInput}</h1>
        <p className="text-sm text-slate-500">
          Created {request.createdAt.toLocaleString()}
        </p>
      </header>

      <div className="space-y-6">
        {tasksWithInterpretation.map(({ task, interpretation }) => (
          <div key={task.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Task</p>
              <PlanTrigger taskId={task.id} hasPlan={Boolean(task.plan)} />
            </div>
            <TaskEditor taskId={task.id} initialTask={interpretation} />
            <TaskCard task={task} plan={task.plan ?? undefined} />
          </div>
        ))}
      </div>

      <ExecutionLogList logs={logs} />
      <PlanRunList runs={planRuns} />
    </div>
  );
}
