import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ENQUIRY_EMAIL, submitEnquiry } from "@/lib/submitEnquiry";
import type { ProjectFormValues } from "@/components/estroc/ProjectForm";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VisitorDetails {
  fullName: string;
  email: string;
  phone: string;
  company: string;
}

interface ChatLead {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  services?: string[];
  details?: string;
  stage?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  visitor: VisitorDetails;
}

const quickActions = [
  "Build a website",
  "Build a mobile app",
  "Build a SaaS product",
  "AI solution",
  "Custom software",
];

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

const greeting: ChatMessage = {
  role: "assistant",
  content:
    "Hi! What are you looking to build? Tell me a little about your idea, product or business and we'll take it from there.",
};

function normalizeLead(
  lead: ChatLead,
  visitor: VisitorDetails
): ProjectFormValues {
  return {
    interests: Array.isArray(lead.services) ? lead.services : [],
    message: lead.details ?? "",
    stage: lead.stage ?? "",
    budget: lead.budget ?? "",
    fullName: lead.fullName || visitor.fullName,
    email: lead.email || visitor.email,
    phone: lead.phone || visitor.phone,
  };
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void
): Promise<ChatLead | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let lead: ChatLead | null = null;
  let streamError = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame
        .split("\n")
        .find((candidate) => candidate.startsWith("data:"));

      if (!line) continue;

      let event: {
        type?: string;
        text?: string;
        lead?: ChatLead;
        error?: string;
      };

      try {
        event = JSON.parse(line.slice(5));
      } catch {
        continue;
      }

      if (event.type === "delta" && event.text) {
        onText(event.text);
      } else if (event.type === "lead") {
        lead = event.lead ?? null;
      } else if (event.type === "error") {
        streamError =
          event.error || "Something went wrong. Please try again.";
      }
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }

  return lead;
}

