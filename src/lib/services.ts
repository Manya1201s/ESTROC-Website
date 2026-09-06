import { Bot, Boxes, Globe2, Zap } from "lucide-react";

export interface BuildCategory {
  name: string;
  description: string;
  services: string[];
  icon: typeof Globe2;
}

/** Single source of truth for what the studio offers. */
export const buildCategories: BuildCategory[] = [
  { name: "Digital Products", description: "From first interface to a product people return to.", services: ["Websites", "Web Apps", "Mobile Apps", "SaaS Products", "MVP Development"], icon: Globe2 },
  { name: "Business Software", description: "The operational systems that make a business move.", services: ["Custom Software", "CRM Systems", "APIs & Integrations", "WhatsApp Solutions"], icon: Boxes },
  { name: "AI & Automation", description: "Useful intelligence designed around the work that matters.", services: ["AI Solutions", "AI Chatbots", "Custom AI Agents", "Workflow Automation"], icon: Bot },
  { name: "Emerging Technology", description: "Complex technology made clear, useful and ready for the real world.", services: ["Blockchain", "Advanced Custom Solutions", "Other Emerging Technologies"], icon: Zap },
];

/**
 * The marquee reads as a chant, so the two catch-all entries are left out —
 * "Other Emerging Technologies" scrolling past says nothing. Everything else
 * comes straight from the categories above and cannot drift out of sync.
 */
const catchAlls = new Set(["Advanced Custom Solutions", "Other Emerging Technologies"]);

export const marqueeServices = buildCategories
  .flatMap((category) => category.services)
  .filter((service) => !catchAlls.has(service));
