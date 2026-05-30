import { motion, AnimatePresence } from "motion/react";

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

export function GrammarPointCard({
  grammarPoint,
  lessonIndex,
  pointIndex,
  totalPoints,
  showDetails,
  showExamples,
  onChangePoint,
  onToggleDetails,
  onToggleExamples,
}) {
  return (
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
          {String(totalPoints).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => onChangePoint(pointIndex - 1)}
            disabled={totalPoints < 2}
            label="←"
          />
          <IconButton
            onClick={() => onChangePoint(pointIndex + 1)}
            disabled={totalPoints < 2}
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
          onClick={onToggleDetails}
          label="意味"
          sub="Meaning"
        />
        <PillToggle
          active={showExamples}
          onClick={onToggleExamples}
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
  );
}
