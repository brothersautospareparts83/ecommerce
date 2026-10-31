import Link from "next/link";
import { AtSign, MapPin, MessageCircle, Music2, Phone } from "lucide-react";
import { Logo } from "./logo";
import { site, toIntl, whatsappUrl } from "@/lib/site";

const columns = [
  {
    title: "Quick Links",
    links: [
      { href: "/", label: "Home" },
      { href: "/shop", label: "Shop" },
      { href: "/categories", label: "Categories" },
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/account/orders", label: "Track Order" },
      { href: "/contact", label: "Support" },
      { href: "/quotation", label: "Request a Quotation" },
    ],
  },
  {
    title: "Our Services",
    links: [
      { href: "/shop", label: "Spare Parts" },
      { href: "/finder?mode=vehicle", label: "Vehicle Catalog" },
      { href: "/quotation", label: "Garage Services" },
      { href: "/quotation", label: "Bulk Orders" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-chrome text-chrome-fg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div className="space-y-4 md:col-span-3 lg:col-span-1">
          <Logo />
          <p className="text-sm leading-relaxed text-chrome-muted">
            Cars · Motorcycles · Delivery. Quality automotive spare parts for Tanzania and East Africa.
          </p>
          <p className="flex items-start gap-2 text-sm text-chrome-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {site.location}
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-accent">{col.title}</h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-chrome-muted transition-colors hover:text-chrome-fg">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="md:col-span-3 lg:col-span-1">
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-accent">Stay Connected</h3>
          <ul className="space-y-2 text-sm text-chrome-muted">
            {site.phones.map((p) => (
              <li key={p}>
                <a href={`tel:+${toIntl(p)}`} className="flex items-center gap-2 hover:text-chrome-fg"><Phone className="h-4 w-4 text-accent" /> {p}</a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border hover:border-accent hover:text-accent"><MessageCircle className="h-5 w-5" /></a>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border hover:border-accent hover:text-accent"><AtSign className="h-5 w-5" /></a>
            <a href={site.tiktok.url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-10 w-10 items-center justify-center rounded-lg border border-chrome-border hover:border-accent hover:text-accent"><Music2 className="h-5 w-5" /></a>
          </div>
          <form className="mt-4" aria-describedby="nl-note">
            <p className="mb-2 text-sm font-semibold">Subscribe to our newsletter</p>
            <div className="flex">
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input id="nl-email" type="email" disabled placeholder="Your email address" className="h-10 min-w-0 flex-1 rounded-l-lg border border-chrome-border bg-white/5 px-3 text-sm disabled:opacity-60" />
              <button disabled className="h-10 rounded-r-lg bg-accent px-4 text-sm font-semibold text-accent-fg opacity-60">Join</button>
            </div>
            <p id="nl-note" className="mt-1.5 text-xs text-chrome-muted">Sign-up opens once email delivery is set up.</p>
          </form>
        </div>
      </div>

      <div className="border-t border-chrome-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-chrome-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {site.name}. All rights reserved. Prices in Tanzanian Shillings (TZS).</p>
          <p className="flex gap-3">
            <Link href="/privacy" className="hover:text-chrome-fg">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link href="/terms" className="hover:text-chrome-fg">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
