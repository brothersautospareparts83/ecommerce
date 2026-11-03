import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { T } from "@/lib/i18n";
import { SocialLinks } from "@/components/layout/social-links";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { site, toIntl } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-8">
      <h1 className="text-3xl font-extrabold">Contact Us</h1>
      <p className="mt-2 text-muted">Tupigie au WhatsApp. Call or message us for parts, prices and delivery.</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="mb-1 font-display font-bold"><T en="Ask us a question" sw="Tuulize swali" /></h2>
          <p className="mb-4 text-sm text-muted"><T en="Part, price or fit? Write it here and we reply on your phone." sw="Kipuri, bei au kinafaa? Andika hapa nasi tunakujibu kwa simu yako." /></p>
          <InquiryForm />
        </div>
        <div className="rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><Phone className="h-5 w-5 text-accent-text" /> Phone / WhatsApp</h2>
          <ul className="space-y-1">
            {site.phones.map((p) => (
              <li key={p}><a className="font-display text-xl font-extrabold hover:text-accent-text" href={`tel:+${toIntl(p)}`}>{p}</a></li>
            ))}
          </ul>
          <div className="mt-4"><WhatsAppButton /></div>
        </div>
        {site.email && (
          <div className="rounded-2xl border border-border bg-surface shadow-card p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display font-bold"><Mail className="h-5 w-5 text-accent-text" /> Email</h2>
            <a className="font-semibold hover:text-accent-text" href={`mailto:${site.email}`}>{site.email}</a>
          </div>
        )}
        <div className="rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display font-bold"><MapPin className="h-5 w-5 text-accent-text" /> Visit us</h2>
          <p className="text-muted">{site.location}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="mb-3 font-display font-bold">Social media</h2>
          <SocialLinks className="text-fg" />
        </div>
      </div>
    </div>
  );
}

