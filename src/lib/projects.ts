export interface Project {
  name: string;
  /** Used as the build-console argument: `estroc build <slug>`. */
  slug: string;
  category: string;
  description: string;
  /** Public, frameable product URL, live in the work section's preview box. */
  url: string;
  /**
   * Screenshot shown in the preview box while the live site loads, captured at
   * the box's 1.15:1 ratio and roughly its width.
   */
  preview: string;
  /**
   * What the product actually does, read off the live site — printed line by
   * line in the hero console. Around 40 characters is the most that stays on
   * one line there on a desktop (33 on a phone, where longer lines wrap), and
   * every project keeps the same line count so the console does not change
   * height between builds.
   */
  summary: string[];
}

/** Single source of truth for the hero console and the work section. */
export const projects: Project[] = [
  {
    name: "RAVE LUX",
    slug: "rave-lux",
    category: "LUXURY E-COMMERCE / DIGITAL PRODUCT",
    description: "A members-only luxury storefront for eyewear and fine goods, built around curated collections and concierge enquiries.",
    url: "https://ravelux-app.vercel.app/",
    preview: "/work/rave-lux.webp",
    summary: [
      "members-only luxury e-commerce platform",
      "curated eyewear, jewellery & leather",
      "campaign-led collection storytelling",
      "concierge enquiries & private viewings",
      "new arrivals, sale & support pages",
    ],
  },
  {
    name: "NewAgeNaukri.online",
    slug: "newagenaukri",
    category: "JOB / RECRUITMENT PLATFORM",
    description: "An AI-powered hiring platform that matches candidates to roles, for job seekers and recruiters alike.",
    url: "https://newagenaukri.online/",
    preview: "/work/newagenaukri.webp",
    summary: [
      "ai job matching for talent & roles",
      "job seekers discover matching roles",
      "recruiters shortlist candidates faster",
      "job posting & applications on autopilot",
      "trusted platform, secure by default",
    ],
  },
  {
    name: "CYBER VAULT",
    slug: "cyber-vault",
    category: "SECURITY / ENCRYPTED VAULT",
    description: "A local-first vault that keeps credentials and files encrypted on your own devices, unlocked by biometrics and synced without a server.",
    url: "https://cyber-vault.vercel.app/",
    preview: "/work/cyber-vault.webp",
    summary: [
      "local-first vault, nothing in the cloud",
      "biometric unlock, no master password",
      "aes-256 encryption on every record",
      "p2p device sync + tamper-evident audit",
      "zero-knowledge dead-drop file transit",
    ],
  },
  {
    name: "TRUSTLENS",
    slug: "trustlens",
    category: "AI / DOCUMENT INTELLIGENCE",
    description: "An AI co-pilot that explains legal documents in plain language, verifies sources and flags misinformation.",
    url: "https://trust-lens-one.vercel.app/",
    preview: "/work/trustlens.webp",
    summary: [
      "ai co-pilot for complex legal documents",
      "plain-language contract breakdowns",
      "source verification with trust scores",
      "misinformation detection & flagging",
      "educational legal resources",
    ],
  },
];

export const testId = (name: string) => name.toLowerCase().replaceAll(".", "").replaceAll(" ", "-");
