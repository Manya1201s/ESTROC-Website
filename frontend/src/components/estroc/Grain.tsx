/**
 * Fixed film-grain wash. Inline SVG turbulence keeps it a zero-request layer,
 * and `mix-blend-overlay` lets it read on the near-black ground without
 * flattening the orange. Opacity is deliberately low — texture, not noise.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
       <filter id="n">
         <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
         <feColorMatrix type="saturate" values="0"/>
       </filter>
       <rect width="180" height="180" filter="url(#n)"/>
     </svg>`,
  );

export default function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] opacity-[0.035] mix-blend-overlay dark:opacity-[0.05]"
      style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "180px 180px" }}
      aria-hidden="true"
      data-testid="grain-overlay"
    />
  );
}
