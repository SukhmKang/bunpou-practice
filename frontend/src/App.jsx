import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import grammarLessons from "./data/grammar_points_merged.json";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const categoryMeta = {
  自然: {
    en: "Natural",
    seal: "自然",
    tone: "natural",
    ring: "var(--moss)",
    bg: "rgba(74, 90, 58, 0.08)",
  },
  不自然だが文法は正しい: {
    en: "Unnatural · Grammar OK",
    seal: "微差",
    tone: "subtle",
    ring: "var(--gold)",
    bg: "rgba(154, 125, 58, 0.10)",
  },
  文法ミス: {
    en: "Grammar Error",
    seal: "誤",
    tone: "error",
    ring: "var(--shu)",
    bg: "rgba(184, 49, 28, 0.08)",
  },
  文法点を使ってない: {
    en: "Pattern Not Used",
    seal: "外",
    tone: "missing",
    ring: "var(--ai)",
    bg: "rgba(27, 58, 75, 0.08)",
  },
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
          if (item.event === "status") {
            setStatusMessage(item.data?.text ?? "");
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

  const charCount = sentence.length;

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Decorative background kanji */}
      <span
        className="kanji-bg"
        style={{ top: "-4rem", right: "-2rem", fontSize: "28rem" }}
      >
        文
      </span>
      <span
        className="kanji-bg"
        style={{ bottom: "-8rem", left: "-4rem", fontSize: "32rem" }}
      >
        法
      </span>

      {/* Top masthead */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-end justify-between gap-6 px-8 pt-8 pb-5">
        <div className="flex items-end gap-5">
          <div
            className="hanko flex h-14 w-14 items-center justify-center rounded-sm text-2xl"
            style={{ transform: "rotate(-4deg)" }}
          >
            文
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.35em] uppercase" style={{ color: "var(--ink-mute)" }}>
              N°&nbsp;001 · Edition&nbsp;令和
            </p>
            <h1 className="font-en text-[2.5rem] font-light leading-none tracking-tight" style={{ color: "var(--sumi)" }}>
              <span className="italic">Bunpou</span>
              <span className="font-jp mx-2 font-normal" style={{ color: "var(--shu)" }}>
                文法
              </span>
              <span className="font-en text-[1.5rem]" style={{ color: "var(--ink-mute)" }}>
                Practice
              </span>
            </h1>
          </div>
        </div>
        <div className="hidden flex-col items-end gap-1 md:flex">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--ink-mute)" }}>
            A Workshop of Sentences
          </p>
          <p className="font-jp text-sm" style={{ color: "var(--sumi-soft)" }}>
            一文一文、丁寧に
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1400px] px-8">
        <div className="deco-line h-px w-full" />
      </div>

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

          {/* Grammar point card */}
          {grammarPoint && (
            <motion.div
              key={`${lessonIndex}-${pointIndex}`}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="paper relative flex flex-col gap-5 rounded-sm p-6"
            >
              {/* Vertical label */}
              <div
                className="tategaki absolute -left-3 top-6 font-jp text-[10px] tracking-[0.4em] uppercase"
                style={{ color: "var(--shu)" }}
              >
                Pattern · 文型
              </div>

              {/* Counter + nav */}
              <div className="ml-4 flex items-center justify-between">
                <p className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                  <span style={{ color: "var(--sumi)" }}>
                    {String(pointIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-1.5">/</span>
                  {String(grammarPoints.length).padStart(2, "0")}
                </p>
                <div className="flex items-center gap-1">
                  <IconButton
                    onClick={() => changePoint(pointIndex - 1)}
                    disabled={grammarPoints.length < 2}
                    label="←"
                  />
                  <IconButton
                    onClick={() => changePoint(pointIndex + 1)}
                    disabled={grammarPoints.length < 2}
                    label="→"
                  />
                </div>
              </div>

              {/* Pattern */}
              <div className="ml-4">
                <h2
                  className="font-jp text-[2.5rem] font-medium leading-tight"
                  style={{ color: "var(--sumi)" }}
                >
                  {grammarPoint.pattern}
                </h2>
              </div>

              {/* Toggles */}
              <div className="ml-4 flex gap-2">
                <PillToggle
                  active={showDetails}
                  onClick={() => setShowDetails((v) => !v)}
                  label="意味"
                  sub="Meaning"
                />
                <PillToggle
                  active={showExamples}
                  onClick={() => setShowExamples((v) => !v)}
                  label="例文"
                  sub="Examples"
                />
              </div>

              <AnimatePresence initial={false}>
                {showDetails && (grammarPoint.jp_meaning || grammarPoint.eng_meaning) && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="ml-4 overflow-hidden"
                  >
                    <p
                      className="font-jp pt-1 text-[15px] leading-[1.9]"
                      style={{ color: "var(--sumi-soft)" }}
                    >
                      {grammarPoint.jp_meaning || grammarPoint.eng_meaning}
                    </p>
                    {grammarPoint.warning && (
                      <div
                        className="mt-4 border-l-2 pl-3 font-jp text-[13px] leading-[1.9]"
                        style={{
                          borderColor: "var(--shu)",
                          color: "var(--sumi-soft)",
                        }}
                      >
                        <span
                          className="font-mono mr-2 text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: "var(--shu)" }}
                        >
                          注意 · note
                        </span>
                        {grammarPoint.warning}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {showExamples && grammarPoint.example_sentences?.length > 0 && (
                  <motion.div
                    key="examples"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="ml-4 overflow-hidden"
                  >
                    <p
                      className="font-mono mb-2 text-[10px] tracking-[0.3em] uppercase"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      Textbook · 教科書例
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {grammarPoint.example_sentences.map((example, i) => (
                        <motion.li
                          key={example}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="font-jp flex gap-3 text-[14px] leading-[1.8]"
                          style={{ color: "var(--sumi-soft)" }}
                        >
                          <span
                            className="font-mono pt-1 text-[10px]"
                            style={{ color: "var(--shu)" }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{example}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </aside>

        {/* RIGHT — Composition + Result */}
        <section className="flex flex-col gap-8">
          {/* Composition panel */}
          <div className="paper relative rounded-sm p-8">
            {/* Corner decoration */}
            <div
              className="absolute right-6 top-6 font-jp text-[5rem] leading-none"
              style={{ color: "rgba(184, 49, 28, 0.08)" }}
            >
              書
            </div>

            <div className="relative">
              <p
                className="font-mono mb-1 text-[10px] tracking-[0.35em] uppercase"
                style={{ color: "var(--ink-mute)" }}
              >
                Compose · 作文
              </p>
              <h2
                className="font-en text-[2rem] font-light italic leading-tight"
                style={{ color: "var(--sumi)" }}
              >
                Write with{" "}
                <span className="font-jp not-italic font-medium brush-underline">
                  {grammarPoint?.pattern ?? "—"}
                </span>
              </h2>
            </div>

            <div
              className="relative mt-6 rounded-sm border p-5"
              style={{
                borderColor: "rgba(21, 17, 12, 0.12)",
                background: "rgba(255, 252, 245, 0.55)",
              }}
            >
              {/* Vertical decoration */}
              <div
                className="deco-line-v absolute left-3 top-3 bottom-3 w-px"
                style={{ opacity: 0.4 }}
              />
              <textarea
                className="bunpou-input ml-4 h-40 w-[calc(100%-1rem)] resize-none text-[20px] tracking-wide outline-none placeholder:font-jp"
                style={{ color: "var(--sumi)" }}
                placeholder={`${grammarPoint?.pattern ?? "文型"} を使って書いてみてください…`}
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
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p
                  className="font-mono text-[10px] tracking-[0.25em] uppercase"
                  style={{ color: "var(--ink-mute)" }}
                >
                  {charCount} 字
                </p>
                <p
                  className="font-mono hidden text-[10px] tracking-[0.25em] uppercase sm:block"
                  style={{ color: "var(--ink-mute)" }}
                >
                  ⌘ + ↵ to evaluate
                </p>
              </div>
              <motion.button
                whileHover={{ scale: sentence.trim() && !isEvaluating ? 1.02 : 1 }}
                whileTap={{ scale: sentence.trim() && !isEvaluating ? 0.98 : 1 }}
                className="group relative overflow-hidden rounded-sm px-7 py-3 font-en text-sm font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: "var(--sumi)",
                  color: "var(--washi-light)",
                  letterSpacing: "0.04em",
                }}
                disabled={!sentence.trim() || isEvaluating}
                onClick={evaluateSentence}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isEvaluating ? (
                    <>
                      <Spinner /> Evaluating…
                    </>
                  ) : (
                    <>
                      <span className="font-jp text-base">評</span>
                      <span>Evaluate</span>
                      <span className="opacity-60">→</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 border-l-2 pl-3 font-jp text-sm"
                  style={{ borderColor: "var(--shu)", color: "var(--shu-deep)" }}
                >
                  <span className="font-mono mr-2 text-[10px] uppercase tracking-[0.2em]">
                    Error
                  </span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isEvaluating && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative mt-5 overflow-hidden rounded-sm border px-4 py-3"
                  style={{
                    borderColor: "rgba(21, 17, 12, 0.1)",
                    background: "rgba(21, 17, 12, 0.02)",
                  }}
                >
                  <div className="shimmer absolute inset-0" />
                  <p
                    className="font-jp relative text-sm"
                    style={{ color: "var(--sumi-soft)" }}
                  >
                    <span
                      className="font-mono mr-3 text-[10px] uppercase tracking-[0.25em]"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      ···
                    </span>
                    {statusMessage || "文を読んでいます…"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result */}
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

function IconButton({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-sm border font-mono text-sm transition hover:bg-[rgba(21,17,12,0.04)] disabled:cursor-not-allowed disabled:opacity-30"
      style={{
        borderColor: "rgba(21, 17, 12, 0.18)",
        color: "var(--sumi)",
      }}
    >
      {label}
    </button>
  );
}

function PillToggle({ active, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="group flex items-center gap-2 rounded-full border px-3 py-1 transition"
      style={{
        borderColor: active ? "var(--sumi)" : "rgba(21, 17, 12, 0.18)",
        background: active ? "var(--sumi)" : "transparent",
        color: active ? "var(--washi-light)" : "var(--sumi)",
      }}
    >
      <span className="font-jp text-[13px]">{label}</span>
      <span
        className="font-mono text-[9px] tracking-[0.2em] uppercase"
        style={{
          color: active ? "rgba(245, 239, 224, 0.6)" : "var(--ink-mute)",
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResultPanel({ result }) {
  const meta =
    categoryMeta[result.category] ?? {
      en: result.category,
      seal: result.category?.[0] ?? "評",
      ring: "var(--sumi)",
      bg: "rgba(21, 17, 12, 0.05)",
    };

  return (
    <div className="paper relative rounded-sm p-8">
      {/* Top: seal + verdict */}
      <div className="flex items-start gap-6">
        <motion.div
          initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="hanko flex h-20 w-20 shrink-0 items-center justify-center rounded-sm text-2xl"
        >
          {meta.seal}
        </motion.div>
        <div className="flex-1 pt-1">
          <p
            className="font-mono text-[10px] tracking-[0.35em] uppercase"
            style={{ color: "var(--ink-mute)" }}
          >
            Verdict · 評価
          </p>
          <h3
            className="font-jp mt-1 text-3xl font-medium leading-tight"
            style={{ color: "var(--sumi)" }}
          >
            {result.category}
          </h3>
          <p
            className="font-en mt-1 text-base italic"
            style={{ color: "var(--ink-mute)" }}
          >
            {meta.en}
          </p>
        </div>
      </div>

      <div className="deco-line my-6 h-px w-full" />

      {/* Sections */}
      <div className="grid gap-6">
        <ResultSection title="Reasoning" jp="理由" delay={0.05}>
          {result.reasoning}
        </ResultSection>
        {result.corrected && (
          <ResultSection title="Corrected" jp="訂正" accent delay={0.1}>
            <span className="font-jp text-[1.25rem] leading-relaxed" style={{ color: "var(--sumi)" }}>
              {result.corrected}
            </span>
          </ResultSection>
        )}
        {result.why_better && (
          <ResultSection title="Why Better" jp="改善" delay={0.15}>
            {result.why_better}
          </ResultSection>
        )}
        {result.nuance_note && (
          <ResultSection title="Nuance" jp="ニュアンス" delay={0.2}>
            {result.nuance_note}
          </ResultSection>
        )}
        {result.native_examples?.length > 0 && (
          <div>
            <SectionLabel title="Native Examples" jp="自然な例" />
            <ul className="mt-3 flex flex-col gap-2">
              {result.native_examples.map((example, i) => (
                <motion.li
                  key={example}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex gap-3 border-l pl-4 font-jp text-[15px] leading-[1.9]"
                  style={{
                    borderColor: "rgba(184, 49, 28, 0.3)",
                    color: "var(--sumi-soft)",
                  }}
                >
                  <span
                    className="font-mono pt-1 text-[10px]"
                    style={{ color: "var(--shu)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{example}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ title, jp }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="font-mono text-[10px] tracking-[0.35em] uppercase"
        style={{ color: "var(--ink-mute)" }}
      >
        {title}
      </span>
      <span
        className="font-jp text-[11px]"
        style={{ color: "var(--shu)" }}
      >
        · {jp}
      </span>
    </div>
  );
}

function ResultSection({ title, jp, children, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <SectionLabel title={title} jp={jp} />
      <div
        className={`mt-2 font-jp text-[15px] leading-[1.95] ${
          accent ? "" : ""
        }`}
        style={{ color: "var(--sumi-soft)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export default App;
