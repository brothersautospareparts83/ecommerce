import { MapPin, Phone } from "lucide-react";
import { site, toIntl } from "@/lib/site";

/** Slim utility strip above the header (hidden on phones to save space). */
export function TopBar() {
  return (
    <div className="hidden border-b border-chrome-border bg-chrome text-xs text-chrome-muted md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6">
        <span>Tanzania · Prices in TSh</span>
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-accent" /> {site.location.replace(", Tanzania", "")}</span>
        <span className="flex items-center gap-4">
          {site.phones.map((p) => (
            <a key={p} href={`tel:+${toIntl(p)}`} className="flex items-center gap-1.5 hover:text-chrome-fg">
              <Phone className="h-3.5 w-3.5 text-accent" /> {p}
            </a>
          ))}
        </span>
        <span className="flex items-center gap-3">
          <a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">WhatsApp</a>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">Instagram</a>
          <a href={site.tiktok.url} target="_blank" rel="noopener noreferrer" className="hover:text-chrome-fg">TikTok</a>
        </span>
      </div>
    </div>
  );
}
