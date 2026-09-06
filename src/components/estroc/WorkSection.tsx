import { useState } from "react";
import { ExternalLink, MoveUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { projects, testId as slug } from "@/lib/projects";

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
                  {selectedProject.url ? (
                    <iframe
                      title={`${selectedProject.name} live preview`}
                      src={selectedProject.url}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full border-0 bg-white"
                      data-testid="project-live-preview"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d0d0f] px-8 text-center" data-testid="project-preview-unavailable">
                      <span className="grid-fade h-24 w-24 border border-white/10" aria-hidden="true" />
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-600">Live preview pending</p>
                      <p className="max-w-[26ch] text-sm text-zinc-500">{selectedProject.name} is built and running privately. A public link is on the way.</p>
                    </div>
                  )}
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
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {selectedProject.url ? (
                    <a href={selectedProject.url} target="_blank" rel="noreferrer" className="wipe-link inline-flex shrink-0 items-center gap-2 border border-white/15 px-4 py-3 text-xs font-medium text-zinc-100" data-testid="selected-project-view-button">
                      <span className="relative z-10 inline-flex items-center gap-2">View project<ExternalLink className="h-3.5 w-3.5" /></span>
                    </a>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-2 border border-dashed border-white/15 px-4 py-3 text-xs text-zinc-600" data-testid="selected-project-disabled-button">Link pending</span>
                  )}
                  <p className="text-xs text-zinc-600" data-testid="selected-project-note">
                    {selectedProject.url ? "Open in a new tab to explore the live product." : "Ask us for a walkthrough of this build."}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="border-t border-white/10" data-testid="project-list">
              {projects.map((project, index) => (
                <button
                  key={project.name}
                  type="button"
                  onClick={() => setActiveProject(index)}
                  className={`group relative flex w-full items-start justify-between overflow-hidden border-b border-white/10 py-5 pl-0 text-left transition-[color,padding] duration-300 hover:pl-4 ${activeProject === index ? "pl-4 text-zinc-100" : "text-zinc-600 hover:text-zinc-300"}`}
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
                  <MoveUpRight className={`mt-2 h-4 w-4 shrink-0 transition-transform duration-300 ${activeProject === index ? "translate-x-1 -translate-y-1 text-[#ff5500]" : "text-zinc-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
