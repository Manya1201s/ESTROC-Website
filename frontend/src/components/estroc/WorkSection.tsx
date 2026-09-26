import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { projects, testId as slug } from "@/lib/projects";

/**
 * The live product, usable in place — visitors can scroll and click through it
 * without leaving the page. Its screenshot holds the frame until the site has
 * loaded, so the box is never an empty white rectangle.
 */
function LivePreview({ name, url, poster }: { name: string; url: string; poster: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <img src={poster} alt="" aria-hidden="true" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" data-testid="project-preview-poster" />
      <iframe
        title={`${name} live preview`}
        src={url}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full border-0 bg-white transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        data-testid="project-live-preview"
      />
    </>
  );
}

export default function WorkSection() {
  const [activeProject, setActiveProject] = useState(0);
  const reducedMotion = useReducedMotion();
  const selectedProject = projects[activeProject];

  return (
    <section id="work" className="border-t border-white/[0.08]" data-testid="our-work-section">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <SectionHeading title="OUR WORK" copy="Real products. Real experiences. Built by ESTROC." />

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:items-start">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start" data-testid="project-preview-column">
            <div className="relative aspect-[1.15/1] min-h-[330px] overflow-hidden border border-white/10 bg-[#111113]" data-testid="project-preview">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedProject.name}
                  initial={reducedMotion ? false : { opacity: 0, scale: 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <LivePreview name={selectedProject.name} url={selectedProject.url} poster={selectedProject.preview} />
                </motion.div>
              </AnimatePresence>
              <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" aria-hidden="true" />
            </div>
          </div>

          <div className="min-w-0" data-testid="project-list-column">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProject.name}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 border-b border-white/10 pb-8"
                data-testid="selected-project-details"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="selected-project-category">{selectedProject.category}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-zinc-100 sm:text-4xl" data-testid="selected-project-preview-title">{selectedProject.name}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400" data-testid="selected-project-preview-description">{selectedProject.description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="border-t border-white/10" data-testid="project-list">
              {projects.map((project, index) => (
                <button
                  key={project.name}
                  type="button"
                  onClick={() => setActiveProject(index)}
                  className={`relative flex w-full items-start overflow-hidden border-b border-white/10 py-5 pl-0 text-left transition-[color,padding] duration-300 hover:pl-4 ${activeProject === index ? "pl-4 text-zinc-100" : "text-zinc-600 hover:text-zinc-300"}`}
                  data-testid={`project-card-${slug(project.name)}-button`}
                >
                  {activeProject === index && (
                    <motion.span layoutId="project-active-bar" className="absolute inset-y-0 left-0 w-[2px] bg-[#ff5500]" transition={{ type: "spring", stiffness: 420, damping: 38 }} aria-hidden="true" />
                  )}
                  <span className="min-w-0 pr-4">
                    <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-700">{String(index + 1).padStart(2, "0")}</span>
                    <span className={`mt-2 block text-xl font-medium tracking-tight transition-colors ${activeProject === index ? "text-[#ff5500]" : ""}`} data-testid={`project-title-${slug(project.name)}`}>{project.name}</span>
                    <span className="mt-1 block max-w-[280px] text-[11px] uppercase tracking-wider text-zinc-700">{project.category}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
