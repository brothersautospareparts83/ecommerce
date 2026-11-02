import { MapPin, Phone } from "lucide-react";
import { site, toIntl } from "@/lib/site";
import { LangSwitch, T } from "@/lib/i18n";

/** Slim strip above the header: phone numbers always, location and links on larger screens, and the language switch. */
export function TopBar() {
  return (
    <div className="border-b border-chrome-border bg-chrome text-xs text-chrome-muted">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <span className="hidden lg:inline"><T en="Tanzania · Prices in TSh" sw="Tanzania · Bei kwa TSh" /></span>
        <span className="hidden items-center gap-1.5 md:flex"><MapPin className="h-3.5 w-3.5 text-accent" /> {site.location.replace(", Tanzania", "")}</span>
        <span className="flex items-center gap-3 sm:gap-4">
          {site.phones.map((p) => (
            <a key={p} href={`tel:+${toIntl(p)}`} className="flex items-center gap-1 whitespace-nowrap hover:text-chrome-fg">
              <Phone className="h-3.5 w-3.5 text-accent" /> {p}
            </a>
          ))}
        </span>
        <span className="hidden items-center gap-3 lg:flex">
          <a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">WhatsApp</a>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">Instagram</a>
          <a href={site.tiktok.url} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">TikTok</a>
        </span>
        <LangSwitch className="flex items-center gap-1" />
      </div>
    </div>
  );
}
