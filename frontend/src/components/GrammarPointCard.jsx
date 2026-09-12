function IconButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export function GrammarPointCard({
  grammarPoint,
  pointIndex,
  totalPoints,
  showDetails,
  showExamples,
  onChangePoint,
  onToggleDetails,
  onToggleExamples,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="grammar-pattern">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Grammar point {pointIndex + 1} of {totalPoints}
        </p>
        <div className="flex gap-2">
          <IconButton
            onClick={() => onChangePoint(pointIndex - 1)}
            disabled={totalPoints < 2}
            label="Previous grammar point"
          >
            ←
          </IconButton>
          <IconButton
            onClick={() => onChangePoint(pointIndex + 1)}
            disabled={totalPoints < 2}
            label="Next grammar point"
          >
            →
          </IconButton>
        </div>
      </div>

      <h2 id="grammar-pattern" className="mt-5 break-words text-3xl font-semibold leading-tight text-slate-950">
        {grammarPoint.pattern}
      </h2>

      <div className="mt-5 flex flex-wrap gap-2">
        <ToggleButton active={showDetails} onClick={onToggleDetails}>
          Meaning
        </ToggleButton>
        <ToggleButton active={showExamples} onClick={onToggleExamples}>
          Examples
        </ToggleButton>
      </div>

      {showDetails && (grammarPoint.jp_meaning || grammarPoint.eng_meaning) ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="text-base leading-7 text-slate-800">
            {grammarPoint.jp_meaning || grammarPoint.eng_meaning}
          </p>
          {grammarPoint.warning ? (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <strong className="font-semibold">Note:</strong> {grammarPoint.warning}
            </div>
          ) : null}
        </div>
      ) : null}

      {showExamples && grammarPoint.example_sentences?.length > 0 ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-700">Textbook examples</h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-base leading-7 text-slate-800">
            {grammarPoint.example_sentences.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
