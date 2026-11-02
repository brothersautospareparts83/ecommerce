import Link from "next/link";
import { AtSign, MapPin, MessageCircle, Phone } from "lucide-react";
import { site, toIntl, whatsappUrl } from "@/lib/site";

/** Black footer bar as in the approved design: phones, WhatsApp, socials, tagline, location. */
export function Footer() {
  return (
    <footer className="mt-10 bg-chrome text-chrome-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold">
          {site.phones.map((p, i) => (
            <li key={p}>
              <a href={`tel:+${toIntl(p)}`} className="flex items-center gap-2">
                {i === 0 ? <Phone className="h-4 w-4 text-white" /> : <MessageCircle className="h-4 w-4 text-white" />} {p}
              </a>
            </li>
          ))}
          <li>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><AtSign className="h-4 w-4" /> @{site.instagram.handle.replace(/^@/, "")}</a>
          </li>
        </ul>
        <p className="tagline text-lg text-accent">Quality Parts Keep You Moving</p>
        <p className="flex items-center gap-2 text-chrome-muted"><MapPin className="h-4 w-4 text-white" /> {site.location}</p>
      </div>
      <div className="border-t border-chrome-border">
        <p className="mx-auto max-w-6xl px-4 py-3 text-xs text-chrome-muted">
          © {site.name}. Prices in Tanzanian Shillings (TSh). <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link> · <a href={whatsappUrl()} className="underline">WhatsApp</a>
        </p>
      </div>
    </footer>
  );
}
