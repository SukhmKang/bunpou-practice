function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function CompositionPanel({
  grammarPoint,
  statusMessage,
  error,
  isEvaluating,
  onEvaluate,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onEvaluate(String(formData.get("sentence") ?? ""));
  }

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
      aria-labelledby="compose-heading"
      onSubmit={handleSubmit}
    >
      <p className="text-sm font-medium text-blue-700">Writing practice</p>
      <h2 id="compose-heading" className="mt-1 text-2xl font-semibold leading-snug text-slate-950">
        Write a sentence using {grammarPoint?.pattern ?? "this grammar point"}
      </h2>

      <label htmlFor="practice-sentence" className="mt-6 block text-sm font-medium text-slate-700">
        Your sentence
      </label>
      <textarea
        id="practice-sentence"
        name="sentence"
        required
        className="mt-2 h-40 w-full resize-y rounded-lg border border-slate-300 bg-white p-4 text-lg leading-8 text-slate-950 placeholder:text-slate-400"
        placeholder={`${grammarPoint?.pattern ?? "文型"} を使って書いてみてください…`}
      />

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isEvaluating}
        >
          {isEvaluating ? (
            <>
              <Spinner /> Evaluating…
            </>
          ) : (
            "Evaluate"
          )}
        </button>
      </div>

      {error ? (
        <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      ) : null}

      {isEvaluating ? (
        <div role="status" className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          {statusMessage || "Reading your sentence…"}
        </div>
      ) : null}
    </form>
  );
}
