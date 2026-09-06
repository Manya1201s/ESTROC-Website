import { useState } from "react";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface ChatbotProps {
  onStartProject: (service?: string) => void;
}

const quickActions = ["Build a website", "Build a mobile app", "Build a SaaS product", "AI solution", "Custom software"];

export default function Chatbot({ onStartProject }: ChatbotProps) {
  const [open, setOpen] = useState(false);

  return <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7" data-testid="chatbot-widget">
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="mb-3 w-[min(350px,calc(100vw-2rem))] overflow-hidden border border-white/15 bg-[#111113] shadow-2xl shadow-black/50" data-testid="chatbot-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><div><p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="chatbot-kicker">ESTROC AI</p><p className="mt-1 text-xs text-zinc-500" data-testid="chatbot-status">Guided project intake</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Close chatbot" data-testid="chatbot-close-button"><X className="h-4 w-4" /></button></div>
        <div className="px-4 py-5"><p className="text-lg font-medium tracking-tight text-zinc-100" data-testid="chatbot-opening-message">Hi. What are you looking to build?</p><p className="mt-2 text-xs leading-relaxed text-zinc-500" data-testid="chatbot-disclaimer">Choose a direction and we’ll take you to the project intake. No live AI is connected here yet.</p><div className="mt-5 flex flex-wrap gap-2">{quickActions.map((action) => <button key={action} type="button" onClick={() => onStartProject(action.replace(/^Build a /, "").replace(/^AI solution$/, "AI Solution").replace(/^Custom software$/, "Custom Software"))} className="border border-white/10 px-3 py-2 text-left text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-[#ff5500]/50 hover:text-zinc-100" data-testid={`chatbot-quick-action-${action.toLowerCase().replaceAll(" ", "-")}-button`}>{action}</button>)}</div><Button type="button" className="mt-5 w-full" onClick={() => onStartProject()} data-testid="chatbot-start-project-button">Start a project<ArrowUpRight className="ml-2 h-4 w-4" /></Button></div>
      </motion.div>}
    </AnimatePresence>
    <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex items-center gap-2 border border-white/15 bg-[#111113] px-4 py-3 text-xs font-medium text-zinc-100 shadow-xl shadow-black/30 transition-colors hover:border-[#ff5500]/60 hover:text-[#ff9a6b]" aria-label="Open ESTROC AI chatbot" data-testid="chatbot-trigger-button"><MessageCircle className="h-4 w-4 text-[#ff5500]" />{open ? "Close" : "ESTROC AI"}</button>
  </div>;
}