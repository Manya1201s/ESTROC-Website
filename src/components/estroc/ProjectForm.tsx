import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ENQUIRY_EMAIL, submitEnquiry } from "@/lib/submitEnquiry";

export interface ProjectFormValues {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  services: string[];
  details: string;
  stage: string;
  budget: string;
  timeline: string;
  referral: string;
  notes: string;
}

interface ProjectFormProps {
  initialService?: string;
}

const services = ["Website", "Mobile App", "SaaS Product", "MVP", "Custom Software", "CRM", "WhatsApp Solution", "AI Solution", "AI Chatbot", "AI Agent", "Workflow Automation", "Blockchain", "Other"];
const stages = ["Just an idea", "Planning", "MVP required", "Existing product", "Need improvements", "Scaling an existing product"];
const budgets = ["Under $5K", "$5K – $15K", "$15K – $30K", "$30K – $50K", "$50K+", "Not sure yet"];
const timelines = ["ASAP", "1–2 months", "2–4 months", "4–6 months", "6+ months", "Flexible"];
const stepLabels = ["About you", "What you're building", "Project details", "Project stage", "Budget", "Timeline", "Additional information"];

const emptyForm: ProjectFormValues = {
  fullName: "", email: "", company: "", phone: "", services: [], details: "", stage: "", budget: "", timeline: "", referral: "", notes: "",
};

