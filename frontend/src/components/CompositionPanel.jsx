import { motion, AnimatePresence } from "motion/react";

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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

export function CompositionPanel({
  grammarPoint,
  sentence,
  statusMessage,
  error,
  isEvaluating,
  onSentenceChange,
  onEvaluate,
}) {
  const charCount = sentence.length;

  return (
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
        <div
          className="deco-line-v absolute left-3 top-3 bottom-3 w-px"
          style={{ opacity: 0.4 }}
        />
        <textarea
          className="bunpou-input ml-4 h-40 w-[calc(100%-1rem)] resize-none text-[20px] tracking-wide outline-none placeholder:font-jp"
          style={{ color: "var(--sumi)" }}
          placeholder={`${grammarPoint?.pattern ?? "文型"} を使って書いてみてください…`}
          value={sentence}
          onChange={(event) => onSentenceChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onEvaluate();
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
          onClick={onEvaluate}
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
  );
}
