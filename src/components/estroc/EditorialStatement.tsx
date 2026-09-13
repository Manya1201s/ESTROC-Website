import type { ReactNode } from "react";
import { MaskLines, Rise } from "@/components/estroc/MaskReveal";

interface EditorialStatementProps {
  /** One entry per rendered line, so the statement breaks where it should. */
  lines: ReactNode[];
  footnote: string;
  testId: string;
}

/**
 * A full-bleed statement between sections: large type, deliberate silence
 * around it, nothing to click. The pause is the point — it gives the section
 * before it a moment to land.
 */
export default function EditorialStatement({ lines, footnote, testId }: EditorialStatementProps) {
  return (
    <section className="border-t border-white/[0.08]" data-testid={testId}>
      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:px-10 lg:py-44">
        <MaskLines
          as="p"
          lines={lines}
          className="max-w-5xl text-[clamp(2.4rem,5.6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.06em] text-zinc-100"
          testId={`${testId}-lines`}
        />
        <Rise delay={0.2} className="mt-10 flex items-center gap-4">
          <span className="h-px w-10 bg-[#ff5500]" aria-hidden="true" />
          <p className="text-sm text-zinc-500 sm:text-base" data-testid={`${testId}-footnote`}>{footnote}</p>
        </Rise>
      </div>
    </section>
  );
}
