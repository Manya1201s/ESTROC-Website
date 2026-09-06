export interface Project {
  name: string;
  /** Used as the build-console argument: `estroc build <slug>`. */
  slug: string;
  category: string;
  description: string;
  /** Public, frameable product URL. `null` renders the "link pending" state. */
  url: string | null;
}

/** Single source of truth for the hero console and the work section. */
export const projects: Project[] = [
  { name: "RAVE LUX", slug: "rave-lux", category: "LUXURY E-COMMERCE / DIGITAL PRODUCT", description: "A luxury e-commerce product experience.", url: "https://ravelux-app.vercel.app/" },
  // The previous share.google link redirected to a Google search page — it framed
  // as a blank box and sent "View project" off-site. Restore with the real URL.
  { name: "TRUESIGN MEDIA", slug: "truesign-media", category: "OUTDOOR ADVERTISING & BILLBOARD SOLUTIONS", description: "A platform for outdoor advertising and billboard solutions.", url: null },
  { name: "NewAgeNaukri.online", slug: "newagenaukri", category: "JOB / RECRUITMENT PLATFORM", description: "A job and recruitment platform.", url: "https://newagenaukri.online/" },
  { name: "CYBER VAULT", slug: "cyber-vault", category: "SECURE BACKEND SYSTEM / CYBER VAULT", description: "A secure backend system.", url: "https://cyber-vault.vercel.app/" },
  { name: "TRUSTLENS", slug: "trustlens", category: "SECURE INTELLIGENCE & DOCUMENT VERIFICATION", description: "A secure intelligence and document verification product.", url: "https://trust-lens-one.vercel.app/" },
  { name: "AUTOMAN", slug: "automan", category: "INDUSTRIAL ADMIN ASSISTANT / AI CHATBOT", description: "An industrial admin assistant and AI chatbot project.", url: null },
];

/** The hero console leads with work a visitor can open right now. */
export const liveProjects = projects.filter((project) => project.url !== null);

export const testId = (name: string) => name.toLowerCase().replaceAll(".", "").replaceAll(" ", "-");
