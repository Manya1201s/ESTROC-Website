import type { ProjectFormValues } from "@/components/estroc/ProjectForm";

/** Where enquiries land. Any endpoint that accepts a JSON POST works. */
const ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT as string | undefined;
export const ENQUIRY_EMAIL = "hello@estroc.com";

export type SubmitResult = { ok: true; via: "endpoint" | "email" } | { ok: false; error: string };

function asPlainText(form: ProjectFormValues) {
  return [
    `Name:      ${form.fullName}`,
    `Email:     ${form.email}`,
    `Company:   ${form.company || "—"}`,
    `Phone:     ${form.phone || "—"}`,
    `Services:  ${form.services.join(", ") || "—"}`,
    `Stage:     ${form.stage || "—"}`,
    `Budget:    ${form.budget || "—"}`,
    `Timeline:  ${form.timeline || "—"}`,
    `Referral:  ${form.referral || "—"}`,
    "",
    "Project details",
    form.details || "—",
    "",
    "Additional notes",
    form.notes || "—",
  ].join("\n");
}

/**
 * Posts the brief to the configured endpoint. With no endpoint set the brief is
 * handed to the visitor's mail client instead — a seven-step form that silently
 * discards the answer is worse than one that makes the visitor press send.
 */
export async function submitEnquiry(form: ProjectFormValues): Promise<SubmitResult> {
  if (ENDPOINT) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString(), source: "estroc.com" }),
      });
      if (!response.ok) return { ok: false, error: `The form service replied ${response.status}.` };
      return { ok: true, via: "endpoint" };
    } catch {
      return { ok: false, error: "Could not reach the form service. Check your connection and try again." };
    }
  }

  const subject = `New project enquiry — ${form.fullName}${form.company ? ` (${form.company})` : ""}`;
  window.location.href = `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(asPlainText(form))}`;
  return { ok: true, via: "email" };
}
