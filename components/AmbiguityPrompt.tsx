export default function AmbiguityPrompt({
  ambiguities,
}: {
  ambiguities: Array<{
    question: string;
    why_it_matters: string;
    default_assumption?: string | null;
  }>;
}) {
  if (ambiguities.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#ebe8e3] bg-[#fbfaf8] p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ambiguities</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {ambiguities.map((ambiguity, index) => (
          <li key={`${ambiguity.question}-${index}`}>
            <p className="font-medium text-slate-800">{ambiguity.question}</p>
            <p className="text-xs text-slate-500">{ambiguity.why_it_matters}</p>
            {ambiguity.default_assumption ? (
              <p className="text-xs text-slate-400">
                Default: {ambiguity.default_assumption}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}