export default function Chatbot({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);

  const [detailsSubmitted, setDetailsSubmitted] = useState(false);

  const [visitor, setVisitor] = useState<VisitorDetails>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
  });

  const [detailsForm, setDetailsForm] = useState<VisitorDetails>({
    fullName: "",
    email: "",
    phone: "",
    company: "",
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const [error, setError] = useState("");

  const [leadCaptured, setLeadCaptured] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const streamingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const updateDetails = (
    key: keyof VisitorDetails,
    value: string
  ) => {
    setDetailsForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const startConversation = (event: React.FormEvent) => {
    event.preventDefault();

    const name = detailsForm.fullName.trim();
    const email = detailsForm.email.trim();
    const phone = detailsForm.phone.trim();
    const company = detailsForm.company.trim();

    if (!name || !email || !phone) {
      setError("Please enter your name, email and phone number.");
      return;
    }

    setError("");

    const submittedVisitor = {
      fullName: name,
      email,
      phone,
      company,
    };

    setVisitor(submittedVisitor);
    setDetailsSubmitted(true);
    setMessages([{
      ...greeting,
      content: `Hi ${name.split(" ")[0]}! What are you looking to build? Tell me a little about your idea, product or business and we'll take it from there.`,
    }]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();

    if (
      !trimmed ||
      sending ||
      leadCaptured ||
      !detailsSubmitted
    ) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: trimmed,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    streamingRef.current = false;

    try {
      const payload: ChatRequest = {
        messages: nextMessages,
        visitor,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok || !response.body) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data.detail ||
            data.error ||
            "Something went wrong."
        );
      }

      const lead = await readStream(
        response.body,
        (text) => {
          if (!streamingRef.current) {
            streamingRef.current = true;
            setStreaming(true);

            setMessages((current) => [
              ...current,
              {
                role: "assistant",
                content: text,
              },
            ]);

            return;
          }

          setMessages((current) => [
            ...current.slice(0, -1),
            {
              role: "assistant",
              content:
                current[current.length - 1].content +
                text,
            },
          ]);
        }
      );

      if (lead) {
        const result = await submitEnquiry(
          normalizeLead(lead, visitor)
        );

        setLeadCaptured(true);

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              result.ok && result.via === "email"
                ? `Thanks, ${visitor.fullName.split(" ")[0]}. Your project brief is ready. Your mail app will open so you can send it to us at ${ENQUIRY_EMAIL}.`
                : "Thanks — we've got your project brief. Our team will review it and get back to you shortly.",
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
      setStreaming(false);
      streamingRef.current = false;
    }
  };

  const reset = () => {
    setMessages([]);
    setLeadCaptured(false);
    setError("");
    setInput("");
    setDetailsSubmitted(false);

    setVisitor({
      fullName: "",
      email: "",
      phone: "",
      company: "",
    });

    setDetailsForm({
      fullName: "",
      email: "",
      phone: "",
      company: "",
    });
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7 ${
        hidden ? "hidden" : ""
      }`}
      data-testid="chatbot-widget"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            className="mb-3 flex h-[min(600px,calc(100vh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden border border-white/15 bg-[#111113] shadow-2xl shadow-black/50"
            data-testid="chatbot-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p
                  className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#ff5500]"
                  data-testid="chatbot-kicker"
                >
                  ESTROC AI
                </p>

                <p
                  className="mt-1 text-xs text-zinc-500"
                  data-testid="chatbot-status"
                >
                  {streaming
                    ? "Responding…"
                    : sending
                    ? "Thinking…"
                    : detailsSubmitted
                    ? "Project discussion"
                    : "Quick project intake"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
                  aria-label="Start a new conversation"
                  data-testid="chatbot-reset-button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
                  aria-label="Close chatbot"
                  data-testid="chatbot-close-button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Initial visitor details */}
            {!detailsSubmitted ? (
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="mb-6">
                  <p className="text-lg font-medium text-zinc-100">
                    Let’s get to know you first.
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Share a few details and then we can discuss your project.
                  </p>
                </div>

                <form
                  onSubmit={startConversation}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                      Full name *
                    </label>

                    <input
                      type="text"
                      value={detailsForm.fullName}
                      onChange={(event) =>
                        updateDetails(
                          "fullName",
                          event.target.value
                        )
                      }
                      placeholder="Your name"
                      className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#ff5500]/60"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                      Email *
                    </label>

                    <input
                      type="email"
                      value={detailsForm.email}
                      onChange={(event) =>
                        updateDetails(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="you@company.com"
                      className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#ff5500]/60"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                      Phone number *
                    </label>

                    <input
                      type="tel"
                      value={detailsForm.phone}
                      onChange={(event) =>
                        updateDetails(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="+91 98765 43210"
                      className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#ff5500]/60"
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                      Company / organisation
                    </label>

                    <input
                      type="text"
                      value={detailsForm.company}
                      onChange={(event) =>
                        updateDetails(
                          "company",
                          event.target.value
                        )
                      }
                      placeholder="Company name"
                      className="h-11 w-full border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-[#ff5500]/60"
                      autoComplete="organization"
                    />
                  </div>

                  {error && (
                    <p
                      className="text-xs text-[#ff9a6b]"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="mt-2 h-11 w-full bg-[#ff5500] text-[#0a0a0b] hover:bg-[#ff6a20]"
                  >
                    Start project discussion
                    <Send className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-center text-[10px] leading-relaxed text-zinc-600">
                    Your details are used to help our team follow up
                    about your project.
                  </p>
                </form>
              </div>
            ) : (
              <>
                {/* Chat messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
                  data-testid="chatbot-messages"
                >
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

                      {streaming &&
                        index === messages.length - 1 &&
                        message.role === "assistant" && (
                          <span
                            className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-[#ff5500]"
                            aria-hidden="true"
                          />
                        )}
                    </div>
                  ))}

                  {sending && !streaming && (
                    <div
                      className="mr-auto flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-500"
                      data-testid="chatbot-typing-indicator"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Thinking…
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                {messages.length <= 1 &&
                  !sending &&
                  !leadCaptured && (
                    <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
                      {quickActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => sendMessage(action)}
                          className="border border-white/10 px-3 py-2 text-left text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-[#ff5500]/50 hover:text-zinc-100"
                          data-testid={`chatbot-quick-action-${action
                            .toLowerCase()
                            .replaceAll(" ", "-")}-button`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                {error && (
                  <p
                    className="border-t border-[#ff5500]/25 bg-[#ff5500]/[0.06] px-4 py-3 text-xs text-[#ff9a6b]"
                    role="alert"
                    data-testid="chatbot-error"
                  >
                    {error}
                  </p>
                )}

                {/* Chat input */}
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
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    placeholder={
                      leadCaptured
                        ? "Conversation complete"
                        : "Type a message…"
                    }
                    disabled={
                      sending || leadCaptured
                    }
                    className="h-9 flex-1 border border-white/10 bg-transparent px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#ff5500]/50 disabled:opacity-50"
                    data-testid="chatbot-input"
                  />

                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      sending ||
                      leadCaptured ||
                      !input.trim()
                    }
                    aria-label="Send message"
                    data-testid="chatbot-send-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot trigger */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ml-auto flex items-center gap-2 border border-white/15 bg-[#111113] px-4 py-3 text-xs font-medium text-zinc-100 shadow-xl shadow-black/30 transition-colors hover:border-[#ff5500]/60 hover:text-[#ff9a6b]"
        aria-label="Open ESTROC AI chatbot"
        data-testid="chatbot-trigger-button"
      >
        <MessageCircle className="h-4 w-4 text-[#ff5500]" />
        {open ? "Close" : "ESTROC AI"}
      </button>
    </div>
  );
}