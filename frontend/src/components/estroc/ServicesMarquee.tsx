import { marqueeTagline } from "@/lib/services";

interface ServicesMarqueeProps {
  onSelect: (id: string) => void;
}

/**
 * A full-bleed band of everything the studio builds, drifting right to left.
 *
 * The track holds the list twice and travels exactly -50%, so the second copy
 * sits where the first began and the loop has no seam. The duplicate is hidden
 * from assistive tech — a screen reader should hear the list once.
 */
export default function ServicesMarquee({ onSelect }: ServicesMarqueeProps) {
  const run = (key: string) => (
    <ul className="marquee-run" aria-hidden={key === "echo" ? true : undefined}>
      {/* Two per run, so a copy is always entering on the right as the one
          before it leaves on the left — the band never runs empty. */}
      {[0, 1].map((index) => (
        <li key={`${key}-${index}`} className="marquee-item" aria-hidden={index > 0 ? true : undefined}>
          <span>
            {marqueeTagline.solid} <span className="marquee-outline">{marqueeTagline.outline}</span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="border-y border-white/[0.08] bg-[#0d0d0f]" data-testid="services-marquee-section">
      <button
        type="button"
        onClick={() => onSelect("build")}
        className="marquee group block w-full overflow-hidden py-7 text-left sm:py-9"
        aria-label="See everything ESTROC builds"
        data-testid="services-marquee"
      >
        <div className="marquee-track">
          {run("lead")}
          {run("echo")}
        </div>
      </button>
    </section>
  );
}
