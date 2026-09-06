import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, LockKeyhole, Terminal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { liveProjects, testId } from "@/lib/projects";

/**
 * The five stages are the studio's own published process — the same list the
 * "HOW WE WORK" section walks through. Nothing here is a fabricated metric:
 * real projects, real stages, real URLs.
 */
const stages = ["discover", "define", "design", "build", "launch"] as const;

const CHAR_MS = 42;
const STAGE_MS = 380;
const HOLD_MS = 3200;

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
   * project could otherwise land after the reset and show the old build's
   * finished stages beside the new build's half-typed command.
   */
  const [state, setState] = useState<ConsoleState>(() => start(0));
  const { index, typed, done, shipped } = state;

  const project = liveProjects[index];
  const command = `estroc build ${project.slug}`;

  useEffect(() => {
    if (reduceMotion) {
      setState({ index, typed: command.length, done: stages.length, shipped: true });
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
    for (let i = 1; i <= stages.length; i += 1) at(STAGE_MS, { done: i });
    at(520, { shipped: true });
    at(HOLD_MS, start((index + 1) % liveProjects.length));

    return () => timers.forEach(clearTimeout);
  }, [index, reduceMotion, command.length]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" as const };

  return (
    <div className="relative mx-auto w-full max-w-[680px]" data-testid="hero-product-interface">
      <div className="absolute -inset-8 bg-[#ff5500]/[0.07] blur-3xl" aria-hidden="true" />
      {/* Above the fold on load, so it plays on mount. Gating this on an
          intersection callback risks the whole panel staying at opacity 0. */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={transition}
        className="hero-interface relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#111113] shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 sm:px-5">
          <span className="flex items-center gap-2" data-testid="hero-interface-label">
            <span className="h-2 w-2 rounded-full bg-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.65)]" />
            ESTROC / BUILD
          </span>
          <span className="flex items-center gap-2 text-zinc-600">
            <LockKeyhole className="h-3 w-3" /> SECURE BUILD
          </span>
        </div>

        <div className="grid min-h-[375px] grid-cols-1 gap-3 p-3 sm:grid-cols-[1.25fr_0.75fr] sm:p-4">
          {/* Console */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#0d0d0f] p-4 font-mono text-[13px] leading-relaxed">
            <div className="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-zinc-600">
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

            <ul className="mt-5 space-y-2.5" data-testid="hero-console-stages">
              {stages.map((stage, stageIndex) => {
                const complete = stageIndex < done;
                const active = stageIndex === done && typed >= command.length;
                if (!complete && !active) return <li key={stage} className="h-[21px]" aria-hidden="true" />;

                return (
                  <motion.li
                    key={stage}
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28 }}
                    className={`flex items-center gap-3 ${complete ? "text-zinc-300" : "text-zinc-500"}`}
                    data-testid={`hero-console-stage-${stage}`}
                  >
                    {/* Both markers are the same icon box, so rows never shift sideways
                        as a stage flips from running to complete. */}
                    {complete ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#ff5500]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#ff5500]" />
                    )}
                    <span>{stage}</span>
                    {active && <span className="console-caret" aria-hidden="true" />}
                  </motion.li>
                );
              })}
            </ul>

            <div className="mt-auto pt-5">
              <div className="h-px w-full bg-white/10" />
              <motion.a
                href={project.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: shipped ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                className="mt-4 inline-flex items-center gap-2 text-[#ff8554] transition-colors hover:text-[#ff5500]"
                data-testid="hero-console-output"
                tabIndex={shipped ? 0 : -1}
              >
                <span className="text-[#ff5500]">→</span>
                {project.url?.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </motion.a>
            </div>
          </div>

          {/* Current build */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-[#18181b] p-4">
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
              <dl className="mt-6 space-y-3 border-t border-white/10 pt-4 text-[10px] font-mono uppercase tracking-[0.16em]" data-testid="hero-current-build-spec">
                {project.category.split("/").map((part, partIndex) => (
                  <div key={part} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-zinc-600">{partIndex === 0 ? "Sector" : "Type"}</dt>
                    <dd className="text-right leading-relaxed text-zinc-400">{part.trim()}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-zinc-600">Stage</dt>
                  <dd className="text-right text-zinc-300" data-testid="hero-current-build-stage">
                    {stages[Math.min(done, stages.length - 1)]}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto border-t border-white/10 pt-4">
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

            <div className="rounded-lg border border-[#ff5500]/30 bg-[#ff5500]/[0.06] p-3 text-center">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff8554]" data-testid="hero-idea-product-indicator">IDEA <span className="mx-2 text-[#ff5500]">→</span> PRODUCT</span>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-3 sm:px-5" data-testid="hero-build-queue">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">Queue</span>
          <div className="flex flex-1 gap-1.5">
            {liveProjects.map((entry, entryIndex) => (
              <span
                key={entry.slug}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${entryIndex === index ? "bg-[#ff5500]" : "bg-white/10"}`}
                title={entry.name}
                data-testid={`hero-queue-${testId(entry.name)}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600" data-testid="hero-queue-counter">
            {String(index + 1).padStart(2, "0")} — {String(liveProjects.length).padStart(2, "0")}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.04)_50%,transparent_75%)] opacity-40" aria-hidden="true" />
      </motion.div>
    </div>
  );
}
