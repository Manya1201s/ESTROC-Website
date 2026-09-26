import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The signature moment: one orange signal travelling down through the stages a
 * product passes on its way from an idea to a working system, lighting each as
 * it arrives. Nothing here is decorative — the stages are the studio's own
 * order of work, and the signal is the dot from the wordmark.
 */
const stages: [stage: string, copy: string][] = [
  ["IDEA", "The problem worth solving, stated plainly."],
  ["SOFTWARE", "The product that carries it to real users."],
  ["DATA", "What the product learns as people use it."],
  ["INTELLIGENCE", "Models that turn that into decisions."],
  ["AUTOMATION", "The work that then runs without being asked."],
  ["SYSTEM", "Every part connected, in one place."],
  ["IMPACT", "The result the business actually feels."],
];

export default function EstrocEngine() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [reached, setReached] = useState(0);

  // The signal travels while the section crosses the middle of the screen, so
  // the last stage lands before the section leaves.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start 75%", "end 65%"] });
  const signalTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setReached(Math.min(stages.length - 1, Math.floor(value * stages.length)));
  });

  // Without motion the chain is simply complete: the same information, no travel.
  const lit = (index: number) => reducedMotion || index <= reached;

  return (
    <section id="engine" className="border-t border-white/[0.08]" data-testid="estroc-engine-section">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="engine-kicker">ESTROC / ENGINE</p>
            <h2 className="mt-4 text-5xl font-semibold tracking-[-0.065em] text-zinc-100 sm:text-6xl" data-testid="engine-heading">
              HOW AN IDEA<br />BECOMES A SYSTEM
            </h2>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-zinc-400" data-testid="engine-copy">
              One signal, from the first sentence someone says out loud to the result their business runs on.
            </p>
            <p className="mt-10 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500" data-testid="engine-counter">
              {String(Math.min(reached + 1, stages.length)).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
            </p>
          </div>

          <div ref={sectionRef} className="relative pl-10 sm:pl-14" data-testid="engine-chain">
            {/* The rail the signal runs down, with the travelled part in brand orange. */}
            <div className="absolute bottom-0 left-[5px] top-0 w-px bg-white/10" aria-hidden="true">
              <motion.div className="w-full origin-top bg-[#ff5500]" style={reducedMotion ? { height: "100%" } : { height: signalTop }} />
              {!reducedMotion && (
                <motion.span
                  className="absolute -left-[5px] h-[11px] w-[11px] rounded-full bg-[#ff5500] shadow-[0_0_18px_rgba(255,85,0,0.8)]"
                  style={{ top: signalTop, y: "-50%" }}
                  data-testid="engine-signal"
                />
              )}
            </div>

            {stages.map(([stage, copy], index) => (
              <div key={stage} className="relative pb-12 last:pb-0" data-testid={`engine-stage-${stage.toLowerCase()}`}>
                <span
                  className={`absolute -left-10 top-[10px] h-[11px] w-[11px] rounded-full border-2 transition-colors duration-500 sm:-left-14 ${lit(index) ? "border-[#ff5500] bg-[#ff5500]" : "border-zinc-700 bg-[#0a0a0b]"}`}
                  aria-hidden="true"
                />
                <h3
                  className={`text-3xl font-semibold tracking-[-0.05em] transition-colors duration-500 sm:text-5xl ${lit(index) ? "text-zinc-100" : "text-zinc-700"}`}
                  data-testid={`engine-stage-${stage.toLowerCase()}-title`}
                >
                  {stage}
                </h3>
                <p className={`mt-2 max-w-md text-sm leading-relaxed transition-colors duration-500 ${lit(index) ? "text-zinc-400" : "text-zinc-700"}`}>
                  {copy}
                </p>
              </div>
            ))}

            {/* Where the chain ends: the wordmark itself. */}
            <p
              className={`mt-14 text-4xl font-bold tracking-[-0.07em] transition-colors duration-700 sm:text-6xl ${reached >= stages.length - 1 || reducedMotion ? "text-zinc-100" : "text-zinc-800"}`}
              data-testid="engine-signoff"
            >
              ESTROC<span className="text-[#ff5500]">.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
