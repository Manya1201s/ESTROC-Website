import { motion, useScroll, useSpring } from "motion/react";

/** Hairline read-progress bar pinned under the fixed header. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-[#ff5500]"
      style={{ scaleX }}
      aria-hidden="true"
      data-testid="scroll-progress-bar"
    />
  );
}
