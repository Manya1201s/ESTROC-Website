import { Building2, Quote } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import SectionHeading from "./SectionHeading";

export interface Testimonial {
  quote: string;
  /** Attributed person or role. */
  role: string;
  company: string;
}

/**
 * Real, approved client quotes only.
 *
 * This shipped with five placeholder quotes labelled "Sample / editable" on the
 * live page — invented praise, visibly marked as invented, which costs more
 * trust than an absent section. Add verified quotes here and the section
 * renders itself; leave it empty and the page skips it cleanly.
 */
const testimonials: Testimonial[] = [];

export default function Testimonials() {
  const reducedMotion = useReducedMotion();

  if (testimonials.length === 0) return null;

  return (
    <section className="border-t border-white/[0.08]" data-testid="testimonials-section">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <SectionHeading title="WHAT CLIENTS SAY" copy="The people who put a product in our hands, on what came back." />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="testimonial-card-grid">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.quote}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={reducedMotion ? undefined : { y: -6 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reducedMotion ? 0 : 0.35, delay: reducedMotion ? 0 : index * 0.06 }}
              className={`group relative flex min-h-[330px] flex-col justify-between overflow-hidden border border-white/10 bg-[#111113] p-6 transition-colors duration-300 hover:border-[#ff5500]/45 sm:p-7 ${index === 0 ? "md:col-span-2 lg:col-span-2" : ""}`}
              data-testid={`testimonial-card-${index + 1}`}
            >
              <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full bg-[#ff5500]/[0.05] blur-2xl" aria-hidden="true" />
              <div className="relative">
                <Quote className="h-5 w-5 text-[#ff5500]" aria-hidden="true" />
                <p
                  className={`${index === 0 ? "mt-14 text-2xl sm:text-3xl" : "mt-10 text-xl"} max-w-2xl font-medium leading-snug tracking-[-0.025em] text-zinc-200`}
                  data-testid={`testimonial-quote-${index + 1}`}
                >
                  “{testimonial.quote}”
                </p>
              </div>
              <div className="relative mt-10 flex items-center gap-4 border-t border-white/[0.08] pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 bg-[#0a0a0b] text-zinc-600">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200" data-testid={`testimonial-role-${index + 1}`}>{testimonial.role}</p>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500" data-testid={`testimonial-company-${index + 1}`}>{testimonial.company}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
