import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
        label: `${String(item.lesson).padStart(2, "0")}`,
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
    setStatusMessage("");
    setResult(null);
    setError("");
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
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Decorative background kanji */}
      <span className="kanji-bg" style={{ top: "-4rem", right: "-2rem", fontSize: "28rem" }}>
        文
      </span>
      <span className="kanji-bg" style={{ bottom: "-8rem", left: "-4rem", fontSize: "32rem" }}>
        法
      </span>

      {/* Main grid */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1400px] gap-8 px-8 py-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEFT — Lesson & Pattern */}
        <aside className="flex flex-col gap-6">
          {/* Lesson selector */}
          <div className="paper relative rounded-sm p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-mute)" }}>
                Lesson · 課
              </span>
              <span className="font-jp text-xs" style={{ color: "var(--ink-mute)" }}>
                {grammarPoints.length} 項目
              </span>
            </div>
            <div className="relative">
              <select
                className="w-full cursor-pointer appearance-none rounded-none border-0 border-b-2 bg-transparent pb-2 font-en text-3xl font-light tracking-tight outline-none transition focus:border-current"
                style={{
                  borderBottomColor: "rgba(21, 17, 12, 0.15)",
                  color: "var(--sumi)",
                }}
                value={lessonIndex}
                onChange={(event) => changeLesson(Number(event.target.value))}
              >
                {lessonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Lesson&nbsp;{option.label}
                  </option>
                ))}
              </select>
              <span
                className="font-jp pointer-events-none absolute right-0 top-1 text-xs"
                style={{ color: "var(--ink-mute)" }}
              >
                ▾
              </span>
            </div>
          </div>

          {grammarPoint && (
            <GrammarPointCard
              grammarPoint={grammarPoint}
              lessonIndex={lessonIndex}
              pointIndex={pointIndex}
              totalPoints={grammarPoints.length}
              showDetails={showDetails}
              showExamples={showExamples}
              onChangePoint={changePoint}
              onToggleDetails={() => setShowDetails((v) => !v)}
              onToggleExamples={() => setShowExamples((v) => !v)}
            />
          )}
        </aside>

        {/* RIGHT — Composition + Result */}
        <section className="flex flex-col gap-8">
          <CompositionPanel
            grammarPoint={grammarPoint}
            sentence={sentence}
            statusMessage={statusMessage}
            error={error}
            isEvaluating={isEvaluating}
            onSentenceChange={handleSentenceChange}
            onEvaluate={evaluateSentence}
          />

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={JSON.stringify(result).slice(0, 32)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <ResultPanel result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-[1400px] px-8 pb-8">
        <div className="deco-line h-px w-full" />
        <div
          className="font-mono mt-4 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "var(--ink-mute)" }}
        >
          <span>© Bunpou Atelier</span>
          <span className="font-jp">一期一会</span>
          <span>Crafted in 東京</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
