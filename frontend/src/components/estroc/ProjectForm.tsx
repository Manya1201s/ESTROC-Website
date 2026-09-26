import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, Check, ChevronDown, Loader2, Send } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import CopyEmail from "@/components/estroc/CopyEmail";
import { countries } from "@/lib/countries";
import { ENQUIRY_EMAIL, submitEnquiry } from "@/lib/submitEnquiry";

export interface ProjectFormValues {
  interests: string[];
  message: string;
  /** Filled by the chat agent rather than this form, and left blank here. */
  stage: string;
  budget: string;
  fullName: string;
  email: string;
  /** Full international number, dial code included, e.g. "+91 98765 43210". */
  phone: string;
}

const interestOptions = ["Website", "Web App", "Mobile App", "SaaS / MVP", "Custom Software", "AI & Automation", "Other"];

/**
 * Extra ways to reach the studio, shown on the success screen only once they
 * point somewhere real — an empty WhatsApp button is worse than none.
 */
const WHATSAPP_URL = "";
const CALL_URL = "";

const emptyForm: ProjectFormValues = { interests: [], message: "", stage: "", budget: "", fullName: "", email: "", phone: "" };

/** One underline instead of a box, so the form reads as a page rather than a panel of controls. */
const lineInput =
  "w-full border-0 border-b border-white/20 bg-transparent px-0 py-3 text-lg text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-[#ff5500] focus:shadow-[0_1px_0_0_#ff5500]";

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ProjectForm() {
  const [form, setForm] = useState<ProjectFormValues>(emptyForm);
  const [countryCode, setCountryCode] = useState("IN");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentVia, setSentVia] = useState<"endpoint" | "email">("endpoint");
  const [error, setError] = useState("");
  const reducedMotion = useReducedMotion();

  const country = countries.find((entry) => entry.code === countryCode) ?? countries[0];

  const update = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleInterest = (option: string) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(option)
        ? current.interests.filter((entry) => entry !== option)
        : [...current.interests, option],
    }));
  };

  const canSubmit =
    form.fullName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.phone.replace(/\D/g, "").length >= 6;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || sending) return;
    setSending(true);
    setError("");
    const result = await submitEnquiry({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      phone: `${country.dial} ${form.phone.trim()}`.trim(),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentVia(result.via);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[390px] flex-col justify-center border border-[#ff5500]/30 bg-[#ff5500]/[0.05] px-6 py-12 sm:px-10"
        data-testid="project-form-success"
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff5500] text-[#0a0a0b]"><Check className="h-6 w-6" /></div>
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5500]" data-testid="project-form-success-label">Transmission received.</p>
        <h3 className="max-w-lg text-3xl font-semibold tracking-tight text-zinc-100" data-testid="project-form-success-title">We'll review your project and come back to you.</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400" data-testid="project-form-success-copy">
          {sentVia === "email"
            ? `Your brief is open in your mail app — press send and it reaches us at ${ENQUIRY_EMAIL}.`
            : "Your brief is with us. Expect a reply within two working days."}
        </p>

        <div className="mt-8 border-t border-white/10 pt-6" data-testid="project-form-success-channels">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">ESTROC / project intake</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <CopyEmail />
            {WHATSAPP_URL && (
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm text-zinc-200 underline-offset-4 transition-colors hover:text-[#ff5500] hover:underline" data-testid="project-form-whatsapp-link">
                Discuss a project on WhatsApp ↗
              </a>
            )}
            {CALL_URL && (
              <a href={CALL_URL} target="_blank" rel="noreferrer" className="text-sm text-zinc-200 underline-offset-4 transition-colors hover:text-[#ff5500] hover:underline" data-testid="project-form-call-link">
                Book a call ↗
              </a>
            )}
          </div>
        </div>

        <Button type="button" variant="outline" className="mt-8 self-start" onClick={() => { setSubmitted(false); setForm(emptyForm); setError(""); }} data-testid="project-form-start-over-button">Start another enquiry</Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10" data-testid="project-form">
      <fieldset>
        <legend className="text-sm font-medium text-zinc-300">Interested in</legend>
        <div className="mt-4 flex flex-wrap gap-3">
          {interestOptions.map((option) => {
            const selected = form.interests.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleInterest(option)}
                aria-pressed={selected}
                className={`border px-5 py-3 text-sm transition-colors ${selected ? "border-[#ff5500] bg-[#ff5500] text-[#0a0a0b]" : "border-white/20 text-zinc-300 hover:border-[#ff5500]/60 hover:text-zinc-100"}`}
                data-testid={`enquiry-interest-${slug(option)}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Your name" htmlFor="full-name">
        <input id="full-name" autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className={lineInput} data-testid="enquiry-full-name-input" />
      </Field>

      <Field label="Email" htmlFor="work-email">
        <input id="work-email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={lineInput} data-testid="enquiry-work-email-input" />
      </Field>

      <Field label="Mobile number" htmlFor="phone">
        <div className="flex items-stretch border-b border-white/20 transition-[border-color,box-shadow] focus-within:border-[#ff5500] focus-within:shadow-[0_1px_0_0_#ff5500]">
          {/* The native select stays on top (invisible) so it keeps the platform
              picker, keyboard support and screen-reader name; only the flag and
              caret beneath it are drawn. */}
          <div className="relative mr-4 flex items-center gap-1.5 border-r border-white/15 pr-3 text-zinc-500 focus-within:text-[#ff5500]">
            <span className="text-xl leading-none" aria-hidden="true">{country.flag}</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            <select
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              aria-label="Country code"
              className="absolute inset-0 cursor-pointer opacity-0"
              data-testid="enquiry-country-select"
            >
              {countries.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}{entry.dial ? ` (${entry.dial})` : ""}
                </option>
              ))}
            </select>
          </div>
          {country.dial && <span className="self-center pr-2 text-lg text-zinc-400" data-testid="enquiry-dial-code">{country.dial}</span>}
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete={country.dial ? "tel-national" : "tel"}
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder={country.dial ? "" : "+00 000 000 0000"}
            className="w-full min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-lg text-zinc-100 outline-none placeholder:text-zinc-600"
            data-testid="enquiry-phone-input"
          />
        </div>
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea id="message" rows={4} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Tell us a little about what you're building" className={`${lineInput} resize-none`} data-testid="enquiry-message-input" />
      </Field>

      {error && (
        <p className="flex items-start gap-2 border border-[#ff5500]/25 bg-[#ff5500]/[0.06] px-4 py-3 text-sm text-[#ff9a6b]" role="alert" data-testid="enquiry-submit-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} You can also email us directly at <a href={`mailto:${ENQUIRY_EMAIL}`} className="underline underline-offset-2">{ENQUIRY_EMAIL}</a>.</span>
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!canSubmit || sending} data-testid="enquiry-submit-button">
          {sending ? <>Sending<Loader2 className="ml-2 h-4 w-4 animate-spin" /></> : <>Start<Send className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-300" data-testid={`label-${htmlFor}`}>{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
