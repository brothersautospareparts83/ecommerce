"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendInquiry, type InquiryState } from "@/app/contact/actions";
import { Button, LinkButton } from "@/components/ui/button";
import { T, TL } from "@/lib/i18n";
import { whatsappUrl } from "@/lib/site";

const field = "mt-1.5 h-12 w-full min-w-0 rounded-xl border border-border bg-bg px-3.5 text-[15px] outline-none focus:border-accent focus:bg-surface";

/** Contact-page inquiry form. The message is saved for staff; the customer can also send it on WhatsApp straight away. */
export function InquiryForm() {
  const [state, action, pending] = useActionState<InquiryState, FormData>(sendInquiry, {});

  if (state.sent) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-[#1fa855]" aria-hidden="true" />
        <h2 className="text-lg font-bold"><T en="Thank you, we received your question" sw="Asante, tumepokea swali lako" /></h2>
        <p className="mt-1 text-sm text-muted">
          <T en="We will reply on the phone number you gave. For a faster answer, send it on WhatsApp too." sw="Tutakujibu kwa namba uliyotoa. Kwa jibu la haraka, litume pia kwa WhatsApp." />
        </p>
        <LinkButton
          href={whatsappUrl(`Hello Brothers Auto, I sent a question on your website.\nName: ${state.sent.name}\n${state.sent.message}`)}
          variant="whatsapp"
          className="mt-4 rounded-full px-5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <T en="Send on WhatsApp" sw="Tuma kwa WhatsApp" />
        </LinkButton>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold"><TL k="Full name" /><input name="name" required autoComplete="name" className={field} /></label>
      <label className="block text-sm font-semibold"><TL k="Phone (WhatsApp if possible)" /><input name="phone" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={field} /></label>
      <label className="block text-sm font-semibold"><TL k="Email (optional)" /><input name="email" type="email" autoComplete="email" className={field} /></label>
      <label className="block text-sm font-semibold">
        <T en="Your question" sw="Swali lako" />
        <textarea name="message" required rows={4} maxLength={1000} placeholder="e.g. Do you have brake pads for Toyota Hilux 2016?" className={`${field} h-auto py-3`} />
      </label>
      <div className="hidden" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state.error && <p role="alert" className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full rounded-full" disabled={pending}>
        {pending ? <T en="Sending…" sw="Inatuma…" /> : <T en="Send question" sw="Tuma swali" />}
      </Button>
    </form>
  );
}
