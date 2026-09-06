import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const emptyForm: ProjectFormValues = {
  fullName: "", email: "", company: "", phone: "", services: [], details: "", stage: "", budget: "", timeline: "", referral: "", notes: "",
};

export default function ProjectForm() {
  const [form, setForm] = useState<ProjectFormValues>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentVia, setSentVia] = useState<"endpoint" | "email">("endpoint");
  const [error, setError] = useState("");

  const update = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canSubmit = useMemo(
    () => form.fullName.trim().length > 1 && form.email.includes("@") && form.phone.trim().length > 1,
    [form],
  );

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
        <Button type="button" variant="outline" className="mt-8" onClick={() => { setSubmitted(false); setForm(emptyForm); setError(""); }} data-testid="project-form-start-over-button">Start another enquiry</Button>
      </motion.div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#111113]" data-testid="project-form">
      <div className="border-b border-white/10 px-5 py-5 sm:px-8">
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#ff5500]" data-testid="project-form-step-label">Get started</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100" data-testid="project-form-step-title">About you</h3>
      </div>

      <div className="px-5 py-7 sm:px-8 sm:py-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full-name"><Input id="full-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your name" data-testid="enquiry-full-name-input" /></Field>
          <Field label="Work email" htmlFor="work-email"><Input id="work-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@company.com" data-testid="enquiry-work-email-input" /></Field>
          <Field label="Company / organization" htmlFor="company"><Input id="company" value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company name" data-testid="enquiry-company-input" /></Field>
          <Field label="Phone number" htmlFor="phone"><Input id="phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Your phone number" data-testid="enquiry-phone-input" /></Field>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 border-t border-[#ff5500]/25 bg-[#ff5500]/[0.06] px-5 py-4 text-sm text-[#ff9a6b] sm:px-8" role="alert" data-testid="enquiry-submit-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} You can also email us directly at <a href={`mailto:${ENQUIRY_EMAIL}`} className="underline underline-offset-2">{ENQUIRY_EMAIL}</a>.</span>
        </p>
      )}

      <div className="flex items-center justify-end border-t border-white/10 px-5 py-5 sm:px-8">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit || sending} data-testid="enquiry-submit-button">{sending ? <>Sending<Loader2 className="ml-2 h-4 w-4 animate-spin" /></> : <>Start the conversation<Send className="ml-2 h-4 w-4" /></>}</Button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor} className="text-xs font-mono uppercase tracking-wider text-zinc-500" data-testid={`label-${htmlFor}`}>{label}</Label>{children}</div>;
}
