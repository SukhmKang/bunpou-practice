import { useMemo, useState } from "react";
import grammarLessons from "./data/grammar_points_merged.json";
import { parseSseEvents } from "./utils/parseSseEvents";
import { GrammarPointCard } from "./components/GrammarPointCard";
import { CompositionPanel } from "./components/CompositionPanel";
import { ResultPanel } from "./components/ResultPanel";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [pointIndex, setPointIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showExamples, setShowExamples] = useState(false);

  const lesson = grammarLessons[lessonIndex];
  const grammarPoints = lesson?.grammar_points ?? [];
  const grammarPoint = grammarPoints[pointIndex];

  const lessonOptions = useMemo(
    () =>
      grammarLessons.map((item, index) => ({
        label: `Lesson ${String(item.lesson).padStart(2, "0")}`,
        value: index,
      })),
    [],
  );

  function resetEvaluation() {
    setStatusMessage("");
    setResult(null);
    setError("");
  }

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

  function handleSentenceChange(value) {
    setSentence(value);
    resetEvaluation();
  }

  async function evaluateSentence() {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence || !grammarPoint || isEvaluating) return;

    setIsEvaluating(true);
    setStatusMessage("");
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
          if (item.event === "status") setStatusMessage(item.data?.text ?? "");
          if (item.event === "result") setResult(item.data);
          if (item.event === "error") throw new Error(item.data?.message ?? "Evaluation failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <h1 className="text-xl font-semibold text-slate-900">Bunpou Practice</h1>
          <p className="mt-1 text-sm text-slate-600">Practice Japanese grammar with focused feedback.</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:py-8">
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label htmlFor="lesson-select" className="mb-2 block text-sm font-medium text-slate-700">
              Lesson
            </label>
            <select
              id="lesson-select"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              value={lessonIndex}
              onChange={(event) => changeLesson(Number(event.target.value))}
            >
              {lessonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {grammarPoint ? (
            <GrammarPointCard
              grammarPoint={grammarPoint}
              pointIndex={pointIndex}
              totalPoints={grammarPoints.length}
              showDetails={showDetails}
              showExamples={showExamples}
              onChangePoint={changePoint}
              onToggleDetails={() => setShowDetails((value) => !value)}
              onToggleExamples={() => setShowExamples((value) => !value)}
            />
          ) : null}
        </aside>

        <section className="flex min-w-0 flex-col gap-6" aria-label="Writing practice">
          <CompositionPanel
            grammarPoint={grammarPoint}
            sentence={sentence}
            statusMessage={statusMessage}
            error={error}
            isEvaluating={isEvaluating}
            onSentenceChange={handleSentenceChange}
            onEvaluate={evaluateSentence}
          />

          {result ? <ResultPanel result={result} /> : null}
        </section>
      </div>
    </main>
  );
}

export default App;
