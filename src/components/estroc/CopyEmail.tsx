import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ENQUIRY_EMAIL } from "@/lib/submitEnquiry";

/**
 * The studio address, copied on click.
 *
 * A mailto link hands the visitor off to whatever mail client the machine has
 * registered, which on a shared or work machine is often nothing at all.
 * Copying keeps the address in reach either way, and the clipboard call is
 * wrapped because browsers refuse it outright in some contexts.
 */
export default function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ENQUIRY_EMAIL);
      setCopied(true);
      setFailed(false);
    } catch {
      // No clipboard permission — the address is still on screen to read.
      setFailed(true);
      setCopied(false);
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setCopied(false); setFailed(false); }, 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group/copy mt-4 flex items-center gap-2 text-left text-sm text-zinc-200 transition-colors hover:text-[#ff5500]"
      data-cursor="Copy"
      data-testid="footer-email-copy-button"
    >
      {ENQUIRY_EMAIL}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#ff5500]" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover/copy:text-[#ff5500]" aria-hidden="true" />
      )}
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ff5500]" role="status" data-testid="footer-email-copy-status">
        {copied ? "Copied" : failed ? "Press ⌘C" : ""}
      </span>
    </button>
  );
}
