import type { ProjectFormValues } from "@/components/estroc/ProjectForm";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
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
 * Posts the brief to the backend, which emails it to the studio inbox. If the
 * backend is unreachable, the brief is handed to the visitor's mail client
 * instead — a form that silently discards the answer is worse than one that
 * makes the visitor press send.
 */
export async function submitEnquiry(form: ProjectFormValues): Promise<SubmitResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) throw new Error(`The mail service replied ${response.status}.`);
    return { ok: true, via: "endpoint" };
  } catch {
    const subject = `New project enquiry — ${form.fullName}${form.company ? ` (${form.company})` : ""}`;
    window.location.href = `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(asPlainText(form))}`;
    return { ok: true, via: "email" };
  }
}
