import IntegrationCard from "@/components/IntegrationCard";
import IntegrationPlaceholder from "@/components/IntegrationPlaceholder";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view integrations.
      </div>
    );
  }

  const integrations = await prisma.integration.findMany({
    where: { userId },
    include: {
      syncs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { provider: "asc" },
  });

  const googleIntegration = integrations.find((integration) => integration.provider === "google");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Integrations</p>
        <h1 className="font-display text-3xl text-slate-900">Connected services</h1>
        <p className="text-sm text-slate-500">Connect external systems to enable syncing and automation.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <IntegrationCard
          provider="google"
          name="Google Workspace"
          description="Connect Gmail + Calendar for live execution."
          status={googleIntegration?.status ?? "disconnected"}
          metadata={(googleIntegration?.metadata as Record<string, unknown> | null) ?? undefined}
          lastSync={googleIntegration?.syncs?.[0]?.createdAt.toLocaleString() ?? null}
        />
        <IntegrationPlaceholder name="Notion" description="Send tasks and plans to a Notion database." />
        <IntegrationPlaceholder name="Slack" description="Push reminders to a Slack channel." />
      </div>
    </div>
  );
}
