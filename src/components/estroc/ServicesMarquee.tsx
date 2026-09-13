import { marqueeServices } from "@/lib/services";

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
      {marqueeServices.map((service) => (
        <li key={`${key}-${service}`} className="marquee-item">
          <span>{service}</span>
          <span className="marquee-mark" aria-hidden="true">✦</span>
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
