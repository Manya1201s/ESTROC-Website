import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Desktop-only magnetic cursor. The ring lags the dot on a spring and swells
 * over anything interactive, so hit targets announce themselves before the click.
 * Never mounted for touch, coarse pointers or reduced motion.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  /** Set from data-cursor on whatever is under the pointer, e.g. "View". */
  const [label, setLabel] = useState("");
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 34, mass: 0.55 });
  const ringY = useSpring(y, { stiffness: 380, damping: 34, mass: 0.55 });

  useEffect(() => {
    const fine = matchMedia("(pointer: fine)").matches;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !still);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target as Element | null;
      // Pointer events stop at an iframe's edge, so the ring would freeze there
      // while the framed site shows its own cursor. Step aside until the
      // pointer comes back out.
      if (target?.closest?.("iframe")) {
        setVisible(false);
        return;
      }
      setVisible(true);
      setHovering(Boolean(target?.closest?.(INTERACTIVE)));
      setLabel(target?.closest?.("[data-cursor]")?.getAttribute("data-cursor") ?? "");
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true" data-testid="custom-cursor">
      <motion.div
        className="absolute h-1.5 w-1.5 rounded-full bg-[#ff5500]"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      {/* The ring names what it is over when that element says so, and is a
          plain ring everywhere else — invisible until it means something. */}
      <motion.div
        className="absolute flex items-center justify-center overflow-hidden rounded-full border border-[#ff5500]/55"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: label ? label.length * 8 + 30 : hovering ? 46 : 26,
          height: label ? 30 : hovering ? 46 : 26,
          opacity: visible ? (hovering || label ? 0.95 : 0.45) : 0,
          scale: pressed ? 0.82 : 1,
          backgroundColor: label ? "rgba(255,85,0,0.95)" : hovering ? "rgba(255,85,0,0.10)" : "rgba(255,85,0,0)",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      >
        {label && (
          <span className="whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.16em] text-[#0a0a0b]">{label}</span>
        )}
      </motion.div>
    </div>
  );
}
