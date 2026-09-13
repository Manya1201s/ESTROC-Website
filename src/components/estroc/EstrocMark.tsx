/**
 * The ESTROC "E" as a mark: three stacked bars, the middle one carrying the
 * brand's orange signal. Drawn in currentColor so it takes the colour of
 * whatever label it sits beside.
 *
 * This is a stand-in built from the wordmark's proportions — swap the paths for
 * the official mark when the logo files land, and keep this the one place it
 * lives so the favicon and every usage move together.
 */
export default function EstrocMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="4" fill="currentColor" />
      <rect x="3" y="10" width="12" height="4" fill="#ff5500" />
      <rect x="3" y="16" width="18" height="4" fill="currentColor" />
    </svg>
  );
}
