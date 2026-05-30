import { motion } from "motion/react";
import { categoryMeta } from "../constants/categoryMeta";

function SectionLabel({ title, jp }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="font-mono text-[10px] tracking-[0.35em] uppercase"
        style={{ color: "var(--ink-mute)" }}
      >
        {title}
      </span>
      <span className="font-jp text-[11px]" style={{ color: "var(--shu)" }}>
        · {jp}
      </span>
    </div>
  );
}

function ResultSection({ title, jp, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <SectionLabel title={title} jp={jp} />
      <div
        className="mt-2 font-jp text-[15px] leading-[1.95]"
        style={{ color: "var(--sumi-soft)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function ResultPanel({ result }) {
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

      <div className="grid gap-6">
        <ResultSection title="Reasoning" jp="理由" delay={0.05}>
          {result.reasoning}
        </ResultSection>
        {result.corrected && (
          <ResultSection title="Corrected" jp="訂正" delay={0.1}>
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
