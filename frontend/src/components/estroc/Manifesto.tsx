import { MaskLines, Rise } from "@/components/estroc/MaskReveal";

/** What the studio holds to. Beliefs only — no claims that need proving. */
const beliefs = [
  "Technology should solve problems, not create complexity.",
  "Great products begin with great questions.",
  "AI should create value, not noise.",
  "Software should evolve with the people using it.",
  "The best systems are built for what comes next.",
];

export default function Manifesto() {
  return (
    <section id="manifesto" className="border-t border-white/[0.08]" data-testid="manifesto-section">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-40">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <MaskLines
            as="h2"
            lines={["WE", "BELIEVE"]}
            className="text-6xl font-semibold tracking-[-0.07em] text-zinc-100 sm:text-8xl"
            testId="manifesto-heading"
          />
          <div>
            {beliefs.map((belief, index) => (
              <Rise key={belief} delay={index * 0.06} className="border-b border-white/10 py-7 first:pt-0">
                <p className="flex items-baseline gap-5 text-xl leading-snug tracking-[-0.02em] text-zinc-300 sm:text-2xl" data-testid={`manifesto-belief-${index + 1}`}>
                  <span className="shrink-0 text-[10px] font-mono tracking-[0.2em] text-[#ff5500]">{String(index + 1).padStart(2, "0")}</span>
                  {belief}
                </p>
              </Rise>
            ))}
            <Rise delay={0.3} className="pt-10">
              <p className="text-3xl font-bold tracking-[-0.07em] text-zinc-100" data-testid="manifesto-signoff">
                ESTROC<span className="text-[#ff5500]">.</span>
              </p>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  );
}
