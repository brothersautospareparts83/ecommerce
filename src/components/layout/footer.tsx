import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle, AtSign } from "lucide-react";
import { Logo } from "./logo";
import { categories } from "@/lib/demo-data";
import { site, toIntl, whatsappUrl } from "@/lib/site";

const company = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/quotation", label: "Request a Quotation" },
];
const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className="bg-chrome text-chrome-fg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-chrome-muted">
            Cars · Motorcycles · Delivery. Quality automotive spare parts for Tanzania and East Africa.
          </p>
          <ul className="space-y-2 text-sm text-chrome-muted">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{site.location}</li>
            {site.phones.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <a href={`tel:+${toIntl(p)}`} className="hover:text-chrome-fg">{p}</a>
              </li>
            ))}
            {site.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" />{site.email}</li>}
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-accent" />
              <a href={whatsappUrl()} className="hover:text-chrome-fg" rel="noopener noreferrer" target="_blank">Chat on WhatsApp</a>
            </li>
            <li className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-accent" />
              <a href={site.instagram.url} className="hover:text-chrome-fg" rel="noopener noreferrer" target="_blank">{site.instagram.handle}</a>
            </li>
          </ul>
        </div>
        <FooterList title="Shop" links={[{ href: "/shop", label: "All Products" }, { href: "/categories", label: "Categories" }, { href: "/finder", label: "Parts Finder" }, { href: "/ai-assistant", label: "AI Parts Expert" }]} />
        <FooterList title="Popular Categories" links={categories.slice(0, 6).map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))} />
        <div className="space-y-8">
          <FooterList title="Company" links={company} />
          <FooterList title="Legal" links={legal} />
        </div>
      </div>
      <div className="border-t border-chrome-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-chrome-muted sm:px-6">
          © {site.name}. All rights reserved. Prices in Tanzanian Shillings (TZS).
        </p>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-accent">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-chrome-muted transition-colors hover:text-chrome-fg">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

