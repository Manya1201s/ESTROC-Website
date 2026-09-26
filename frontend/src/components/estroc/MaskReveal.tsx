import type { ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface MaskLinesProps {
  /** One entry per rendered line; each gets its own clipping window. */
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  as?: ElementType;
  delay?: number;
  /** Play immediately (hero) instead of waiting for the line to scroll into view. */
  immediate?: boolean;
  testId?: string;
}

const lineVariants = {
  hidden: { y: "115%" },
  visible: { y: "0%" },
};

/**
 * Slides each line up out of its own overflow-hidden window, staggered.
 *
 * The scroll trigger sits on an unclipped wrapper and the lines follow it as
 * variants. Putting `whileInView` on a line itself deadlocks: the line starts
 * translated outside its own mask, an IntersectionObserver therefore measures
 * it as never visible, and the reveal that would bring it into view never
 * fires — leaving a heading that silently occupies space forever.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  as: Tag = "div",
  delay = 0,
  immediate = false,
  testId,
}: MaskLinesProps) {
  const reducedMotion = useReducedMotion();

  const trigger = immediate
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: { once: true, amount: 0.3 } };

  return (
    <motion.div initial={reducedMotion ? false : "hidden"} {...(reducedMotion ? {} : trigger)}>
      <Tag className={className} data-testid={testId}>
        {lines.map((line, index) => (
          <span key={index} className="block overflow-hidden pb-[0.12em]">
            <motion.span
              className={`block will-change-transform ${lineClassName ?? ""}`}
              variants={lineVariants}
              transition={{ duration: 0.85, delay: delay + index * 0.09, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </Tag>
    </motion.div>
  );
}

/** Simple fade-and-rise for supporting copy that sits under a MaskLines block. */
export function Rise({
  children,
  className,
  delay = 0,
  immediate = false,
  testId,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
  testId?: string;
}) {
  const reducedMotion = useReducedMotion();
  const target = { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      {...(immediate ? { animate: target } : { whileInView: target, viewport: { once: true, amount: 0.3 } })}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}
