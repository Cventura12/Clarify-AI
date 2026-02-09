export default function Loading() {
  return (
    <div className="min-h-screen px-6 py-12 md:px-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-8 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
          <p className="text-xs uppercase tracking-[0.3em] text-ember">Clarify</p>
          <h1 className="mt-4 text-3xl font-semibold text-ink">Loading workspace...</h1>
          <div className="mt-6 grid gap-3">
            <div className="h-3 w-2/3 rounded-full bg-ink/10" />
            <div className="h-3 w-1/2 rounded-full bg-ink/10" />
            <div className="h-3 w-3/4 rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
