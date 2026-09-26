import { MaskLines, Rise } from "@/components/estroc/MaskReveal";

/**
 * Where ESTROC is, and who it builds for. Typography only — no flags, no map,
 * and no invented offices in cities the studio has never worked from.
 */
export default function GlobalReach() {
  return (
    <section className="border-t border-white/[0.08]" data-testid="global-section">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <MaskLines
            as="h2"
            lines={["MADE IN INDIA.", <span className="text-zinc-500">BUILT FOR WHAT'S NEXT.</span>]}
            className="text-4xl font-semibold tracking-[-0.06em] text-zinc-100 sm:text-6xl"
            testId="global-heading"
          />
          <Rise delay={0.15} className="lg:pb-2">
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400" data-testid="global-copy">
              ESTROC works from India with founders and businesses wherever they are — remote by default, in your working hours when it matters.
            </p>
            <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500" data-testid="global-meta">ESTROC / India — building for the world</p>
          </Rise>
        </div>
      </div>
    </section>
  );
}
