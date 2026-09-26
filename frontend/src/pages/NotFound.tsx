import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { MaskLines, Rise } from "@/components/estroc/MaskReveal";
import Grain from "@/components/estroc/Grain";

/**
 * A page that is missing should still be ESTROC — same ground, same type, same
 * signal — and should say where the visitor actually is.
 */
export default function NotFound() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Signal lost — ESTROC";
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0b] text-[#f5f5f7]" data-testid="not-found-page">
      <Grain />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-24 sm:px-8 lg:px-10">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-[#ff5500]" data-testid="not-found-code">Error 404</p>
        <MaskLines
          as="h1"
          immediate
          lines={["SIGNAL", <span className="text-zinc-500">LOST.</span>]}
          className="mt-5 text-[clamp(3.2rem,9vw,8rem)] font-bold leading-[0.9] tracking-[-0.085em] text-zinc-100"
          testId="not-found-heading"
        />
        <Rise immediate delay={0.3} className="mt-8">
          <p className="max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg" data-testid="not-found-copy">
            The page you're looking for doesn't exist — it may have moved, or never have been here at all.
          </p>
        </Rise>
        <Rise immediate delay={0.45} className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-white/20 px-5 py-4 text-sm text-zinc-100 transition-colors hover:border-[#ff5500] hover:text-[#ff5500]"
            data-testid="not-found-home-link"
          >
            <ArrowLeft className="h-4 w-4" /> Return to ESTROC
          </Link>
        </Rise>
      </div>
      <p className="mx-auto w-full max-w-7xl px-5 pb-8 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 sm:px-8 lg:px-10" data-testid="not-found-status">
        ESTROC / India — building for the world
      </p>
    </div>
  );
}
