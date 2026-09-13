import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ENQUIRY_EMAIL, submitEnquiry } from "@/lib/submitEnquiry";
import type { ProjectFormValues } from "@/components/estroc/ProjectForm";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const quickActions = ["Build a website", "Build a mobile app", "Build a SaaS product", "AI solution", "Custom software"];

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

const greeting: ChatMessage = {
  role: "assistant",
  content: "Hi. What are you looking to build? Tell me a bit about it and I’ll take it from there.",
};

/** The fields the backend's submit_lead tool can return. */
interface ChatLead {
  fullName?: string;
  email?: string;
  phone?: string;
  services?: string[];
  details?: string;
  stage?: string;
  budget?: string;
}

/** Maps the agent's lead onto the same fields the project form sends. */
function normalizeLead(lead: ChatLead): ProjectFormValues {
  return {
    interests: Array.isArray(lead.services) ? lead.services : [],
    message: lead.details ?? "",
    stage: lead.stage ?? "",
    budget: lead.budget ?? "",
    fullName: lead.fullName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
  };
}

export default function Chatbot({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || leadCaptured) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");

      setMessages((current) => [...current, { role: "assistant", content: data.reply || "…" }]);

      if (data.lead) {
        const result = await submitEnquiry(normalizeLead(data.lead));
        setLeadCaptured(true);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              result.ok && result.via === "email"
                ? `Your brief is open in your mail app — press send and it reaches us at ${ENQUIRY_EMAIL}.`
                : "Thanks — we've got your brief. Expect a reply within two working days.",
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setMessages([greeting]);
    setLeadCaptured(false);
    setError("");
    setInput("");
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7 ${hidden ? "hidden" : ""}`} data-testid="chatbot-widget">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="mb-3 flex h-[min(560px,calc(100vh-8rem))] w-[min(370px,calc(100vw-2rem))] flex-col overflow-hidden border border-white/15 bg-[#111113] shadow-2xl shadow-black/50"
            data-testid="chatbot-panel"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="chatbot-kicker">ESTROC AI</p>
                <p className="mt-1 text-xs text-zinc-500" data-testid="chatbot-status">{sending ? "Thinking…" : "Guided project intake"}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={reset} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Start a new conversation" data-testid="chatbot-reset-button">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100" aria-label="Close chatbot" data-testid="chatbot-close-button">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="chatbot-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    message.role === "assistant"
                      ? "mr-auto border border-white/10 bg-white/[0.04] text-zinc-200"
                      : "ml-auto bg-[#ff5500] text-[#0a0a0b]"
                  }`}
                  data-testid={`chatbot-message-${message.role}-${index}`}
                >
                  {message.content}
                </div>
              ))}
              {sending && (
                <div className="mr-auto flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-500" data-testid="chatbot-typing-indicator">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              )}
            </div>

            {messages.length <= 1 && !sending && (
              <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendMessage(action)}
                    className="border border-white/10 px-3 py-2 text-left text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-[#ff5500]/50 hover:text-zinc-100"
                    data-testid={`chatbot-quick-action-${action.toLowerCase().replaceAll(" ", "-")}-button`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="border-t border-[#ff5500]/25 bg-[#ff5500]/[0.06] px-4 py-3 text-xs text-[#ff9a6b]" role="alert" data-testid="chatbot-error">
                {error}
              </p>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={leadCaptured ? "Conversation complete" : "Type a message…"}
                disabled={sending || leadCaptured}
                className="h-9 flex-1 border border-white/10 bg-transparent px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#ff5500]/50 disabled:opacity-50"
                data-testid="chatbot-input"
              />
              <Button type="submit" size="icon" disabled={sending || leadCaptured || !input.trim()} aria-label="Send message" data-testid="chatbot-send-button">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ml-auto flex items-center gap-2 border border-white/15 bg-[#111113] px-4 py-3 text-xs font-medium text-zinc-100 shadow-xl shadow-black/30 transition-colors hover:border-[#ff5500]/60 hover:text-[#ff9a6b]"
        aria-label="Open ESTROC AI chatbot"
        data-cursor="Ask"
        data-testid="chatbot-trigger-button"
      >
        <MessageCircle className="h-4 w-4 text-[#ff5500]" />
        {open ? "Close" : "ESTROC AI"}
      </button>
    </div>
  );
}
