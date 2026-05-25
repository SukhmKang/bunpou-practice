import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import grammarLessons from "./data/grammar_points_merged.json";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const categoryTone = {
  自然: "border-emerald-200 bg-emerald-50 text-emerald-900",
  不自然だが文法は正しい: "border-amber-200 bg-amber-50 text-amber-900",
  文法ミス: "border-rose-200 bg-rose-50 text-rose-900",
  文法点を使ってない: "border-slate-200 bg-slate-100 text-slate-900",
};

function parseSseEvents(buffer) {
  const events = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    const event = lines
      .find((line) => line.startsWith("event:"))
      ?.slice("event:".length)
      .trim();
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim())
      .join("\n");

    if (!event) continue;
    events.push({ event, data: data ? JSON.parse(data) : null });
  }

  return { events, remainder };
}

function App() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [pointIndex, setPointIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [streamedFeedback, setStreamedFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const lesson = grammarLessons[lessonIndex];
  const grammarPoints = lesson?.grammar_points ?? [];
  const grammarPoint = grammarPoints[pointIndex];

  const lessonOptions = useMemo(
    () =>
      grammarLessons.map((item, index) => ({
        label: `Lesson ${item.lesson}`,
        value: index,
      })),
    [],
  );

  function changeLesson(nextIndex) {
    setLessonIndex(nextIndex);
    setPointIndex(0);
    resetEvaluation();
  }

  function changePoint(nextIndex) {
    const boundedIndex = (nextIndex + grammarPoints.length) % grammarPoints.length;
    setPointIndex(boundedIndex);
    resetEvaluation();
  }

  function resetEvaluation() {
    setStreamedFeedback("");
    setResult(null);
    setError("");
  }

  async function evaluateSentence() {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence || !grammarPoint || isEvaluating) return;

    setIsEvaluating(true);
    setStreamedFeedback("");
    setResult(null);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: trimmedSentence,
          grammar_point: grammarPoint,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseEvents(buffer);
        buffer = parsed.remainder;

        for (const item of parsed.events) {
          if (item.event === "delta") {
            setStreamedFeedback((current) => current + (item.data?.text ?? ""));
          }

          if (item.event === "result") {
            setResult(item.data);
          }

          if (item.event === "error") {
            throw new Error(item.data?.message ?? "Evaluation failed");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f4f7fb_32%,#eef7f1_70%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid flex-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Lesson
            </label>
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none ring-blue-500 transition focus:ring-2"
              value={lessonIndex}
              onChange={(event) => changeLesson(Number(event.target.value))}
            >
              {lessonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={grammarPoints.length < 2}
                onClick={() => changePoint(pointIndex - 1)}
              >
                Previous
              </button>
              <p className="text-sm font-medium text-slate-500">
                {pointIndex + 1} / {grammarPoints.length}
              </p>
              <button
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={grammarPoints.length < 2}
                onClick={() => changePoint(pointIndex + 1)}
              >
                Next
              </button>
            </div>

            {grammarPoint && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Pattern
                    </p>
                    <div className="flex items-center gap-2">
                      <ToggleButton
                        active={showDetails}
                        label="Details"
                        onClick={() => setShowDetails((current) => !current)}
                      />
                      <ToggleButton
                        active={showExamples}
                        label="Examples"
                        onClick={() => setShowExamples((current) => !current)}
                      />
                    </div>
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    {grammarPoint.pattern}
                  </h2>
                  {showDetails && (
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {grammarPoint.jp_meaning || grammarPoint.eng_meaning}
                    </p>
                  )}
                </div>

                {showDetails && grammarPoint.warning && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    {grammarPoint.warning}
                  </div>
                )}

                {showExamples && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Textbook examples
                    </p>
                    <ul className="mt-2 space-y-2">
                      {grammarPoint.example_sentences?.map((example) => (
                        <li
                          key={example}
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                        >
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Your sentence
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Try the selected grammar point
                  </h2>
                </div>
                <button
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!sentence.trim() || isEvaluating}
                  onClick={evaluateSentence}
                >
                  {isEvaluating ? "Evaluating..." : "Evaluate"}
                </button>
              </div>

              <textarea
                className="mt-4 h-44 w-full resize-none rounded-lg border border-slate-300 bg-white p-4 text-lg leading-8 text-slate-950 outline-none ring-blue-500 transition placeholder:text-slate-400 focus:ring-2"
                placeholder={`Write a sentence using ${grammarPoint?.pattern ?? "the pattern"}...`}
                value={sentence}
                onChange={(event) => {
                  setSentence(event.target.value);
                  resetEvaluation();
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    evaluateSentence();
                  }
                }}
              />

              {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                  {error}
                </div>
              )}

              {(isEvaluating || streamedFeedback) && (
                <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Live feedback
                    </p>
                    {isEvaluating && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        Streaming
                      </span>
                    )}
                  </div>
                  <MarkdownFeedback>{streamedFeedback}</MarkdownFeedback>
                </div>
              )}
            </div>

            {result && <ResultPanel result={result} />}
          </section>
        </section>
      </div>
    </main>
  );
}

function ToggleButton({ active, label, onClick }) {
  return (
    <button
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function MarkdownFeedback({ children }) {
  return (
    <div className="min-h-24 text-sm leading-7 text-slate-800">
      <ReactMarkdown
        components={{
          p: ({ children: paragraphChildren }) => (
            <p className="mb-3 last:mb-0">{paragraphChildren}</p>
          ),
          strong: ({ children: strongChildren }) => (
            <strong className="font-semibold text-slate-950">
              {strongChildren}
            </strong>
          ),
          ul: ({ children: listChildren }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">
              {listChildren}
            </ul>
          ),
          ol: ({ children: listChildren }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">
              {listChildren}
            </ol>
          ),
          li: ({ children: itemChildren }) => <li>{itemChildren}</li>,
          h1: ({ children: headingChildren }) => (
            <h3 className="mb-2 text-base font-semibold text-slate-950">
              {headingChildren}
            </h3>
          ),
          h2: ({ children: headingChildren }) => (
            <h3 className="mb-2 text-base font-semibold text-slate-950">
              {headingChildren}
            </h3>
          ),
          h3: ({ children: headingChildren }) => (
            <h3 className="mb-2 text-sm font-semibold text-slate-950">
              {headingChildren}
            </h3>
          ),
          code: ({ children: codeChildren }) => (
            <code className="rounded bg-white px-1.5 py-0.5 text-[0.9em] text-blue-800">
              {codeChildren}
            </code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function ResultPanel({ result }) {
  const tone =
    categoryTone[result.category] ?? "border-slate-200 bg-slate-100 text-slate-900";

  return (
    <aside className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">Result</p>
      <div className={`mt-3 rounded-lg border p-3 text-sm font-semibold ${tone}`}>
        {result.category}
      </div>

      <div className="mt-5 space-y-5">
        <ResultSection title="Reasoning">{result.reasoning}</ResultSection>
        {result.corrected && (
          <ResultSection title="Corrected">{result.corrected}</ResultSection>
        )}
        {result.why_better && (
          <ResultSection title="Why Better">{result.why_better}</ResultSection>
        )}
        {result.nuance_note && (
          <ResultSection title="Nuance Note">{result.nuance_note}</ResultSection>
        )}
        {result.native_examples?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Native Examples
            </h3>
            <ul className="mt-2 space-y-2">
              {result.native_examples.map((example) => (
                <li
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800"
                  key={example}
                >
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function ResultSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase text-slate-500">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-800">{children}</p>
    </div>
  );
}

export default App;
