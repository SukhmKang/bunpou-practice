import { categoryMeta } from "../constants/categoryMeta";

function ResultSection({ title, children }) {
  return (
    <section>
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <div className="mt-2 text-base leading-7 text-slate-800">{children}</div>
    </section>
  );
}

export function ResultPanel({ result }) {
  const meta = categoryMeta[result.category] ?? { en: result.category };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="result-heading">
      <p className="text-sm font-medium text-blue-700">Evaluation</p>
      <h3 id="result-heading" className="mt-1 text-2xl font-semibold text-slate-950">
        {result.category}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{meta.en}</p>

      <div className="mt-6 grid gap-6 border-t border-slate-200 pt-6">
        <ResultSection title="Reasoning">{result.reasoning}</ResultSection>

        {result.corrected ? (
          <ResultSection title="Corrected sentence">
            <p className="rounded-lg bg-blue-50 p-4 text-lg font-medium leading-8 text-slate-950">
              {result.corrected}
            </p>
          </ResultSection>
        ) : null}

        {result.why_better ? <ResultSection title="Why it is better">{result.why_better}</ResultSection> : null}
        {result.nuance_note ? <ResultSection title="Nuance">{result.nuance_note}</ResultSection> : null}

        {result.native_examples?.length > 0 ? (
          <ResultSection title="Natural examples">
            <ol className="list-decimal space-y-3 pl-5">
              {result.native_examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ol>
          </ResultSection>
        ) : null}
      </div>
    </section>
  );
}
