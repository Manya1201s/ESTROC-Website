import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Full-bleed closing wordmark. It rises out of its own mask as the footer
 * arrives and drifts slightly against the scroll, so the page ends on a
 * deliberate beat instead of trailing off into legal text.
 */
export default function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["18%", "0%"]);

  return (
    <div ref={ref} className="overflow-hidden pt-16" aria-hidden="true" data-testid="footer-wordmark">
      <motion.p
        style={reducedMotion ? undefined : { y }}
        /* Descenders sit below the 0.78 line box, so the mask needs padding of
           its own or the glyph bottoms get shaved off at the page edge. */
        className="select-none whitespace-nowrap pb-[0.09em] text-center text-[clamp(4rem,17.5vw,16rem)] font-bold leading-[0.78] tracking-[-0.085em] text-zinc-100/[0.07]"
      >
        ESTROC<span className="text-[#ff5500]/25">.</span>
      </motion.p>
    </div>
  );
}
