import type { Metadata } from "next";
import { AtSign, MapPin, Phone } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { site, toIntl } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Contact Us</h1>
      <p className="mt-2 text-muted">Tupigie au WhatsApp. Call or message us for parts, prices and delivery.</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><Phone className="h-5 w-5 text-accent-text" /> Phone / WhatsApp</h2>
          <ul className="space-y-1">
            {site.phones.map((p) => (
              <li key={p}><a className="font-display text-xl font-extrabold hover:text-accent-text" href={`tel:+${toIntl(p)}`}>{p}</a></li>
            ))}
          </ul>
          <div className="mt-4"><WhatsAppButton /></div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display font-bold"><MapPin className="h-5 w-5 text-accent-text" /> Visit us</h2>
          <p className="text-muted">{site.location}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><AtSign className="h-5 w-5 text-accent-text" /> Social media</h2>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={site.instagram.url} variant="secondary" target="_blank" rel="noopener noreferrer">Instagram {site.instagram.handle}</LinkButton>
            <LinkButton href={site.tiktok.url} variant="secondary" target="_blank" rel="noopener noreferrer">TikTok {site.tiktok.handle}</LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