export default function ProjectForm({ initialService }: ProjectFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProjectFormValues>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentVia, setSentVia] = useState<"endpoint" | "email">("endpoint");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialService && !form.services.includes(initialService)) {
      setForm((current) => ({ ...current, services: [...current.services, initialService] }));
      setStep(1);
    }
  }, [initialService, form.services]);

  const update = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleService = (service: string) => {
    update("services", form.services.includes(service) ? form.services.filter((item) => item !== service) : [...form.services, service]);
  };

  const canContinue = useMemo(() => {
    if (step === 0) return form.fullName.trim().length > 1 && form.email.includes("@");
    if (step === 1) return form.services.length > 0;
    if (step === 2) return form.details.trim().length > 10;
    if (step === 3) return Boolean(form.stage);
    if (step === 4) return Boolean(form.budget);
    if (step === 5) return Boolean(form.timeline);
    return true;
  }, [form, step]);

  const handleSubmit = async () => {
    setSending(true);
    setError("");
    const result = await submitEnquiry(form);
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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[390px] flex-col items-center justify-center border border-[#ff5500]/30 bg-[#ff5500]/[0.05] px-6 text-center" data-testid="project-form-success">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff5500] text-[#0a0a0b]"><Check className="h-6 w-6" /></div>
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5500]" data-testid="project-form-success-label">Project received.</p>
        <h3 className="max-w-lg text-3xl font-semibold tracking-tight text-zinc-100" data-testid="project-form-success-title">Thanks. We’ll be in touch.</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400" data-testid="project-form-success-copy">
          {sentVia === "email"
            ? `Your brief is open in your mail app — press send and it reaches us at ${ENQUIRY_EMAIL}.`
            : "Your brief is with us. Expect a reply within two working days."}
        </p>
        <Button type="button" variant="outline" className="mt-8" onClick={() => { setSubmitted(false); setStep(0); setForm(emptyForm); setError(""); }} data-testid="project-form-start-over-button">Start another enquiry</Button>
      </motion.div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#111113]" data-testid="project-form">
      <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="project-form-step-label">Step {step + 1} / {stepLabels.length}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100" data-testid="project-form-step-title">{stepLabels[step]}</h3>
        </div>
        <div className="w-full sm:w-48">
          <div className="mb-2 flex justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-600"><span>Progress</span><span>{Math.round(((step + 1) / stepLabels.length) * 100)}%</span></div>
          <div className="h-1 bg-white/10"><motion.div className="h-full bg-[#ff5500]" animate={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} /></div>
        </div>
      </div>

      <div className="min-h-[330px] px-5 py-7 sm:px-8 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
            {step === 0 && <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="full-name"><Input id="full-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your name" data-testid="enquiry-full-name-input" /></Field>
              <Field label="Work email" htmlFor="work-email"><Input id="work-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@company.com" data-testid="enquiry-work-email-input" /></Field>
              <Field label="Company / organization" htmlFor="company"><Input id="company" value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company name" data-testid="enquiry-company-input" /></Field>
              <Field label="Phone number" htmlFor="phone"><Input id="phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Optional" data-testid="enquiry-phone-input" /></Field>
            </div>}

            {step === 1 && <div><p className="mb-5 text-sm text-zinc-400" data-testid="enquiry-services-copy">Select everything that sounds like your next build.</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => <button key={service} type="button" onClick={() => toggleService(service)} className={`flex items-center justify-between border px-4 py-3 text-left text-sm transition-colors ${form.services.includes(service) ? "border-[#ff5500]/70 bg-[#ff5500]/10 text-zinc-100" : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`} data-testid={`enquiry-service-${service.toLowerCase().replaceAll(" ", "-")}-button`}><span>{service}</span>{form.services.includes(service) && <Check className="h-4 w-4 text-[#ff5500]" />}</button>)}</div></div>}

            {step === 2 && <Field label="Tell us about your idea, product, business problem or requirements." htmlFor="project-details"><Textarea id="project-details" value={form.details} onChange={(event) => update("details", event.target.value)} placeholder="What are you working on? What should it help people do?" className="min-h-48 resize-none" data-testid="enquiry-project-details-textarea" /></Field>}
            {step === 3 && <ChoiceGrid label="Where is the project today?" values={stages} value={form.stage} onChange={(value) => update("stage", value)} testIdPrefix="enquiry-stage" />}
            {step === 4 && <ChoiceGrid label="What range are you working within?" values={budgets} value={form.budget} onChange={(value) => update("budget", value)} testIdPrefix="enquiry-budget" />}
            {step === 5 && <ChoiceGrid label="When would you like to move?" values={timelines} value={form.timeline} onChange={(value) => update("timeline", value)} testIdPrefix="enquiry-timeline" />}
            {step === 6 && <div className="grid gap-5"><Field label="How did you hear about us?" htmlFor="referral"><Input id="referral" value={form.referral} onChange={(event) => update("referral", event.target.value)} placeholder="A referral, search, social…" data-testid="enquiry-referral-input" /></Field><Field label="Additional notes / links / references" htmlFor="additional-notes"><Textarea id="additional-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Anything else we should know?" className="min-h-32 resize-none" data-testid="enquiry-additional-notes-textarea" /></Field></div>}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <p className="flex items-start gap-2 border-t border-[#ff5500]/25 bg-[#ff5500]/[0.06] px-5 py-4 text-sm text-[#ff9a6b] sm:px-8" role="alert" data-testid="enquiry-submit-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} You can also email us directly at <a href={`mailto:${ENQUIRY_EMAIL}`} className="underline underline-offset-2">{ENQUIRY_EMAIL}</a>.</span>
        </p>
      )}

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-5 sm:px-8">
        <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || sending} data-testid="enquiry-previous-step-button"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        {step < stepLabels.length - 1 ? <Button type="button" onClick={() => setStep((current) => Math.min(stepLabels.length - 1, current + 1))} disabled={!canContinue} data-testid="enquiry-next-step-button">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={handleSubmit} disabled={!canContinue || sending} data-testid="enquiry-submit-button">{sending ? <>Sending<Loader2 className="ml-2 h-4 w-4 animate-spin" /></> : <>Start the conversation<Send className="ml-2 h-4 w-4" /></>}</Button>}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor} className="text-xs font-mono uppercase tracking-wider text-zinc-500" data-testid={`label-${htmlFor}`}>{label}</Label>{children}</div>;
}

function ChoiceGrid({ label, values, value, onChange, testIdPrefix }: { label: string; values: string[]; value: string; onChange: (value: string) => void; testIdPrefix: string }) {
  return <div><p className="mb-5 text-sm text-zinc-400" data-testid={`${testIdPrefix}-copy`}>{label}</p><div className="grid gap-2 sm:grid-cols-2">{values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`border px-4 py-4 text-left text-sm transition-colors ${value === item ? "border-[#ff5500] bg-[#ff5500]/10 text-zinc-100" : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200"}`} data-testid={`${testIdPrefix}-${item.toLowerCase().replaceAll(" ", "-").replaceAll("$", "usd")}-button`}>{item}</button>)}</div></div>;
}