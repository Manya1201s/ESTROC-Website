import { useEffect, useState } from "react";
import { ChevronRight, Terminal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import EstrocMark from "@/components/estroc/EstrocMark";
import { projects, testId } from "@/lib/projects";

const CHAR_MS = 42;
const LINE_MS = 380;
const HOLD_MS = 3600;

interface ConsoleState {
  index: number;
  typed: number;
  done: number;
  shipped: boolean;
}

const start = (index: number): ConsoleState => ({ index, typed: 0, done: 0, shipped: false });

export default function HeroProductInterface() {
  const reduceMotion = useReducedMotion();
  /**
   * One object rather than four values: a timer left over from the previous
   * project could otherwise land after the reset and print the old build's
   * summary beside the new build's half-typed command.
   */
  const [state, setState] = useState<ConsoleState>(() => start(0));
  const { index, typed, done, shipped } = state;

  const project = projects[index];
  const command = `estroc build ${project.slug}`;
  /** What this product does, read off the live site — see lib/projects. */
  const lines = project.summary;

  useEffect(() => {
    if (reduceMotion) {
      setState({ index, typed: command.length, done: lines.length, shipped: true });
      return;
    }
    // Deliberately ungated by viewport: an earlier visibility check could leave
    // the console parked on an empty prompt, and a dead terminal in the hero
    // costs far more than a handful of timers would have saved.
    const timers: number[] = [];
    let elapsed = 0;
    // Every write is ignored unless the run that scheduled it still owns the console.
    const at = (delay: number, patch: Partial<ConsoleState>) => {
      elapsed += delay;
      timers.push(window.setTimeout(() => {
        setState((current) => (current.index === index ? { ...current, ...patch } : current));
      }, elapsed));
    };

    for (let i = 1; i <= command.length; i += 1) at(CHAR_MS, { typed: i });
    elapsed += 320;
    for (let i = 1; i <= lines.length; i += 1) at(LINE_MS, { done: i });
    at(520, { shipped: true });
    at(HOLD_MS, start((index + 1) % projects.length));

    return () => timers.forEach(clearTimeout);
  }, [index, reduceMotion, command.length, lines.length]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" as const };

  return (
    <div className="relative mx-auto h-full w-full max-w-[680px]" data-testid="hero-product-interface">
      <div className="absolute -inset-8 bg-[#ff5500]/[0.07] blur-3xl" aria-hidden="true" />
      {/* Above the fold on load, so it plays on mount. Gating this on an
          intersection callback risks the whole panel staying at opacity 0. */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={transition}
        className="hero-interface relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#111113] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 sm:px-5 lg:py-2.5">
          <span className="flex items-center gap-2" data-testid="hero-interface-label">
            <span className="h-2 w-2 rounded-full bg-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.65)]" />
            ESTROC
          </span>
          <span className="flex items-center gap-2 text-zinc-600">
            <EstrocMark className="h-3 w-3" /> SECURE BUILD
          </span>
        </div>

        {/* flex-1: on desktop the panel is sized by the hero heading beside it,
            and this body absorbs whatever height the header and queue leave. */}
        <div className="grid min-h-[375px] flex-1 grid-cols-1 gap-3 p-3 sm:grid-cols-[1.25fr_0.75fr] sm:p-4 lg:min-h-0 lg:p-3">
          {/* Console */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-[13px] leading-relaxed lg:p-3.5">
            <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              <span className="flex items-center gap-2"><Terminal className="h-3 w-3 text-[#ff5500]" /> Console</span>
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
              </span>
            </div>

            <p className="text-zinc-300" data-testid="hero-console-command">
              <span className="text-[#ff5500]">$ </span>
              {command.slice(0, typed)}
              {typed < command.length && <span className="console-caret" aria-hidden="true" />}
            </p>

            <ul className="mt-4 space-y-2 lg:space-y-1.5" data-testid="hero-console-summary">
              {lines.map((line, lineIndex) => {
                const printed = lineIndex < done;
                const active = lineIndex === done && typed >= command.length;
                const shown = printed || active;

                return (
                  // Every line is rendered from the start and merely faded in as
                  // it prints, so the rows hold their real height — including
                  // the taller ones where a line wraps on a narrow screen — and
                  // the console never grows as the summary appears.
                  <motion.li
                    key={line}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                    transition={{ duration: 0.28 }}
                    aria-hidden={!shown}
                    className={`flex items-center gap-3 ${printed ? "text-zinc-300" : "text-zinc-500"}`}
                    data-testid={`hero-console-line-${lineIndex}`}
                  >
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#ff5500]" />
                    <span>{line}</span>
                    {active && <span className="console-caret" aria-hidden="true" />}
                  </motion.li>
                );
              })}
            </ul>

            <div className="mt-auto pt-3">
              <div className="h-px w-full bg-white/10" />
              {/* The console reports the build, it does not hand out the URL —
                  the work section is where a visitor meets the product. */}
              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: shipped ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                className="mt-4 inline-flex items-center gap-2 text-[#ff8554] lg:mt-3"
                data-testid="hero-console-output"
              >
                <span className="text-[#ff5500]">→</span>
                shipped to production
              </motion.p>
            </div>
          </div>

          {/* Current build */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-[#18181b] p-4 lg:p-3.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]">Current build</p>
              <motion.h3
                key={project.name}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-3 text-lg font-semibold tracking-tight text-zinc-100"
                data-testid="hero-current-build-name"
              >
                {project.name}
              </motion.h3>

              {/* A spec sheet built from what the project record already holds —
                  the category split on its own slash, plus live console state. */}
              <dl className="mt-5 space-y-3 border-t border-white/10 pt-4 text-[10px] lg:mt-4 lg:space-y-2.5 lg:pt-3 font-mono uppercase tracking-[0.16em]" data-testid="hero-current-build-spec">
                {project.category.split("/").map((part, partIndex) => (
                  <div key={part} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-zinc-600">{partIndex === 0 ? "Sector" : "Type"}</dt>
                    <dd className="text-right leading-relaxed text-zinc-400">{part.trim()}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto border-t border-white/10 pt-4 lg:pt-3">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
                  <span className="text-zinc-600">Status</span>
                  <span className={`flex items-center gap-2 transition-colors ${shipped ? "text-[#ff5500]" : "text-zinc-600"}`} data-testid="hero-current-build-status">
                    <span className="relative flex h-2 w-2">
                      {shipped && !reduceMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5500] opacity-60" />}
                      <span className={`relative inline-flex h-2 w-2 rounded-full ${shipped ? "bg-[#ff5500]" : "bg-zinc-700"}`} />
                    </span>
                    {shipped ? "Live" : "Building"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#ff5500]/30 bg-[#ff5500]/[0.06] p-3 text-center lg:py-2.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff8554]" data-testid="hero-idea-product-indicator">IDEA <span className="mx-2 text-[#ff5500]">→</span> PRODUCT</span>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-3 sm:px-5 lg:py-2.5" data-testid="hero-build-queue">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">Queue</span>
          <div className="flex flex-1 gap-1.5">
            {projects.map((entry, entryIndex) => (
              <span
                key={entry.slug}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${entryIndex === index ? "bg-[#ff5500]" : "bg-white/10"}`}
                title={entry.name}
                data-testid={`hero-queue-${testId(entry.name)}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600" data-testid="hero-queue-counter">
            {String(index + 1).padStart(2, "0")} — {String(projects.length).padStart(2, "0")}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.04)_50%,transparent_75%)] opacity-40" aria-hidden="true" />
      </motion.div>
    </div>
  );
}
