import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { TL } from "@/lib/i18n";
import { site, toIntl } from "@/lib/site";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/parts-guide", label: "Parts Guide" },
  { href: "/orders/track", label: "Track Order" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-lg font-extrabold italic tracking-wide">BROTHERS <span className="text-accent-text">AUTO SPARE PARTS</span></p>
          <p className="flex items-start gap-2 text-sm text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {site.location}</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {links.map((l) => (
            <li key={l.href}><Link href={l.href} className="text-muted hover:text-fg"><TL k={l.label} /></Link></li>
          ))}
        </ul>
        <ul className="space-y-2 text-sm">
          {site.phones.map((p) => (
            <li key={p}><a href={`tel:+${toIntl(p)}`} className="flex items-center gap-2 font-semibold"><Phone className="h-4 w-4 text-accent-text" /> {p}</a></li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
          © {site.name}. Prices in Tanzanian Shillings (TSh). <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
